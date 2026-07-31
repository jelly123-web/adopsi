import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'

function getAuthInfo() {
  const appSettings = (() => {
    try {
      return JSON.parse(localStorage.getItem('appSettings') || '{}')
    } catch {
      return {}
    }
  })()
  const appName = appSettings.nama_apk || 'Sahabat Kecil'
  const logo = appSettings.logo_apk || ''
  const userName = localStorage.getItem('authName') || 'Customer'
  const userAvatar = localStorage.getItem('authAvatar') || ''
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'C'
  return { appName, logo, userName, userAvatar, initials }
}

function CustomerLayout({ children }) {
  const [authInfo, setAuthInfo] = useState(() => getAuthInfo())
  const { appName, logo, userName, userAvatar, initials } = authInfo

  useEffect(() => {
    const refresh = () => setAuthInfo(getAuthInfo())
    window.addEventListener('auth-profile-updated', refresh)
    return () => window.removeEventListener('auth-profile-updated', refresh)
  }, [])

  const isImageLogo = logo.startsWith?.('data:image')
  const isVideoLogo = logo.startsWith?.('data:video') || /\.(mp4|webm|ogg)(\?|#|$)/i.test(logo)

  return (
    <div className="customer-app">
      <nav className="customer-topnav">
        <div className="customer-nav-inner">
          <Link to="/customer/dashboard" className="customer-brand">
            <span className="customer-brand-mark">
              {isImageLogo ? <img src={logo} alt="" /> : isVideoLogo ? <video src={logo} autoPlay muted loop playsInline /> : <i className="fas fa-paw" />}
            </span>
            <strong>{appName}</strong>
          </Link>

          <div className="customer-tabs">
            <NavLink to="/customer/dashboard" end>Dashboard</NavLink>
            <NavLink to="/customer/animals">Jelajahi Hewan</NavLink>
            <NavLink to="/customer/adoptions">Pengajuan Adopsi</NavLink>
            <NavLink to="/customer/status">Status Pengajuan</NavLink>
          </div>

          <div className="customer-user">
            <button type="button" className="customer-bell" aria-label="Notifikasi">
              <i className="far fa-bell"></i>
              <span></span>
            </button>
            <Link to="/profile" className="customer-user-btn">
              {userAvatar && !userAvatar.startsWith('data:video') ? (
                <img src={userAvatar} alt={userName} className="customer-user-avatar-img" />
              ) : (
                <span>{initials}</span>
              )}
              <strong>{userName}</strong>
            </Link>
            <button
              type="button"
              className="customer-logout"
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
        </div>
      </nav>

      {children}

      <footer className="customer-footer">
        <div>
          <span className="customer-footer-mark"><i className="fas fa-paw"></i></span>
          <strong>{appName}</strong>
        </div>
        <p>Setiap hewan berhak atas rumah yang penuh kasih.</p>
      </footer>
    </div>
  )
}

export default CustomerLayout
