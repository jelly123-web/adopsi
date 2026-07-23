import { NavLink } from 'react-router-dom'

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M15 17H5c1.1-1.1 2-2.9 2-5V9a5 5 0 1 1 10 0v3c0 2.1.9 3.9 2 5h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 19a2 2 0 0 0 4 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19.4 15a8 8 0 0 0 0-6l2-1.2-1.8-3.1-2.3.8a8 8 0 0 0-5.1-3L12 0h-4l-.2 2.5a8 8 0 0 0-5.1 3l-2.3-.8-1.8 3.1 2 1.2a8 8 0 0 0 0 6l-2 1.2 1.8 3.1 2.3-.8a8 8 0 0 0 5.1 3L8 24h4l.2-2.5a8 8 0 0 0 5.1-3l2.3.8 1.8-3.1-2-1.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SuperadminNavbar({ chipLabel, onToggleSidebar, sidebarOpen = true }) {
  return (
    <header className={`superadmin-navbar ${sidebarOpen ? 'shifted' : ''}`}>
      <div className="superadmin-navbar-left">
        <button
          type="button"
          className="sidebar-toggle navbar-toggle"
          aria-label="Buka tutup sidebar"
          onClick={onToggleSidebar}
        >
          ≡
        </button>

        <NavLink to="/dashboard" className="navbar-brand">
          <span className="brand-mark" aria-hidden="true">
            A
          </span>
          <span className="navbar-brand-text">
            <strong>Adopsi Hewan</strong>
            <small>Superadmin</small>
          </span>
        </NavLink>
      </div>

      <div className="superadmin-navbar-right">
        <button type="button" className="icon-button" aria-label="Pengaturan">
          <IconSettings />
        </button>
        <button type="button" className="icon-button" aria-label="Notifikasi">
          <IconBell />
          <span className="icon-badge" aria-hidden="true" />
        </button>
        <div className="admin-chip">{chipLabel}</div>
      </div>
    </header>
  )
}

export default SuperadminNavbar
