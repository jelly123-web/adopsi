import { useCallback, useEffect, useState } from 'react'
import axios from '../utils/api'
import { Link } from 'react-router-dom'
import SuperadminNavbar from '../components/SuperadminNavbar'
import SuperadminSidebar from '../components/SuperadminSidebar'
import MediaAvatar, { DEFAULT_ANIMAL_PHOTO, DEFAULT_USER_PHOTO, pickMedia } from '../components/MediaAvatar'
import { subscribeLiveData } from '../utils/liveDataEvents'

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

const fallbackAnimalTypes = ['Kucing', 'Anjing', 'Kelinci', 'Burung', 'Hamster'].map((type) => ({
  type,
  total: 0,
}))

const ALL_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function getMonthsForRange(range) {
  if (range === '1y') {
    return ALL_MONTHS.map((month) => ({ month, total: 0 }))
  }
  const currentMonthIndex = new Date().getMonth()
  const months = []
  for (let i = 5; i >= 0; i--) {
    const mIdx = (currentMonthIndex - i + 12) % 12
    months.push({ month: ALL_MONTHS[mIdx], total: 0 })
  }
  return months
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


/* â”€â”€ Dashboard Page â”€â”€ */
const getRoleAdoptionPath = (role) => {
  if (role === 'admin') return '/admin/adoptions'
  if (role === 'petugas') return '/petugas/adoptions'
  return '/dashboard/adoptions'
}

const getRequestUserPhoto = (req) => pickMedia(
  req.user_photo,
  req.user_profile_photo,
  req.user_avatar,
  req.customer_photo,
  req.customer_profile_photo,
  req.customer_avatar,
  req.profile_photo,
  req.avatar,
)

const getRequestAnimalPhoto = (req) => pickMedia(
  req.animal_photo,
  req.animal_image,
  req.animal_image_url,
  req.animal_avatar,
  req.photo,
  req.image,
  req.image_url,
)

function formatRequestDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getStatusText(status) {
  if (status === 'disetujui') return 'Disetujui'
  if (status === 'ditolak') return 'Ditolak'
  return 'Menunggu'
}

function getStatusClass(status) {
  if (status === 'disetujui') return 'tag-success'
  if (status === 'ditolak') return 'tag-kitchen'
  return 'tag-muted'
}

function Dashboard() {
  const authRole = localStorage.getItem('authRole') || 'superadmin'
  const [dashboardData, setDashboardData] = useState(defaultDashboardData)
  const [latestRequests, setLatestRequests] = useState([])
  const [chartRange, setChartRange] = useState('6m')
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  )

  const loadDashboard = useCallback(() => {
    axios
      .get(`/superadmin/dashboard?role=${encodeURIComponent(authRole)}`)
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

    axios
      .get('/superadmin/adoption-requests')
      .then((response) => {
        const waitingRequests = (response.data?.data || []).filter((request) =>
          ['pending', 'menunggu', 'Menunggu'].includes(request.status)
        )
        setLatestRequests(waitingRequests.slice(0, 5))
      })
      .catch(() => {
        setLatestRequests([])
      })
  }, [authRole])

  useEffect(() => {
    loadDashboard()
    return subscribeLiveData('dashboard', loadDashboard)
  }, [loadDashboard])

  const { stats, monthlyAdoptions, animalTypes, activities } = dashboardData
  const activityTitle = authRole === 'petugas'
    ? 'Aktivitas Petugas'
    : authRole === 'admin'
      ? 'Lihat Aktivitas Admin'
      : 'Aktivitas Superadmin'
  const baseMonths = getMonthsForRange(chartRange)
  const monthlyByLabel = new Map((monthlyAdoptions || []).map((item) => [String(item.month).trim(), Number(item.total) || 0]))
  const chartMonthlyAdoptions = baseMonths.map((item) => ({
    ...item,
    total: monthlyByLabel.get(item.month) ?? item.total,
  }))
  const chartAnimalTypes = animalTypes.length > 0 ? animalTypes : fallbackAnimalTypes
  const highestMonthly = Math.max(...chartMonthlyAdoptions.map((item) => Number(item.total) || 0), 1)
  const highestAnimalType = Math.max(...chartAnimalTypes.map((item) => Number(item.total) || 0), 1)
  const adoptionPath = getRoleAdoptionPath(authRole)

  return (
    <div className="dashboard-layout">
      <SuperadminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className={`main-content ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
        <SuperadminNavbar
          pageTitle="Dashboard"
          sidebarOpen={sidebarOpen}
          offsetForSidebar={false}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />

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
                  <button type="button" className={`filter-pill ${chartRange === '6m' ? 'active' : ''}`} onClick={() => setChartRange('6m')}>6 Bulan</button>
                  <button type="button" className={`filter-pill ${chartRange === '1y' ? 'active' : ''}`} onClick={() => setChartRange('1y')}>1 Tahun</button>
                </div>
              </div>
              <div className="section-card-body">
                <div style={{ padding: '22px', overflowX: 'auto' }}>
                  <div
                    style={{
                      minWidth: `${Math.max(chartMonthlyAdoptions.length * 88, 100)}px`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'stretch',
                      height: '190px',
                      gap: '12px',
                      paddingBottom: '6px',
                    }}
                  >
                    {chartMonthlyAdoptions.map((item, index) => {
                      const total = Number(item.total) || 0
                      const barHeight = total > 0 ? Math.max((total / highestMonthly) * 100, 15) : 12
                      return (
                        <div
                          key={`${item.month}-${index}`}
                          style={{
                            flex: '0 0 76px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            height: '100%',
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#334155', marginBottom: '6px' }}>{total}</div>
                          <div style={{ flex: 1, width: '100%', maxWidth: '38px', background: '#f1f5f9', borderRadius: '8px 8px 0 0', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', border: '1px solid #e2e8f0' }}>
                            <div style={{
                              width: '100%',
                              height: `${barHeight}%`,
                              background: total > 0 ? 'linear-gradient(180deg, #0ea5e9 0%, #2563eb 100%)' : 'linear-gradient(180deg, #38bdf8 0%, #60a5fa 100%)',
                              borderRadius: '6px 6px 0 0',
                              transition: 'height 0.6s ease'
                            }}></div>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '8px' }}>{item.month}</div>
                        </div>
                      )
                    })}
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
                  {chartAnimalTypes.map((item) => {
                    const total = Number(item.total) || 0
                    const width = total > 0 ? Math.max((total / highestAnimalType) * 100, 8) : 5
                    return (
                      <div key={item.type} style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ fontWeight: 600 }}>{item.type}</span>
                          <span style={{ fontWeight: 700 }}>{total}</span>
                        </div>
                        <div style={{ height: '8px', background: '#eef2f7', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${width}%`,
                            background: total > 0 ? 'linear-gradient(90deg, #10b981 0%, #14b8a6 100%)' : 'linear-gradient(90deg, #ccfbf1 0%, #dbeafe 100%)',
                            borderRadius: '4px',
                            transition: 'width 0.6s ease'
                          }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="section-card dashboard-adoption-requests">
            <div className="section-card-header">
              <div className="section-card-title">
                <i className="fas fa-file-signature"></i>
                Orang yang Mau Adopsi
              </div>
              <Link to={adoptionPath} className="section-card-link">
                Lihat Semua <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
            <div className="section-card-body">
              {latestRequests.length === 0 ? (
                <div className="dashboard-empty-state">Belum ada pengajuan adopsi masuk.</div>
              ) : (
                <div className="dashboard-request-list">
                  {latestRequests.map((request) => (
                    <Link to={adoptionPath} className="dashboard-request-item" key={request.id}>
                      <div className="dashboard-request-person">
                        <MediaAvatar
                          src={getRequestUserPhoto(request)}
                          fallbackSrc={DEFAULT_USER_PHOTO}
                          alt={request.user_name || request.full_name || 'Customer'}
                        />
                        <div>
                          <strong>{request.user_name || request.full_name || 'Customer'}</strong>
                          <span>{request.user_email || request.phone || 'Customer adopsi'}</span>
                        </div>
                      </div>
                      <div className="dashboard-request-animal">
                        <MediaAvatar
                          src={getRequestAnimalPhoto(request)}
                          fallbackSrc={DEFAULT_ANIMAL_PHOTO}
                          alt={request.animal_name || 'Hewan'}
                        />
                        <div>
                          <strong>{request.animal_name || 'Hewan'}</strong>
                          <span>{request.animal_species || 'Hewan adopsi'}</span>
                        </div>
                      </div>
                      <span className={`tag ${getStatusClass(request.status)}`}>
                        <span className="status-dot"></span>
                        {getStatusText(request.status)}
                      </span>
                      <span className="dashboard-request-date">{formatRequestDate(request.created_at)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Activity List */}
          <div className="section-card">
            <div className="section-card-header">
              <div className="section-card-title">
                <i className="fas fa-history"></i>
                {activityTitle}
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
