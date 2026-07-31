import { useEffect, useState } from 'react'
import axios from 'axios'
import SuperadminNavbar from '../components/SuperadminNavbar'
import SuperadminSidebar from '../components/SuperadminSidebar'
import { subscribeLiveData } from '../utils/liveDataEvents'

const storageKey = 'petugasVisitSchedules'

function PetugasVisits() {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true,
  )
  const [requests, setRequests] = useState([])
  const [schedules, setSchedules] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '{}')
    } catch {
      return {}
    }
  })

  const updateSchedule = (requestId, field, value) => {
    const nextSchedules = {
      ...schedules,
      [requestId]: {
        ...(schedules[requestId] || { status: 'Menunggu Konfirmasi' }),
        [field]: value,
      },
    }
    setSchedules(nextSchedules)
    localStorage.setItem(storageKey, JSON.stringify(nextSchedules))
  }

  const formatDate = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID')
  }

  useEffect(() => {
    let active = true
    const loadRequests = () => {
      axios
      .get('http://localhost:3000/api/superadmin/adoption-requests')
      .then((response) => {
        if (active) setRequests(response.data.data || [])
      })
      .catch(() => {
        if (active) setRequests([])
      })
    }

    loadRequests()
    const unsubscribe = subscribeLiveData('adoptions', loadRequests)
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return (
    <div className="dashboard-layout">
      <SuperadminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={`main-content ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
        <SuperadminNavbar
          pageTitle="Jadwal Kunjungan"
          sidebarOpen={sidebarOpen}
          offsetForSidebar={false}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />

        <div className="page-body">
          <div className="page-header">
            <h1 className="page-header-title">
              <i className="fas fa-calendar-check"></i>
              Kelola Jadwal Kunjungan
            </h1>
            <p className="page-header-desc">
              Tentukan tanggal kunjungan calon adopter dan konfirmasi jadwal pengambilan hewan.
            </p>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2><i className="fas fa-table"></i> Jadwal Calon Adopter</h2>
              <span>{requests.length} pengajuan</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Hewan</th>
                    <th>Status Pengajuan</th>
                    <th>Tanggal Kunjungan</th>
                    <th>Konfirmasi</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => {
                    const schedule = schedules[request.id] || {}
                    return (
                      <tr key={request.id}>
                        <td>
                          <strong>{request.user_name || '-'}</strong>
                          <div style={{ color: 'var(--muted)', fontSize: 13 }}>{formatDate(request.created_at)}</div>
                        </td>
                        <td>{request.animal_name || '-'}</td>
                        <td>
                          <span className="tag tag-muted">
                            <span className="status-dot"></span>
                            {request.status === 'pending' ? 'Menunggu' : request.status}
                          </span>
                        </td>
                        <td>
                          <input
                            type="datetime-local"
                            value={schedule.date || ''}
                            onChange={(event) => updateSchedule(request.id, 'date', event.target.value)}
                            className="schedule-input"
                          />
                        </td>
                        <td>
                          <select
                            value={schedule.status || 'Menunggu Konfirmasi'}
                            onChange={(event) => updateSchedule(request.id, 'status', event.target.value)}
                            className="status-select"
                          >
                            <option>Menunggu Konfirmasi</option>
                            <option>Dikonfirmasi</option>
                            <option>Dijadwalkan Ulang</option>
                            <option>Selesai</option>
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--muted)', padding: 28 }}>
                        Belum ada pengajuan untuk dijadwalkan.
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

export default PetugasVisits
