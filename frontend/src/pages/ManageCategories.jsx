import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { publishLiveData, subscribeLiveData } from '../utils/liveDataEvents'

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
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCategories, setTotalCategories] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  const loadCategories = async (page = 1, search = '') => {
    try {
      const response = await axios.get(`http://localhost:3000/api/superadmin/categories?page=${page}&limit=6&search=${search}`)
      setCategories(response.data.data || [])
      setCurrentPage(response.data.page || 1)
      setTotalPages(response.data.pages || 1)
      setTotalCategories(response.data.total || 0)
    } catch {
      setCategories([])
    }
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/superadmin/categories?page=1&limit=6`)
        if (active) {
          setCategories(response.data.data || [])
          setCurrentPage(response.data.page || 1)
          setTotalPages(response.data.pages || 1)
          setTotalCategories(response.data.total || 0)
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

  useEffect(() => {
    return subscribeLiveData('categories', () => loadCategories(currentPage, searchTerm))
  }, [currentPage, searchTerm])

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
      await loadCategories(1, searchTerm)
      publishLiveData('categories')
      closeDrawer()
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal menyimpan kategori.')
    }
  }

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    loadCategories(1, value)
  }

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      loadCategories(page, searchTerm)
    }
  }

  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
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
      await loadCategories(currentPage, searchTerm)
      publishLiveData('categories')
      if (editingId === id) {
        closeDrawer()
      }
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal menghapus kategori.')
    }
  }

  const handleDeleteAll = async () => {
    if (!window.confirm('Hapus semua kategori?')) return
    try {
      if (categories.length === 0) {
        window.alert('Tidak ada kategori yang bisa dihapus.')
        return
      }
      
      for (const category of categories) {
        await axios.delete(`http://localhost:3000/api/superadmin/categories/${category.id}`)
      }
      
      await loadCategories(1, searchTerm)
      publishLiveData('categories')
      if (editingId) {
        closeDrawer()
      }
      window.alert(`${categories.length} kategori berhasil dihapus.`)
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal menghapus semua kategori.')
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
          <a href="/dashboard/adoptions/verify" className="nav-item">
            <i className="fas fa-check-circle"></i>
            <span>Verifikasi Adopsi</span>
          </a>
          <a href="/dashboard/customers" className="nav-item">
            <i className="fas fa-address-book"></i>
            <span>Data Customer</span>
          </a>
          <a href="/dashboard/reports" className="nav-item">
            <i className="fas fa-chart-line"></i>
            <span>Laporan</span>
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
            onClick={() => {
              localStorage.removeItem('authUserId')
              localStorage.removeItem('authName')
              localStorage.removeItem('authRole')
              localStorage.removeItem('authEmail')
              localStorage.removeItem('authRemember')
              window.location.href = '/login'
            }}
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
            <Link to="/dashboard/settings" className="topbar-btn" aria-label="Pengaturan Sistem">
              <i className="fas fa-cog"></i>
            </Link>
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
              <input 
                type="text" 
                placeholder="Cari nama kategori..." 
                value={searchTerm}
                onChange={handleSearch}
              />
              <button><i className="fas fa-search"></i> Cari</button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="primary-link" onClick={openAddDrawer}>
                <i className="fas fa-plus"></i> Tambah Kategori
              </button>
              <button 
                className="danger-link" 
                onClick={handleDeleteAll}
              >
                <i className="fas fa-trash"></i> Hapus Semua
              </button>
            </div>
          </div>

          {/* Panel / Table */}
          <div className="panel">
            <div className="panel-head">
              <h2><i className="fas fa-table"></i> Semua Kategori</h2>
              <span>{totalCategories} kategori</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nama Kategori</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td>{category.id}</td>
                      <td>
                        <strong>{category.name}</strong>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="actions" style={{ justifyContent: 'center' }}>
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
            {/* Pagination Controls - Light Blue */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              padding: '25px 20px',
              borderTop: '2px solid #f0f0f0',
              backgroundColor: 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)',
              backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)',
              gap: '15px',
              fontFamily: '"Poppins", "Segoe UI", sans-serif'
            }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  style={{
                    width: '28px',
                    height: '28px',
                    padding: '0',
                    backgroundColor: currentPage === 1 ? '#e8e8e8' : '#4BA3FF',
                    color: currentPage === 1 ? '#999' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: '"Poppins", "Segoe UI", sans-serif',
                    transition: 'all 0.3s ease',
                    boxShadow: currentPage === 1 ? 'none' : '0 4px 12px rgba(75, 163, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    letterSpacing: '1px',
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== 1) {
                      e.target.style.backgroundColor = '#2E8FD9'
                      e.target.style.transform = 'translateY(-2px)'
                      e.target.style.boxShadow = '0 6px 16px rgba(75, 163, 255, 0.4)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== 1) {
                      e.target.style.backgroundColor = '#4BA3FF'
                      e.target.style.transform = 'translateY(0)'
                      e.target.style.boxShadow = '0 4px 12px rgba(75, 163, 255, 0.3)'
                    }
                  }}
                >
                  ◀
                </button>

                <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      style={{
                        width: '26px',
                        height: '26px',
                        backgroundColor: currentPage === page 
                          ? 'linear-gradient(135deg, #4BA3FF 0%, #2E8FD9 100%)' 
                          : '#f0f0f0',
                        backgroundImage: currentPage === page
                          ? 'linear-gradient(135deg, #4BA3FF 0%, #2E8FD9 100%)'
                          : 'none',
                        color: currentPage === page ? 'white' : '#999',
                        border: currentPage === page ? 'none' : '2px solid #e8e8e8',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: currentPage === page ? '700' : '600',
                        fontFamily: '"Poppins", "Segoe UI", sans-serif',
                        transition: 'all 0.3s ease',
                        boxShadow: currentPage === page ? '0 4px 12px rgba(75, 163, 255, 0.4)' : 'none',
                        transform: currentPage === page ? 'scale(1.05)' : 'scale(1)',
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage !== page) {
                          e.target.style.backgroundColor = '#D4E7FF'
                          e.target.style.color = '#4BA3FF'
                          e.target.style.transform = 'scale(1.08)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentPage !== page) {
                          e.target.style.backgroundColor = '#f0f0f0'
                          e.target.style.color = '#999'
                          e.target.style.transform = 'scale(1)'
                        }
                      }}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  style={{
                    width: '28px',
                    height: '28px',
                    padding: '0',
                    backgroundColor: currentPage === totalPages ? '#e8e8e8' : '#4BA3FF',
                    color: currentPage === totalPages ? '#999' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: '"Poppins", "Segoe UI", sans-serif',
                    transition: 'all 0.3s ease',
                    boxShadow: currentPage === totalPages ? 'none' : '0 4px 12px rgba(75, 163, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    letterSpacing: '1px',
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== totalPages) {
                      e.target.style.backgroundColor = '#2E8FD9'
                      e.target.style.transform = 'translateY(-2px)'
                      e.target.style.boxShadow = '0 6px 16px rgba(75, 163, 255, 0.4)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== totalPages) {
                      e.target.style.backgroundColor = '#4BA3FF'
                      e.target.style.transform = 'translateY(0)'
                      e.target.style.boxShadow = '0 4px 12px rgba(75, 163, 255, 0.3)'
                    }
                  }}
                >
                  ▶
                </button>
              </div>
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
