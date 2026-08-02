import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import SuperadminNavbar from '../components/SuperadminNavbar'
import { publishLiveData } from '../utils/liveDataEvents'

const publishRestoredType = (type) => {
  if (type === 'animals') publishLiveData('animals')
  if (type === 'categories') publishLiveData('categories')
  if (type === 'adoption-requests') publishLiveData('adoptions')
  if (type === 'users') {
    publishLiveData('users')
    publishLiveData('customers')
  }
}

function Restore() {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  )
  const tabs = [
    { key: 'users', label: 'Pengguna' },
    { key: 'animals', label: 'Hewan' },
    { key: 'categories', label: 'Kategori' },
    { key: 'adoption-requests', label: 'Pengajuan Adopsi' },
  ]

  const [activeTab, setActiveTab] = useState('users')
  const [deletedUsers, setDeletedUsers] = useState([])
  const [deletedAnimals, setDeletedAnimals] = useState([])
  const [deletedCategories, setDeletedCategories] = useState([])
  const [deletedAdoptions, setDeletedAdoptions] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const itemsPerPage = 8

  const loadDeletedData = async () => {
    try {
      const [usersRes, animalsRes, categoriesRes, adoptionsRes] = await Promise.all([
        axios.get('http://localhost:3000/api/superadmin/deleted-users'),
        axios.get('http://localhost:3000/api/superadmin/deleted-animals'),
        axios.get('http://localhost:3000/api/superadmin/deleted-categories'),
        axios.get('http://localhost:3000/api/superadmin/deleted-adoption-requests'),
      ])
      setDeletedUsers(usersRes.data.data || [])
      setDeletedAnimals(animalsRes.data.data || [])
      setDeletedCategories(categoriesRes.data.data || [])
      setDeletedAdoptions(adoptionsRes.data.data || [])
    } catch (error) {
      console.error('Failed to load deleted data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActiveData = () => {
    switch (activeTab) {
      case 'animals':
        return deletedAnimals
      case 'categories':
        return deletedCategories
      case 'adoption-requests':
        return deletedAdoptions
      default:
        return deletedUsers
    }
  }

  const getPageItems = () => {
    const data = getActiveData()
    const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage))
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return {
      items: data.slice(startIndex, endIndex),
      totalPages,
      totalItems: data.length,
    }
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [usersRes, animalsRes, categoriesRes, adoptionsRes] = await Promise.all([
          axios.get('http://localhost:3000/api/superadmin/deleted-users'),
          axios.get('http://localhost:3000/api/superadmin/deleted-animals'),
          axios.get('http://localhost:3000/api/superadmin/deleted-categories'),
          axios.get('http://localhost:3000/api/superadmin/deleted-adoption-requests'),
        ])
        if (active) {
          setDeletedUsers(usersRes.data.data || [])
          setDeletedAnimals(animalsRes.data.data || [])
          setDeletedCategories(categoriesRes.data.data || [])
          setDeletedAdoptions(adoptionsRes.data.data || [])
        }
      } catch (error) {
        console.error('Failed to load deleted data:', error)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const handleRestore = async (type, id) => {
    if (!window.confirm(`Apakah Anda yakin ingin memulihkan ${type === 'users' ? 'user' : type === 'animals' ? 'hewan' : type === 'categories' ? 'kategori' : 'pengajuan adopsi'} ini?`)) {
      return
    }
    try {
      const endpoint = `http://localhost:3000/api/superadmin/${type}/:id/restore`.replace(':id', id)
      await axios.post(endpoint)
      await loadDeletedData()
      publishRestoredType(type)
      alert('Berhasil dipulihkan!')
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal memulihkan!')
    }
  }

  const handleDeletePermanent = async (type, id) => {
    if (!window.confirm(`Hapus permanen ${type === 'users' ? 'user' : type === 'animals' ? 'hewan' : type === 'categories' ? 'kategori' : 'pengajuan adopsi'} ini?`)) {
      return
    }
    try {
      const endpoint = `http://localhost:3000/api/superadmin/${type}/${id}/permanent`
      await axios.delete(endpoint)
      await loadDeletedData()
      publishRestoredType(type)
      alert('Berhasil dihapus permanen!')
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal menghapus permanen!')
    }
  }

  const handleDeleteAllPermanent = async () => {
    const confirmMessage = activeTab === 'users' && deletedUsers.some((user) => user.role === 'superadmin')
      ? 'Hapus semua data user terhapus secara permanen? Akun superadmin akan dipertahankan.'
      : 'Hapus semua data terhapus secara permanen?'

    if (!window.confirm(confirmMessage)) {
      return
    }
    try {
      const endpoint = `http://localhost:3000/api/superadmin/deleted-${activeTab}/delete-all`
      await axios.post(endpoint)
      await loadDeletedData()
      publishRestoredType(activeTab)
      alert('Semua data terhapus permanen!')
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal menghapus semua!')
    }
  }

  const activeTabLabel = () => {
    switch (activeTab) {
      case 'animals':
        return 'Hewan'
      case 'categories':
        return 'Kategori'
      case 'adoption-requests':
        return 'Pengajuan Adopsi'
      default:
        return 'Pengguna'
    }
  }

  const { items, totalPages, totalItems } = getPageItems()

  const renderPagination = () => {
    if (totalPages <= 1) return null

    return (
      <div className="pagination-controls">
        <button
          className="pagination-btn"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
        >
          Sebelumnya
        </button>
        <span className="pagination-info">
          Halaman {currentPage} dari {totalPages}
        </span>
        <button
          className="pagination-btn"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
        >
          Selanjutnya
        </button>
      </div>
    )
  }

  const formatDate = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="dashboard-layout">
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
          <a href="/dashboard/categories" className="nav-item">
            <i className="fas fa-tags"></i>
            <span>Kelola Kategori</span>
          </a>
          <a href="/dashboard/animals" className="nav-item">
            <i className="fas fa-paw"></i>
            <span>Kelola Hewan</span>
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
          <a href="/dashboard/chat" className="nav-item">
            <i className="fas fa-comments"></i>
            <span>Chat Customer</span>
          </a>
          <a href="/dashboard/reports" className="nav-item">
            <i className="fas fa-chart-line"></i>
            <span>Laporan</span>
          </a>
          <a href="/dashboard/logs" className="nav-item">
            <i className="fas fa-history"></i>
            <span>History Logs</span>
          </a>

          <a href="/dashboard/restore" className="nav-item active">
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

      <main className={`main-content ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
        <SuperadminNavbar
          pageTitle="Pulihkan Data"
          sidebarOpen={sidebarOpen}
          offsetForSidebar={false}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />

        <div className="page-body restore-page">
          <div className="page-header">
            <h1 className="page-header-title">
              <i className="fas fa-undo"></i>
              Pulihkan Data Terhapus
            </h1>
            <p className="page-header-desc">
              Pulihkan data pengguna, hewan, kategori, dan pengajuan adopsi yang telah dihapus.
            </p>
          </div>

          <div className="restore-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`restore-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.key)
                  setCurrentPage(1)
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="restore-actions">
            <div className="restore-count">
              <strong>{activeTabLabel()}</strong> terhapus: {totalItems}
            </div>
            <button className="restore-danger-btn" onClick={handleDeleteAllPermanent} disabled={totalItems === 0}>
              <i className="fas fa-trash-alt"></i> Hapus Semua Permanen
            </button>
          </div>

          <div className="panel restore-panel">
            {loading ? (
              <div className="restore-loading">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Memuat data...</p>
              </div>
            ) : (
              <>
                {activeTab === 'users' && (
                  deletedUsers.length === 0 ? (
                    <div className="restore-empty">
                      <i className="fas fa-inbox" aria-hidden="true"></i>
                      <p>Tidak ada pengguna yang terhapus.</p>
                    </div>
                  ) : (
                    <>
                      <div className="panel-head">
                        <h2><i className="fas fa-users"></i> Pengguna Terhapus</h2>
                        <span>{deletedUsers.length} pengguna</span>
                      </div>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Nama Pengguna</th>
                              <th>Email</th>
                              <th>Status Softdelete</th>
                              <th>Dihapus Oleh</th>
                              <th>Waktu & Hari Hapus</th>
                              <th>IP Hapus</th>
                              <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((user) => (
                              <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>
                                  <div className="user-cell">
                                    <div className="user-avatar" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
                                      {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <strong>{user.name}</strong>
                                  </div>
                                </td>
                                <td>{user.email}</td>
                                <td>
                                  <span className="tag" style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
                                    1 (Terhapus)
                                  </span>
                                </td>
                                <td><strong>{user.deleted_by || 'Super Admin'}</strong></td>
                                <td>{formatDate(user.deleted_at)}</td>
                                <td><code>{user.deleted_ip || '127.0.0.1'}</code></td>
                                <td>
                                  <div className="action-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button className="primary-link" onClick={() => handleRestore('users', user.id)}>
                                      <i className="fas fa-undo"></i> Pulihkan
                                    </button>
                                    {user.role === 'superadmin' ? (
                                      <span className="tag tag-superadmin" style={{ marginLeft: '8px' }}>
                                        Superadmin terlindungi
                                      </span>
                                    ) : (
                                      <button className="danger-link" onClick={() => handleDeletePermanent('users', user.id)}>
                                        <i className="fas fa-trash"></i> Hapus Permanen
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {renderPagination()}
                    </>
                  )
                )}

                {activeTab === 'animals' && (
                  deletedAnimals.length === 0 ? (
                    <div className="restore-empty">
                      <i className="fas fa-inbox" aria-hidden="true"></i>
                      <p>Tidak ada hewan yang terhapus.</p>
                    </div>
                  ) : (
                    <>
                      <div className="panel-head">
                        <h2><i className="fas fa-paw"></i> Hewan Terhapus</h2>
                        <span>{deletedAnimals.length} hewan</span>
                      </div>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Nama Hewan</th>
                              <th>Spesies</th>
                              <th>Status Softdelete</th>
                              <th>Dihapus Oleh</th>
                              <th>Waktu & Hari Hapus</th>
                              <th>IP Hapus</th>
                              <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((animal) => (
                              <tr key={animal.id}>
                                <td>{animal.id}</td>
                                <td>
                                  <div className="user-cell">
                                    <div className="user-avatar" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
                                      <i className="fas fa-paw"></i>
                                    </div>
                                    <strong>{animal.name}</strong>
                                  </div>
                                </td>
                                <td>{animal.species}</td>
                                <td>
                                  <span className="tag" style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
                                    1 (Terhapus)
                                  </span>
                                </td>
                                <td><strong>{animal.deleted_by || 'Super Admin'}</strong></td>
                                <td>{formatDate(animal.deleted_at)}</td>
                                <td><code>{animal.deleted_ip || '127.0.0.1'}</code></td>
                                <td>
                                  <div className="action-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button className="primary-link" onClick={() => handleRestore('animals', animal.id)}>
                                      <i className="fas fa-undo"></i> Pulihkan
                                    </button>
                                    <button className="danger-link" onClick={() => handleDeletePermanent('animals', animal.id)}>
                                      <i className="fas fa-trash"></i> Hapus Permanen
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {renderPagination()}
                    </>
                  )
                )}

                {activeTab === 'categories' && (
                  deletedCategories.length === 0 ? (
                    <div className="restore-empty">
                      <i className="fas fa-inbox" aria-hidden="true"></i>
                      <p>Tidak ada kategori yang terhapus.</p>
                    </div>
                  ) : (
                    <>
                      <div className="panel-head">
                        <h2><i className="fas fa-tags"></i> Kategori Terhapus</h2>
                        <span>{deletedCategories.length} kategori</span>
                      </div>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Nama Kategori</th>
                              <th>Status Softdelete</th>
                              <th>Dihapus Oleh</th>
                              <th>Waktu & Hari Hapus</th>
                              <th>IP Hapus</th>
                              <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((category) => (
                              <tr key={category.id}>
                                <td>{category.id}</td>
                                <td><strong>{category.name}</strong></td>
                                <td>
                                  <span className="tag" style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
                                    1 (Terhapus)
                                  </span>
                                </td>
                                <td><strong>{category.deleted_by || 'Super Admin'}</strong></td>
                                <td>{formatDate(category.deleted_at)}</td>
                                <td><code>{category.deleted_ip || '127.0.0.1'}</code></td>
                                <td>
                                  <div className="action-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button className="primary-link" onClick={() => handleRestore('categories', category.id)}>
                                      <i className="fas fa-undo"></i> Pulihkan
                                    </button>
                                    <button className="danger-link" onClick={() => handleDeletePermanent('categories', category.id)}>
                                      <i className="fas fa-trash"></i> Hapus Permanen
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {renderPagination()}
                    </>
                  )
                )}

                {activeTab === 'adoption-requests' && (
                  deletedAdoptions.length === 0 ? (
                    <div className="restore-empty">
                      <i className="fas fa-inbox" aria-hidden="true"></i>
                      <p>Tidak ada pengajuan adopsi yang terhapus.</p>
                    </div>
                  ) : (
                    <>
                      <div className="panel-head">
                        <h2><i className="fas fa-file-alt"></i> Pengajuan Adopsi Terhapus</h2>
                        <span>{deletedAdoptions.length} pengajuan</span>
                      </div>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Pengguna</th>
                              <th>Hewan</th>
                              <th>Status Softdelete</th>
                              <th>Dihapus Oleh</th>
                              <th>Waktu & Hari Hapus</th>
                              <th>IP Hapus</th>
                              <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((adoption) => (
                              <tr key={adoption.id}>
                                <td>{adoption.id}</td>
                                <td>
                                  <div className="user-cell">
                                    <div className="user-avatar" style={{ background: 'var(--accent)' }}>
                                      {adoption.user_name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <strong>{adoption.user_name}</strong>
                                  </div>
                                </td>
                                <td>
                                  <div className="user-cell">
                                    <div className="user-avatar" style={{ background: 'linear-gradient(135deg, var(--green), var(--teal))' }}>
                                      {adoption.animal_species?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <strong>{adoption.animal_name}</strong>
                                    <span style={{ color: 'var(--muted)', fontSize: '13px', marginLeft: '8px' }}>
                                      ({adoption.animal_species})
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <span className="tag" style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
                                    1 (Terhapus)
                                  </span>
                                </td>
                                <td><strong>{adoption.deleted_by || 'Super Admin'}</strong></td>
                                <td>{formatDate(adoption.deleted_at)}</td>
                                <td><code>{adoption.deleted_ip || '127.0.0.1'}</code></td>
                                <td>
                                  <div className="action-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button className="primary-link" onClick={() => handleRestore('adoption-requests', adoption.id)}>
                                      <i className="fas fa-undo"></i> Pulihkan
                                    </button>
                                    <button className="danger-link" onClick={() => handleDeletePermanent('adoption-requests', adoption.id)}>
                                      <i className="fas fa-trash"></i> Hapus Permanen
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {renderPagination()}
                    </>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Restore
