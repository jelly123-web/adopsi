import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const superadminMenu = [
  { to: '/dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt', end: true },
  { to: '/dashboard/users', label: 'Kelola User', icon: 'fa-users' },
  { to: '/dashboard/categories', label: 'Kelola Kategori', icon: 'fa-tags' },
  { to: '/dashboard/animals', label: 'Kelola Hewan', icon: 'fa-paw' },
  { to: '/dashboard/questionnaire-character', label: 'Kuisioner Karakter', icon: 'fa-clipboard-list' },
  { to: '/dashboard/adoptions', label: 'Kelola Pengajuan Adopsi', icon: 'fa-file-alt', end: true },
  { to: '/dashboard/adoptions/verify', label: 'Verifikasi Adopsi', icon: 'fa-check-circle' },
  { to: '/dashboard/customers', label: 'Data Customer', icon: 'fa-address-book' },
  { to: '/dashboard/reports', label: 'Laporan', icon: 'fa-chart-line' },
  { to: '/dashboard/logs', label: 'History Logs', icon: 'fa-history' },
  { to: '/dashboard/restore', label: 'Pulihkan Data', icon: 'fa-undo' },
]

const adminMenu = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt', end: true },
  { to: '/admin/categories', label: 'Kelola Kategori', icon: 'fa-tags' },
  { to: '/admin/animals', label: 'Kelola Hewan', icon: 'fa-paw' },
  { to: '/admin/adoptions', label: 'Kelola Pengajuan Adopsi', icon: 'fa-file-alt', end: true },
  { to: '/admin/adoptions/verify', label: 'Verifikasi Adopsi', icon: 'fa-check-circle' },
  { to: '/admin/customers', label: 'Data Customer', icon: 'fa-address-book' },
  { to: '/admin/reports', label: 'Laporan', icon: 'fa-chart-line' },
]

const petugasMenu = [
  { to: '/petugas/dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt', end: true },
  { to: '/petugas/animals', label: 'Data Hewan', icon: 'fa-paw', end: true },
  { to: '/petugas/adoptions', label: 'Kelola Pengajuan Adopsi', icon: 'fa-file-alt', end: true },
  { to: '/petugas/chat', label: 'Chat Customer', icon: 'fa-comments' },
  { to: '/petugas/visits', label: 'Jadwal Kunjungan', icon: 'fa-calendar-check' },
]

const customerMenu = [
  { to: '/customer/dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt', end: true },
  { to: '/customer/animals', label: 'Jelajahi Hewan', icon: 'fa-paw' },
  { to: '/customer/adoptions', label: 'Pengajuan Adopsi', icon: 'fa-heart' },
  { to: '/customer/status', label: 'Status Pengajuan', icon: 'fa-clipboard-list' },
]

function MenuIcon({ icon }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  const paths = {
    'fa-tachometer-alt': <path d="M4 13a8 8 0 0 1 16 0M12 13l4-4M5 19h14M7 13h.01M17 13h.01" />,
    'fa-users': <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />,
    'fa-tags': <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01" />,
    'fa-paw': (
      <>
        <circle cx="5.5" cy="10" r="2" fill="currentColor" stroke="none" />
        <circle cx="10" cy="6" r="2" fill="currentColor" stroke="none" />
        <circle cx="14" cy="6" r="2" fill="currentColor" stroke="none" />
        <circle cx="18.5" cy="10" r="2" fill="currentColor" stroke="none" />
        <path d="M7.5 17.2c0-3 2.1-5.2 4.5-5.2s4.5 2.2 4.5 5.2c0 2.2-1.5 3.4-3.1 2.7a3.4 3.4 0 0 0-2.8 0c-1.6.7-3.1-.5-3.1-2.7z" fill="currentColor" stroke="none" />
      </>
    ),
    'fa-clipboard-list': <path d="M9 5h6M9 12h6M9 16h6M7 5h.01M7 12h.01M7 16h.01M8 3h8l1 2h2v16H5V5h2l1-2z" />,
    'fa-file-alt': <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h6" />,
    'fa-check-circle': <path d="M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14.01l-3-3" />,
    'fa-address-book': <path d="M6 4h12a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8 2v4M16 2v4M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0zM8 20a5 5 0 0 1 8 0" />,
    'fa-chart-line': <path d="M3 3v18h18M7 15l4-4 3 3 5-7" />,
    'fa-history': <path d="M3 12a9 9 0 1 0 3-6.7M3 4v6h6M12 7v5l3 2" />,
    'fa-undo': <path d="M3 7v6h6M3.8 13A8 8 0 1 0 6 5.3L3 7" />,
    'fa-comments': <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4zM8 9h8M8 13h5" />,
    'fa-calendar-check': <path d="M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2zM9 16l2 2 4-5" />,
    'fa-heart': <path d="M20.8 8.6c0 5.4-8.8 10.2-8.8 10.2S3.2 14 3.2 8.6A4.6 4.6 0 0 1 12 6.7a4.6 4.6 0 0 1 8.8 1.9z" />,
  }

  return <svg className="nav-svg-icon" {...common}>{paths[icon] || paths['fa-paw']}</svg>
}

const getAuthSnapshot = () => ({
  role: localStorage.getItem('authRole') || 'superadmin',
  name: localStorage.getItem('authName') || '',
  email: localStorage.getItem('authEmail') || '',
  avatar: localStorage.getItem('authAvatar') || '',
})

function SuperadminSidebar({ open = true, onClose }) {
  const [authSnapshot, setAuthSnapshot] = useState(getAuthSnapshot)

  useEffect(() => {
    const refreshAuth = () => setAuthSnapshot(getAuthSnapshot())

    window.addEventListener('auth-profile-updated', refreshAuth)
    window.addEventListener('storage', refreshAuth)

    return () => {
      window.removeEventListener('auth-profile-updated', refreshAuth)
      window.removeEventListener('storage', refreshAuth)
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

        <nav className="sidebar-nav">
          <div className="nav-section-title">MENU</div>
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            >
              <i className={`fas ${item.icon}`} />
              <span>{item.label}</span>
            </NavLink>
          ))}
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
