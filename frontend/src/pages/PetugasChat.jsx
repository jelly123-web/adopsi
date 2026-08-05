import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import SuperadminNavbar from '../components/SuperadminNavbar'
import SuperadminSidebar from '../components/SuperadminSidebar'
import MediaAvatar, { DEFAULT_USER_PHOTO, pickMedia } from '../components/MediaAvatar'
import { subscribeLiveData } from '../utils/liveDataEvents'

const storageKey = 'petugasChatReplies'

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
              <div className="staff-chat-topic">
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
  const authName = localStorage.getItem('authName') || (authRole === 'admin' ? 'Admin' : 'Petugas')

  const getCustomerPhoto = (customer) =>
    pickMedia(
      customer?.profile_photo,
      customer?.customer_profile_photo,
      customer?.user_profile_photo,
      customer?.admin_avatar,
      customer?.avatar,
    )

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

  const syncChatData = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/chat-messages')
      if (res.data?.success && Array.isArray(res.data.data)) {
        const dbMessages = res.data.data
        const localData = JSON.parse(localStorage.getItem(storageKey) || '{}')
        const updatedReplies = { ...localData }

        dbMessages.forEach((dbMsg) => {
          const cId = String(dbMsg.user_id)
          if (!cId) return

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
              time: new Date(dbMsg.created_at).toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }),
            })
          }
        })

        setReplies(updatedReplies)
        localStorage.setItem(storageKey, JSON.stringify(updatedReplies))
      }
    } catch {
      try {
        setReplies(JSON.parse(localStorage.getItem(storageKey) || '{}'))
      } catch {
        setReplies({})
      }
    }
  }

  useEffect(() => {
    syncChatData()
    const handleUpdate = () => syncChatData()
    window.addEventListener('chat-updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    const interval = setInterval(syncChatData, 3000)
    return () => {
      window.removeEventListener('chat-updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
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

  useEffect(() => {
    if (!activeId || !Array.isArray(replies[activeId])) return
    const hasUnread = replies[activeId].some(
      (m) =>
        m.sender === 'customer' &&
        !m.isRead &&
        (authRole === 'superadmin' || m.targetRole === authRole || !m.targetRole),
    )
    if (!hasUnread) return

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
  }, [activeId])

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
        userId: Number(activeId),
        sender: authRole,
        senderName: authName,
        targetRole: 'customer',
        text,
      })
    } catch (error) {
      console.error('Failed saving staff message to DB', error)
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
    } catch (error) {
      console.error('Failed deleting chat message', error)
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

        <div className="page-body staff-chat-page">
          <div className="page-header staff-chat-hero">
            <h1 className="page-header-title">
              <i className="fas fa-comments" /> Chat Customer
            </h1>
            <p className="page-header-desc">
              Pilih akun customer untuk melihat profil dan bertukar pesan langsung.
            </p>
          </div>

          <div className="staff-chat-shell">
            <aside className="staff-chat-list">
              <div className="staff-chat-list-head">
                <span>
                  <i className="fas fa-address-book" style={{ marginRight: 8, color: 'var(--accent)' }} />
                  Daftar Customer
                </span>
                <span className="staff-chat-count">{customers.length}</span>
              </div>

              <div className="staff-chat-list-scroll">
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
                      className={`staff-chat-list-item ${isSelected ? 'active' : ''}`}
                    >
                      <MediaAvatar
                        src={getCustomerPhoto(customer)}
                        fallbackSrc={DEFAULT_USER_PHOTO}
                        alt={customer.name}
                        className="customer-contact-avatar"
                      />
                      <div className="staff-chat-list-copy">
                        <div className="staff-chat-list-row">
                          <strong className="staff-chat-name">{customer.name}</strong>
                          {hasUnread && <span className="staff-chat-unread" />}
                        </div>
                        <div className="staff-chat-preview">
                          {lastMsg ? lastMsg.text : customer.email}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {customers.length === 0 && (
                  <div className="staff-chat-list-empty">
                    Belum ada data customer.
                  </div>
                )}
              </div>
            </aside>

            {selectedCustomer ? (
              <section className="staff-chat-conversation">
                <div className="staff-chat-conv-head">
                  <div className="staff-chat-conv-person">
                    <MediaAvatar
                      src={getCustomerPhoto(selectedCustomer)}
                      fallbackSrc={DEFAULT_USER_PHOTO}
                      alt={selectedCustomer.name}
                      className="staff-chat-header-avatar"
                    />
                    <div>
                      <h3 className="staff-chat-title">{selectedCustomer.name}</h3>
                      <span className="staff-chat-email">
                        <i className="fas fa-envelope" style={{ marginRight: 4 }} />
                        {selectedCustomer.email}
                        {selectedCustomer.phone ? ` - ${selectedCustomer.phone}` : ''}
                      </span>
                    </div>
                  </div>

                  <span className="staff-chat-role-pill">
                    <i className="fas fa-user-check" style={{ marginRight: 4, color: '#10b981' }} />
                    Customer
                  </span>
                </div>

                <div className="staff-chat-messages ig-chat-area">
                  <ChatMessages
                    conversation={conversation}
                    selectedCustomer={selectedCustomer}
                    onDelete={deleteMessage}
                  />
                </div>

                <div className="staff-chat-input">
                  <ChatInput
                    message={message}
                    setMessage={setMessage}
                    onSend={saveReply}
                    disabled={false}
                  />
                </div>
              </section>
            ) : (
              <div className="ig-empty staff-chat-empty">
                <i className="fas fa-comments" />
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
