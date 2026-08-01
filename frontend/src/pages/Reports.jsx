import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import SuperadminNavbar from '../components/SuperadminNavbar'
import SuperadminSidebar from '../components/SuperadminSidebar'
import { publishLiveData } from '../utils/liveDataEvents'

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
  const [backupLoading, setBackupLoading] = useState(false)
  const role = localStorage.getItem('authRole') || 'superadmin'

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
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const currentYear = new Date().getFullYear()
  const monthlyTotals = new Map((monthlyAdoptions || []).map((item) => [item.month, Number(item.total) || 0]))
  const yearlyTotals = new Map((yearlyAdoptions || []).map((item) => [String(item.year), Number(item.total) || 0]))
  const normalizedMonthlyAdoptions = monthLabels.map((month) => ({
    month,
    total: monthlyTotals.get(month) || 0,
  }))
  const normalizedYearlyAdoptions = Array.from({ length: 5 }, (_, index) => {
    const year = String(currentYear - 4 + index)
    return {
      year,
      total: yearlyTotals.get(year) || 0,
    }
  })
  const activeChartData = reportType === 'bulanan' 
    ? normalizedMonthlyAdoptions.map(item => ({ label: item.month, total: Number(item.total) || 0 }))
    : normalizedYearlyAdoptions.map(item => ({ label: item.year, total: Number(item.total) || 0 }))
  const normalizedStatusBreakdown = statusBreakdown.length
    ? statusBreakdown
    : [
      { label: 'Tersedia', value: 0, color: '#059669' },
      { label: 'Diadopsi', value: 0, color: '#2563eb' },
      { label: 'Perawatan', value: 0, color: '#f59e0b' },
    ]

  const hasChartData = activeChartData.length > 0
  const highestValue = Math.max(...activeChartData.map((item) => item.total), 1)
  const chartTotal = activeChartData.reduce((sum, item) => sum + item.total, 0)
  const totalStatus = normalizedStatusBreakdown.reduce((sum, item) => sum + (Number(item.value) || 0), 0)
  const chartStatusTotal = Math.max(totalStatus, 1)

  const publishImportedData = () => {
    ;['settings', 'users', 'customers', 'animals', 'categories', 'adoptions'].forEach((scope) => {
      publishLiveData(scope, { source: 'backup-import' })
    })
  }

  const handleExportBackup = async () => {
    setBackupLoading(true)
    try {
      const response = await axios.get('http://localhost:3000/api/superadmin/backup/export', {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `backup-adopsi-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } finally {
      setBackupLoading(false)
    }
  }

  const handleImportBackup = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setBackupLoading(true)
    try {
      const text = await file.text()
      const payload = JSON.parse(text)
      await axios.post('http://localhost:3000/api/superadmin/backup/import', payload)
      publishImportedData()
      const response = await axios.get('http://localhost:3000/api/superadmin/reports')
      const data = response.data?.data || {}
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
      alert('Import backup berhasil. Data halaman lain akan ikut berubah otomatis.')
    } catch (error) {
      alert(error.response?.data?.message || 'Import backup gagal. Pastikan file JSON backup benar.')
    } finally {
      setBackupLoading(false)
    }
  }

  return (
    <div className="dashboard-layout">
      <SuperadminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className={`main-content ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
        <SuperadminNavbar
          pageTitle="Laporan Transaksi"
          statusLabel="LIVE REPORT"
          sidebarOpen={sidebarOpen}
          offsetForSidebar={false}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />

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

          {(role === 'superadmin' || role === 'admin') && (
            <div className="section-card" style={{ marginBottom: '24px' }}>
              <div className="section-card-header">
                <div className="section-card-title">
                  <i className="fas fa-save"></i>
                  Import & Backup Data Hewan / User
                </div>
                <div className="filter-pills">
                  <button
                    type="button"
                    className="filter-pill active"
                    onClick={handleExportBackup}
                    disabled={backupLoading}
                  >
                    <i className="fas fa-file-export"></i> Backup JSON
                  </button>
                  <label className="filter-pill" style={{ cursor: backupLoading ? 'not-allowed' : 'pointer' }}>
                    <i className="fas fa-file-import"></i> Import JSON
                    <input
                      type="file"
                      accept="application/json,.json"
                      onChange={handleImportBackup}
                      disabled={backupLoading}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>
              <div className="section-card-body">
                <div style={{ padding: '18px 22px', color: 'var(--muted)', fontSize: '13px', fontWeight: 700 }}>
                  Backup menyimpan data aplikasi dari database. Import memakai mode update, jadi data dengan ID sama akan diperbarui.
                </div>
              </div>
            </div>
          )}

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
                  Laporan Transaksi {reportType === 'bulanan' ? 'Bulanan' : 'Tahunan'}
                </div>
                <div className="filter-pills" style={{ gap: '8px' }}>
                  <button 
                    className={`filter-pill ${reportType === 'bulanan' ? 'active' : ''}`}
                    onClick={() => setReportType('bulanan')}
                    type="button"
                  >Bulanan</button>
                  <button 
                    className={`filter-pill ${reportType === 'tahunan' ? 'active' : ''}`}
                    onClick={() => setReportType('tahunan')}
                    type="button"
                  >Tahunan</button>
                  <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }}></div>
                  <button 
                    className={`filter-pill ${chartType === 'bar' ? 'active' : ''}`}
                    onClick={() => setChartType('bar')}
                    title="Grafik Batang (Bar)"
                    type="button"
                  ><i className="fas fa-chart-bar"></i></button>
                  <button 
                    className={`filter-pill ${chartType === 'line' ? 'active' : ''}`}
                    onClick={() => setChartType('line')}
                    title="Grafik Garis (Line)"
                    type="button"
                  ><i className="fas fa-chart-line"></i></button>
                  <button 
                    className={`filter-pill ${chartType === 'area' ? 'active' : ''}`}
                    onClick={() => setChartType('area')}
                    title="Grafik Area"
                    type="button"
                  ><i className="fas fa-chart-area"></i></button>
                </div>
              </div>

              <div className="section-card-body">
                <div style={{ padding: '22px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '14px',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700 }}>
                        Total transaksi {reportType === 'bulanan' ? currentYear : `${currentYear - 4}-${currentYear}`}
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--fg)' }}>
                        {chartTotal}
                      </div>
                    </div>
                    <span className="status-badge info">
                      <span className="status-dot"></span>
                      {chartType === 'bar' ? 'Diagram Batang' : chartType === 'line' ? 'Diagram Garis' : 'Diagram Area'}
                    </span>
                  </div>

                  {/* Bar Chart */}
                  {chartType === 'bar' && (
                    <div style={{
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: '20px',
                      padding: '18px',
                      minHeight: '240px',
                    }}>
                      {hasChartData ? (
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
                              gap: '8px',
                              minWidth: '48px'
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
                                  minHeight: '24px',
                                  height: `${item.total > 0 ? (item.total / highestValue) * 100 : 12}%`,
                                  background: item.total > 0
                                    ? 'linear-gradient(180deg, var(--accent) 0%, var(--accent-dark) 100%)'
                                    : 'linear-gradient(180deg, rgba(14, 165, 233, 0.42) 0%, rgba(59, 130, 246, 0.22) 100%)',
                                  borderRadius: '8px 8px 0 0',
                                  transition: 'all 0.6s ease'
                                }}></div>
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>{item.label}</div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Line Chart */}
                  {chartType === 'line' && (
                    <div>
                      {hasChartData && (
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
                                  const y = 184 - ((item.total / highestValue) * 168)
                                  return `${x},${y}`
                                }).join(' ')}
                                fill="none"
                                stroke="var(--accent)"
                                strokeWidth="3"
                              />
                              {activeChartData.map((item, i) => {
                                const x = (i / Math.max(activeChartData.length - 1, 1)) * 400
                                const y = 184 - ((item.total / highestValue) * 168)
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
                      )}

                      {hasChartData && (
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
                      )}
                    </div>
                  )}

                  {/* Area Chart */}
                  {chartType === 'area' && (
                    <div>
                      {hasChartData && (
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
                                  const y = 184 - ((item.total / highestValue) * 168)
                                  return `${x},${y}`
                                }).join(' ')} 400,200`}
                                fill="url(#areaGrad)"
                              />
                              <polyline
                                points={activeChartData.map((item, i) => {
                                  const x = (i / Math.max(activeChartData.length - 1, 1)) * 400
                                  const y = 184 - ((item.total / highestValue) * 168)
                                  return `${x},${y}`
                                }).join(' ')}
                                fill="none"
                                stroke="var(--accent)"
                                strokeWidth="3"
                              />
                              {activeChartData.map((item, i) => {
                                const x = (i / Math.max(activeChartData.length - 1, 1)) * 400
                                const y = 184 - ((item.total / highestValue) * 168)
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
                      )}

                      {hasChartData && (
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
                      )}
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
                  {(() => {
                    const statusColors = { Tersedia: '#10b981', Diadopsi: '#3b82f6', Perawatan: '#f59e0b' }
                    const R = 56
                    const SW = 16
                    const C = 2 * Math.PI * R
                    const segments = []
                    let acc = 0
                    for (const item of normalizedStatusBreakdown) {
                      const v = Number(item.value) || 0
                      if (v > 0 && totalStatus > 0) {
                        segments.push({
                          label: item.label,
                          color: item.color || statusColors[item.label] || '#94a3b8',
                          len: (v / totalStatus) * C,
                          offset: acc
                        })
                        acc += (v / totalStatus) * C
                      }
                    }

                    return (
                      <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
                        <svg width="140" height="140" viewBox="0 0 140 140" style={{ display: 'block' }}>
                          <circle cx="70" cy="70" r={R} fill="none" stroke="#e2e8f0" strokeWidth={SW} />
                          {segments.map((seg) => (
                            <circle
                              key={seg.label}
                              cx="70" cy="70" r={R}
                              fill="none"
                              stroke={seg.color}
                              strokeWidth={SW}
                              strokeDasharray={`${seg.len} ${C - seg.len}`}
                              strokeDashoffset={C * 0.25 - seg.offset}
                            />
                          ))}
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                          <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--fg)' }}>{totalStatus}</span>
                          <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>Total Hewan</span>
                        </div>
                      </div>
                    )
                  })()}
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {normalizedStatusBreakdown.map((item) => (
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
