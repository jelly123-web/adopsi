import { Link, NavLink } from 'react-router-dom'

function SuperadminSidebar({ open = true, onClose }) {
  return (
    <>
      <aside className={`sidebar ${open ? 'open' : 'closed'}`} aria-label="Navigasi superadmin">
        <div className="sidebar-brand">
          <span className="sidebar-logo" aria-hidden="true">
            A
          </span>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-name">Adopsi Hewan</div>
            <div className="sidebar-brand-role">Superadmin</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Menu</div>
          <NavLink to="/dashboard" end className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <i className="fas fa-tachometer-alt" aria-hidden="true" />
            Dashboard
          </NavLink>
          <NavLink
            to="/dashboard/users"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            <i className="fas fa-users" aria-hidden="true" />
            Kelola User
          </NavLink>
          <NavLink
            to="/dashboard/categories"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            <i className="fas fa-tags" aria-hidden="true" />
            Kelola Kategori
          </NavLink>
          <NavLink
            to="/dashboard/animals"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            <i className="fas fa-paw" aria-hidden="true" />
            Kelola Hewan
          </NavLink>
          <NavLink
            to="/dashboard/questionnaire-character"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            <i className="fas fa-clipboard-list" aria-hidden="true" />
            Kuisioner Karakter
          </NavLink>
          <NavLink
            to="/dashboard/adoptions"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            <i className="fas fa-file-alt" aria-hidden="true" />
            Kelola Pengajuan Adopsi
          </NavLink>
          <NavLink
            to="/dashboard/reports"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            <i className="fas fa-chart-line" aria-hidden="true" />
            Laporan
          </NavLink>
          <NavLink
            to="/dashboard/settings"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            <i className="fas fa-cog" aria-hidden="true" />
            Pengaturan Sistem
          </NavLink>
          <NavLink
            to="/dashboard/restore"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            <i className="fas fa-undo" aria-hidden="true" />
            Pulihkan Data
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <Link to="/dashboard/profile" className="sidebar-user">
            <div className="sidebar-avatar">SA</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">Super Admin</div>
              <div className="sidebar-user-email">admin@adopsi.test</div>
            </div>
          </Link>

          <button type="button" className="sidebar-logout-btn" onClick={() => { window.location.href = '/' }}>
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
