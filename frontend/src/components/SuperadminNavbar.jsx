import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api'

const getAuthSnapshot = () => {
  const role = localStorage.getItem('authRole') || 'superadmin'
  const name = localStorage.getItem('authName') || (role === 'admin' ? 'Admin' : role === 'petugas' ? 'Petugas' : 'Super Admin')
  const email = localStorage.getItem('authEmail') || ''
  const avatar = localStorage.getItem('authAvatar') || ''
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'A'
  const profilePath = role === 'admin' ? '/admin/profile' : role === 'petugas' ? '/petugas/profile' : '/dashboard/profile'

  return { role, name, email, avatar, initials, profilePath }
}

const isVideoMedia = (value = '') => value.startsWith('data:video') || /\.(mp4|webm|ogg)(\?|#|$)/i.test(value)

const getNotifReadKey = (role) => `panelReadNotificationIds:${role || 'superadmin'}`

const getReadNotificationIds = (role) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(getNotifReadKey(role)) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const formatNotifTime = (value) => {
  if (!value) return 'Baru saja'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Baru saja'
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SuperadminNavbar({
  pageTitle = '',
  statusLabel = 'LIVE',
  onToggleSidebar,
  sidebarOpen = true,
  offsetForSidebar = true,
}) {
  const [notifications, setNotifications] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)
  const [authInfo, setAuthInfo] = useState(getAuthSnapshot)
  const [readNotificationIds, setReadNotificationIds] = useState(() =>
    getReadNotificationIds(getAuthSnapshot().role)
  )

  useEffect(() => {
    const getRolePath = (type) => {
      if (type === 'chat') {
        if (authInfo.role === 'admin') return '/admin/chat'
        if (authInfo.role === 'petugas') return '/petugas/chat'
        return '/dashboard/chat'
      }
      if (authInfo.role === 'admin') return '/admin/adoptions'
      if (authInfo.role === 'petugas') return '/petugas/adoptions'
      return '/dashboard/adoptions'
    }

    const fromLocalStorage = () => {
      const items = []
      try {
        const adoptions = JSON.parse(localStorage.getItem('adoptions') || '[]')
        adoptions
          .filter((a) => ['menunggu', 'Menunggu', 'pending'].includes(a.status))
          .slice(0, 5)
          .forEach((adoption) => {
            items.push({
              id: `local-adoption-${adoption.id || adoption.petId || adoption.animal_id || Math.random()}`,
              type: 'adoption',
              icon: 'fa-file-alt',
              title: 'Pengajuan adopsi baru',
              text: `${adoption.user_name || adoption.full_name || 'Customer'} ingin adopsi ${adoption.animal_name || adoption.petName || 'hewan'}.`,
              time: adoption.created_at || adoption.date || '',
              to: getRolePath('adoption'),
            })
          })
      } catch (e) {
        console.error('Error parsing adoptions', e)
      }

      try {
        const chatData = JSON.parse(localStorage.getItem('petugasChatReplies') || '{}')
        Object.values(chatData).forEach((messages) => {
          if (!Array.isArray(messages)) return
          messages
            .filter((m) => m.sender === 'customer')
            .slice(-3)
            .forEach((message) => {
              items.push({
                id: `local-chat-${message.id || message.created_at || Math.random()}`,
                type: 'chat',
                icon: 'fa-comment-dots',
                title: 'Pesan customer',
                text: message.text || message.message || 'Pesan baru masuk.',
                time: message.created_at || message.time || '',
                to: getRolePath('chat'),
              })
            })
        })
      } catch (e) {
        console.error('Error parsing chats', e)
      }

      return items
    }

    const checkNotifications = async () => {
      const items = []
      try {
        const response = await axios.get(`${API_BASE_URL}/superadmin/adoption-requests`)
        ;(response.data?.data || [])
          .filter((item) => item.status === 'pending' || item.status === 'menunggu' || item.status === 'Menunggu')
          .slice(0, 6)
          .forEach((request) => {
            items.push({
              id: `adoption-${request.id}`,
              type: 'adoption',
              icon: 'fa-file-alt',
              title: 'Pengajuan adopsi baru',
              text: `${request.user_name || request.full_name || 'Customer'} ingin adopsi ${request.animal_name || 'hewan'}.`,
              time: request.created_at,
              to: getRolePath('adoption'),
            })
          })
      } catch {
        items.push(...fromLocalStorage().filter((item) => item.type === 'adoption'))
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/chat-messages`)
        ;(response.data?.data || [])
          .filter((message) => {
            if (message.sender !== 'customer') return false
            if (authInfo.role === 'admin') return !message.target_role || message.target_role === 'admin'
            if (authInfo.role === 'petugas') return !message.target_role || message.target_role === 'petugas'
            return true
          })
          .slice(-6)
          .reverse()
          .forEach((message) => {
            items.push({
              id: `chat-${message.id || message.msg_id || message.created_at}`,
              type: 'chat',
              icon: 'fa-comment-dots',
              title: `Chat dari ${message.user_name || message.customer_name || 'Customer'}`,
              text: message.message || 'Pesan baru masuk.',
              time: message.created_at,
              to: getRolePath('chat'),
            })
          })
      } catch {
        items.push(...fromLocalStorage().filter((item) => item.type === 'chat'))
      }

      setNotifications(items.slice(0, 10))
    }

    checkNotifications()

    window.addEventListener('chat-updated', checkNotifications)
    window.addEventListener('adoption-updated', checkNotifications)
    const interval = setInterval(checkNotifications, 3000)

    return () => {
      window.removeEventListener('chat-updated', checkNotifications)
      window.removeEventListener('adoption-updated', checkNotifications)
      clearInterval(interval)
    }
  }, [authInfo.role])

  useEffect(() => {
    const refreshAuth = () => setAuthInfo(getAuthSnapshot())
    window.addEventListener('auth-profile-updated', refreshAuth)
    window.addEventListener('storage', refreshAuth)

    return () => {
      window.removeEventListener('auth-profile-updated', refreshAuth)
      window.removeEventListener('storage', refreshAuth)
    }
  }, [])

  useEffect(() => {
    setReadNotificationIds(getReadNotificationIds(authInfo.role))
  }, [authInfo.role])

  const markNotificationsRead = (items = notifications) => {
    if (!items.length) return
    const next = Array.from(new Set([
      ...readNotificationIds,
      ...items.map((item) => item.id),
    ])).slice(-200)

    setReadNotificationIds(next)
    localStorage.setItem(getNotifReadKey(authInfo.role), JSON.stringify(next))
  }

  const markAllNotificationsRead = () => {
    markNotificationsRead(notifications)
    setNotifOpen(false)
  }

  const unreadNotifications = notifications.filter((item) => !readNotificationIds.includes(item.id))
  const displayedNotifications = [...notifications].sort((a, b) => {
    const aUnread = readNotificationIds.includes(a.id) ? 0 : 1
    const bUnread = readNotificationIds.includes(b.id) ? 0 : 1
    if (aUnread !== bUnread) return bUnread - aUnread
    const aTime = new Date(a.time || 0).getTime()
    const bTime = new Date(b.time || 0).getTime()
    return bTime - aTime
  })

  return (
    <header className={`topbar superadmin-navbar ${offsetForSidebar && sidebarOpen ? 'shifted' : ''}`}>
      <div className="topbar-left">
        <div className="topbar-title">
          <button
            type="button"
            className="topbar-toggle"
            aria-label="Buka tutup sidebar"
            onClick={onToggleSidebar}
          >
            <i className="fas fa-bars" aria-hidden="true" />
          </button>
          {pageTitle ? <div className="topbar-page-title">{pageTitle}</div> : null}
        </div>
      </div>

      <div className="topbar-right">
        <div className="notif-wrapper">
          <button
            type="button"
            className="topbar-btn"
            aria-label="Notifikasi"
            onClick={() => {
              setNotifOpen((open) => {
                if (!open) markNotificationsRead(notifications)
                return !open
              })
            }}
          >
            <i className="fas fa-bell" aria-hidden="true" />
            {unreadNotifications.length > 0 && <span className="notif-dot" aria-hidden="true" />}
            {unreadNotifications.length > 0 && <span className="notif-count">{unreadNotifications.length}</span>}
          </button>
          {notifOpen && (
            <div className="notif-menu">
              <div className="notif-menu-head">
                <div className="notif-menu-head-copy">
                  <strong>Notifikasi</strong>
                  <span>{unreadNotifications.length} baru</span>
                </div>
                <button
                  type="button"
                  className="notif-mark-read"
                  onClick={markAllNotificationsRead}
                  disabled={notifications.length === 0 || unreadNotifications.length === 0}
                >
                  Tandai dibaca
                </button>
              </div>
              {notifications.length === 0 ? (
                <div className="notif-empty">Belum ada notifikasi baru.</div>
              ) : (
                displayedNotifications.map((item) => (
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
                      <span className="notif-item-time">{formatNotifTime(item.time)}</span>
                    </span>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
        {authInfo.role === 'superadmin' && (
          <Link to="/dashboard/settings" className="topbar-btn" aria-label="Pengaturan">
            <i className="fas fa-cog" aria-hidden="true" />
          </Link>
        )}
        <Link to={authInfo.profilePath} className="topbar-profile-link" title={authInfo.email || 'Profil Akun'}>
          <span className="topbar-profile-avatar">
            {authInfo.avatar ? (
              isVideoMedia(authInfo.avatar) ? (
                <video src={authInfo.avatar} autoPlay muted loop playsInline />
              ) : (
                <img src={authInfo.avatar} alt={authInfo.name} />
              )
            ) : (
              authInfo.initials
            )}
          </span>
          <span className="topbar-profile-name">{authInfo.name.split(' ')[0]}</span>
        </Link>
        <div className="live-indicator">
          <span className="live-dot" aria-hidden="true" />
          {statusLabel}
        </div>
      </div>
    </header>
  )
}

export default SuperadminNavbar
