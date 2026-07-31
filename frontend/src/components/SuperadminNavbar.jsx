import { Link } from 'react-router-dom'

function SuperadminNavbar({
  pageTitle = '',
  statusLabel = 'LIVE',
  onToggleSidebar,
  sidebarOpen = true,
  offsetForSidebar = true,
}) {
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
            {sidebarOpen ? '\u00ab' : '\u00bb'}
          </button>
          {pageTitle ? <div className="topbar-page-title">{pageTitle}</div> : null}
        </div>
      </div>

      <div className="topbar-right">
        <button type="button" className="topbar-btn" aria-label="Notifikasi">
          <i className="fas fa-bell" aria-hidden="true" />
          <span className="notif-dot" aria-hidden="true" />
        </button>
        <Link to="/dashboard/settings" className="topbar-btn" aria-label="Pengaturan">
          <i className="fas fa-cog" aria-hidden="true" />
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
