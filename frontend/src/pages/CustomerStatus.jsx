import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import CustomerLayout from '../components/CustomerLayout'
import { publishLiveData, subscribeLiveData } from '../utils/liveDataEvents'

const API_BASE_URL = 'http://localhost:3000/api'

function getStatusCls(status) {
  if (status === 'disetujui') return 'approved'
  if (status === 'ditolak') return 'rejected'
  return 'pending'
}

function getStatusLabel(status) {
  if (status === 'disetujui') return 'Disetujui'
  if (status === 'ditolak') return 'Ditolak'
  return 'Menunggu Verifikasi'
}

const formatDate = (v) => {
  if (!v) return '-'
  const d = new Date(v)
  return isNaN(d) ? '-' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

const formatDateTime = (v) => {
  if (!v) return '-'
  const d = new Date(v)
  return Number.isNaN(d.getTime())
    ? '-'
    : d.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })
}

export default function CustomerStatus() {
  const [requests, setRequests] = useState([])
  const userId = localStorage.getItem('authUserId')

  const myRequests = useMemo(
    () => requests.filter((r) => String(r.user_id) === String(userId)),
    [requests, userId]
  )

  useEffect(() => {
    let active = true
    const load = () => {
      axios
        .get(`${API_BASE_URL}/superadmin/adoption-requests`)
        .then((res) => { if (active) setRequests(res.data?.data || []) })
        .catch(() => { if (active) setRequests([]) })
    }
    load()
    const unsub = subscribeLiveData('adoptions', load)
    return () => { active = false; unsub() }
  }, [])

  const confirmSchedule = async (requestId) => {
    const now = new Date().toISOString()
    try {
      await axios.put(`${API_BASE_URL}/superadmin/adoption-requests/${requestId}`, {
        pickup_status: 'Dikonfirmasi',
        pickup_updated_at: now,
      })
      setRequests((prev) => prev.map((row) => (
        row.id === requestId
          ? { ...row, pickup_status: 'Dikonfirmasi', pickup_updated_at: now }
          : row
      )))
      publishLiveData('adoptions', { action: 'schedule-confirmed', requestId })
    } catch {
      window.alert('Gagal konfirmasi jadwal. Coba lagi.')
    }
  }

  return (
    <CustomerLayout>
      <div className="customer-page">
        <div className="customer-panel">
          <div className="customer-panel-head">
            <div>
              <h2>Pesanan Saya</h2>
              <p>Riwayat dan status semua pengajuan adopsi kamu.</p>
            </div>
            <span style={{ background: '#eff6ff', color: '#2563eb', fontSize: 12, fontWeight: 900, padding: '6px 14px', borderRadius: 999 }}>
              {myRequests.length} pengajuan
            </span>
          </div>
          <div className="customer-order-list">
            {myRequests.length === 0 ? (
              <div className="customer-empty">
                <i className="fas fa-clipboard-list" style={{ fontSize: 44, color: '#cbd5e1' }} />
                <strong>Belum ada pengajuan adopsi</strong>
                <p>Yuk mulai adopsi hewan pertamamu!</p>
                <Link to="/customer/animals" className="customer-main-btn small" style={{ marginTop: 10 }}>
                  🐾 Jelajahi Hewan
                </Link>
              </div>
            ) : (
              myRequests.map((r) => {
                const schedule = { date: r.pickup_date, status: r.pickup_status }
                const needsConfirm = schedule.date && schedule.status !== 'Dikonfirmasi' && schedule.status !== 'Selesai'
                return (
                <div key={r.id} className="customer-order-card">
                  <div className="customer-order-icon">
                    {r.animal_photo ? (
                      <img
                        src={r.animal_photo}
                        alt={r.animal_name}
                        style={{ width: 48, height: 48, borderRadius: 14, objectFit: 'cover' }}
                      />
                    ) : (
                      <i className="fas fa-paw" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{r.animal_name || 'Hewan Adopsi'}</strong>
                    <p>{r.animal_species || 'Hewan'} · Diajukan {formatDate(r.created_at)}</p>
                    {r.status === 'ditolak' && r.rejection_reason && (
                      <div className="customer-reject-note" style={{ marginTop: 8 }}>
                        <i className="fas fa-info-circle" />
                        Catatan: {r.rejection_reason}
                      </div>
                    )}
                    {schedule.date && (
                      <div className="customer-schedule-note">
                        <i className="fas fa-calendar-check" />
                        <div>
                          <strong>Jadwal Pengambilan Hewan</strong>
                          <p>{formatDateTime(schedule.date)}</p>
                          <span>{schedule.status || 'Belum Dikonfirmasi Customer'}</span>
                          {needsConfirm && (
                            <button type="button" onClick={() => confirmSchedule(r.id)}>
                              Konfirmasi Jadwal
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <span className={`customer-status ${getStatusCls(r.status)}`}>
                    {getStatusLabel(r.status)}
                  </span>
                </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}
