import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import SuperadminNavbar from '../components/SuperadminNavbar'
import SuperadminSidebar from '../components/SuperadminSidebar'

function HistoryLogs() {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  )
  const [activityLogs, setActivityLogs] = useState([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(6)
  const [totalLogs, setTotalLogs] = useState(0)
  const [pages, setPages] = useState(1)
  const [userLocation, setUserLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [loading, setLoading] = useState(true)

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Browser tidak mendukung Geolocation.')
      return
    }
    setLoadingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setUserLocation(coords)
        setLocationError(null)
        setLoadingLocation(false)

        axios.post('http://localhost:3000/api/superadmin/activity-logs', {
          type: 'location',
          title: 'Izin Lokasi Diberikan',
          description: `Superadmin memberikan izin lokasi browser. Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}`,
          user_name: 'Super Admin',
          user_email: 'admin@adopsi.test',
          user_role: 'superadmin',
          latitude: coords.lat,
          longitude: coords.lng,
          location_name: `Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}`,
        }).then(() => fetchLogs()).catch(() => {})
      },
      (error) => {
        setLoadingLocation(false)
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Izin lokasi ditolak oleh pengguna.')
        } else {
          setLocationError('Gagal mengambil lokasi.')
        }
      }
    )
  }

  const fetchLogs = (p = page) => {
    setLoading(true)
    axios
      .get('http://localhost:3000/api/superadmin/activity-logs', { params: { page: p, limit } })
      .then((response) => {
        setActivityLogs(response.data?.data || [])
        setTotalLogs(response.data?.total || 0)
        setPages(response.data?.pages || 1)
        setPage(response.data?.page || p)
      })
      .catch(() => {
        setActivityLogs([])
        setTotalLogs(0)
        setPages(1)
      })
      .finally(() => setLoading(false))
  }

  const recordPageVisit = async () => {
    try {
      await axios.post('http://localhost:3000/api/superadmin/activity-logs', {
        type: 'navigation',
        title: 'Membuka History Logs',
        description: 'Superadmin membuka halaman History Logs.',
        user_name: localStorage.getItem('authName') || 'Super Admin',
        user_email: localStorage.getItem('authEmail') || 'admin@adopsi.test',
        user_role: localStorage.getItem('authRole') || 'superadmin',
        location_name: userLocation
          ? `Lat: ${userLocation.lat.toFixed(4)}, Lng: ${userLocation.lng.toFixed(4)}`
          : 'Lokasi belum tersedia',
        latitude: userLocation?.lat || null,
        longitude: userLocation?.lng || null,
      })
    } catch {
      // Log halaman tidak boleh mengganggu tampilan history.
    }
  }

  const handleDeleteAllLogs = async () => {
    if (totalLogs === 0) {
      window.alert('Tidak ada history log untuk dihapus.')
      return
    }

    if (!window.confirm(`Hapus semua history logs? Aksi ini akan menghapus ${totalLogs} entri dari database.`)) {
      return
    }

    try {
      await axios.delete('http://localhost:3000/api/superadmin/activity-logs')
      setActivityLogs([])
      setTotalLogs(0)
      setPages(1)
      window.alert('Semua history logs berhasil dihapus.')
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal menghapus history logs.')
    }
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      await recordPageVisit()
      if (active) {
        fetchLogs(1)
        requestLocation()
      }
    })()
    return () => {
      active = false
    }
  }, [])

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
      <SuperadminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className={`main-content ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
        <SuperadminNavbar
          pageTitle="History Logs"
          statusLabel="LIVE LOGS"
          sidebarOpen={sidebarOpen}
          offsetForSidebar={false}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />

        <div className="page-body">
          <div className="page-header">
            <h1 className="page-header-title">
              <i className="fas fa-history"></i>
              History Audit Logs
            </h1>
            <p className="page-header-desc">
              Catatan riwayat aktivitas pengguna lengkap dengan lokasi koordinat dan IP address.
            </p>
          </div>

          {/* Geolocation Banner */}
          <div className="panel" style={{ marginBottom: '24px', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08), rgba(99, 102, 241, 0.08))', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--accent)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                <i className="fas fa-location-arrow"></i>
              </div>
              <div>
                <strong style={{ fontSize: '15px' }}>Audit Pelacak Lokasi & IP User</strong>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                  {userLocation 
                    ? `Lokasi Terdeteksi: Latitude ${userLocation.lat.toFixed(4)}, Longitude ${userLocation.lng.toFixed(4)}`
                    : locationError || 'Perizinan lokasi browser digunakan untuk mencatat koordinat dan IP di history log.'}
                </p>
              </div>
            </div>
            <button 
              className="primary-link"
              onClick={requestLocation}
              disabled={loadingLocation}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <i className={`fas ${loadingLocation ? 'fa-spinner fa-spin' : 'fa-crosshairs'}`}></i>
              {userLocation ? 'Perbarui Lokasi Saya' : 'Izinkan Akses Lokasi'}
            </button>
          </div>

          {/* History Audit Logs Table */}
          <div className="panel">
            <div className="panel-head">
              <div>
                <h2><i className="fas fa-history"></i> History Audit Logs</h2>
                <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--muted)', maxWidth: '560px' }}>
                  Catatan lengkap aktivitas pengguna dengan lokasi, IP, dan status browser.
                </p>
              </div>
              <div className="history-panel-actions">
                <span style={{ color: 'var(--muted)', fontSize: '13px' }}>{totalLogs} entri</span>
                <button
                  type="button"
                  className="history-delete-all"
                  onClick={handleDeleteAllLogs}
                  disabled={activityLogs.length === 0}
                >
                  <i className="fas fa-trash-alt"></i>
                  Hapus Semua
                </button>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Ngapain</th>
                    <th>Kapan</th>
                    <th>Dimana</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '32px 0' }}>
                        Tidak ada history log untuk ditampilkan.
                      </td>
                    </tr>
                  ) : activityLogs.map((log) => (
                    <tr key={log.id}>
                      {/* User */}
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar" style={{ background: log.user_role === 'superadmin' ? 'linear-gradient(135deg, var(--accent), var(--indigo))' : 'var(--blue)' }}>
                            {log.user_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <strong>{log.user_name || 'User'}</strong>
                            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                              {log.user_email || '-'} • {log.user_role || 'user'}
                            </div>
                            
                          </div>
                        </div>
                      </td>

                      {/* Ngapain */}
                      <td>
                        <div>
                          <strong style={{ color: 'var(--fg)' }}>{log.title}</strong>
                          <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px', lineHeight: 1.5 }}>
                            {log.description}
                          </div>
                        </div>
                      </td>

                      {/* Kapan */}
                      <td>
                        <span style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                          {formatDate(log.created_at)}
                        </span>
                      </td>

                      {/* Dimana */}
                      <td>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="fas fa-map-marker-alt" style={{ color: 'var(--red)' }}></i>
                            <strong style={{ fontSize: '13px' }}>{log.location_name || 'Jakarta, Indonesia'}</strong>
                          </div>
                          {log.latitude && log.longitude && (
                            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                              Lat: {Number(log.latitude).toFixed(4)}, Lng: {Number(log.longitude).toFixed(4)}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* IP */}
                      <td>
                        <code style={{ display: 'block', background: 'var(--bg)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px', color: 'var(--fg-secondary)' }}>
                          {log.ip_address || '127.0.0.1'}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
              <div style={{ color: 'var(--muted)' }}>
                Menampilkan halaman {page} dari {pages} — total {totalLogs} entri
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn" onClick={() => fetchLogs(Math.max(1, page - 1))} disabled={page <= 1}>Prev</button>
                <button className="btn" onClick={() => fetchLogs(Math.min(pages, page + 1))} disabled={page >= pages}>Next</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default HistoryLogs
