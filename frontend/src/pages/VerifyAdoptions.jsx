import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import SuperadminNavbar from '../components/SuperadminNavbar'
import SuperadminSidebar from '../components/SuperadminSidebar'
import MediaAvatar, { DEFAULT_ANIMAL_PHOTO, DEFAULT_USER_PHOTO, pickMedia } from '../components/MediaAvatar'
import { publishLiveData, subscribeLiveData } from '../utils/liveDataEvents'

const getRequestUserPhoto = (request) => pickMedia(
  request.user_photo,
  request.user_profile_photo,
  request.user_avatar,
  request.customer_photo,
  request.customer_profile_photo,
  request.customer_avatar,
  request.profile_photo,
  request.avatar,
  request.user?.profile_photo,
  request.user?.avatar,
)

const getRequestAnimalPhoto = (request) => pickMedia(
  request.animal_photo,
  request.animal_image,
  request.animal_image_url,
  request.animal_avatar,
  request.photo,
  request.image,
  request.image_url,
  request.animal?.photo,
  request.animal?.image,
  request.animal?.image_url,
  request.animal?.photos,
)

function VerifyAdoptions() {
  const [requests, setRequests] = useState([])
  const [filterTab, setFilterTab] = useState('all')
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  )

  const pendingCount = useMemo(() => requests.filter((r) => r.status === 'pending').length, [requests])
  const approvedCount = useMemo(() => requests.filter((r) => r.status === 'disetujui').length, [requests])
  const rejectedCount = useMemo(() => requests.filter((r) => r.status === 'ditolak').length, [requests])

  const filteredRequests = useMemo(() => {
    if (filterTab === 'pending') return requests.filter((r) => r.status === 'pending')
    if (filterTab === 'disetujui') return requests.filter((r) => r.status === 'disetujui')
    if (filterTab === 'ditolak') return requests.filter((r) => r.status === 'ditolak')
    return requests
  }, [requests, filterTab])

  const loadRequests = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/superadmin/adoption-requests')
      setRequests(response.data.data || [])
    } catch {
      setRequests([])
    }
  }

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:3000/api/superadmin/adoption-requests/${id}`, { status })
      await loadRequests()
      publishLiveData('adoptions')
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal memverifikasi pengajuan.')
    }
  }

  const formatDate = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID')
  }

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

  useEffect(() => {
    return subscribeLiveData('adoptions', loadRequests)
  }, [])

  return (
    <div className="dashboard-layout">
      <SuperadminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className={`main-content ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
        <SuperadminNavbar
          pageTitle="Verifikasi Adopsi"
          sidebarOpen={sidebarOpen}
          offsetForSidebar={false}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />

        <div className="page-body">
          <div className="page-header">
            <h1 className="page-header-title">
              <i className="fas fa-check-circle"></i>
              Verifikasi Pengajuan Adopsi
            </h1>
            <p className="page-header-desc">
              Setujui atau tolak pengajuan adopsi. Riwayat pengajuan yang sudah disetujui akan tetap tampil di sini.
            </p>
          </div>

          <div className="stats-grid">
            <div
              className={`stat-card ${filterTab === 'pending' ? 'active' : ''}`}
              style={{ '--stat-color': 'var(--amber)', cursor: 'pointer' }}
              onClick={() => setFilterTab('pending')}
            >
              <div className="stat-header">
                <div className="stat-icon amber"><i className="fas fa-clock"></i></div>
              </div>
              <div className="stat-value">{pendingCount}</div>
              <div className="stat-label">Menunggu Verifikasi</div>
            </div>
            <div
              className={`stat-card ${filterTab === 'disetujui' ? 'active' : ''}`}
              style={{ '--stat-color': 'var(--green)', cursor: 'pointer' }}
              onClick={() => setFilterTab('disetujui')}
            >
              <div className="stat-header">
                <div className="stat-icon green"><i className="fas fa-check"></i></div>
              </div>
              <div className="stat-value">{approvedCount}</div>
              <div className="stat-label">Disetujui</div>
            </div>
            <div
              className={`stat-card ${filterTab === 'ditolak' ? 'active' : ''}`}
              style={{ '--stat-color': 'var(--red)', cursor: 'pointer' }}
              onClick={() => setFilterTab('ditolak')}
            >
              <div className="stat-header">
                <div className="stat-icon red"><i className="fas fa-times"></i></div>
              </div>
              <div className="stat-value">{rejectedCount}</div>
              <div className="stat-label">Ditolak</div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2><i className="fas fa-table"></i> Daftar Pengajuan ({filteredRequests.length})</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={`btn-secondary ${filterTab === 'all' ? 'active' : ''}`}
                  style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px', background: filterTab === 'all' ? '#eff6ff' : '#f8fafc', color: filterTab === 'all' ? '#2563eb' : '#64748b', fontWeight: 700, border: '1px solid #e2e8f0', cursor: 'pointer' }}
                  onClick={() => setFilterTab('all')}
                >
                  Semua ({requests.length})
                </button>
                <button
                  className={`btn-secondary ${filterTab === 'pending' ? 'active' : ''}`}
                  style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px', background: filterTab === 'pending' ? '#fffbeb' : '#f8fafc', color: filterTab === 'pending' ? '#d97706' : '#64748b', fontWeight: 700, border: '1px solid #e2e8f0', cursor: 'pointer' }}
                  onClick={() => setFilterTab('pending')}
                >
                  Menunggu ({pendingCount})
                </button>
                <button
                  className={`btn-secondary ${filterTab === 'disetujui' ? 'active' : ''}`}
                  style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px', background: filterTab === 'disetujui' ? '#ecfdf5' : '#f8fafc', color: filterTab === 'disetujui' ? '#059669' : '#64748b', fontWeight: 700, border: '1px solid #e2e8f0', cursor: 'pointer' }}
                  onClick={() => setFilterTab('disetujui')}
                >
                  Disetujui ({approvedCount})
                </button>
                <button
                  className={`btn-secondary ${filterTab === 'ditolak' ? 'active' : ''}`}
                  style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px', background: filterTab === 'ditolak' ? '#fef2f2' : '#f8fafc', color: filterTab === 'ditolak' ? '#dc2626' : '#64748b', fontWeight: 700, border: '1px solid #e2e8f0', cursor: 'pointer' }}
                  onClick={() => setFilterTab('ditolak')}
                >
                  Ditolak ({rejectedCount})
                </button>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Hewan</th>
                    <th>Tanggal</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Verifikasi / Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id}>
                      <td>#{request.id}</td>
                      <td>
                        <div className="user-cell">
                          <MediaAvatar
                            src={getRequestUserPhoto(request)}
                            fallbackSrc={DEFAULT_USER_PHOTO}
                            alt={request.user_name || 'Customer'}
                          />
                          <strong>{request.user_name || '-'}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="user-cell">
                          <MediaAvatar
                            src={getRequestAnimalPhoto(request)}
                            fallbackSrc={DEFAULT_ANIMAL_PHOTO}
                            alt={request.animal_name || 'Hewan'}
                          />
                          <strong>{request.animal_name || '-'}</strong>
                          <span style={{ color: 'var(--muted)', fontSize: '13px', marginLeft: '2px' }}>
                            {request.animal_species ? `(${request.animal_species})` : ''}
                          </span>
                        </div>
                      </td>
                      <td>{formatDate(request.created_at)}</td>
                      <td>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            background: request.status === 'disetujui' ? '#d1fae5' : request.status === 'ditolak' ? '#fee2e2' : '#fef3c7',
                            color: request.status === 'disetujui' ? '#047857' : request.status === 'ditolak' ? '#b91c1c' : '#b45309',
                          }}
                        >
                          {request.status === 'disetujui' ? 'Disetujui' : request.status === 'ditolak' ? 'Ditolak' : 'Menunggu'}
                        </span>
                      </td>
                      <td>
                        <div className="actions" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                          {request.status === 'pending' ? (
                            <>
                              <button className="btn-open-edit" onClick={() => updateStatus(request.id, 'disetujui')}>
                                <i className="fas fa-check"></i> Setujui
                              </button>
                              <button className="btn-delete-user" onClick={() => updateStatus(request.id, 'ditolak')}>
                                <i className="fas fa-times"></i> Tolak
                              </button>
                            </>
                          ) : request.status === 'disetujui' ? (
                            <button
                              className="btn-delete-user"
                              style={{ background: '#fef2f2', color: '#dc2626', borderColor: '#fca5a5' }}
                              onClick={() => updateStatus(request.id, 'ditolak')}
                            >
                              <i className="fas fa-undo"></i> Ubah ke Ditolak
                            </button>
                          ) : (
                            <button
                              className="btn-open-edit"
                              style={{ background: '#ecfdf5', color: '#059669', borderColor: '#6ee7b7' }}
                              onClick={() => updateStatus(request.id, 'disetujui')}
                            >
                              <i className="fas fa-check"></i> Ubah ke Disetujui
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--muted)', padding: '28px' }}>
                        Tidak ada data pengajuan adopsi pada kategori ini.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default VerifyAdoptions
