import { useState, useEffect, useMemo } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import axios from '../utils/api'
import { subscribeLiveData } from '../utils/liveDataEvents'

const CHAT_STORAGE_KEY = 'petugasChatReplies'

function getCustomerUserId() {
  return localStorage.getItem('authUserId') || ''
}

function getCustomerNotifReadKey(userId = getCustomerUserId()) {
  return `customerReadNotificationIds:${userId || 'guest'}`
}

function getReadNotificationIds(userId = getCustomerUserId()) {
  try {
    const saved = JSON.parse(localStorage.getItem(getCustomerNotifReadKey(userId)) || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function formatNotifTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

function parseTime(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

function clipText(value) {
  const text = String(value || '').trim()
  return text.length > 100 ? `${text.slice(0, 100)}...` : text
}

function getStatusLabel(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'disetujui' || normalized === 'approved') return 'Disetujui'
  if (normalized === 'ditolak' || normalized === 'rejected') return 'Ditolak'
  return 'Menunggu Verifikasi'
}

function isFinalAdoptionStatus(status) {
  const normalized = String(status || '').toLowerCase()
  return ['disetujui', 'approved', 'ditolak', 'rejected'].includes(normalized)
}

function getStatusIcon(status) {
  const normalized = String(status || '').toLowerCase()
  return normalized === 'ditolak' || normalized === 'rejected' ? 'fa-times-circle' : 'fa-check-circle'
}

function getAuthInfo() {
  const appSettings = (() => {
    try { return JSON.parse(localStorage.getItem('appSettings') || '{}') } catch { return {} }
  })()
  const appName = appSettings.nama_apk || 'Sahabat Kecil'
  const logo = appSettings.logo_apk || ''
  const userName = localStorage.getItem('authName') || 'Customer'
  const userAvatar = localStorage.getItem('authAvatar') || ''
  const initials = userName.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || 'C'
  return { appName, logo, userName, userAvatar, initials }
}

export default function CustomerLayout({ children }) {
  const [authInfo, setAuthInfo] = useState(() => getAuthInfo())
  const [notifications, setNotifications] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)
  const [readNotificationIds, setReadNotificationIds] = useState(() => getReadNotificationIds())
  const navigate = useNavigate()
  const { appName, logo, userName, userAvatar, initials } = authInfo
  const userId = getCustomerUserId()
  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !readNotificationIds.includes(item.id)),
    [notifications, readNotificationIds]
  )

  useEffect(() => {
    const refresh = () => setAuthInfo(getAuthInfo())
    window.addEventListener('auth-profile-updated', refresh)
    return () => window.removeEventListener('auth-profile-updated', refresh)
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setReadNotificationIds(getReadNotificationIds(userId))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [userId])

  const markNotificationsRead = (items = notifications) => {
    const ids = items.map((item) => item.id).filter(Boolean)
    if (!ids.length) return
    const next = Array.from(new Set([...getReadNotificationIds(userId), ...ids])).slice(-300)
    localStorage.setItem(getCustomerNotifReadKey(userId), JSON.stringify(next))
    setReadNotificationIds(next)
  }

  const loadNotifications = async (shouldApply = () => true) => {
    const currentUserId = getCustomerUserId()
    const currentEmail = (localStorage.getItem('authEmail') || '').toLowerCase()
    const items = []

    try {
      const response = await axios.get(`/superadmin/adoption-requests`)
      const rows = Array.isArray(response.data?.data) ? response.data.data : []
      rows
        .filter((row) => String(row.user_id || '') === String(currentUserId) || (currentEmail && String(row.email || row.user_email || '').toLowerCase() === currentEmail))
        .forEach((row) => {
          const animalName = row.animal_name || row.petName || row.animal?.name || 'Hewan'
          if (row.pickup_date) {
            const scheduleTime = row.pickup_updated_at || row.pickup_notified_at || row.pickup_date
            items.push({
              id: `visit-${row.id}-${row.pickup_date}-${row.pickup_status || ''}`,
              type: 'schedule',
              icon: 'fa-calendar-check',
              title: `Jadwal pengambilan ${animalName}`,
              text: `${formatNotifTime(row.pickup_date)} - ${row.pickup_status || 'Belum Dikonfirmasi Customer'}`,
              time: scheduleTime,
              sortTime: parseTime(scheduleTime),
              to: '/customer/status'
            })
          }

          if (!isFinalAdoptionStatus(row.status)) return
          const status = getStatusLabel(row.status)
          const time = row.updated_at || row.created_at || row.date || ''
          items.push({
            id: `adoption-${row.id}-${String(row.status).toLowerCase()}`,
            type: 'adoption',
            icon: getStatusIcon(row.status),
            title: `Pengajuan ${status}`,
            text: status === 'Ditolak'
              ? `${animalName} ditolak${row.rejection_reason ? `: ${row.rejection_reason}` : '.'}`
              : `${animalName} disetujui. Cek detail pesanan kamu.`,
            time,
            sortTime: parseTime(time),
            to: '/customer/status'
          })
        })
    } catch {
      // Notifikasi tetap memakai chat lokal jika API adopsi belum bisa diakses.
    }

    const addChatNotification = (message) => {
      if (!message) return
      if (String(message.sender || '').toLowerCase() === 'customer') return
      const messageUserId = message.userId || message.user_id
      if (messageUserId && String(messageUserId) !== String(currentUserId)) return
      const time = message.created_at || message.time || ''
      const senderName = message.senderName || message.sender_name || (message.sender === 'petugas' ? 'Petugas Shelter' : 'Admin Sistem')
      items.push({
        id: `chat-${message.id || message.msg_id || `${message.sender || 'staff'}-${time}-${message.text || message.message || ''}`}`,
        type: 'chat',
        icon: 'fa-comment-dots',
        title: `Chat masuk dari ${senderName}`,
        text: clipText(message.text || message.message || 'Pesan baru masuk.'),
        time,
        sortTime: parseTime(time),
        to: '/customer/chat'
      })
    }

    try {
      const response = await axios.get(`/chat-messages`)
      const rows = Array.isArray(response.data?.data) ? response.data.data : []
      rows.forEach(addChatNotification)
    } catch {
      // Fallback ke localStorage di bawah.
    }

    try {
      const saved = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || '{}')
      const localMessages = Array.isArray(saved[currentUserId]) ? saved[currentUserId] : []
      localMessages.forEach(addChatNotification)
    } catch {
      // Abaikan data lokal rusak.
    }

    const unique = Array.from(new Map(items.map((item) => [item.id, item])).values())
      .sort((a, b) => b.sortTime - a.sortTime)
      .slice(0, 12)

    if (shouldApply()) setNotifications(unique)
  }

  useEffect(() => {
    let active = true
    const refresh = () => loadNotifications(() => active)
    refresh()
    const unsubscribeAdoptions = subscribeLiveData('adoptions', refresh)
    const refreshOnFocus = () => refresh()
    window.addEventListener('chat-updated', refresh)
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refreshOnFocus)
    window.addEventListener('visibilitychange', refreshOnFocus)
    const timer = window.setInterval(refresh, 3000)
    return () => {
      active = false
      unsubscribeAdoptions()
      window.removeEventListener('chat-updated', refresh)
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refreshOnFocus)
      window.removeEventListener('visibilitychange', refreshOnFocus)
      window.clearInterval(timer)
    }
  }, [])

  const isImageLogo = logo && !logo.startsWith('data:video') && !/\.(mp4|webm|ogg)/i.test(logo)
  const isVideoLogo = logo && (/\.(mp4|webm|ogg)/i.test(logo) || logo.startsWith('data:video'))

  const handleLogout = () => {
    localStorage.removeItem('authUserId')
    localStorage.removeItem('authName')
    localStorage.removeItem('authRole')
    localStorage.removeItem('authEmail')
    localStorage.removeItem('authAvatar')
    localStorage.removeItem('authRemember')
    navigate('/login')
  }

  return (
    <div className="customer-app min-h-screen font-inter bg-[#F8FAFC]" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Ã¢â€â‚¬Ã¢â€â‚¬ NAVBAR Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <nav className="customer-topnav sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link to="/customer/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-[#60A5FA] to-[#2563EB] rounded-xl flex items-center justify-center shadow-md">
              {isImageLogo
                ? <img src={logo} alt={appName} className="w-full h-full object-cover rounded-xl" />
                : isVideoLogo
                ? <video src={logo} autoPlay muted loop playsInline className="w-full h-full object-cover rounded-xl" />
                : <i className="fas fa-paw text-white text-sm" />}
            </div>
            <span className="text-[15px] font-extrabold text-slate-900 tracking-tight hidden sm:inline">{appName}</span>
          </Link>

          {/* Nav tabs */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/customer/dashboard" end className={({ isActive }) =>
              `tab-btn text-[12px] font-bold px-4 py-2.5 rounded-lg text-slate-500 hover:text-slate-900 transition-colors relative ${isActive ? 'active text-[#3B82F6]' : ''}`
            }>
              Dashboard
            </NavLink>
            <NavLink to="/customer/animals" className={({ isActive }) =>
              `tab-btn text-[12px] font-bold px-4 py-2.5 rounded-lg text-slate-500 hover:text-slate-900 transition-colors relative ${isActive ? 'active text-[#3B82F6]' : ''}`
            }>
              Jelajahi
            </NavLink>
            <NavLink to="/customer/adoptions" className={({ isActive }) =>
              `tab-btn text-[12px] font-bold px-4 py-2.5 rounded-lg text-slate-500 hover:text-slate-900 transition-colors relative ${isActive ? 'active text-[#3B82F6]' : ''}`
            }>
              Kecocokan
            </NavLink>
            <NavLink to="/customer/status" className={({ isActive }) =>
              `tab-btn text-[12px] font-bold px-4 py-2.5 rounded-lg text-slate-500 hover:text-slate-900 transition-colors relative ${isActive ? 'active text-[#3B82F6]' : ''}`
            }>
              Pesanan Saya
            </NavLink>
            <NavLink to="/customer/chat" className={({ isActive }) =>
              `tab-btn text-[12px] font-bold px-4 py-2.5 rounded-lg text-slate-500 hover:text-slate-900 transition-colors relative ${isActive ? 'active text-[#3B82F6]' : ''}`
            }>
              <i className="fas fa-comments mr-1" /> Chat
            </NavLink>
          </div>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <div className="customer-notif-wrapper notif-wrapper">
              <button
                type="button"
                className="customer-notif-btn relative w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all"
                onClick={() => {
                  setNotifOpen((open) => {
                    if (!open) markNotificationsRead(notifications)
                    return !open
                  })
                }}
              >
                <i className="fas fa-bell text-sm" />
                {unreadNotifications.length > 0 && <span className="notif-dot" aria-hidden="true" />}
                {unreadNotifications.length > 0 && <span className="customer-notif-count">{unreadNotifications.length}</span>}
              </button>
              {notifOpen && (
                <div className="customer-notif-menu notif-menu">
                  <div className="notif-menu-head">
                    <strong>Notifikasi</strong>
                    <span>{unreadNotifications.length} baru</span>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="notif-empty">Belum ada notifikasi.</div>
                  ) : notifications.map((item) => (
                    <Link
                      key={item.id}
                      to={item.to}
                      className={`notif-item ${item.type} ${readNotificationIds.includes(item.id) ? '' : 'unread'}`}
                      onClick={() => {
                        markNotificationsRead([item])
                        setNotifOpen(false)
                      }}
                    >
                      <span className="notif-item-icon"><i className={`fas ${item.icon}`} aria-hidden="true" /></span>
                      <span className="notif-item-body">
                        <strong>{item.title}</strong>
                        <small>{item.text}</small>
                        {item.time && <em className="customer-notif-time">{formatNotifTime(item.time)}</em>}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link to="/profile" className="flex items-center gap-2 hover:bg-slate-50 rounded-xl px-2.5 py-2 transition-all cursor-pointer no-underline">
              {userAvatar && !userAvatar.startsWith('data:video') ? (
                <img src={userAvatar} alt={userName} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-[#60A5FA] to-[#2563EB] rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                  {initials}
                </div>
              )}
              <span className="text-[12px] font-bold text-slate-700 hidden sm:inline">{userName.split(' ')[0]}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="customer-logout-btn hidden sm:inline-flex items-center gap-1.5"
            >
              <i className="fas fa-sign-out-alt" />
              Keluar
            </button>
          </div>
        </div>
      </nav>

      {children}

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-5 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#60A5FA] rounded-lg flex items-center justify-center">
              <i className="fas fa-paw text-white text-sm" />
            </div>
            <span className="text-[13px] font-extrabold tracking-tight">{appName}</span>
          </div>
          <p className="text-slate-500 text-[10px]">Ã‚Â© 2026 {appName}. Setiap hewan berhak atas rumah yang penuh kasih.</p>
        </div>
      </footer>

      <style>{`
        .tab-btn::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: #60A5FA;
          transform: scaleX(0);
          transition: transform 0.25s ease;
        }
        .tab-btn.active::after { transform: scaleX(1); }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes heartbeat { 0%,100%{transform:scale(1)} 14%{transform:scale(1.2)} 28%{transform:scale(1)} 42%{transform:scale(1.15)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes bounceIn { 0%{transform:scale(0.3);opacity:0} 50%{transform:scale(1.05)} 70%{transform:scale(0.95)} 100%{transform:scale(1);opacity:1} }
        @keyframes progressFill { from{width:0%} }
        @keyframes pulseRing { 0%{transform:scale(1);opacity:0.4} 100%{transform:scale(1.6);opacity:0} }
        @keyframes matchReveal { from{opacity:0;transform:scale(0.85) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .btn-main {
          background: linear-gradient(135deg, #60A5FA 0%, #3B82F6 55%, #2563EB 100%);
          background-size: 200% 200%;
          transition: all 0.35s cubic-bezier(0.22,1,0.36,1);
        }
        .btn-main:hover { background-position: 100% 100%; transform: translateY(-2px); box-shadow: 0 12px 40px rgba(59,130,246,0.35); }
        .btn-main:active { transform: translateY(0) scale(0.98); }
        .btn-outline { transition: all 0.25s cubic-bezier(0.22,1,0.36,1); }
        .btn-outline:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.06); }
        .pet-card { transition: all 0.4s cubic-bezier(0.22,1,0.36,1); }
        .pet-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
        .pet-card:hover .pc-img { transform: scale(1.08); }
        .pet-card:hover .pc-overlay { opacity: 1; }
        .pet-card:hover .pc-heart { transform: scale(1); opacity: 1; }
        .pc-img { transition: transform 0.6s cubic-bezier(0.22,1,0.36,1); }
        .pc-overlay { opacity: 0; transition: opacity 0.3s ease; }
        .pc-heart { transform: scale(0.6); opacity: 0; transition: all 0.3s cubic-bezier(0.22,1,0.36,1); }
        .filter-pill { transition: all 0.25s cubic-bezier(0.22,1,0.36,1); }
        .filter-pill:hover { transform: translateY(-1px); }
        .filter-pill.active { background: #60A5FA; color: white; border-color: #60A5FA; box-shadow: 0 4px 12px rgba(96,165,250,0.3); }
        .quiz-opt { transition: all 0.3s cubic-bezier(0.22,1,0.36,1); cursor: pointer; }
        .quiz-opt:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); border-color: #60A5FA; }
        .quiz-opt.selected { border-color: #60A5FA; background: #EFF6FF; box-shadow: 0 4px 16px rgba(96,165,250,0.15); }
        .quiz-opt.selected .opt-check { background: #60A5FA; border-color: #60A5FA; }
        .quiz-opt.selected .opt-check span { opacity: 1; }
        .match-card { transition: all 0.4s cubic-bezier(0.22,1,0.36,1); }
        .match-card:hover { transform: translateY(-6px) scale(1.01); box-shadow: 0 20px 40px rgba(96,165,250,0.12); }
        .form-input { transition: all 0.25s ease; border: 1.5px solid #E8ECF1; border-radius: 12px; background: #F8FAFC; }
        .form-input:hover { border-color: #CBD5E1; background: #fff; }
        .form-input:focus { border-color: #60A5FA; background: #fff; box-shadow: 0 0 0 3px rgba(96,165,250,0.1); outline: none; }
        .order-step.done .step-circle { background: #10B981; border-color: #10B981; color: white; }
        .order-step.current .step-circle { background: #60A5FA; border-color: #60A5FA; color: white; box-shadow: 0 0 0 4px rgba(96,165,250,0.2); }
        .progress-fill { transition: width 0.6s cubic-bezier(0.22,1,0.36,1); }
        .grad-text { background: linear-gradient(135deg, #60A5FA, #2563EB); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 3px; }
      `}</style>
    </div>
  )
}

