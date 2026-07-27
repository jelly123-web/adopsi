import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

const emptyForm = {
  name: '',
}

function ManageCategories() {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  )

  const loadCategories = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/superadmin/categories')
      setCategories(response.data.data || [])
    } catch {
      setCategories([])
    }
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/superadmin/categories')
        if (active) {
          setCategories(response.data.data || [])
        }
      } catch {
        if (active) {
          setCategories([])
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
        await axios.put(`http://localhost:3000/api/superadmin/categories/${editingId}`, form)
      } else {
        await axios.post('http://localhost:3000/api/superadmin/categories', form)
      }
      await loadCategories()
      closeDrawer()
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal menyimpan kategori.')
    }
  }

  const openAddDrawer = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDrawerOpen(true)
  }

  const openEditDrawer = (category) => {
    setEditingId(category.id)
    setForm({
      name: category.name || '',
    })
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus kategori ini?')) return
    try {
      await axios.delete(`http://localhost:3000/api/superadmin/categories/${id}`)
      await loadCategories()
      if (editingId === id) {
        closeDrawer()
      }
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal menghapus kategori.')
    }
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
          <a href="/dashboard/users" className="nav-item">
            <i className="fas fa-users"></i>
            <span>Kelola User</span>
          </a>
          <a href="/dashboard/categories" className="nav-item active">
            <i className="fas fa-tags"></i>
            <span>Kelola Kategori</span>
          </a>
          <a href="/dashboard/animals" className="nav-item">
            <i className="fas fa-paw"></i>
            <span>Kelola Hewan</span>
          </a>
          <a href="/dashboard/questionnaire-character" className="nav-item">
            <i className="fas fa-clipboard-list"></i>
            <span>Kuisioner Karakter</span>
          </a>
          <a href="/dashboard/adoptions" className="nav-item">
            <i className="fas fa-file-alt"></i>
            <span>Kelola Pengajuan Adopsi</span>
          </a>
          <a href="/dashboard/reports" className="nav-item">
            <i className="fas fa-chart-line"></i>
            <span>Laporan</span>
          </a>
          <a href="/dashboard/settings" className="nav-item">
            <i className="fas fa-cog"></i>
            <span>Pengaturan Sistem</span>
          </a>
          <a href="/dashboard/restore" className="nav-item">
            <i className="fas fa-undo"></i>
            <span>Pulihkan Data</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <Link to="/dashboard/profile" className="sidebar-user">
            <div className="sidebar-avatar">SA</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">Super Admin</div>
              <div className="sidebar-user-email">admin@adopsi.test</div>
            </div>
          </Link>
          <button 
            className="sidebar-logout-btn"
            onClick={() => { window.location.href = '/'; }}
          >
            <i className="fas fa-sign-out-alt"></i> Keluar
          </button>
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
              <button 
                className="topbar-toggle" 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? '≪' : '≫'}
              </button>
              <div className="topbar-page-title">Kelola Kategori</div>
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
          <div className="page-header">
            <h1 className="page-header-title">
              <i className="fas fa-tags"></i>
              Daftar Kategori Hewan
            </h1>
            <p className="page-header-desc">
              Kelola semua kategori hewan yang tersedia untuk diadopsi.
            </p>
          </div>

          <div className="content-toolbar">
            <div className="search-box">
              <input type="text" placeholder="Cari nama kategori..." />
              <button><i className="fas fa-search"></i> Cari</button>
            </div>
            <button className="primary-link" onClick={openAddDrawer}>
              <i className="fas fa-plus"></i> Tambah Kategori
            </button>
          </div>

          {/* Panel / Table */}
          <div className="panel">
            <div className="panel-head">
              <h2><i className="fas fa-table"></i> Semua Kategori</h2>
              <span>{categories.length} kategori</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nama Kategori</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td>{category.id}</td>
                      <td>
                        <strong>{category.name}</strong>
                      </td>
                      <td>
                        <div className="actions">
                          <button 
                            className="btn-open-edit" 
                            onClick={() => openEditDrawer(category)}
                          >
                            <i className="fas fa-pen"></i> Edit
                          </button>
                          <button 
                            className="btn-delete-user" 
                            onClick={() => handleDelete(category.id)}
                          >
                            <i className="fas fa-trash"></i> Hapus
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
      </main>

      {/* Drawer */}
      <div 
        className={`drawer-backdrop ${drawerOpen ? 'open' : ''}`} 
        onClick={closeDrawer}
      ></div>
      <div className={`user-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-head">
          <h3>
            <i className="fas fa-tags"></i>
            {editingId ? 'Edit Kategori' : 'Tambah Kategori'}
          </h3>
          <button className="drawer-close" onClick={closeDrawer}>
            <i className="fas fa-times"></i> Tutup
          </button>
        </div>
        <div className="drawer-body">
          <form className="user-form" onSubmit={handleSubmit}>
            <div className="drawer-field">
              <label htmlFor="name">Nama Kategori</label>
              <input
                type="text"
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Masukkan nama kategori"
              />
            </div>

            <div className="drawer-buttons">
              <button type="submit" className="primary-link">
                {editingId ? 'Simpan Perubahan' : 'Tambah Kategori'}
              </button>
              <button 
                type="button" 
                className="danger-link"
                onClick={closeDrawer}
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ManageCategories
