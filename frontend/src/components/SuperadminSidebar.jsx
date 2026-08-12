import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const superadminMenu = [
  { to: '/dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt', end: true },
  { to: '/dashboard/chat', label: 'Chat Customer', icon: 'fa-comments' },
  { to: '/dashboard/users', label: 'Kelola User', icon: 'fa-users' },
  { to: '/dashboard/categories', label: 'Kelola Kategori', icon: 'fa-tags' },
  { to: '/dashboard/animals', label: 'Kelola Hewan', icon: 'fa-paw' },
  { to: '/dashboard/adoptions', label: 'Kelola Pengajuan Adopsi', icon: 'fa-file-alt', end: true },
  { to: '/dashboard/adoptions/verify', label: 'Verifikasi Adopsi', icon: 'fa-check-circle' },
  { to: '/dashboard/customers', label: 'Data Customer', icon: 'fa-address-book' },
  { to: '/dashboard/reports', label: 'Laporan', icon: 'fa-chart-line' },
  { to: '/dashboard/logs', label: 'History Logs', icon: 'fa-history' },
  { to: '/dashboard/permissions', label: 'Hak Akses', icon: 'fa-shield-alt' },
  { to: '/dashboard/restore', label: 'Pulihkan Data', icon: 'fa-undo' },
]

const adminMenu = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt', end: true },
  { to: '/admin/chat', label: 'Chat Customer', icon: 'fa-comments' },
  { to: '/admin/categories', label: 'Kelola Kategori', icon: 'fa-tags' },
  { to: '/admin/animals', label: 'Kelola Hewan', icon: 'fa-paw' },
  { to: '/admin/adoptions', label: 'Kelola Pengajuan Adopsi', icon: 'fa-file-alt', end: true },
  { to: '/admin/adoptions/verify', label: 'Verifikasi Adopsi', icon: 'fa-check-circle' },
  { to: '/admin/customers', label: 'Data Customer', icon: 'fa-address-book' },
  { to: '/admin/reports', label: 'Laporan', icon: 'fa-chart-line' },
]

const petugasMenu = [
  { to: '/petugas/dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt', end: true },
  { to: '/petugas/chat', label: 'Chat Customer', icon: 'fa-comments' },
  { to: '/petugas/animals', label: 'Data Hewan', icon: 'fa-paw', end: true },
  { to: '/petugas/adoptions', label: 'Kelola Pengajuan Adopsi', icon: 'fa-file-alt', end: true },
  { to: '/petugas/visits', label: 'Jadwal Kunjungan', icon: 'fa-calendar-check' },
]

const customerMenu = [
  { to: '/customer/dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt', end: true },
  { to: '/customer/animals', label: 'Jelajahi Hewan', icon: 'fa-paw' },
  { to: '/customer/adoptions', label: 'Pengajuan Adopsi', icon: 'fa-heart' },
  { to: '/customer/status', label: 'Status Pengajuan', icon: 'fa-clipboard-list' },
  { to: '/customer/chat', label: 'Chat Petugas & Admin', icon: 'fa-comments' },
]

function MenuIcon({ icon }) {
  return <i className={`nav-fa-icon fas ${icon}`} aria-hidden="true" />
}

const getAuthSnapshot = () => ({
  role: localStorage.getItem('authRole') || 'superadmin',
  name: localStorage.getItem('authName') || '',
  email: localStorage.getItem('authEmail') || '',
  avatar: localStorage.getItem('authAvatar') || '',
})

const hasUnreadCustomerChat = (role) => {
  try {
    const chatData = JSON.parse(localStorage.getItem('petugasChatReplies') || '{}')
    return Object.values(chatData).some((messages) => (
      Array.isArray(messages)
      && messages.some((message) => (
        message.sender === 'customer'
        && !message.isRead
        && (role === 'superadmin' || !message.targetRole || message.targetRole === role)
      ))
    ))
  } catch {
    return false
  }
}

