import { useEffect, useState } from 'react'
import axios from 'axios'

const sampleUsers = [
  {
    id: 1,
    name: 'Budi Santoso',
    email: 'budi@mail.com',
    role: 'user',
    status: 'aktif',
    created_at: '2023-10-12T00:00:00.000Z',
  },
  {
    id: 2,
    name: 'Siti Aminah',
    email: 'siti@mail.com',
    role: 'user',
    status: 'aktif',
    created_at: '2023-11-05T00:00:00.000Z',
  },
  {
    id: 3,
    name: 'Super Admin',
    email: 'admin@mail.com',
    role: 'superadmin',
    status: 'aktif',
    created_at: '2023-09-01T00:00:00.000Z',
  },
  {
    id: 4,
    name: 'Joko Anwar',
    email: 'joko@mail.com',
    role: 'user',
    status: 'nonaktif',
    created_at: '2024-01-20T00:00:00.000Z',
  },
]

const emptyForm = {
  name: '',
  email: '',
  role: 'user',
  status: 'aktif',
}

function ManageUsers() {
  const [users, setUsers] = useState(sampleUsers)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  )

  const loadUsers = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/superadmin/users')
      setUsers(response.data.data?.length ? response.data.data : sampleUsers)
    } catch {
      setUsers(sampleUsers)
    }
  }

  useEffect(() => {
    let active = true

    ;(async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/superadmin/users')
        if (active) {
          setUsers(response.data.data?.length ? response.data.data : sampleUsers)
        }
      } catch {
        if (active) {
          setUsers(sampleUsers)
        }
      }
    })()

    return () => {
      active = false
    }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      if (editingId) {
        await axios.put(`http://localhost:3000/api/superadmin/users/${editingId}`, form)
      } else {
        await axios.post('http://localhost:3000/api/superadmin/users', form)
      }

      await loadUsers()
      setEditingId(null)
      setForm(emptyForm)
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal menyimpan user.')
    }
  }

  const handleEdit = (user) => {
    setEditingId(user.id)
    setForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'user',
      status: user.status || 'aktif',
    })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus user ini?')) return

    try {
      await axios.delete(`http://localhost:3000/api/superadmin/users/${id}`)
      await loadUsers()
      if (editingId === id) {
        setEditingId(null)
        setForm(emptyForm)
      }
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal menghapus user.')
    }
  }

  const handleReset = () => {
    setEditingId(null)
    setForm(emptyForm)
  }

  const renderInitials = (name = '') =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'U'

  const formatDate = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID')
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo">A</div>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-name">Adopsi Hewan</div>
            <div className="sidebar-brand-role">Superadmin</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">MENU</div>
          <a href="/dashboard" className="nav-item">
            <i className="fas fa-tachometer-alt"></i>
            <span>Dashboard</span>
          </a>
          <a href="/dashboard/users" className="nav-item active">
            <i className="fas fa-users"></i>
            <span>Kelola User</span>
          </a>
          <a href="/dashboard/animals" className="nav-item">
            <i className="fas fa-paw"></i>
            <span>Kelola Hewan</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">SA</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">Super Admin</div>
              <div className="sidebar-user-email">admin@adopsi.test</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="topbar-hamburger"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <i className="fas fa-bars"></i>
            </button>
            <div className="topbar-title">
              <div className="topbar-kicker">Kelola User</div>
              <div className="topbar-page-title">CRUD User</div>
            </div>
          </div>

          <div className="topbar-right">
            <button className="topbar-btn">
              <i className="fas fa-bell"></i>
              <span className="notif-dot"></span>
            </button>
            <button className="topbar-btn">
              <i className="fas fa-cog"></i>
            </button>
            <div className="live-indicator">
              <span className="live-dot"></span>
              LIVE
            </div>
          </div>
        </header>

        {/* Page Body */}
        <div className="page-body">
          <div className="two-col">
            {/* Form */}
            <div className="section-card">
              <div className="section-card-header">
                <div className="section-card-title">
                  <i className="fas fa-plus"></i>
                  {editingId ? 'Edit User' : 'Tambah User Baru'}
                </div>
              </div>
              <div className="section-card-body">
                <div style={{ padding: '22px' }}>
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label className="form-label">Nama</label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        className="form-select"
                      >
                        <option value="user">user</option>
                        <option value="superadmin">superadmin</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        className="form-select"
                      >
                        <option value="aktif">aktif</option>
                        <option value="nonaktif">nonaktif</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                      <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                        {editingId ? 'Simpan Perubahan' : 'Tambah User'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleReset}
                      >
                        Reset
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="section-card">
              <div className="section-card-header">
                <div className="section-card-title">
                  <i className="fas fa-table"></i>
                  Daftar User
                </div>
              </div>
              <div className="section-card-body">
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>NAMA</th>
                        <th>EMAIL</th>
                        <th>ROLE</th>
                        <th>STATUS</th>
                        <th>TERDAFTAR</th>
                        <th>AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>
                            <div className="cell-branch">
                              <div
                                className="cell-branch-dot"
                                style={{
                                  background:
                                    user.role === 'superadmin'
                                      ? 'linear-gradient(135deg, var(--purple) 0%, var(--blue) 100%)'
                                      : 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)',
                                }}
                              >
                                {renderInitials(user.name)}
                              </div>
                              <div>
                                <div className="cell-branch-name">{user.name}</div>
                              </div>
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td>{user.role}</td>
                          <td>
                            <span className={`status-badge ${user.status}`}>
                              <span className="status-dot"></span>
                              {user.status}
                            </span>
                          </td>
                          <td>{formatDate(user.created_at)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => handleEdit(user)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => handleDelete(user.id)}
                                disabled={user.role === 'superadmin'}
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ManageUsers
