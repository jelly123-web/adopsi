import { NavLink } from 'react-router-dom'

function SuperadminSidebar({ open = true, onClose }) {
  return (
    <>
      <aside className={`sidebar ${open ? 'open' : 'closed'}`} aria-label="Navigasi superadmin">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            A
          </span>
          <div>
            <strong>Adopsi Hewan</strong>
            <span>Superadmin</span>
          </div>
        </div>

        <nav className="side-nav">
          <NavLink to="/dashboard" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Dashboard
          </NavLink>
          <NavLink
            to="/dashboard/users"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Kelola User
          </NavLink>
          <NavLink
            to="/dashboard/animals"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Kelola Hewan
          </NavLink>
        </nav>
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
