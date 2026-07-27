import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

function Restore() {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  )
  const [activeTab, setActiveTab] = useState('users')
  const [deletedUsers, setDeletedUsers] = useState([])
  const [deletedAnimals, setDeletedAnimals] = useState([])
  const [deletedCategories, setDeletedCategories] = useState([])
  const [deletedAdoptions, setDeletedAdoptions] = useState([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    loadDeletedData()
  }, [])

  const handleRestore = async (type, id) => {
    if (!window.confirm(`Apakah Anda yakin ingin memulihkan ${type === 'users' ? 'user' : type === 'animals' ? 'hewan' : type === 'categories' ? 'kategori' : 'pengajuan adopsi'} ini?`)) {
      return
    }
    try {
      const endpoint = `http://localhost:3000/api/superadmin/${type}/:id/restore`.replace(':id', id)
      await axios.post(endpoint)
      await loadDeletedData()
      alert('Berhasil dipulihkan!')
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal memulihkan!')
    }
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
          <a href="/dashboard/logs" className="nav-item">
            <i className="fas fa-history"></i>
            <span>History Logs</span>
          </a>
          <a href="/dashboard/settings" className="nav-item">
            <i className="fas fa-cog"></i>
            <span>Pengaturan Sistem</span>
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
            onClick={() => { window.location.href = '/'; }}
          >
            <i className="fas fa-sign-out-alt"></i> Keluar
          </button>
        </div>
      </aside>

      <main className={`main-content ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
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
              <div className="topbar-page-title">Pulihkan Data</div>
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

        <div className="page-body">
          <div className="page-header">
            <h1 className="page-header-title">
              <i className="fas fa-undo"></i>
              Pulihkan Data Terhapus
            </h1>
            <p className="page-header-desc">
              Pulihkan data pengguna, hewan, kategori, dan pengajuan adopsi yang telah dihapus.
            </p>
          </div>

          <div className="filter-pills" style={{ marginBottom: '20px' }}>
            {['users', 'animals', 'categories', 'adoptions'].map((tab) => (
              <button
                key={tab}
                className={`filter-pill ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'users' ? 'Pengguna' : tab === 'animals' ? 'Hewan' : tab === 'categories' ? 'Kategori' : 'Pengajuan Adopsi'}
              </button>
            ))}
          </div>

          <div className="panel">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: 'var(--accent)' }}></i>
                <p style={{ marginTop: '16px', color: 'var(--fg-secondary)' }}>Memuat data...</p>
              </div>
            ) : (
              <>
                {activeTab === 'users' && (
                  deletedUsers.length === 0 ? (
                    <div className="panel-head" style={{ borderBottom: 0, textAlign: 'center' }}>
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
                              <th>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {deletedUsers.map((user) => (
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
                                  <button
                                    className="primary-link"
                                    onClick={() => handleRestore('users', user.id)}
                                  >
                                    <i className="fas fa-undo"></i> Pulihkan
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )
                )}

                {activeTab === 'animals' && (
                  deletedAnimals.length === 0 ? (
                    <div className="panel-head" style={{ borderBottom: 0, textAlign: 'center' }}>
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
                              <th>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {deletedAnimals.map((animal) => (
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
                                  <button
                                    className="primary-link"
                                    onClick={() => handleRestore('animals', animal.id)}
                                  >
                                    <i className="fas fa-undo"></i> Pulihkan
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )
                )}

                {activeTab === 'categories' && (
                  deletedCategories.length === 0 ? (
                    <div className="panel-head" style={{ borderBottom: 0, textAlign: 'center' }}>
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
                              <th>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {deletedCategories.map((category) => (
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
                                  <button
                                    className="primary-link"
                                    onClick={() => handleRestore('categories', category.id)}
                                  >
                                    <i className="fas fa-undo"></i> Pulihkan
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )
                )}

                {activeTab === 'adoptions' && (
                  deletedAdoptions.length === 0 ? (
                    <div className="panel-head" style={{ borderBottom: 0, textAlign: 'center' }}>
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
                              <th>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {deletedAdoptions.map((adoption) => (
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
                                  <button
                                    className="primary-link"
                                    onClick={() => handleRestore('adoption-requests', adoption.id)}
                                  >
                                    <i className="fas fa-undo"></i> Pulihkan
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
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
