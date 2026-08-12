import { Component, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import axios from './utils/api'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register.jsx'
import Home from './pages/Home'
import ManageUsers from './pages/ManageUsers'
import ManageAnimals from './pages/ManageAnimals'
import ManageCategories from './pages/ManageCategories'
import ManageAdoptions from './pages/ManageAdoptions'
import VerifyAdoptions from './pages/VerifyAdoptions'
import DataCustomers from './pages/DataCustomers'
import Reports from './pages/Reports'
import PengaturanSistem from './pages/PengaturanSistem'
import Profile from './pages/Profile'
import Restore from './pages/Restore'
import HistoryLogs from './pages/HistoryLogs'
import HakAkses from './pages/HakAkses'
import PetugasChat from './pages/PetugasChat'
import PetugasVisits from './pages/PetugasVisits'
import CustomerDashboard from './pages/CustomerDashboard'
import CustomerAnimals from './pages/CustomerAnimals'
import CustomerAdoption from './pages/CustomerAdoption'
import CustomerStatus from './pages/CustomerStatus'
import CustomerChat from './pages/CustomerChat'
import './App.css'

const adminNavTargets = new Map([
  ['Dashboard', '/admin/dashboard'],
  ['Kelola Hewan', '/admin/animals'],
  ['Kelola Kategori', '/admin/categories'],
  ['Kelola Pengajuan Adopsi', '/admin/adoptions'],
  ['Verifikasi Adopsi', '/admin/adoptions/verify'],
  ['Data Customer', '/admin/customers'],
  ['Chat Customer', '/admin/chat'],
  ['Jadwal Kunjungan', '/admin/visits'],
  ['Laporan', '/admin/reports'],
])

const petugasNavTargets = new Map([
  ['Dashboard', '/petugas/dashboard'],
  ['Data Hewan', '/petugas/animals'],
  ['Kelola Hewan', '/petugas/animals'],
  ['Kelola Pengajuan Adopsi', '/petugas/adoptions'],
  ['Chat Customer', '/petugas/chat'],
  ['Jadwal Kunjungan', '/petugas/visits'],
])

const customerNavTargets = new Map([
  ['Dashboard', '/customer/dashboard'],
  ['Jelajahi Hewan', '/customer/animals'],
  ['Pengajuan Adopsi', '/customer/adoptions'],
  ['Status Pengajuan', '/customer/status'],
  ['Chat Petugas & Admin', '/customer/chat'],
  ['Chat Petugas', '/customer/chat'],
])

const defaultAppSettings = {
  nama_apk: 'Adopsi Hewan',
  warna_apk: '#0EA5E9',
  logo_apk: 'A',
  dashboard_bg_apk: '',
  adoption_location: 'Shelter Sahabat Kecil',
}

const isVideoMedia = (value = '') => value.startsWith('data:video') || /\.(mp4|webm|ogg)(\?|#|$)/i.test(value)

function applySettingsToDocument(settingsInput = {}) {
  const settings = { ...defaultAppSettings, ...settingsInput }
  const root = document.documentElement
  const logoIsImage = settings.logo_apk?.startsWith?.('data:image')
  const logoIsVideo = isVideoMedia(settings.logo_apk)
  const logoText = logoIsImage ? '' : (settings.logo_apk || settings.nama_apk.charAt(0)).slice(0, 3)

  root.style.setProperty('--accent', settings.warna_apk || '#0EA5E9')
  root.style.setProperty('--app-accent', settings.warna_apk || '#0EA5E9')
  root.style.setProperty('--brand-blue', settings.warna_apk || '#0EA5E9')
  document.title = settings.nama_apk || defaultAppSettings.nama_apk

  document.querySelectorAll('.dashboard-bg-video').forEach((node) => node.remove())

  if (settings.dashboard_bg_apk && isVideoMedia(settings.dashboard_bg_apk)) {
    root.style.removeProperty('--dashboard-bg-image')
    const video = document.createElement('video')
    video.className = 'dashboard-bg-video'
    video.src = settings.dashboard_bg_apk
    video.autoplay = true
    video.muted = true
    video.loop = true
    video.playsInline = true
    document.body.prepend(video)
    document.body.classList.add('has-dashboard-bg', 'has-dashboard-video')
  } else if (settings.dashboard_bg_apk) {
    root.style.setProperty('--dashboard-bg-image', `url("${settings.dashboard_bg_apk}")`)
    document.body.classList.add('has-dashboard-bg')
    document.body.classList.remove('has-dashboard-video')
  } else {
    root.style.removeProperty('--dashboard-bg-image')
    document.body.classList.remove('has-dashboard-bg', 'has-dashboard-video')
  }

  document.querySelectorAll('.sidebar-brand-name').forEach((node) => {
    node.textContent = settings.nama_apk || defaultAppSettings.nama_apk
  })

  document.querySelectorAll('.sidebar-logo').forEach((node) => {
    node.classList.toggle('has-image', Boolean(logoIsImage || logoIsVideo))
    if (logoIsImage) {
      node.innerHTML = `<img src="${settings.logo_apk}" alt="" />`
    } else if (logoIsVideo) {
      node.innerHTML = `<video src="${settings.logo_apk}" autoplay muted loop playsinline></video>`
    } else {
      node.textContent = logoText
    }
  })

  applyRoleNavigation()
}

function applyRoleNavigation() {
  const role = localStorage.getItem('authRole')
  const isSuperadmin = role === 'superadmin'

  document.querySelectorAll('.topbar-btn, .icon-button').forEach((node) => {
    const isSettingsButton =
      node.getAttribute('href') === '/dashboard/settings' ||
      node.getAttribute('title') === 'Pengaturan Sistem' ||
      node.getAttribute('aria-label') === 'Pengaturan' ||
      Boolean(node.querySelector?.('.fa-cog'))

    if (isSettingsButton) {
      node.style.display = isSuperadmin ? '' : 'none'
    }
  })

  if (role === 'admin' || role === 'petugas' || role === 'costumer') {
    const roleTargets = role === 'admin' ? adminNavTargets : role === 'petugas' ? petugasNavTargets : customerNavTargets
    const roleLabel = role === 'admin' ? 'Admin' : role === 'petugas' ? 'Petugas' : 'Customer'

    document.querySelectorAll('.sidebar-brand-role').forEach((node) => {
      node.textContent = roleLabel
    })

    document.querySelectorAll('.sidebar-user-name').forEach((node) => {
      node.textContent = localStorage.getItem('authName') || roleLabel
    })

    document.querySelectorAll('.sidebar-user-email').forEach((node) => {
      node.textContent = localStorage.getItem('authEmail') || (role === 'admin' ? 'admin@gmail.com' : role === 'petugas' ? 'petugas@gmail.com' : 'customer@gmail.com')
    })

    document.querySelectorAll('.sidebar-user').forEach((node) => {
      node.setAttribute('href', role === 'admin' ? '/admin/profile' : role === 'petugas' ? '/petugas/profile' : '/profile')
      node.style.pointerEvents = ''
    })

    document.querySelectorAll('.sidebar-nav .nav-item').forEach((node) => {
      const labelNode = node.querySelector('span')
      const label = labelNode?.textContent?.trim()
      const targetPath = roleTargets.get(label)
      if (!targetPath) {
        node.style.display = 'none'
        return
      }

      node.style.display = ''
      node.setAttribute('href', targetPath)
      if (role === 'petugas' && label === 'Kelola Hewan') {
        labelNode.textContent = 'Data Hewan'
      }
      node.classList.toggle('active', window.location.pathname === targetPath)
    })
  }
}

function AppSettingsBridge() {
  const location = useLocation()

  useEffect(() => {
    let alive = true
    const cachedSettings = localStorage.getItem('appSettings')
    if (cachedSettings) {
      try {
        applySettingsToDocument(JSON.parse(cachedSettings))
      } catch {
        localStorage.removeItem('appSettings')
      }
    }

    axios.get('/superadmin/settings')
      .then((payload) => {
        if (!alive) return
        const settings = payload.data?.data || {}
        localStorage.setItem('appSettings', JSON.stringify(settings))
        applySettingsToDocument(settings)
      })
      .catch(() => {
        document.body.classList.remove('has-dashboard-bg')
      })

    const handleSettingsUpdated = (event) => {
      const settings = event.detail || {}
      localStorage.setItem('appSettings', JSON.stringify(settings))
      applySettingsToDocument(settings)
    }

    const handleStorage = (event) => {
      if (event.key !== 'appSettings' || !event.newValue) return
      try {
        applySettingsToDocument(JSON.parse(event.newValue))
      } catch {
        localStorage.removeItem('appSettings')
      }
    }

    window.addEventListener('app-settings-updated', handleSettingsUpdated)
    window.addEventListener('storage', handleStorage)

    return () => {
      alive = false
      window.removeEventListener('app-settings-updated', handleSettingsUpdated)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  useEffect(() => {
    const cachedSettings = localStorage.getItem('appSettings')
    window.requestAnimationFrame(() => {
      applyRoleNavigation()
      if (!cachedSettings) return

      try {
        applySettingsToDocument(JSON.parse(cachedSettings))
      } catch {
        localStorage.removeItem('appSettings')
      }
    })
  }, [location.pathname])

  return null
}

class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="route-error">
          <h1>Halaman gagal dimuat</h1>
          <p>{this.state.error.message}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Muat Ulang
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

function RouteErrorBoundaryWithLocation({ children }) {
  const location = useLocation()
  return <RouteErrorBoundary resetKey={location.pathname}>{children}</RouteErrorBoundary>
}

function InternalLinkInterceptor() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleClick = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }

      const link = event.target.closest?.('a[href]')
      if (!link || link.target || link.hasAttribute('download')) return

      const navItem = link.classList.contains('nav-item') ? link : link.closest?.('.nav-item')
      const navLabel = navItem?.querySelector('span')?.textContent?.trim()
      const role = localStorage.getItem('authRole')
      const adminTarget = role === 'admin' ? adminNavTargets.get(navLabel) : null
      const petugasTarget = role === 'petugas' ? petugasNavTargets.get(navLabel) : null
      const customerTarget = role === 'costumer' ? customerNavTargets.get(navLabel) : null
      const roleTarget = adminTarget || petugasTarget || customerTarget

      if (roleTarget) {
        event.preventDefault()
        applyRoleNavigation()
        if (window.location.pathname !== roleTarget) {
          navigate(roleTarget)
        }
        return
      }

      const url = new URL(link.href, window.location.origin)
        const isInternalDashboard = url.origin === window.location.origin && (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/admin') || url.pathname.startsWith('/petugas') || url.pathname.startsWith('/customer') || url.pathname === '/profile')
      const isAuthPage = url.origin === window.location.origin && ['/login', '/register', '/home'].includes(url.pathname)

      if (isInternalDashboard || isAuthPage) {
        event.preventDefault()
        navigate(`${url.pathname}${url.search}${url.hash}`)
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [navigate])

  return null
}

function RequireRole({ roles, children }) {
  const role = localStorage.getItem('authRole')

  if (!role) {
    return <Navigate to="/login" replace />
  }

  if (!roles.includes(role)) {
    return <Navigate to={role === 'admin' ? '/admin' : role === 'petugas' ? '/petugas' : role === 'costumer' ? '/customer' : '/login'} replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <RouteErrorBoundaryWithLocation>
        <AppSettingsBridge />
        <InternalLinkInterceptor />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<RequireRole roles={['costumer', 'superadmin', 'admin', 'petugas']}><Profile /></RequireRole>} />
          <Route path="/customer" element={<RequireRole roles={['costumer']}><Navigate to="/customer/dashboard" replace /></RequireRole>} />
          <Route path="/customer/dashboard" element={<RequireRole roles={['costumer']}><CustomerDashboard /></RequireRole>} />
          <Route path="/customer/animals" element={<RequireRole roles={['costumer']}><CustomerAnimals /></RequireRole>} />
          <Route path="/customer/adoptions" element={<RequireRole roles={['costumer']}><CustomerAdoption /></RequireRole>} />
          <Route path="/customer/status" element={<RequireRole roles={['costumer']}><CustomerStatus /></RequireRole>} />
          <Route path="/customer/chat" element={<RequireRole roles={['costumer']}><CustomerChat /></RequireRole>} />
          <Route path="/admin" element={<RequireRole roles={['admin']}><Navigate to="/admin/dashboard" replace /></RequireRole>} />
          <Route path="/admin/dashboard" element={<RequireRole roles={['admin']}><Dashboard /></RequireRole>} />
          <Route path="/admin/animals" element={<RequireRole roles={['admin']}><ManageAnimals /></RequireRole>} />
          <Route path="/admin/categories" element={<RequireRole roles={['admin']}><ManageCategories /></RequireRole>} />
          <Route path="/admin/adoptions" element={<RequireRole roles={['admin']}><ManageAdoptions /></RequireRole>} />
          <Route path="/admin/adoptions/verify" element={<RequireRole roles={['admin']}><VerifyAdoptions /></RequireRole>} />
          <Route path="/admin/customers" element={<RequireRole roles={['admin']}><DataCustomers /></RequireRole>} />
          <Route path="/admin/chat" element={<RequireRole roles={['admin']}><PetugasChat /></RequireRole>} />
          <Route path="/admin/visits" element={<RequireRole roles={['admin']}><PetugasVisits /></RequireRole>} />
          <Route path="/admin/reports" element={<RequireRole roles={['admin']}><Reports /></RequireRole>} />
          <Route path="/admin/profile" element={<RequireRole roles={['admin']}><Profile /></RequireRole>} />
          <Route path="/petugas" element={<RequireRole roles={['petugas']}><Navigate to="/petugas/dashboard" replace /></RequireRole>} />
          <Route path="/petugas/dashboard" element={<RequireRole roles={['petugas']}><Dashboard /></RequireRole>} />
          <Route path="/petugas/animals" element={<RequireRole roles={['petugas']}><ManageAnimals /></RequireRole>} />
          <Route path="/petugas/animals/add" element={<RequireRole roles={['petugas']}><ManageAnimals /></RequireRole>} />
          <Route path="/petugas/animals/update" element={<RequireRole roles={['petugas']}><ManageAnimals /></RequireRole>} />
          <Route path="/petugas/adoptions" element={<RequireRole roles={['petugas']}><ManageAdoptions /></RequireRole>} />
          <Route path="/petugas/chat" element={<RequireRole roles={['petugas']}><PetugasChat /></RequireRole>} />
          <Route path="/petugas/visits" element={<RequireRole roles={['petugas']}><PetugasVisits /></RequireRole>} />
          <Route path="/petugas/profile" element={<RequireRole roles={['petugas']}><Profile /></RequireRole>} />
          <Route path="/dashboard" element={<RequireRole roles={['superadmin']}><Dashboard /></RequireRole>} />
          <Route path="/dashboard/users" element={<RequireRole roles={['superadmin']}><ManageUsers /></RequireRole>} />
          <Route path="/dashboard/categories" element={<RequireRole roles={['superadmin']}><ManageCategories /></RequireRole>} />
          <Route path="/dashboard/animals" element={<RequireRole roles={['superadmin']}><ManageAnimals /></RequireRole>} />
          <Route path="/dashboard/adoptions" element={<RequireRole roles={['superadmin']}><ManageAdoptions /></RequireRole>} />
          <Route path="/dashboard/adoptions/verify" element={<RequireRole roles={['superadmin']}><VerifyAdoptions /></RequireRole>} />
          <Route path="/dashboard/customers" element={<RequireRole roles={['superadmin']}><DataCustomers /></RequireRole>} />
          <Route path="/dashboard/chat" element={<RequireRole roles={['superadmin']}><PetugasChat /></RequireRole>} />
          <Route path="/dashboard/reports" element={<RequireRole roles={['superadmin']}><Reports /></RequireRole>} />
          <Route path="/dashboard/logs" element={<RequireRole roles={['superadmin']}><HistoryLogs /></RequireRole>} />
          <Route path="/dashboard/settings" element={<RequireRole roles={['superadmin']}><PengaturanSistem /></RequireRole>} />
          <Route path="/dashboard/permissions" element={<RequireRole roles={['superadmin']}><HakAkses /></RequireRole>} />
          <Route path="/dashboard/profile" element={<RequireRole roles={['superadmin']}><Profile /></RequireRole>} />
          <Route path="/dashboard/questionnaire-character" element={<RequireRole roles={['superadmin']}><Navigate to="/dashboard" replace /></RequireRole>} />
          <Route path="/dashboard/restore" element={<RequireRole roles={['superadmin']}><Restore /></RequireRole>} />
        </Routes>
      </RouteErrorBoundaryWithLocation>
    </BrowserRouter>
  )
}

export default App
