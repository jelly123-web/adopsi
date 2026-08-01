import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import SuperadminNavbar from '../components/SuperadminNavbar'
import SuperadminSidebar from '../components/SuperadminSidebar'
import MediaAvatar, { DEFAULT_USER_PHOTO, pickMedia } from '../components/MediaAvatar'
import { subscribeLiveData } from '../utils/liveDataEvents'

const storageKey = 'petugasChatReplies'

/* ---- reusable chat message list ---- */
function ChatMessages({ conversation, selectedCustomer, onDelete }) {
  const bottomRef = useRef(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  if (conversation.length === 0) {
    return (
      <div className="ig-empty">
        <i className="fas fa-comments" />
        <span>Belum ada percakapan. Mulai sapa {selectedCustomer?.name || 'customer'}!</span>
      </div>
    )
  }

  return (
    <>
      {conversation.map((item, index) => {
        const isStaff =
          item.sender === 'petugas' ||
          item.sender === 'admin' ||
          item.sender === 'superadmin' ||
          (!item.sender && item.text)
        const label = isStaff
          ? item.senderName || (item.sender === 'admin' ? 'Admin' : 'Petugas')
          : selectedCustomer?.name || 'Customer'

        return (
          <div
            key={`${item.time}-${index}`}
            className={`ig-bubble ${isStaff ? 'ig-out' : 'ig-in'}`}
          >
            <button
              type="button"
              className="ig-delete-message"
              onClick={() => onDelete?.(item.id)}
              title="Hapus pesan"
            >
              <i className="fas fa-trash" />
            </button>
            <span className="ig-name">{label}</span>
            {item.topic && (
              <div style={{ fontSize: '11px', fontWeight: 600, opacity: 0.85, marginBottom: '4px' }}>
                {item.topic}
              </div>
            )}
            <p className="ig-text">{item.text}</p>
            <span className="ig-time">{item.time}</span>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </>
  )
}

/* ---- reusable input bar ---- */
function ChatInput({ message, setMessage, onSend, disabled }) {
  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }
  return (
    <div className="ig-input-bar">
      <input
        className="ig-input"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Tulis pesan..."
        disabled={disabled}
      />
      <button
        className="ig-send"
        onClick={onSend}
        disabled={disabled || !message.trim()}
        title="Kirim"
      >
        <i className="fas fa-paper-plane" />
      </button>
    </div>
  )
}

/* ---- main page ---- */
function PetugasChat() {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true,
  )
  const [customers, setCustomers] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [message, setMessage] = useState('')
  const [replies, setReplies] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '{}')
    } catch {
      return {}
    }
  })

  const authRole = localStorage.getItem('authRole') || 'petugas'
  const authName =
    localStorage.getItem('authName') ||
    (authRole === 'admin' ? 'Admin' : 'Petugas')

  const getCustomerPhoto = (customer) =>
    pickMedia(
      customer?.profile_photo,
      customer?.customer_profile_photo,
      customer?.user_profile_photo,
      customer?.admin_avatar,
      customer?.avatar,
    )

  /* load customers & set initial selectedId */
  useEffect(() => {
    let active = true
    const loadCustomers = () => {
      axios
        .get('http://localhost:3000/api/superadmin/users?page=1&limit=50&role=costumer')
        .then((res) => {
          if (!active) return
          const data = res.data.data || []
          setCustomers(data)
          if (data.length > 0 && !selectedId) {
            setSelectedId(String(data[0].id))
          }
        })
        .catch(() => {
          if (active) setCustomers([])
        })
    }
    loadCustomers()
    const unsub = subscribeLiveData(['users', 'customers'], loadCustomers)
    return () => {
      active = false
      unsub()
    }
  }, [])

  const selectedCustomer = useMemo(
    () => customers.find((c) => String(c.id) === String(selectedId)) || customers[0],
    [customers, selectedId],
  )

  const activeId = selectedCustomer ? String(selectedCustomer.id) : ''

  // Sync DB Chat Messages
  const syncChatData = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/chat-messages')
      if (res.data?.success && Array.isArray(res.data.data)) {
        const dbMessages = res.data.data
        const localData = JSON.parse(localStorage.getItem(storageKey) || '{}')
        const updatedReplies = { ...localData }

        dbMessages.forEach((dbMsg) => {
          const cId = String(dbMsg.user_id)
          if (cId) {
            if (!updatedReplies[cId]) updatedReplies[cId] = []
            const exists = updatedReplies[cId].some((m) => m.id === dbMsg.msg_id)
            if (!exists) {
              updatedReplies[cId].push({
                id: dbMsg.msg_id,
                sender: dbMsg.sender,
                senderName: dbMsg.sender_name,
                targetRole: dbMsg.target_role,
                text: dbMsg.text,
                topic: dbMsg.topic,
                time: new Date(dbMsg.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
              })
            }
          }
        })

        setReplies(updatedReplies)
        localStorage.setItem(storageKey, JSON.stringify(updatedReplies))
      }
    } catch (e) {
      try {
        setReplies(JSON.parse(localStorage.getItem(storageKey) || '{}'))
      } catch {
        setReplies({})
      }
    }
  }

  useEffect(() => {
    syncChatData()
    const h = () => syncChatData()
    window.addEventListener('chat-updated', h)
    window.addEventListener('storage', h)
    const interval = setInterval(syncChatData, 3000)
    return () => {
      window.removeEventListener('chat-updated', h)
      window.removeEventListener('storage', h)
      clearInterval(interval)
    }
  }, [])

  const rawConversation = activeId ? replies[activeId] || [] : []
  const conversation = rawConversation.filter(
    (m) =>
      authRole === 'superadmin' ||
      m.targetRole === authRole ||
      m.sender === authRole ||
      (authRole === 'admin' && m.sender === 'superadmin') ||
      (!m.targetRole && m.sender === 'customer'),
  )

  /* mark as read when selected customer changes */
  useEffect(() => {
    if (!activeId || !Array.isArray(replies[activeId])) return
    const hasUnread = replies[activeId].some(
      (m) =>
        m.sender === 'customer' &&
        !m.isRead &&
        (authRole === 'superadmin' || m.targetRole === authRole || !m.targetRole),
    )
    if (hasUnread) {
      const updated = replies[activeId].map((m) =>
        m.sender === 'customer' &&
        !m.isRead &&
        (authRole === 'superadmin' || m.targetRole === authRole || !m.targetRole)
          ? { ...m, isRead: true }
          : m,
      )
      const next = { ...replies, [activeId]: updated }
      setReplies(next)
      localStorage.setItem(storageKey, JSON.stringify(next))
      window.dispatchEvent(new Event('chat-updated'))
    }
  }, [activeId])

  /* send message */
  const saveReply = async () => {
    if (!activeId || !message.trim()) return

    const msgId = Date.now() + '_' + Math.random().toString(36).substr(2, 4)
    const text = message.trim()
    const newMsg = {
      id: msgId,
      sender: authRole,
      senderName: authName,
      text,
      time: new Date().toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    }
    const next = {
      ...replies,
      [activeId]: [...(replies[activeId] || []), newMsg],
    }
    setReplies(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
    window.dispatchEvent(new Event('chat-updated'))
    setMessage('')

    try {
      await axios.post('http://localhost:3000/api/chat-messages', {
        msgId,
        userId: isNaN(Number(activeId)) ? null : Number(activeId),
        sender: authRole,
        senderName: authName,
        targetRole: 'customer',
        text,
      })
    } catch (err) {
      console.error('Failed saving staff message to DB', err)
    }
  }

  const deleteMessage = async (msgId) => {
    if (!activeId || !msgId) return

    const next = {
      ...replies,
      [activeId]: (replies[activeId] || []).filter((msg) => msg.id !== msgId),
    }
    setReplies(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
    window.dispatchEvent(new Event('chat-updated'))

    try {
      await axios.delete(`http://localhost:3000/api/chat-messages/${encodeURIComponent(msgId)}`)
    } catch (err) {
      console.error('Failed deleting chat message', err)
    }
  }

  return (
    <div className="dashboard-layout">
      <SuperadminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={`main-content ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
        <SuperadminNavbar
          pageTitle="Chat Customer"
          sidebarOpen={sidebarOpen}
          offsetForSidebar={false}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />

        <div className="page-body" style={{ padding: '20px' }}>
          <div className="page-header" style={{ marginBottom: '16px' }}>
            <h1 className="page-header-title">
              <i className="fas fa-comments" /> Chat Customer
            </h1>
            <p className="page-header-desc">
              Pilih akun customer untuk melihat profil dan bertukar pesan langsung (Instagram Style).
            </p>
          </div>

          {/* Grid Layout Instagram Chat (Daftar Customer di Kiri & Ruang Chat + Profil di Kanan) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '320px 1fr',
              gap: '20px',
              height: 'calc(100vh - 200px)',
              minHeight: '520px',
              maxHeight: '720px',
              background: '#fff',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              overflow: 'hidden',
              border: '1px solid var(--border)',
            }}
          >
            {/* KOLOM KIRI: Daftar Customer */}
            <div
              style={{
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                background: '#fafafa',
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border)',
                  fontWeight: 700,
                  fontSize: '15px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#fff',
                }}
              >
                <span>
                  <i className="fas fa-address-book" style={{ marginRight: 8, color: 'var(--accent)' }} /> Daftar Customer
                </span>
                <span style={{ fontSize: '12px', background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', color: '#475569' }}>
                  {customers.length}
                </span>
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {customers.map((customer) => {
                  const isSelected = String(customer.id) === activeId
                  const chats = replies[customer.id] || []
                  const lastMsg = chats.length > 0 ? chats[chats.length - 1] : null
                  const hasUnread = chats.some(
                    (m) =>
                      m.sender === 'customer' &&
                      !m.isRead &&
                      (authRole === 'superadmin' || m.targetRole === authRole || !m.targetRole),
                  )

                  return (
                    <div
                      key={customer.id}
                      onClick={() => setSelectedId(String(customer.id))}
                      style={{
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        background: isSelected ? '#eff6ff' : 'transparent',
                        borderLeft: isSelected ? '4px solid #0ea5e9' : '4px solid transparent',
                        transition: 'all 0.2s',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      <MediaAvatar
                        src={getCustomerPhoto(customer)}
                        fallbackSrc={DEFAULT_USER_PHOTO}
                        alt={customer.name}
                        className="staff-chat-customer-avatar"
                      />

                      {/* Info & Last message */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <strong style={{ fontSize: '14px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {customer.name}
                          </strong>
                          {hasUnread && (
                            <span
                              style={{
                                width: '8px',
                                height: '8px',
                                background: '#ef4444',
                                borderRadius: '50%',
                                display: 'inline-block',
                              }}
                            />
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {lastMsg ? lastMsg.text : customer.email}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {customers.length === 0 && (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                    Belum ada data customer.
                  </div>
                )}
              </div>
            </div>

            {/* KOLOM KANAN: Ruang Chat (Instagram Style) + Profile Customer */}
            {selectedCustomer ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
                {/* Header Chat: Info & Profile Customer */}
                <div
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#fff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <MediaAvatar
                      src={getCustomerPhoto(selectedCustomer)}
                      fallbackSrc={DEFAULT_USER_PHOTO}
                      alt={selectedCustomer.name}
                      className="staff-chat-header-avatar"
                    />
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                        {selectedCustomer.name}
                      </h3>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        <i className="fas fa-envelope" style={{ marginRight: 4 }} />
                        {selectedCustomer.email}
                        {selectedCustomer.phone && ` • 📞 ${selectedCustomer.phone}`}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '20px', background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                      <i className="fas fa-user-check" style={{ marginRight: 4, color: '#10b981' }} /> Customer
                    </span>
                  </div>
                </div>

                {/* Body Chat (Messages) */}
                <div className="ig-chat-area" style={{ flex: 1, padding: '20px', background: '#f8fafc' }}>
                  <ChatMessages conversation={conversation} selectedCustomer={selectedCustomer} onDelete={deleteMessage} />
                </div>

                {/* Input Bar */}
                <ChatInput
                  message={message}
                  setMessage={setMessage}
                  onSend={saveReply}
                  disabled={false}
                />
              </div>
            ) : (
              <div className="ig-empty" style={{ flex: 1 }}>
                <i className="fas fa-comments" style={{ fontSize: '36px', color: '#94a3b8' }} />
                <span>Pilih customer di sebelah kiri untuk mulai mengobrol.</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default PetugasChat
