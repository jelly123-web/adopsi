import { useEffect, useState } from 'react'
import axios from 'axios'
import SuperadminNavbar from '../components/SuperadminNavbar'
import SuperadminSidebar from '../components/SuperadminSidebar'
import { publishLiveData, subscribeLiveData } from '../utils/liveDataEvents'

function ManageAdoptions() {
  const [requests, setRequests] = useState([])
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
      setCurrentPage(1)
    } catch {
      setRequests([])
      setCurrentPage(1)
    }
  }

  const handleDeleteAll = async () => {
    if (requests.length === 0) {
      window.alert('Tidak ada pengajuan untuk dihapus.')
      return
    }

    if (!window.confirm(`Hapus semua pengajuan adopsi? Aksi ini akan menghapus ${requests.length} pengajuan.`)) {
      return
    }

    try {
      await axios.post('http://localhost:3000/api/superadmin/adoption-requests/delete-all')
      await loadRequests()
      publishLiveData('adoptions')
      window.alert(`${requests.length} pengajuan berhasil dihapus.`)
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal menghapus semua pengajuan')
    }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:3000/api/superadmin/adoption-requests/${id}`, { status })
      await loadRequests()
      publishLiveData('adoptions')
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal mengupdate status')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus pengajuan ini?')) return
    try {
      await axios.delete(`http://localhost:3000/api/superadmin/adoption-requests/${id}`)
      await loadRequests()
      publishLiveData('adoptions')
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
        return 'Menunggu'
      case 'ditolak':
        return 'Ditolak'
      default:
        return status
    }
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/superadmin/adoption-requests')
        if (active) {
          setRequests(response.data.data || [])
          setCurrentPage(1)
        }
      } catch {
        if (active) {
          setRequests([])
          setCurrentPage(1)
        }
      }
    })()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    return subscribeLiveData('adoptions', loadRequests)
  }, [])

  return (
    <div className="dashboard-layout">
      <SuperadminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={`main-content ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
        <SuperadminNavbar
          pageTitle="Kelola Pengajuan Adopsi"
          sidebarOpen={sidebarOpen}
          offsetForSidebar={false}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />

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

          <div className="content-toolbar" style={{ gap: '12px', flexWrap: 'wrap' }}>
            <div className="search-box" style={{ flex: '1 1 320px' }}>
              <input type="text" placeholder="Cari nama atau hewan..." />
              <button><i className="fas fa-search"></i> Cari</button>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                className="danger-link"
                onClick={handleDeleteAll}
                disabled={requests.length === 0}
                style={{ whiteSpace: 'nowrap' }}
              >
                <i className="fas fa-trash"></i> Hapus Semua
              </button>
            </div>
          </div>

          <div className="filter-pills" style={{ marginBottom: '20px' }}>
            {statuses.map((status) => (
              <button
                key={status}
                className={`filter-pill ${selectedStatus === status ? 'active' : ''}`}
                onClick={() => {
                  setSelectedStatus(status)
                  setCurrentPage(1)
                }}
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
                    <th style={{ textAlign: 'center' }}>Aksi</th>
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
                        <div className="actions" style={{ justifyContent: 'flex-end' }}>
                          <select
                            value={req.status}
                            onChange={(event) => handleUpdateStatus(req.id, event.target.value)}
                            className="status-select"
                            aria-label={`Ubah status pengajuan ${req.id}`}
                          >
                            <option value="pending">Menunggu</option>
                            <option value="disetujui">Disetujui</option>
                            <option value="ditolak">Ditolak</option>
                          </select>
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

