import { useEffect, useState } from 'react'
import axios from '../utils/api'
import SuperadminNavbar from '../components/SuperadminNavbar'
import SuperadminSidebar from '../components/SuperadminSidebar'
import { publishLiveData, subscribeLiveData } from '../utils/liveDataEvents'

const defaultScheduleStatus = 'Belum Dikonfirmasi Customer'

const toDateTimeInputValue = (value) => {
  if (!value) return ''
  const raw = String(value)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) return raw.slice(0, 16)
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw.replace(' ', 'T').slice(0, 16)
  const pad = (number) => String(number).padStart(2, '0')
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`
}

function PetugasVisits() {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true,
  )
  const [requests, setRequests] = useState([])
  const [schedules, setSchedules] = useState({})

  const getSchedule = (request) => {
    return schedules[request.id] || {
      date: toDateTimeInputValue(request.pickup_date),
      status: request.pickup_status || defaultScheduleStatus,
    }
  }

  const updateSchedule = (request, field, value) => {
    setSchedules((prev) => ({
      ...prev,
      [request.id]: {
        ...(prev[request.id] || {
          date: toDateTimeInputValue(request.pickup_date),
          status: request.pickup_status || defaultScheduleStatus,
        }),
        [field]: value,
      },
    }))
  }

  const sendSchedule = async (request) => {
    const schedule = getSchedule(request)
    if (!schedule.date) {
      window.alert('Isi tanggal ambil hewan dulu.')
      return
    }

    const now = new Date().toISOString()
    const payload = {
      pickup_date: schedule.date,
      pickup_status: schedule.status || defaultScheduleStatus,
      pickup_notified_at: now,
      pickup_updated_at: now,
    }

    try {
      await axios.put(`/superadmin/adoption-requests/${request.id}`, payload)
      setRequests((prev) => prev.map((item) => (
        item.id === request.id ? { ...item, ...payload } : item
      )))
      setSchedules((prev) => ({
        ...prev,
        [request.id]: {
          date: toDateTimeInputValue(payload.pickup_date),
          status: payload.pickup_status,
        },
      }))
      publishLiveData('adoptions', { action: 'schedule-updated', requestId: request.id })
      window.alert('Jadwal pengambilan sudah dikirim ke customer.')
    } catch {
      window.alert('Gagal mengirim jadwal. Coba lagi.')
    }
  }

  const formatDate = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID')
  }

  const isApprovedRequest = (status) => {
    const normalized = String(status || '').toLowerCase()
    return normalized === 'approved' || normalized === 'disetujui'
  }

  const visitRequests = requests.filter((request) => isApprovedRequest(request.status))

  useEffect(() => {
    let active = true
    const loadRequests = () => {
      axios
        .get(`/superadmin/adoption-requests`)
        .then((response) => {
          if (active) setRequests(response.data.data || [])
        })
        .catch(() => {
          if (active) setRequests([])
        })
    }

    const refreshOnFocus = () => loadRequests()

    loadRequests()
    const unsubscribe = subscribeLiveData('adoptions', loadRequests)
    const timer = window.setInterval(loadRequests, 3000)
    window.addEventListener('focus', refreshOnFocus)
    window.addEventListener('visibilitychange', refreshOnFocus)
    return () => {
      active = false
      unsubscribe()
      window.clearInterval(timer)
      window.removeEventListener('focus', refreshOnFocus)
      window.removeEventListener('visibilitychange', refreshOnFocus)
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
              Atur tanggal customer mengambil hewan untuk pengajuan yang sudah disetujui.
            </p>
          </div>

          <div className="visit-help-card">
            <i className="fas fa-info-circle"></i>
            <span>Isi tanggal ambil hewan, lalu klik <strong>Kirim Jadwal</strong>. Customer akan melihat jadwalnya di Pesanan Saya dan menerima notifikasi.</span>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2><i className="fas fa-calendar-day"></i> Jadwal Calon Adopter</h2>
              <span>{visitRequests.length} siap dijadwalkan</span>
            </div>
            <div className="table-wrap visits-table-wrap">
              <table className="visits-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Alamat</th>
                    <th>Hewan</th>
                    <th>Status Pengajuan</th>
                    <th>Tanggal Ambil Hewan</th>
                    <th>Status Jadwal</th>
                    <th>Metode Pengambilan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {visitRequests.map((request) => {
                    const schedule = getSchedule(request)
                    return (
                      <tr key={request.id}>
                      <td>
                        <strong>{request.user_name || '-'}</strong>
                        <div style={{ color: 'var(--muted)', fontSize: 13 }}>{formatDate(request.created_at)}</div>
                      </td>
                      <td>{request.phone || '-'}</td>
                      <td>{request.address || '-'}</td>
                      <td>{request.animal_name || '-'}</td>
                      <td>
                        <span className="tag tag-success">
                          <span className="status-dot"></span>
                          Disetujui
                        </span>
                      </td>
                      <td>
                        <input
                          type="datetime-local"
                          value={schedule.date || ''}
                          onChange={(event) => updateSchedule(request, 'date', event.target.value)}
                          className="schedule-input"
                        />
                      </td>
                      <td>
                        <select
                          value={schedule.status || defaultScheduleStatus}
                          onChange={(event) => updateSchedule(request, 'status', event.target.value)}
                          className="status-select"
                        >
                          <option>Belum Dikonfirmasi Customer</option>
                          <option>Dikonfirmasi</option>
                          <option>Dijadwalkan Ulang</option>
                          <option>Selesai</option>
                        </select>
                      </td>
                      <td>
                        {request.pickup_method === 'langsung' ? 'Ambil langsung di tempat' : request.pickup_method === 'antar' ? 'Diantar oleh petugas' : '-'}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="schedule-send-btn"
                          onClick={() => sendSchedule(request)}
                        >
                          <i className="fas fa-paper-plane"></i>
                          Kirim Jadwal
                        </button>
                      </td>
                    </tr>
                    )
                  })}
                  {visitRequests.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', color: 'var(--muted)', padding: 28 }}>
                        Belum ada pengajuan disetujui yang perlu dijadwalkan.
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
