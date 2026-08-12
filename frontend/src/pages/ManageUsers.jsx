import { useEffect, useState } from 'react'
import axios from '../utils/api'
import { Link } from 'react-router-dom'
import SuperadminNavbar from '../components/SuperadminNavbar'
import SuperadminSidebar from '../components/SuperadminSidebar'
import { publishLiveData, subscribeLiveData } from '../utils/liveDataEvents'

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'costumer',
  status: 'aktif',
}

function ManageUsers() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  )
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [pageSize, setPageSize] = useState(6)

  const loadUsers = async (page = 1) => {
    try {
      const response = await axios.get('/superadmin/users', {
        params: { page, limit: 6 },
      })
      setUsers(response.data.data || [])
      setCurrentPage(response.data.page || 1)
      setTotalPages(response.data.pages || 1)
      setTotalUsers(response.data.total || 0)
      setPageSize(response.data.limit || 6)
    } catch {
      setUsers([])
    }
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const response = await axios.get('/superadmin/users', {
          params: { page: 1, limit: 6 },
        })
        if (active) {
          setUsers(response.data.data || [])
          setCurrentPage(response.data.page || 1)
          setTotalPages(response.data.pages || 1)
          setTotalUsers(response.data.total || 0)
        }
      } catch {
        if (active) {
          setUsers([])
        }
      }
    })()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    return subscribeLiveData(['users', 'customers'], () => loadUsers(currentPage))
  }, [currentPage])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      if (editingId) {
        await axios.put(`/superadmin/users/${editingId}`, form)
      } else {
        await axios.post('/superadmin/users', form)
      }
      await loadUsers(1)
      publishLiveData('users')
      publishLiveData('customers')
      closeDrawer()
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal menyimpan user.')
    }
  }

  const openAddDrawer = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDrawerOpen(true)
  }

  const openEditDrawer = (user) => {
    setEditingId(user.id)
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'costumer',
      status: user.status || 'aktif',
    })
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus user ini?')) return
    try {
      await axios.delete(`/superadmin/users/${id}`)
      await loadUsers(currentPage)
      publishLiveData('users')
      publishLiveData('customers')
      if (editingId === id) {
        closeDrawer()
      }
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal menghapus user.')
    }
  }

  const handleDeleteAll = async () => {
    if (!window.confirm('Hapus semua user? (Akun superadmin tidak akan dihapus)')) return
    try {
      const usersToDelete = users.filter(user => user.role !== 'superadmin')
      if (usersToDelete.length === 0) {
        window.alert('Tidak ada user yang bisa dihapus. Hanya akun superadmin yang tersisa.')
        return
      }
      
      for (const user of usersToDelete) {
        await axios.delete(`/superadmin/users/${user.id}`)
      }
      
      await loadUsers(1)
      publishLiveData('users')
      publishLiveData('customers')
      if (editingId) {
        closeDrawer()
      }
      window.alert(`${usersToDelete.length} user berhasil dihapus.`)
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal menghapus semua user.')
    }
  }

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      loadUsers(page)
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

  const getRoleTagClass = (role) => {
    switch (role) {
      case 'superadmin': return 'tag-superadmin'
      case 'admin': return 'tag-admin'
      case 'petugas': return 'tag-kasir'
      case 'costumer':
      case 'customer':
        return 'tag-customer'
      default: return 'tag-muted'
    }
  }

  const getStatusTagClass = (status) => {
    return status === 'aktif' ? 'tag-success' : 'tag-muted'
  }

  return (
    <div className="dashboard-layout">
      <SuperadminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className={`main-content ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
        <SuperadminNavbar
          pageTitle="Kelola User"
          sidebarOpen={sidebarOpen}
          offsetForSidebar={false}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />

        {/* Page Body */}
        <div className="page-body">
          <div className="page-header">
            <h1 className="page-header-title">
              <i className="fas fa-users"></i>
              Daftar Pengguna
            </h1>
            <p className="page-header-desc">
              Kelola semua pengguna yang terdaftar di sistem.
            </p>
          </div>

          <div className="content-toolbar">
            <div className="search-box">
              <input type="text" placeholder="Cari nama atau email..." />
              <button><i className="fas fa-search"></i> Cari</button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="primary-link" onClick={openAddDrawer}>
                <i className="fas fa-plus"></i> Tambah User
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
              <h2><i className="fas fa-table"></i> Semua Pengguna</h2>
              <span>{totalUsers} pengguna</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Pengguna</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Terdaftar</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user.id}>
                      <td>{(currentPage - 1) * pageSize + index + 1}</td>
                      <td>
                        <div className="user-cell">
                          <div 
                            className="user-avatar"
                            style={{
                              background: user.role === 'superadmin' 
                                ? 'linear-gradient(135deg, var(--purple), var(--blue))' 
                                : 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '700',
                            }}
                          >
                            {renderInitials(user.name)}
                          </div>
                          <strong>{user.name}</strong>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`tag ${getRoleTagClass(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`tag ${getStatusTagClass(user.status)}`}>
                          <span className="status-dot"></span>
                          {user.status}
                        </span>
                      </td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>
                        <div className="actions" style={{ justifyContent: 'flex-end' }}>
                          <button 
                            className="btn-open-edit" 
                            onClick={() => openEditDrawer(user)}
                          >
                            <i className="fas fa-pen"></i> Edit
                          </button>
                          {user.role !== 'superadmin' && (
                            <button 
                              className="btn-delete-user" 
                              onClick={() => handleDelete(user.id)}
                            >
                              <i className="fas fa-trash"></i> Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls - Cute & Modern */}
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
                  className="pagination-arrow"
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
                  Ã¢â€”â‚¬
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
                  className="pagination-arrow"
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
                  Ã¢â€“Â¶
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
            <i className="fas fa-user"></i>
            {editingId ? 'Edit Pengguna' : 'Tambah Pengguna'}
          </h3>
          <button className="drawer-close" onClick={closeDrawer}>
            <i className="fas fa-times"></i> Tutup
          </button>
        </div>
        <div className="drawer-body">
          <form className="user-form" onSubmit={handleSubmit}>
            <div className="drawer-field">
              <label htmlFor="name">Nama Lengkap</label>
              <input
                type="text"
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div className="drawer-field">
              <label htmlFor="email">Email</label>
              <input
                type="text"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="email@contoh.com"
              />
            </div>

            <div className="drawer-field">
              <label htmlFor="password">Password {editingId ? '(kosongkan jika tidak diubah)' : ''}</label>
              <input
                type="password"
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder={editingId ? 'Password baru opsional' : 'Masukkan password'}
              />
            </div>

            <div className="form-grid">
              <div className="drawer-field">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                >
                  <option value="costumer">Costumer</option>
                  <option value="admin">Admin</option>
                  <option value="petugas">Petugas</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>

              <div className="drawer-field">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>
            </div>

            <div className="drawer-buttons">
              <button type="submit" className="primary-link">
                {editingId ? 'Simpan Perubahan' : 'Tambah Pengguna'}
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

export default ManageUsers
