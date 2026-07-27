import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

const defaultDashboardData = {
  stats: [
    { label: 'Total User', value: 0, tone: 'blue', icon: 'fa-users' },
    { label: 'Total Hewan', value: 0, tone: 'green', icon: 'fa-paw' },
    { label: 'Total Pengajuan', value: 0, tone: 'amber', icon: 'fa-file-alt' },
    { label: 'Adopsi Berhasil', value: 0, tone: 'teal', icon: 'fa-check-circle' },
  ],
  monthlyAdoptions: [],
  animalTypes: [],
  activities: [],
}

function formatActivityTime(value) {
  if (typeof value !== 'string') return value
  if (value.includes('menit') || value.includes('jam')) return value

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(defaultDashboardData)
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  )

  useEffect(() => {
    axios
      .get('http://localhost:3000/api/superadmin/dashboard')
      .then((response) => {
        const data = response.data?.data || defaultDashboardData
        setDashboardData({
          ...defaultDashboardData,
          ...data,
          stats: (data.stats || defaultDashboardData.stats).map((stat, i) => ({
            ...stat,
            tone: ['blue', 'green', 'amber', 'teal'][i],
            icon: ['fa-users', 'fa-paw', 'fa-file-alt', 'fa-check-circle'][i],
          })),
        })
      })
      .catch(() => {
        setDashboardData(defaultDashboardData)
      })
  }, [])

  const { stats, monthlyAdoptions, animalTypes, activities } = dashboardData
  const highestMonthly = Math.max(...monthlyAdoptions.map((item) => item.total), 1)
  const highestAnimalType = Math.max(...animalTypes.map((item) => item.total), 1)

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo">A</div>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-name">Adopsi Hewan</div>
            <div className="sidebar-brand-role">Superadmin</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">MENU</div>
          <a href="/dashboard" className="nav-item active">
            <i className="fas fa-tachometer-alt"></i>
            <span>Dashboard</span>
          </a>
          <a href="/dashboard/users" className="nav-item">
            <i className="fas fa-users"></i>
            <span>Kelola User</span>
          </a>
          <a href="/dashboard/categories" className="nav-item">
            <i className="fas fa-tags"></i>
            <span>Kelola Kategori</span>
          </a>
          <a href="/dashboard/animals" className="nav-item">
            <i className="fas fa-paw"></i>
            <span>Kelola Hewan</span>
          </a>
          <a href="/dashboard/questionnaire-character" className="nav-item">
            <i className="fas fa-clipboard-list"></i>
            <span>Kuisioner Karakter</span>
          </a>
          <a href="/dashboard/adoptions" className="nav-item">
            <i className="fas fa-file-alt"></i>
            <span>Kelola Pengajuan Adopsi</span>
          </a>
          <a href="/dashboard/reports" className="nav-item">
            <i className="fas fa-chart-line"></i>
            <span>Laporan</span>
          </a>
          <a href="/dashboard/logs" className="nav-item">
            <i className="fas fa-history"></i>
            <span>History Logs</span>
          </a>
          <a href="/dashboard/restore" className="nav-item">
            <i className="fas fa-undo"></i>
            <span>Pulihkan Data</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <Link to="/dashboard/profile" className="sidebar-user">
            <div className="sidebar-avatar">SA</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">Super Admin</div>
              <div className="sidebar-user-email">admin@adopsi.test</div>
            </div>
          </Link>
          <button 
            className="sidebar-logout-btn"
            onClick={() => { window.location.href = '/'; }}
          >
            <i className="fas fa-sign-out-alt"></i> Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="topbar-hamburger"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <i className="fas fa-bars"></i>
            </button>
            <div className="topbar-title">
              <button 
                className="topbar-toggle" 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? '≪' : '≫'}
              </button>
              <div className="topbar-page-title">Dashboard</div>
            </div>
          </div>

          <div className="topbar-right">
            <button className="topbar-btn" title="Notifikasi">
              <i className="fas fa-bell"></i>
              <span className="notif-dot"></span>
            </button>
            <button 
              className="topbar-btn" 
              title="Pengaturan Sistem"
              onClick={() => { window.location.href = '/dashboard/settings'; }}
            >
              <i className="fas fa-cog"></i>
            </button>
            <div className="live-indicator">
              <span className="live-dot"></span>
              LIVE
            </div>
          </div>
        </header>

        {/* Page Body */}
        <div className="page-body">
          {/* Stats Grid */}
          <div className="stats-grid">
            {stats.map((stat) => (
              <div key={stat.label} className="stat-card" style={{ '--stat-color': `var(--${stat.tone})` }}>
                <div className="stat-header">
                  <div className={`stat-icon ${stat.tone}`}>
                    <i className={`fas ${stat.icon}`}></i>
                  </div>
                  <div className="stat-trend up">
                    <i className="fas fa-arrow-up"></i>
                    <span>12%</span>
                  </div>
                </div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Two Column Layout */}
          <div className="two-col">
            {/* Monthly Adoptions Chart */}
            <div className="section-card">
              <div className="section-card-header">
                <div className="section-card-title">
                  <i className="fas fa-chart-bar"></i>
                  Adopsi Bulanan
                </div>
                <div className="filter-pills">
                  <button className="filter-pill active">6 Bulan</button>
                  <button className="filter-pill">1 Tahun</button>
                </div>
              </div>
              <div className="section-card-body">
                <div style={{ padding: '22px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    height: '200px',
                    gap: '16px'
                  }}>
                    {monthlyAdoptions.map((item) => (
                      <div key={item.month} style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <div style={{ fontWeight: 700, fontSize: '13px' }}>{item.total}</div>
                        <div style={{
                          width: '100%',
                          height: '100%',
                          background: 'var(--bg)',
                          borderRadius: '8px 8px 0 0',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'flex-end'
                        }}>
                          <div style={{
                            width: '100%',
                            height: `${(item.total / highestMonthly) * 100}%`,
                            background: 'linear-gradient(180deg, var(--accent) 0%, var(--accent-dark) 100%)',
                            borderRadius: '8px 8px 0 0',
                            transition: 'height 0.6s ease'
                          }}></div>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>{item.month}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Animal Types Chart */}
            <div className="section-card">
              <div className="section-card-header">
                <div className="section-card-title">
                  <i className="fas fa-list"></i>
                  Hewan Berdasarkan Jenis
                </div>
              </div>
              <div className="section-card-body">
                <div style={{ padding: '22px' }}>
                  {animalTypes.map((item) => (
                    <div key={item.type} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ fontWeight: 600 }}>{item.type}</span>
                        <span style={{ fontWeight: 700 }}>{item.total}</span>
                      </div>
                      <div style={{
                        height: '8px',
                        background: 'var(--bg)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${(item.total / highestAnimalType) * 100}%`,
                          background: 'linear-gradient(90deg, var(--green) 0%, var(--teal) 100%)',
                          borderRadius: '4px',
                          transition: 'width 0.6s ease'
                        }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Activity List */}
          <div className="section-card">
            <div className="section-card-header">
              <div className="section-card-title">
                <i className="fas fa-history"></i>
                Aktivitas Terbaru
              </div>
            </div>
            <div className="section-card-body">
              <ul className="bestseller-list">
                {activities.map((activity, i) => (
                  <li key={i} className="bestseller-item">
                    <div className={`bestseller-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'normal'}`}>
                      {i + 1}
                    </div>
                    <div className="bestseller-info">
                      <div className="bestseller-name">{activity.title}</div>
                      <div className="bestseller-meta">{activity.description}</div>
                    </div>
                    <div className="bestseller-qty">
                      <div className="bestseller-qty-label">{formatActivityTime(activity.time)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
