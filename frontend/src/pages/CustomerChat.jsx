import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import CustomerLayout from '../components/CustomerLayout'
import MediaAvatar, { DEFAULT_USER_PHOTO, pickMedia } from '../components/MediaAvatar'

const API_BASE_URL = 'http://localhost:3000/api'
const storageKey = 'petugasChatReplies'

const QUICK_TOPICS = [
  { title: 'Bertanya tentang hewan', prompt: 'Halo, saya ingin bertanya mengenai detail, karakter, dan kondisi kesehatan hewan yang tersedia untuk diadopsi.', icon: 'fa-paw', color: '#0ea5e9' },
  { title: 'Menanyakan proses adopsi', prompt: 'Halo, saya ingin bertanya mengenai syarat, dokumen, dan alur prosedur pengajuan adopsi hewan.', icon: 'fa-clipboard-list', color: '#10b981' },
  { title: 'Atur jadwal kunjungan', prompt: 'Halo, saya ingin mendiskusikan dan mengatur jadwal kunjungan ke shelter atau penjemputan hewan adopsi saya.', icon: 'fa-calendar-check', color: '#f59e0b' },
]

export default function CustomerChat() {
  const storedUserId = localStorage.getItem('authUserId') || ''
  const userEmail = localStorage.getItem('authEmail') || ''
  const userName = localStorage.getItem('authName') || 'Customer'
  const [userId, setUserId] = useState(storedUserId)
  const userIdRef = useRef(storedUserId)

  const [selectedContact, setSelectedContact] = useState('petugas')
  const [inputMessage, setInputMessage] = useState('')
  const [contactProfiles, setContactProfiles] = useState({ petugas: null, admin: null })
  const [replies, setReplies] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}') } catch { return {} }
  })
  const chatAreaRef = useRef(null)

  const syncChatData = async (resolvedId = userIdRef.current) => {
    if (!resolvedId) return
    try {
      const res = await axios.get(`${API_BASE_URL}/chat-messages`)
      if (res.data?.success && Array.isArray(res.data.data)) {
        const dbMessages = res.data.data
        const localData = JSON.parse(localStorage.getItem(storageKey) || '{}')
        const mergedUserMsgs = [...(localData[resolvedId] || [])]
        dbMessages.forEach((dbMsg) => {
          if (String(dbMsg.user_id) === String(resolvedId)) {
            const exists = mergedUserMsgs.some((m) => m.id === dbMsg.msg_id)
            if (!exists) {
              mergedUserMsgs.push({
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
        const updated = { ...localData, [resolvedId]: mergedUserMsgs }
        setReplies(updated)
        localStorage.setItem(storageKey, JSON.stringify(updated))
      }
    } catch {
      try { setReplies(JSON.parse(localStorage.getItem(storageKey) || '{}')) } catch { setReplies({}) }
    }
  }

  useEffect(() => {
    let active = true
    const resolveCurrentCustomer = async () => {
      if (storedUserId) {
        userIdRef.current = storedUserId
        setUserId(storedUserId)
        syncChatData(storedUserId)
        return
      }

      try {
        const res = await axios.get(`${API_BASE_URL}/superadmin/users?role=costumer&limit=100`)
        const payload = res.data?.data
        const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
        const found = rows.find((u) =>
          (userEmail && String(u.email).toLowerCase() === userEmail.toLowerCase()) ||
          (userName && String(u.name).toLowerCase() === userName.toLowerCase())
        )
        if (active && found?.id) {
          const resolvedId = String(found.id)
          localStorage.setItem('authUserId', resolvedId)
          userIdRef.current = resolvedId
          setUserId(resolvedId)
          syncChatData(resolvedId)
        }
      } catch {
        if (active) syncChatData(storedUserId)
      }
    }

    resolveCurrentCustomer()
    const h = () => syncChatData()
    window.addEventListener('chat-updated', h)
    window.addEventListener('storage', h)
    const t = setInterval(syncChatData, 3000)
    return () => {
      active = false
      window.removeEventListener('chat-updated', h)
      window.removeEventListener('storage', h)
      clearInterval(t)
    }
  }, [])

  useEffect(() => {
    let active = true
    const firstUser = (response) => {
      const payload = response?.data?.data
      if (Array.isArray(payload)) return payload[0] || null
      if (Array.isArray(payload?.data)) return payload.data[0] || null
      return null
    }

    const loadContactProfiles = async () => {
      try {
        const [petugasRes, adminRes, superadminRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/superadmin/users?role=petugas&limit=50`),
          axios.get(`${API_BASE_URL}/superadmin/users?role=admin&limit=50`),
          axios.get(`${API_BASE_URL}/superadmin/users?role=superadmin&limit=50`),
        ])
        if (!active) return
        setContactProfiles({
          petugas: firstUser(petugasRes),
          admin: firstUser(adminRes) || firstUser(superadminRes),
        })
      } catch {
        if (active) setContactProfiles({ petugas: null, admin: null })
      }
    }

    loadContactProfiles()
    window.addEventListener('auth-profile-updated', loadContactProfiles)
    return () => {
      active = false
      window.removeEventListener('auth-profile-updated', loadContactProfiles)
    }
  }, [])

  const allMessages = replies[userId] || []
  const conversation = allMessages.filter((m) => {
    if (selectedContact === 'petugas') return m.targetRole === 'petugas' || m.sender === 'petugas'
    return m.targetRole === 'admin' || m.sender === 'admin' || m.sender === 'superadmin'
  })

  useEffect(() => {
    const area = chatAreaRef.current
    if (!area) return
    area.scrollTop = area.scrollHeight
  }, [conversation, selectedContact])

  const handleSendMessage = async (textToSend = '', topicName = '') => {
    const text = (textToSend || inputMessage).trim()
    const activeUserId = userIdRef.current || userId || localStorage.getItem('authUserId')
    if (!text || !activeUserId) return
    const msgId = Date.now() + '_' + Math.random().toString(36).slice(2, 6)
    const newMsg = {
      id: msgId,
      sender: 'customer',
      senderName: userName,
      targetRole: selectedContact,
      text,
      topic: topicName,
      time: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
    }
    const next = { ...replies, [activeUserId]: [...(replies[activeUserId] || []), newMsg] }
    setReplies(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
    window.dispatchEvent(new Event('chat-updated'))
    setInputMessage('')
    try {
      await axios.post(`${API_BASE_URL}/chat-messages`, {
        msgId,
        userId: Number(activeUserId),
        sender: 'customer',
        senderName: userName,
        targetRole: selectedContact,
        text,
        topic: topicName,
      })
    } catch (error) {
      console.error('DB save failed', error)
    }
  }

  const handleDeleteMessage = async (msgId) => {
    const activeUserId = userIdRef.current || userId || localStorage.getItem('authUserId')
    if (!activeUserId || !msgId) return

    const next = {
      ...replies,
      [activeUserId]: (replies[activeUserId] || []).filter((msg) => msg.id !== msgId),
    }
    setReplies(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
    window.dispatchEvent(new Event('chat-updated'))

    try {
      await axios.delete(`${API_BASE_URL}/chat-messages/${encodeURIComponent(msgId)}`)
    } catch (error) {
      console.error('Delete chat failed', error)
    }
  }

  const unreadPetugas = allMessages.some((m) => m.sender === 'petugas' && !m.isRead)
  const unreadAdmin = allMessages.some((m) => (m.sender === 'admin' || m.sender === 'superadmin') && !m.isRead)
  const contacts = [
    {
      key: 'petugas',
      name: 'Petugas Shelter',
      sub: 'Konsultasi & Kunjungan',
      color: '#0EA5E9',
      photo: pickMedia(contactProfiles.petugas?.profile_photo, contactProfiles.petugas?.admin_avatar, contactProfiles.petugas?.avatar),
      unread: unreadPetugas,
    },
    {
      key: 'admin',
      name: 'Admin Sistem',
      sub: 'Bantuan & Akun',
      color: '#10B981',
      photo: pickMedia(contactProfiles.admin?.profile_photo, contactProfiles.admin?.admin_avatar, contactProfiles.admin?.avatar),
      unread: unreadAdmin,
    },
  ]
  const active = contacts.find((c) => c.key === selectedContact)

  return (
    <CustomerLayout>
      <main className="customer-page">
        <div className="customer-chat-page" style={{ padding: '20px 28px 40px', maxWidth: 1100, margin: '0 auto', width: '100%', boxSizing: 'border-box', minHeight: 'calc(100vh - 180px)' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EFF6FF', color: '#2563EB', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 999, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <span className="iconify text-sm" data-icon="mdi:chat-outline"></span> Pusat Chat Online
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Chat Petugas & Admin</h1>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Konsultasi seputar hewan, proses adopsi, dan jadwal kunjungan secara real-time.</p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="iconify text-xs" data-icon="mdi:lightbulb-on-outline"></span> Topik Cepat
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
              {QUICK_TOPICS.map((t) => (
                <button
                  key={t.title}
                  type="button"
                  onClick={() => handleSendMessage(t.prompt, t.title)}
                  className="btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#fff', border: '1.5px solid #E8ECF1', borderRadius: 16, textAlign: 'left', cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.color; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 20px ${t.color}22` }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8ECF1'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${t.color}15`, color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    <i className={`fas ${t.icon}`} />
                  </div>
                  <strong style={{ fontSize: 12, color: '#0F172A', fontWeight: 800, lineHeight: 1.3 }}>{t.title}</strong>
                </button>
              ))}
            </div>
          </div>

          <div className="customer-chat-panel" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 0, minHeight: 'calc(100vh - 240px)', background: '#fff', borderRadius: 24, border: '1px solid #E8ECF1', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,.04)' }}>
            <div style={{ borderRight: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', background: '#FAFBFF' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span className="iconify text-sm" data-icon="mdi:chat-outline"></span> Daftar Kontak
                </span>
                <span style={{ fontSize: 10, background: '#E2E8F0', padding: '2px 8px', borderRadius: 999, color: '#64748B', fontWeight: 800 }}>2</span>
              </div>
              {contacts.map((c) => (
                <div
                  key={c.key}
                  onClick={() => setSelectedContact(c.key)}
                  style={{
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    borderBottom: '1px solid #F1F5F9',
                    transition: 'all .2s ease',
                    background: selectedContact === c.key ? '#EFF6FF' : 'transparent',
                    borderLeft: `4px solid ${selectedContact === c.key ? c.color : 'transparent'}`,
                  }}
                >
                  <MediaAvatar src={c.photo} fallbackSrc={DEFAULT_USER_PHOTO} alt={c.name} className="customer-contact-avatar" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{c.name}</strong>
                      {c.unread && <span style={{ width: 8, height: 8, background: '#EF4444', borderRadius: '50%', display: 'inline-block' }} />}
                    </div>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{c.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 12, background: '#fff' }}>
                <MediaAvatar src={active?.photo} fallbackSrc={DEFAULT_USER_PHOTO} alt={active?.name} className="customer-chat-header-avatar" />
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#0F172A' }}>{active?.name}</h3>
                  <span style={{ fontSize: 11, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} /> Online & Siap Membantu
                  </span>
                </div>
              </div>

              <div ref={chatAreaRef} className="ig-chat-area" style={{ flex: 1, minHeight: 0, padding: '20px', overflowY: 'auto', background: '#F8FAFC' }}>
                {conversation.map((item, idx) => {
                  const isMe = item.sender === 'customer'
                  return (
                    <div key={idx} className={`ig-bubble ${isMe ? 'ig-out' : 'ig-in'}`}>
                      <button
                        type="button"
                        className="ig-delete-message"
                        onClick={() => handleDeleteMessage(item.id)}
                        title="Hapus pesan"
                      >
                        <i className="fas fa-trash" />
                      </button>
                      <span className="ig-name">{isMe ? 'Saya' : item.senderName || active?.name}</span>
                      {item.topic && <div style={{ fontSize: 10, fontWeight: 800, opacity: .85, marginBottom: 4, background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>{item.topic}</div>}
                      <p className="ig-text">{item.text}</p>
                      <span className="ig-time">{item.time}</span>
                    </div>
                  )
                })}
                {conversation.length === 0 && (
                  <div className="ig-empty">
                    <div style={{ fontSize: 40, marginBottom: 8, opacity: 0.6 }}>
                      <span className="iconify" data-icon="mdi:chat-outline"></span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#64748B' }}>Belum ada percakapan dengan {active?.name}.</span>
                  </div>
                )}
              </div>

              <div className="ig-input-bar" style={{ flexShrink: 0, padding: '14px 16px', background: '#fff', borderTop: '1px solid #F1F5F9' }}>
                <input
                  className="ig-input"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder={`Tulis pesan untuk ${active?.name}...`}
                />
                <button className="ig-send btn-main" onClick={() => handleSendMessage()} disabled={!inputMessage.trim()} style={{ background: 'linear-gradient(135deg,#60A5FA 0%,#2563EB 100%)' }}>
                  <i className="fas fa-paper-plane" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </CustomerLayout>
  )
}
