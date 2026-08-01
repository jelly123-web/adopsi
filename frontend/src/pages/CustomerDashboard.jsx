import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import CustomerLayout from '../components/CustomerLayout'
import { subscribeLiveData } from '../utils/liveDataEvents'

const isVideoMedia = (v = '') => v.startsWith('data:video') || /\.(mp4|webm|ogg)(\?|#|$)/i.test(v)

function PetMedia({ src, name }) {
  if (!src) return (
    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', color: '#60a5fa', fontSize: 40 }}>
      🐾
    </div>
  )
  if (isVideoMedia(src)) return <video src={src} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  return <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.55s cubic-bezier(.22,1,.36,1)' }} />
}

function getStatusStyle(status) {
  if (status === 'disetujui') return 'approved'
  if (status === 'ditolak') return 'rejected'
  return 'pending'
}

function getStatusLabel(status) {
  if (status === 'disetujui') return 'Disetujui'
  if (status === 'ditolak') return 'Ditolak'
  return 'Menunggu'
}

const formatDate = (v) => {
  if (!v) return '-'
  const d = new Date(v)
  return isNaN(d) ? '-' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const formatDateTime = (v) => {
  if (!v) return '-'
  const d = new Date(v)
  return isNaN(d) ? '-' : d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function CustomerDashboard() {
  const [requests, setRequests] = useState([])
  const [animals, setAnimals] = useState([])
  const [totalAnimals, setTotalAnimals] = useState(0)

  const userId = localStorage.getItem('authUserId')
  const userName = localStorage.getItem('authName') || 'Customer'
  const userEmail = localStorage.getItem('authEmail') || '-'

  const myRequests = useMemo(
    () => requests.filter((r) => String(r.user_id) === String(userId)),
    [requests, userId]
  )

  const counts = useMemo(() => ({
    total: myRequests.length,
    pending: myRequests.filter((r) => r.status === 'pending').length,
    approved: myRequests.filter((r) => r.status === 'disetujui').length,
    rejected: myRequests.filter((r) => r.status === 'ditolak').length,
  }), [myRequests])

  useEffect(() => {
    let active = true
    const loadData = () => {
      axios.get('http://localhost:3000/api/superadmin/adoption-requests')
        .then((res) => { if (active) setRequests(res.data?.data || []) })
        .catch(() => { if (active) setRequests([]) })
      axios.get('http://localhost:3000/api/superadmin/animals')
        .then((res) => {
          if (!active) return
          const data = res.data?.data || []
          setAnimals(data)
          setTotalAnimals(data.length)
        })
        .catch(() => {})
    }
    loadData()
    const unsub = subscribeLiveData(['adoptions', 'animals'], loadData)
    return () => { active = false; unsub() }
  }, [])

  return (
    <CustomerLayout>
      <div className="customer-page">

        {/* Hero / Welcome Card */}
        <div className="customer-hero-card">
          <div>
            <div className="customer-pill">
              <i />
              Selamat Datang Kembali
            </div>
            <h1>Hai, {userName}! 👋</h1>
            <p>{totalAnimals || '—'} hewan menunggu untuk kamu bawa pulang hari ini.</p>
          </div>
          <Link to="/customer/adoptions" className="customer-main-btn small">
            <i className="fas fa-star" style={{ fontSize: 11 }} />
            Cari Kecocokan
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="customer-stat-grid">
          {[
            { label: 'Total Pengajuan', val: counts.total, icon: 'fas fa-clipboard-list', cls: 'blue' },
            { label: 'Menunggu', val: counts.pending, icon: 'fas fa-clock', cls: 'amber' },
            { label: 'Disetujui', val: counts.approved, icon: 'fas fa-check-circle', cls: 'green' },
            { label: 'Ditolak', val: counts.rejected, icon: 'fas fa-times', cls: 'red' },
          ].map((c) => (
            <div key={c.label} className="customer-stat-card">
              <span className={c.cls}><i className={c.icon} /></span>
              <strong>{c.val}</strong>
              <p>{c.label}</p>
            </div>
          ))}
        </div>

        {/* Pet Grid Preview */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>Hewan Siap Adopsi</h2>
          <Link to="/customer/animals" className="customer-card-detail">
            Lihat Semua ({animals.length}) <i className="fas fa-arrow-right" style={{ fontSize: 10 }} />
          </Link>
        </div>

        <div className="customer-pet-grid" style={{ marginBottom: 32 }}>
          {animals.slice(0, 8).map((a) => (
            <Link
              key={a.id}
              to={`/customer/animals?animal_id=${a.id}`}
              className="customer-pet-card"
              style={{ textDecoration: 'none' }}
            >
              <div className="customer-pet-media">
                <PetMedia src={a.photo} name={a.name} />
                <div className="customer-pet-status">{a.status || 'Tersedia'}</div>
              </div>
              <div className="customer-pet-info">
                <div>
                  <h2>{a.name}</h2>
                  <p>{a.category_name || a.species || 'Hewan'} · {a.age || 0} thn</p>
                </div>
              </div>
              <div className="customer-location">
                <i className="fas fa-map-marker-alt" style={{ fontSize: 10 }} />
                Shelter Sahabat Kecil
              </div>
            </Link>
          ))}
          {animals.length === 0 && (
            <div className="customer-empty wide">
              <i className="fas fa-paw" />
              <strong>Data hewan belum tersedia</strong>
              <p>Coba refresh sebentar lagi.</p>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="customer-panel">
          <div className="customer-panel-head">
            <div>
              <h2>Pesanan Saya</h2>
              <p>Status pengajuan adopsi kamu terbaru.</p>
            </div>
            <Link to="/customer/status" className="customer-card-detail">
              Lihat Detail <i className="fas fa-arrow-right" style={{ fontSize: 10 }} />
            </Link>
          </div>
          <div className="customer-order-list">
            {myRequests.length === 0 ? (
              <div className="customer-empty">
                <i className="fas fa-clipboard-list" style={{ fontSize: 40, color: '#cbd5e1' }} />
                <strong>Belum ada pengajuan adopsi</strong>
                <p>Mulai adopsi hewan impianmu sekarang.</p>
                <Link to="/customer/animals" className="customer-main-btn small" style={{ marginTop: 8 }}>
                  🐾 Jelajahi Hewan
                </Link>
              </div>
            ) : myRequests.slice(0, 4).map((r) => (
              <div key={r.id} className="customer-order-card">
                <div className="customer-order-icon">
                  {r.animal_photo ? (
                    <PetMedia src={r.animal_photo} name={r.animal_name || 'Hewan Adopsi'} />
                  ) : (
                    <i className="fas fa-paw" />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>{r.animal_name || 'Hewan Adopsi'}</strong>
                  {r.pickup_date ? (
                    <div className="customer-schedule-note compact">
                      <i className="fas fa-calendar-check" />
                      <div>
                        <strong>Jadwal ambil hewan</strong>
                        <p>{formatDateTime(r.pickup_date)}</p>
                        <span>{r.pickup_status || 'Belum Dikonfirmasi Customer'}</span>
                      </div>
                    </div>
                  ) : null}
                  <p>{r.animal_species || '-'} · Diajukan {formatDate(r.created_at)}</p>
                </div>
                <span className={`customer-status ${getStatusStyle(r.status)}`}>
                  {getStatusLabel(r.status)}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </CustomerLayout>
  )
}
