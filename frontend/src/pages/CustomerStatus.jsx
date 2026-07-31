import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import CustomerLayout from '../components/CustomerLayout'
import { subscribeLiveData } from '../utils/liveDataEvents'

const API_BASE_URL = 'http://localhost:3000/api'

function statusText(status = '') {
  if (status === 'disetujui') return 'Disetujui'
  if (status === 'ditolak') return 'Ditolak'
  return 'Menunggu'
}

function statusClass(status = '') {
  if (status === 'disetujui') return 'approved'
  if (status === 'ditolak') return 'rejected'
  return 'pending'
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function CustomerStatus() {
  const [requests, setRequests] = useState([])
  const userId = localStorage.getItem('authUserId')

  const myRequests = useMemo(
    () => requests.filter((request) => String(request.user_id) === String(userId)),
    [requests, userId],
  )

  const counts = useMemo(() => ({
    pending: myRequests.filter((request) => request.status === 'pending').length,
    approved: myRequests.filter((request) => request.status === 'disetujui').length,
    rejected: myRequests.filter((request) => request.status === 'ditolak').length,
  }), [myRequests])

  useEffect(() => {
    let active = true
    const loadRequests = () => {
      axios
        .get(`${API_BASE_URL}/superadmin/adoption-requests`)
        .then((response) => {
          if (active) setRequests(response.data?.data || [])
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
    <CustomerLayout>
      <main className="customer-page">
        <section className="customer-hero-card">
          <div>
            <span className="customer-pill"><i></i> Status Pengajuan</span>
            <h1>Status Pengajuan</h1>
            <p>Lihat status pengajuan adopsi kamu: Menunggu, Disetujui, atau Ditolak.</p>
            <div className="customer-feature-list">
              <span><i className="fas fa-clock"></i> {counts.pending} Menunggu</span>
              <span><i className="fas fa-check"></i> {counts.approved} Disetujui</span>
              <span><i className="fas fa-times"></i> {counts.rejected} Ditolak</span>
            </div>
          </div>
          <Link to="/customer/adoptions" className="customer-main-btn">
            <i className="fas fa-heart"></i>
            Ajukan Adopsi
          </Link>
        </section>

        <section className="customer-panel">
          <div className="customer-panel-head">
            <div>
              <h2>Daftar Status</h2>
              <p>Semua pengajuan dari akun kamu.</p>
            </div>
            <span>{myRequests.length} pengajuan</span>
          </div>

          <div className="customer-order-list">
            {myRequests.map((request) => (
              <article key={request.id} className="customer-status-card">
                <div className="customer-order-icon"><i className="fas fa-paw"></i></div>
                <div className="customer-status-main">
                  <div>
                    <strong>{request.animal_name || '-'}</strong>
                    <p>{request.animal_species || '-'} - Diajukan {formatDate(request.created_at)}</p>
                  </div>
                  <span className={`customer-status ${statusClass(request.status)}`}>{statusText(request.status)}</span>
                  {request.status === 'ditolak' ? (
                    <div className="customer-reject-note">
                      <i className="fas fa-info-circle"></i>
                      {request.rejection_reason || 'Pengajuan ditolak. Silakan hubungi petugas untuk informasi lebih lanjut.'}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}

            {myRequests.length === 0 ? (
              <div className="customer-empty">
                <i className="far fa-clipboard"></i>
                <strong>Belum ada pengajuan</strong>
                <p>Pilih hewan dan isi formulir adopsi terlebih dahulu.</p>
                <Link to="/customer/animals" className="customer-main-btn small">Jelajahi Hewan</Link>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </CustomerLayout>
  )
}

export default CustomerStatus
