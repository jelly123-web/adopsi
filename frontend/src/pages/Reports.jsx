import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

const defaultReportData = {
  stats: [
    { label: 'Total User', value: 0, tone: 'blue', icon: 'fa-users' },
    { label: 'Total Hewan', value: 0, tone: 'green', icon: 'fa-paw' },
    { label: 'Total Pengajuan', value: 0, tone: 'amber', icon: 'fa-file-alt' },
    { label: 'Adopsi Berhasil', value: 0, tone: 'teal', icon: 'fa-check-circle' },
  ],
  statusBreakdown: [],
  monthlyAdoptions: [],
  yearlyAdoptions: [],
  animalTypes: [],
}

function Reports() {
  const [reportData, setReportData] = useState(defaultReportData)
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  )
  const [reportType, setReportType] = useState('bulanan') // 'bulanan' | 'tahunan'
  const [chartType, setChartType] = useState('bar') // 'bar', 'line', 'area'

  useEffect(() => {
    axios
      .get('http://localhost:3000/api/superadmin/reports')
      .then((response) => {
        if (response.data?.data) {
          const data = response.data.data
          setReportData({
            ...defaultReportData,
            ...data,
            stats: (data.stats || defaultReportData.stats).map((stat, i) => ({
              ...stat,
              tone: ['blue', 'green', 'amber', 'teal'][i],
              icon: ['fa-users', 'fa-paw', 'fa-file-alt', 'fa-check-circle'][i],
            })),
            statusBreakdown: data.statusBreakdown || [],
            monthlyAdoptions: data.monthlyAdoptions || [],
            yearlyAdoptions: data.yearlyAdoptions || [],
            animalTypes: data.animalTypes || [],
          })
        }
      })
      .catch(() => setReportData(defaultReportData))
  }, [])

  const { stats, statusBreakdown, monthlyAdoptions, yearlyAdoptions, animalTypes } = reportData
  const activeChartData = reportType === 'bulanan' 
    ? monthlyAdoptions.map(item => ({ label: item.month, total: item.total }))
    : yearlyAdoptions.map(item => ({ label: item.year, total: item.total }))

  const highestValue = Math.max(...activeChartData.map((item) => item.total), 1)
  const totalStatus = statusBreakdown.reduce((sum, item) => sum + item.value, 0)

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
          <a href="/dashboard" className="nav-item">
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
          <a href="/dashboard/reports" className="nav-item active">
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
              <div className="topbar-page-title">Laporan Transaksi</div>
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
              LIVE REPORT
            </div>
          </div>
        </header>

        {/* Page Body */}
        <div className="page-body">
          <div className="page-header">
            <h1 className="page-header-title">
              <i className="fas fa-chart-line"></i>
              Laporan Transaksi Adopsi
            </h1>
            <p className="page-header-desc">
              Grafik diagram statistik transaksi adopsi tahunan & bulanan beserta status hewan.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            {stats.map((stat) => (
              <div key={stat.label} className="stat-card" style={{ '--stat-color': `var(--${stat.tone})` }}>
                <div className="stat-header">
                  <div className={`stat-icon ${stat.tone}`}>
                    <i className={`fas ${stat.icon}`}></i>
                  </div>
                </div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Two Column Layout for Diagrams */}
          <div className="two-col" style={{ marginBottom: '24px' }}>
            {/* Monthly / Yearly Adoptions Chart */}
            <div className="section-card">
              <div className="section-card-header">
                <div className="section-card-title">
                  <i className="fas fa-chart-bar"></i>
                  Transaksi Adopsi ({reportType === 'bulanan' ? 'Bulanan' : 'Tahunan'})
                </div>
                <div className="filter-pills" style={{ gap: '8px' }}>
                  <button 
                    className={`filter-pill ${reportType === 'bulanan' ? 'active' : ''}`}
                    onClick={() => setReportType('bulanan')}
                  >Bulanan</button>
                  <button 
                    className={`filter-pill ${reportType === 'tahunan' ? 'active' : ''}`}
                    onClick={() => setReportType('tahunan')}
                  >Tahunan</button>
                  <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }}></div>
                  <button 
                    className={`filter-pill ${chartType === 'bar' ? 'active' : ''}`}
                    onClick={() => setChartType('bar')}
                    title="Grafik Batang (Bar)"
                  ><i className="fas fa-chart-bar"></i></button>
                  <button 
                    className={`filter-pill ${chartType === 'line' ? 'active' : ''}`}
                    onClick={() => setChartType('line')}
                    title="Grafik Garis (Line)"
                  ><i className="fas fa-chart-line"></i></button>
                  <button 
                    className={`filter-pill ${chartType === 'area' ? 'active' : ''}`}
                    onClick={() => setChartType('area')}
                    title="Grafik Area"
                  ><i className="fas fa-chart-area"></i></button>
                </div>
              </div>

              <div className="section-card-body">
                <div style={{ padding: '22px' }}>
                  {/* Bar Chart */}
                  {chartType === 'bar' && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      height: '200px',
                      gap: '16px'
                    }}>
                      {activeChartData.map((item) => (
                        <div key={item.label} style={{
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
                              height: `${(item.total / highestValue) * 100}%`,
                              background: 'linear-gradient(180deg, var(--accent) 0%, var(--accent-dark) 100%)',
                              borderRadius: '8px 8px 0 0',
                              transition: 'all 0.6s ease'
                            }}></div>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>{item.label}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Line Chart */}
                  {chartType === 'line' && (
                    <div>
                      <div style={{
                        position: 'relative',
                        height: '200px',
                        marginBottom: '16px',
                        paddingLeft: '40px'
                      }}>
                        {[0, 1, 2, 3, 4].map((i) => {
                          const percent = i * 25
                          return (
                            <div key={percent} style={{
                              position: 'absolute',
                              bottom: `${percent}%`,
                              left: 0,
                              right: 0,
                              borderTop: '1px dashed var(--border)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <span style={{ fontSize: '11px', color: 'var(--muted)', width: '35px', textAlign: 'right' }}>
                                {Math.round((highestValue * (100 - percent)) / 100)}
                              </span>
                            </div>
                          )
                        })}

                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: '40px',
                          right: 0,
                          bottom: 0
                        }}>
                          <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
                            <polyline
                              points={activeChartData.map((item, i) => {
                                const x = (i / Math.max(activeChartData.length - 1, 1)) * 400
                                const y = 200 - ((item.total / highestValue) * 200)
                                return `${x},${y}`
                              }).join(' ')}
                              fill="none"
                              stroke="var(--accent)"
                              strokeWidth="3"
                            />
                            {activeChartData.map((item, i) => {
                              const x = (i / Math.max(activeChartData.length - 1, 1)) * 400
                              const y = 200 - ((item.total / highestValue) * 200)
                              return (
                                <circle
                                  key={i}
                                  cx={x}
                                  cy={y}
                                  r="5"
                                  fill="var(--accent)"
                                  stroke="white"
                                  strokeWidth="3"
                                />
                              )
                            })}
                          </svg>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingLeft: '40px'
                      }}>
                        {activeChartData.map((item) => (
                          <span key={item.label} style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
                            {item.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Area Chart */}
                  {chartType === 'area' && (
                    <div>
                      <div style={{
                        position: 'relative',
                        height: '200px',
                        marginBottom: '16px',
                        paddingLeft: '40px'
                      }}>
                        {[0, 1, 2, 3, 4].map((i) => {
                          const percent = i * 25
                          return (
                            <div key={percent} style={{
                              position: 'absolute',
                              bottom: `${percent}%`,
                              left: 0,
                              right: 0,
                              borderTop: '1px dashed var(--border)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <span style={{ fontSize: '11px', color: 'var(--muted)', width: '35px', textAlign: 'right' }}>
                                {Math.round((highestValue * (100 - percent)) / 100)}
                              </span>
                            </div>
                          )
                        })}

                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: '40px',
                          right: 0,
                          bottom: 0
                        }}>
                          <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4"/>
                                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
                              </linearGradient>
                            </defs>
                            <polygon
                              points={`0,200 ${activeChartData.map((item, i) => {
                                const x = (i / Math.max(activeChartData.length - 1, 1)) * 400
                                const y = 200 - ((item.total / highestValue) * 200)
                                return `${x},${y}`
                              }).join(' ')} 400,200`}
                              fill="url(#areaGrad)"
                            />
                            <polyline
                              points={activeChartData.map((item, i) => {
                                const x = (i / Math.max(activeChartData.length - 1, 1)) * 400
                                const y = 200 - ((item.total / highestValue) * 200)
                                return `${x},${y}`
                              }).join(' ')}
                              fill="none"
                              stroke="var(--accent)"
                              strokeWidth="3"
                            />
                            {activeChartData.map((item, i) => {
                              const x = (i / Math.max(activeChartData.length - 1, 1)) * 400
                              const y = 200 - ((item.total / highestValue) * 200)
                              return (
                                <circle
                                  key={i}
                                  cx={x}
                                  cy={y}
                                  r="5"
                                  fill="var(--accent)"
                                  stroke="white"
                                  strokeWidth="3"
                                />
                              )
                            })}
                          </svg>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingLeft: '40px'
                      }}>
                        {activeChartData.map((item) => (
                          <span key={item.label} style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
                            {item.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status Breakdown Pie Chart */}
            <div className="section-card">
              <div className="section-card-header">
                <div className="section-card-title">
                  <i className="fas fa-chart-pie"></i>
                  Status Hewan
                </div>
              </div>
              <div className="section-card-body">
                <div style={{ padding: '22px', display: 'flex', alignItems: 'center', gap: '32px' }}>
                  <div style={{
                    width: '160px',
                    height: '160px',
                    borderRadius: '50%',
                    background: `conic-gradient(
                      ${statusBreakdown.map((item, i) => {
                        const startPercent = statusBreakdown.slice(0, i).reduce((sum, s) => sum + (s.value / totalStatus) * 100, 0)
                        const endPercent = startPercent + (item.value / totalStatus) * 100
                        return `${item.color} ${startPercent}% ${endPercent}%`
                      }).join(', ')}
                    )`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <div style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      background: 'var(--bg-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--fg)' }}>{totalStatus}</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Total Hewan</div>
                    </div>
                  </div>
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {statusBreakdown.map((item) => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: item.color }}></div>
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{item.label}</span>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: item.color }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Animal Types Table */}
          <div className="section-card">
            <div className="section-card-header">
              <div className="section-card-title">
                <i className="fas fa-list"></i>
                Detail Hewan Berdasarkan Jenis
              </div>
            </div>
            <div className="section-card-body">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Jenis Hewan</th>
                      <th>Total</th>
                      <th>Tersedia</th>
                      <th>Diadopsi</th>
                      <th>Perawatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {animalTypes.map((item) => (
                      <tr key={item.type}>
                        <td><strong>{item.type}</strong></td>
                        <td>{item.total}</td>
                        <td><span style={{ color: 'var(--green)', fontWeight: 700 }}>{item.available}</span></td>
                        <td><span style={{ color: 'var(--blue)', fontWeight: 700 }}>{item.adopted}</span></td>
                        <td><span style={{ color: 'var(--amber)', fontWeight: 700 }}>{item.care}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

export default Reports
