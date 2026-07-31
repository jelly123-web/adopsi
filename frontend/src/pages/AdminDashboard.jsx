import { Link, Navigate } from 'react-router-dom'

function AdminDashboard() {
  const role = localStorage.getItem('authRole')
  const name = localStorage.getItem('authName') || 'Admin'
  const email = localStorage.getItem('authEmail') || 'admin@gmail.com'

  if (role !== 'admin') {
    return <Navigate to={role === 'superadmin' ? '/dashboard' : '/login'} replace />
  }

  const logout = () => {
    localStorage.removeItem('authUserId')
    localStorage.removeItem('authName')
    localStorage.removeItem('authRole')
    localStorage.removeItem('authEmail')
    localStorage.removeItem('authRemember')
    window.location.href = '/login'
  }

  return (
    <main className="admin-dashboard-page">
      <style>{`
        .admin-dashboard-page, .admin-dashboard-page * { box-sizing: border-box; font-family: Inter, system-ui, sans-serif; }
        .admin-dashboard-page { min-height: 100vh; background: #f6f8fb; color: #0f172a; padding: 32px; }
        .admin-shell { max-width: 1120px; margin: 0 auto; }
        .admin-topbar { height: 72px; background: #fff; border: 1px solid #e5e7eb; border-radius: 18px; display: flex; align-items: center; justify-content: space-between; padding: 0 22px; box-shadow: 0 18px 45px rgba(15,23,42,.06); }
        .admin-brand { display: flex; align-items: center; gap: 12px; }
        .admin-mark { width: 42px; height: 42px; border-radius: 14px; background: linear-gradient(135deg, #0ea5e9, #2563eb); color: #fff; display: grid; place-items: center; font-weight: 1000; }
        .admin-brand h1 { margin: 0; font-size: 20px; letter-spacing: -.04em; }
        .admin-brand p { margin: 3px 0 0; color: #94a3b8; font-size: 12px; font-weight: 700; }
        .admin-actions { display: flex; align-items: center; gap: 10px; }
        .admin-btn { height: 42px; border-radius: 12px; border: 1px solid #e5e7eb; background: #fff; color: #475569; padding: 0 16px; font-size: 13px; font-weight: 900; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
        .admin-btn.primary { border-color: #0ea5e9; background: #0ea5e9; color: #fff; }
        .admin-hero { margin-top: 24px; background: linear-gradient(135deg, #0f172a, #1e293b); color: #fff; border-radius: 22px; padding: 34px; box-shadow: 0 22px 55px rgba(15,23,42,.14); }
        .admin-hero h2 { margin: 0; font-size: 34px; letter-spacing: -.06em; }
        .admin-hero p { color: rgba(255,255,255,.68); max-width: 620px; line-height: 1.7; margin: 12px 0 0; }
        .admin-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 20px; }
        .admin-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 18px; padding: 22px; min-height: 150px; box-shadow: 0 18px 45px rgba(15,23,42,.05); text-decoration: none; color: inherit; transition: all .2s ease; }
        .admin-card:hover { transform: translateY(-3px); border-color: #0ea5e9; box-shadow: 0 22px 48px rgba(14,165,233,.12); }
        .admin-card strong { display: block; font-size: 17px; letter-spacing: -.03em; }
        .admin-card p { color: #94a3b8; font-size: 13px; line-height: 1.65; margin: 9px 0 0; }
        @media (max-width: 820px) {
          .admin-dashboard-page { padding: 18px; }
          .admin-topbar { height: auto; align-items: flex-start; flex-direction: column; gap: 14px; padding: 18px; }
          .admin-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="admin-shell">
        <header className="admin-topbar">
          <div className="admin-brand">
            <div className="admin-mark">A</div>
            <div>
              <h1>Dashboard Admin</h1>
              <p>{name} - {email}</p>
            </div>
          </div>
          <div className="admin-actions">
            <Link to="/login" className="admin-btn">Halaman Login</Link>
            <button type="button" className="admin-btn primary" onClick={logout}>Keluar</button>
          </div>
        </header>

        <section className="admin-hero">
          <h2>Dashboard Admin</h2>
          <p>
            Akun admin punya akses terpisah dari superadmin. Admin hanya bisa membuka Dashboard,
            Kelola Hewan, Kelola Kategori Hewan, dan Kelola Pengajuan Adopsi.
          </p>
        </section>

        <section className="admin-grid">
          <Link to="/admin/dashboard" className="admin-card">
            <strong>Dashboard</strong>
            <p>Lihat ringkasan data aplikasi adopsi.</p>
          </Link>
          <Link to="/admin/animals" className="admin-card">
            <strong>Kelola Hewan</strong>
            <p>Tambah, edit, dan kelola data hewan.</p>
          </Link>
          <Link to="/admin/categories" className="admin-card">
            <strong>Kelola Kategori Hewan</strong>
            <p>Atur kategori atau spesies hewan.</p>
          </Link>
          <Link to="/admin/adoptions" className="admin-card">
            <strong>Kelola Pengajuan Adopsi</strong>
            <p>Lihat dan kelola pengajuan adopsi.</p>
          </Link>
        </section>
      </div>
    </main>
  )
}

export default AdminDashboard
