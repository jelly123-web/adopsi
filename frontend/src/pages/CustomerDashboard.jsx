import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import CustomerLayout from '../components/CustomerLayout'
import { subscribeLiveData } from '../utils/liveDataEvents'

function CustomerDashboard() {
  const [requests, setRequests] = useState([])
  const userId = localStorage.getItem('authUserId')
  const userName = localStorage.getItem('authName') || 'Customer'
  const userEmail = localStorage.getItem('authEmail') || '-'

  const myRequests = useMemo(
    () => requests.filter((request) => String(request.user_id) === String(userId)),
    [requests, userId],
  )

  const statusCounts = useMemo(() => ({
    total: myRequests.length,
    pending: myRequests.filter((request) => request.status === 'pending').length,
    approved: myRequests.filter((request) => request.status === 'disetujui').length,
    rejected: myRequests.filter((request) => request.status === 'ditolak').length,
  }), [myRequests])

  const getStatusText = (status) => {
    if (status === 'pending') return 'Menunggu Verifikasi'
    if (status === 'disetujui') return 'Disetujui'
    if (status === 'ditolak') return 'Ditolak'
    return status || '-'
  }

  const getStatusClass = (status) => {
    if (status === 'disetujui') return 'approved'
    if (status === 'ditolak') return 'rejected'
    return 'pending'
  }

  const formatDate = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
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
    <CustomerLayout>
      <main className="customer-page">
        <section className="customer-hero-card">
          <div>
            <span className="customer-pill"><i></i> Ringkasan Akun</span>
            <h1>Hai, {userName}!</h1>
            <p>{userEmail}</p>
          </div>
          <Link to="/customer/animals" className="customer-main-btn">
            <i className="fas fa-paw"></i>
            Jelajahi Hewan
          </Link>
        </section>

        <section className="customer-stat-grid">
          <div className="customer-stat-card">
            <span className="blue"><i className="fas fa-file-alt"></i></span>
            <strong>{statusCounts.total}</strong>
            <p>Total Pengajuan</p>
          </div>
          <div className="customer-stat-card">
            <span className="amber"><i className="fas fa-clock"></i></span>
            <strong>{statusCounts.pending}</strong>
            <p>Menunggu</p>
          </div>
          <div className="customer-stat-card">
            <span className="green"><i className="fas fa-check"></i></span>
            <strong>{statusCounts.approved}</strong>
            <p>Disetujui</p>
          </div>
          <div className="customer-stat-card">
            <span className="red"><i className="fas fa-times"></i></span>
            <strong>{statusCounts.rejected}</strong>
            <p>Ditolak</p>
          </div>
        </section>

        <section className="customer-panel">
          <div className="customer-panel-head">
            <div>
              <h2>Pesanan Saya</h2>
              <p>Status pengajuan adopsi kamu.</p>
            </div>
            <span>{myRequests.length} pengajuan</span>
          </div>

          <div className="customer-order-list">
            {myRequests.map((request) => (
              <article key={request.id} className="customer-order-card">
                <div className="customer-order-icon"><i className="fas fa-paw"></i></div>
                <div>
                  <strong>{request.animal_name || '-'}</strong>
                  <p>{request.animal_species || '-'} · Diajukan {formatDate(request.created_at)}</p>
                </div>
                <span className={`customer-status ${getStatusClass(request.status)}`}>{getStatusText(request.status)}</span>
              </article>
            ))}

            {myRequests.length === 0 ? (
              <div className="customer-empty">
                <i className="far fa-clipboard"></i>
                <strong>Belum ada pesanan</strong>
                <p>Yuk mulai adopsi hewan pertamamu.</p>
                <Link to="/customer/animals" className="customer-main-btn small">Jelajahi Hewan</Link>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </CustomerLayout>
  )
}

export default CustomerDashboard