function SuperadminSidebar({ open = true, onClose }) {
  const sidebarNavRef = useRef(null)
  const [authSnapshot, setAuthSnapshot] = useState(getAuthSnapshot)
  const [hasUnreadChat, setHasUnreadChat] = useState(() =>
    hasUnreadCustomerChat(getAuthSnapshot().role)
  )

  useEffect(() => {
    const refreshAuth = () => setAuthSnapshot(getAuthSnapshot())

    window.addEventListener('auth-profile-updated', refreshAuth)
    window.addEventListener('storage', refreshAuth)

    return () => {
      window.removeEventListener('auth-profile-updated', refreshAuth)
      window.removeEventListener('storage', refreshAuth)
    }
  }, [])

  // The sidebar is recreated when the route changes. Keep its own scroll
  // position so selecting a menu item near the bottom does not jump to MENU.
  useLayoutEffect(() => {
    const nav = sidebarNavRef.current
    if (!nav) return undefined

    const savedPosition = Number(sessionStorage.getItem('superadminSidebarScrollTop') || 0)
    nav.scrollTop = Number.isFinite(savedPosition) ? savedPosition : 0

    const savePosition = () => {
      sessionStorage.setItem('superadminSidebarScrollTop', String(nav.scrollTop))
    }

    nav.addEventListener('scroll', savePosition, { passive: true })
    return () => {
      savePosition()
      nav.removeEventListener('scroll', savePosition)
    }
  }, [])

  useEffect(() => {
    const refreshUnread = () => setHasUnreadChat(hasUnreadCustomerChat(getAuthSnapshot().role))

    refreshUnread()
    window.addEventListener('chat-updated', refreshUnread)
    window.addEventListener('storage', refreshUnread)
    const interval = setInterval(refreshUnread, 3000)

    return () => {
      window.removeEventListener('chat-updated', refreshUnread)
      window.removeEventListener('storage', refreshUnread)
      clearInterval(interval)
    }
  }, [])

  const role = authSnapshot.role
  const isAdmin = role === 'admin'
  const isPetugas = role === 'petugas'
  const isCustomer = role === 'costumer'
  const menuItems = isPetugas ? petugasMenu : isAdmin ? adminMenu : isCustomer ? customerMenu : superadminMenu
  const roleLabel = isPetugas ? 'Petugas' : isAdmin ? 'Admin' : isCustomer ? 'Customer' : 'Superadmin'
  const userName = authSnapshot.name || (isPetugas ? 'Petugas' : isAdmin ? 'Admin' : isCustomer ? 'Customer' : 'Super Admin')
  const userEmail = authSnapshot.email || (isPetugas ? 'petugas@gmail.com' : isAdmin ? 'admin@gmail.com' : isCustomer ? 'customer@gmail.com' : 'admin@adopsi.test')
  const userAvatar = authSnapshot.avatar || ''
  const profilePath = isPetugas ? '/petugas/profile' : isAdmin ? '/admin/profile' : isCustomer ? '/profile' : '/dashboard/profile'
  const isVideoAvatar = userAvatar.startsWith('data:video') || /\.(mp4|webm|ogg)(\?|#|$)/i.test(userAvatar)
  const avatarText = (userName || roleLabel)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'A'

  return (
    <>
      <aside className={`sidebar ${open ? 'open' : 'closed'}`} aria-label={`Navigasi ${roleLabel.toLowerCase()}`}>
        <div className="sidebar-brand">
          <span className="sidebar-logo" aria-hidden="true">
            A
          </span>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-name">Adopsi Hewan</div>
            <div className="sidebar-brand-role">{roleLabel}</div>
          </div>
        </div>

        <nav ref={sidebarNavRef} className="sidebar-nav">
          <div className="nav-section-title">MENU</div>
          {menuItems.map((item) => {
            const showChatUnread = item.to.includes('/chat') && !isCustomer && hasUnreadChat
            const isLongLabel = item.to === '/dashboard/adoptions'
            return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => [
                'nav-item',
                isActive ? 'active' : '',
                isLongLabel ? 'nav-item-long' : '',
              ].filter(Boolean).join(' ')}
            >
              <MenuIcon icon={item.icon} />
              <span>{item.label}</span>
              {showChatUnread && <span className="sidebar-chat-dot" aria-label="Ada chat baru" />}
            </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <Link to={profilePath} className="sidebar-user">
            <div className="sidebar-avatar">
              {userAvatar ? (
                isVideoAvatar ? (
                  <video src={userAvatar} autoPlay muted loop playsInline />
                ) : (
                  <img src={userAvatar} alt={userName} />
                )
              ) : (
                avatarText
              )}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{userName}</div>
              <div className="sidebar-user-email">{userEmail}</div>
            </div>
          </Link>

          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={() => {
              localStorage.removeItem('authUserId')
              localStorage.removeItem('authName')
              localStorage.removeItem('authRole')
              localStorage.removeItem('authEmail')
              localStorage.removeItem('authAvatar')
              localStorage.removeItem('authRemember')
              window.location.href = '/login'
            }}
          >
            Keluar
          </button>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          className="sidebar-backdrop open"
          aria-label="Tutup sidebar"
          onClick={onClose}
        />
      ) : null}
    </>
  )
}

export default SuperadminSidebar
