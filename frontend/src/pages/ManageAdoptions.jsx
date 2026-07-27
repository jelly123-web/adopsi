import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

function ManageAdoptions() {
  const [requests, setRequests] = useState([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  )
  const [selectedStatus, setSelectedStatus] = useState('Semua')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const statuses = ['Semua', 'pending', 'disetujui', 'ditolak']

  const filteredRequests = selectedStatus === 'Semua'
    ? requests
    : requests.filter(req => req.status === selectedStatus)

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
  const currentRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const loadRequests = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/superadmin/adoption-requests')
      setRequests(response.data.data || [])
    } catch {
      setRequests([])
    }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:3000/api/superadmin/adoption-requests/${id}`, { status })
      await loadRequests()
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal mengupdate status')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus pengajuan ini?')) return
    try {
      await axios.delete(`http://localhost:3000/api/superadmin/adoption-requests/${id}`)
      await loadRequests()
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal menghapus pengajuan')
    }
  }

  const formatDate = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID')
  }

  const getStatusTagClass = (status) => {
    switch (status) {
      case 'disetujui':
        return 'tag-success'
      case 'pending':
        return 'tag-muted'
      case 'ditolak':
        return 'tag-kitchen'
      default:
        return 'tag-muted'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'disetujui':
        return 'Disetujui'
      case 'pending':
        return 'Pending'
      case 'ditolak':
        return 'Ditolak'
      default:
        return status
    }
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedStatus, requests])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/superadmin/adoption-requests')
        if (active) {
          setRequests(response.data.data || [])
        }
      } catch {
        if (active) {
          setRequests([])
        }
      }
    })()
    return () => {
      active = false
    }
  }, [])

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
          <a href="/dashboard/adoptions" className="nav-item active">
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
              <div className="topbar-page-title">Kelola Pengajuan Adopsi</div>
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
              <i className="fas fa-file-alt"></i>
              Daftar Pengajuan Adopsi
            </h1>
            <p className="page-header-desc">
              Kelola semua pengajuan adopsi yang masuk.
            </p>
          </div>

          <div className="content-toolbar">
            <div className="search-box">
              <input type="text" placeholder="Cari nama atau hewan..." />
              <button><i className="fas fa-search"></i> Cari</button>
            </div>
          </div>

          <div className="filter-pills" style={{ marginBottom: '20px' }}>
            {statuses.map((status) => (
              <button
                key={status}
                className={`filter-pill ${selectedStatus === status ? 'active' : ''}`}
                onClick={() => setSelectedStatus(status)}
              >
                {status === 'Semua' ? 'Semua' : getStatusText(status)}
              </button>
            ))}
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2><i className="fas fa-table"></i> Semua Pengajuan</h2>
              <span>{filteredRequests.length} pengajuan</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Adopter</th>
                    <th>Hewan</th>
                    <th>Status</th>
                    <th>Tanggal</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRequests.map((req) => (
                    <tr key={req.id}>
                      <td>{req.id}</td>
                      <td>
                        <div className="user-cell">
                          <div 
                            className="user-avatar"
                            style={{
                              background: 'var(--accent)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '700',
                            }}
                          >
                            {req.user_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <strong>{req.user_name}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="user-cell">
                          <div 
                            className="user-avatar"
                            style={{
                              background: 'linear-gradient(135deg, var(--green), var(--teal))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '700',
                            }}
                          >
                            {req.animal_species?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <strong>{req.animal_name}</strong>
                          <span style={{ color: 'var(--muted)', fontSize: '13px', marginLeft: '8px' }}>
                            ({req.animal_species})
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`tag ${getStatusTagClass(req.status)}`}>
                          <span className="status-dot"></span>
                          {getStatusText(req.status)}
                        </span>
                      </td>
                      <td>{formatDate(req.created_at)}</td>
                      <td>
                        <div className="actions">
                          {req.status === 'pending' && (
                            <>
                              <button 
                                className="btn-open-edit" 
                                onClick={() => handleUpdateStatus(req.id, 'disetujui')}
                              >
                                <i className="fas fa-check"></i> Setujui
                              </button>
                              <button 
                                className="btn-delete-user" 
                                onClick={() => handleUpdateStatus(req.id, 'ditolak')}
                              >
                                <i className="fas fa-times"></i> Tolak
                              </button>
                            </>
                          )}
                          <button 
                            className="btn-delete-user" 
                            onClick={() => handleDelete(req.id)}
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

            {totalPages > 1 && (
              <div className="pagination-area">
                <div className="pagination-wrap">
                  <div className="pagination-meta">
                    Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredRequests.length)} dari {filteredRequests.length} pengajuan
                  </div>
                  <div className="pagination-links">
                    <button
                      className="pagination-link"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    >
                      &lt;
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        className={`pagination-link ${currentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      className="pagination-link"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default ManageAdoptions
