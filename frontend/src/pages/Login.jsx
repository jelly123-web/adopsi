import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api'
const defaultAppSettings = {
  nama_apk: 'Sahabat Kecil',
  warna_apk: '#60a5fa',
  logo_apk: '',
  hero_bg_apk: '',
  login_hero_title: 'Setiap Hewan\nLayak\nDicintai',
  login_hero_title_1: 'Setiap Hewan',
  login_hero_title_2: 'Layak',
  login_hero_highlight: 'Dicintai',
  login_hero_description: 'Jangan beli, adopsi. Berikan mereka kesempatan kedua untuk merasakan kehangatan keluarga.',
  login_hero_badge_text: 'hewan sedang menunggu rumah baru',
  login_hero_primary_button: 'Masuk & Adopsi',
  login_hero_secondary_button: 'Jelajahi',
}

const isVideoMedia = (value = '') => value.startsWith('data:video') || /\.(mp4|webm|ogg)(\?|#|$)/i.test(value)

function formatAnimalStatus(status = '') {
  const normalized = status.toLowerCase()
  if (normalized === 'diadopsi') return 'Diadopsi'
  if (normalized === 'perawatan') return 'Perawatan'
  return 'Tersedia'
}

function animalStatusTone(status = '') {
  const normalized = status.toLowerCase()
  if (normalized === 'diadopsi') return 'blue'
  if (normalized === 'perawatan') return 'amber'
  return 'green'
}

function formatAnimalAge(age) {
  const numericAge = Number(age)
  if (!Number.isFinite(numericAge)) return '-'
  return `${numericAge} tahun`
}

function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  const paths = {
    paw: (
      <>
        <circle cx="5.5" cy="10" r="2.3" fill="currentColor" stroke="none" />
        <circle cx="10" cy="6.3" r="2.3" fill="currentColor" stroke="none" />
        <circle cx="14" cy="6.3" r="2.3" fill="currentColor" stroke="none" />
        <circle cx="18.5" cy="10" r="2.3" fill="currentColor" stroke="none" />
        <path d="M7.5 17.2c0-3 2.1-5.2 4.5-5.2s4.5 2.2 4.5 5.2c0 2.2-1.5 3.4-3.1 2.7a3.4 3.4 0 0 0-2.8 0c-1.6.7-3.1-.5-3.1-2.7z" fill="currentColor" stroke="none" />
      </>
    ),
    login: <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />,
    x: <path d="M18 6 6 18M6 6l12 12" />,
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    eyeOff: (
      <>
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6A3 3 0 0 0 13.4 13.4" />
        <path d="M9.9 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a18.5 18.5 0 0 1-3.2 4.1" />
        <path d="M6.2 6.9C3.4 8.8 2 12 2 12s3.5 7 10 7c1.2 0 2.3-.2 3.3-.6" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V8a4 4 0 0 1 8 0v2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    chevronLeft: <path d="m15 18-6-6 6-6" />,
    chevronRight: <path d="m9 18 6-6-6-6" />,
    heart: <path d="M20.8 8.6c0 5.4-8.8 10.2-8.8 10.2S3.2 14 3.2 8.6A4.6 4.6 0 0 1 12 6.7a4.6 4.6 0 0 1 8.8 1.9z" fill="currentColor" />,
    heartOutline: <path d="M20.8 8.6c0 5.4-8.8 10.2-8.8 10.2S3.2 14 3.2 8.6A4.6 4.6 0 0 1 12 6.7a4.6 4.6 0 0 1 8.8 1.9z" />,
    fire: <path d="M8.5 14.5c0 2 1.6 3.5 3.5 3.5s3.5-1.5 3.5-3.5c0-2.5-2.2-3.4-2.8-5.8-1.2.8-1.9 2-1.8 3.5-1.2-.6-1.8-1.7-1.7-3-1.6 1.4-2.7 3-2.7 5.3z" />,
    plus: <path d="M12 5v14M5 12h14" />,
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </>
    ),
    userSearch: <path d="M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a8 8 0 0 1 13.3-6M21 21l-3-3M17 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />,
    doc: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h6" />,
    homeHeart: <path d="M3 11 12 4l9 7M5 10v10h14V10M12 18s-3-1.7-3-4a2 2 0 0 1 3-1.4A2 2 0 0 1 15 14c0 2.3-3 4-3 4z" />,
    rocket: <path d="M5 14c-1.4 1.2-2 3-2 6 3 0 4.8-.6 6-2M14 5l5 5M9 15l-2-2c2-5.5 6-9 13-10-1 7-4.5 11-10 13l-1-1zM15 9h.01" />,
    shield: <path d="M12 3 5 6v5c0 4.5 3 8.4 7 10 4-1.6 7-5.5 7-10V6l-7-3zM9.5 12l1.7 1.7 3.8-4" />,
    bone: <path d="M7.5 8.5a3 3 0 1 1 4-4l8 8a3 3 0 1 1-4 4l-8-8zM6 7a2.5 2.5 0 1 0-2 4M18 13a2.5 2.5 0 1 1 4 2" />,
    dog: (
      <>
        <path d="M7 11.5c0-3 2.1-5.2 5-5.2s5 2.2 5 5.2v2.2c0 3.1-2.1 5-5 5s-5-1.9-5-5v-2.2z" fill="#f59e0b" stroke="none" />
        <path d="M7.7 8.8 4.4 6.7c-.6-.4-1.3.1-1.2.8l.7 4.1c.1.7.9 1 1.5.6l2.3-1.7" fill="#f59e0b" stroke="none" />
        <path d="M16.3 8.8 19.6 6.7c.6-.4 1.3.1 1.2.8l-.7 4.1c-.1.7-.9 1-1.5.6l-2.3-1.7" fill="#f59e0b" stroke="none" />
        <circle cx="10" cy="12" r="1" fill="#fff" stroke="none" />
        <circle cx="14" cy="12" r="1" fill="#fff" stroke="none" />
        <path d="M11.3 14.3h1.4M12 14.3v1.3M10.5 16.1c.8.7 2.2.7 3 0" stroke="#fff" strokeWidth="1.7" />
        <path d="M17 14c2.5.2 3.7 1.2 3.9 2.9" stroke="#f59e0b" strokeWidth="2.2" />
      </>
    ),
    instagram: <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zM8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0zM17.5 6.5h.01" />,
    twitter: <path d="M22 5.8c-.7.3-1.4.5-2.2.6.8-.5 1.3-1.2 1.6-2.1-.7.4-1.6.8-2.4.9A3.7 3.7 0 0 0 12.7 8c0 .3 0 .6.1.8A10.5 10.5 0 0 1 5.2 5s-4 9 5 13a11 11 0 0 1-6.6 1.8c9 5 18.6 0 18.6-10.8v-.5c.7-.5 1.3-1.1 1.8-1.7z" />,
    youtube: <path d="M22 12s0-3.4-.4-5a2.8 2.8 0 0 0-2-2C17.9 4.5 12 4.5 12 4.5s-5.9 0-7.6.5a2.8 2.8 0 0 0-2 2C2 8.6 2 12 2 12s0 3.4.4 5a2.8 2.8 0 0 0 2 2c1.7.5 7.6.5 7.6.5s5.9 0 7.6-.5a2.8 2.8 0 0 0 2-2c.4-1.6.4-5 .4-5zM10 15.5v-7l6 3.5-6 3.5z" />,
  }

  return <svg {...common}>{paths[name]}</svg>
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.7 12.4c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.8-3.5.8-.8 0-1.9-.8-3.1-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.5.8 1.2 1.8 2.5 3.1 2.4 1.2-.1 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.3 1.3-2.6 1.3-2.7-.1-.1-2.6-1-2.6-3.9zM14.4 5.6c.7-.8 1.1-1.9 1-3-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2-.5 2.7-1.3z" />
    </svg>
  )
}

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [panelOpen, setPanelOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({ email: '', password: '' })
  const [resetToken, setResetToken] = useState(() => new URLSearchParams(location.search).get('reset_token') || '')
  const [resetPassword, setResetPassword] = useState('')
  const [authModal, setAuthModal] = useState(null)
  const [authModalEmail, setAuthModalEmail] = useState('')
  const [animals, setAnimals] = useState([])
  const [animalTotal, setAnimalTotal] = useState(0)
  const [animalsLoading, setAnimalsLoading] = useState(true)
  const [appSettings, setAppSettings] = useState(() => {
    const cachedSettings = localStorage.getItem('appSettings')
    if (!cachedSettings) return defaultAppSettings
    try {
      return { ...defaultAppSettings, ...JSON.parse(cachedSettings) }
    } catch {
      localStorage.removeItem('appSettings')
      return defaultAppSettings
    }
  })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (location.hash === '#panel') {
      openPanel()
    }
    const params = new URLSearchParams(location.search)
    const token = params.get('reset_token')
    if (token) {
      window.setTimeout(() => setResetToken(token), 0)
      openPanel()
    }
  }, [location.hash, location.search])

  useEffect(() => {
    let alive = true
    Promise.allSettled([
      axios.get(`${API_BASE_URL}/superadmin/animals?page=1&limit=12`),
      axios.get(`${API_BASE_URL}/superadmin/settings`),
    ])
      .then(([animalsResult, settingsResult]) => {
        if (!alive) return
        if (animalsResult.status === 'fulfilled') {
          setAnimals(animalsResult.value.data?.data || [])
          setAnimalTotal(animalsResult.value.data?.pagination?.total || 0)
        }
        if (settingsResult.status === 'fulfilled') {
          const settings = settingsResult.value.data?.data || {}
          localStorage.setItem('appSettings', JSON.stringify(settings))
          setAppSettings({ ...defaultAppSettings, ...settings })
        }
      })
      .catch(() => {
        if (!alive) return
        setAnimals([])
        setAnimalTotal(0)
      })
      .finally(() => {
        if (alive) setAnimalsLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const applyLiveSettings = (settings) => {
      setAppSettings({ ...defaultAppSettings, ...settings })
    }

    const handleSettingsUpdated = (event) => {
      applyLiveSettings(event.detail || {})
    }

    const handleStorage = (event) => {
      if (event.key !== 'appSettings' || !event.newValue) return
      try {
        applyLiveSettings(JSON.parse(event.newValue))
      } catch {
        localStorage.removeItem('appSettings')
      }
    }

    window.addEventListener('app-settings-updated', handleSettingsUpdated)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener('app-settings-updated', handleSettingsUpdated)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = panelOpen ? 'hidden' : ''
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && panelOpen) closePanel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [panelOpen])

  const showToast = (title, message, type = 'success') => {
    setToast({ title, message, type })
    window.clearTimeout(window.__landingToastTimer)
    window.__landingToastTimer = window.setTimeout(() => setToast(null), 4000)
  }

  const openPanel = () => {
    setClosing(false)
    setPanelOpen(true)
  }

  function closePanel() {
    setClosing(true)
    window.setTimeout(() => {
      setPanelOpen(false)
      setClosing(false)
    }, 300)
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, form)
      const user = response.data?.data
      localStorage.setItem('authUserId', String(user.id))
        localStorage.setItem('authName', user.name)
        localStorage.setItem('authRole', user.role)
        localStorage.setItem('authEmail', user.email)
        localStorage.setItem('authAvatar', user.profile_photo || '')
        localStorage.setItem('authRemember', remember ? '1' : '0')
      showToast('Berhasil!', 'Selamat datang kembali di Sahabat Kecil.')
      navigate(
        user.role === 'superadmin' ? '/dashboard' : user.role === 'admin' ? '/admin' : user.role === 'petugas' ? '/petugas' : '/customer',
        { replace: true },
      )
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal. Periksa kembali email dan password kamu.')
    } finally {
      setLoading(false)
    }
  }

  const completeLogin = (user) => {
    localStorage.setItem('authUserId', String(user.id))
    localStorage.setItem('authName', user.name)
    localStorage.setItem('authRole', user.role)
    localStorage.setItem('authEmail', user.email)
    localStorage.setItem('authAvatar', user.profile_photo || '')
    localStorage.setItem('authRemember', remember ? '1' : '0')
    navigate(
      user.role === 'superadmin' ? '/dashboard' : user.role === 'admin' ? '/admin' : user.role === 'petugas' ? '/petugas' : '/customer',
      { replace: true },
    )
  }

  const handleGoogleLogin = () => {
    setError('')
    setAuthModalEmail(form.email || '')
    setAuthModal('google')
  }

  const submitGoogleLogin = async (event) => {
    event.preventDefault()
    const email = authModalEmail.trim()
    if (!email) return
    setError('')
    setLoading(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/google`, {
        email,
        name: email.split('@')[0],
      })
      setAuthModal(null)
      showToast('Berhasil!', 'Login Google berhasil.')
      completeLogin(response.data?.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Login Google gagal.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    setError('')
    setAuthModalEmail(form.email || '')
    setAuthModal('forgot')
  }

  const submitForgotPassword = async (event) => {
    event.preventDefault()
    const email = authModalEmail.trim()
    if (!email) return
    setError('')
    setLoading(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email })
      const resetUrl = response.data?.data?.reset_url || ''
      if (resetUrl) {
        try {
          const token = new URL(resetUrl).searchParams.get('reset_token')
          if (token) setResetToken(token)
        } catch {
          // Reset URL dari backend tidak valid, cukup tampilkan notifikasi.
        }
      }
      setAuthModal(null)
      showToast('Reset password', 'Link reset password dibuat untuk email tersebut.', 'info')
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat reset password.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        token: resetToken,
        password: resetPassword,
      })
      setResetToken('')
      setResetPassword('')
      showToast('Berhasil!', 'Password berhasil diganti. Silakan login.')
      navigate('/login#panel', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Reset password gagal.')
    } finally {
      setLoading(false)
    }
  }

  const scrollCarousel = (direction) => {
    document.getElementById('carousel')?.scrollBy({ left: direction * 340, behavior: 'smooth' })
  }

  const scrollToSection = (event, id) => {
    event.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.history.replaceState(null, '', `/login#${id}`)
  }

  const logoIsImage = appSettings.logo_apk?.startsWith?.('data:image')
  const logoIsVideo = isVideoMedia(appSettings.logo_apk)
  const logoText = appSettings.logo_apk && !logoIsImage && !logoIsVideo ? appSettings.logo_apk : appSettings.nama_apk.charAt(0).toUpperCase()
  const heroBackground = appSettings.hero_bg_apk || 'https://picsum.photos/seed/dog-sunset-golden-light/1920/1080.jpg'
  const themeColor = appSettings.warna_apk || '#60a5fa'
  const heroTitle = appSettings.login_hero_title || [
    appSettings.login_hero_title_1 || defaultAppSettings.login_hero_title_1,
    appSettings.login_hero_title_2 || defaultAppSettings.login_hero_title_2,
    appSettings.login_hero_highlight || defaultAppSettings.login_hero_highlight,
  ].join('\n')
  const heroTitleLines = heroTitle.split(/\r?\n/).filter(Boolean)
  const heroHighlight = appSettings.login_hero_highlight || defaultAppSettings.login_hero_highlight
  const heroDescription = appSettings.login_hero_description || defaultAppSettings.login_hero_description
  const heroBadgeText = appSettings.login_hero_badge_text || defaultAppSettings.login_hero_badge_text
  const heroPrimaryButton = appSettings.login_hero_primary_button || defaultAppSettings.login_hero_primary_button
  const heroSecondaryButton = appSettings.login_hero_secondary_button || defaultAppSettings.login_hero_secondary_button
  const featuredAnimals = animals.slice(0, 4)

  const requestLoginForAllAnimals = () => {
    showToast('Login diperlukan', 'Silakan login untuk melihat semua hewan.', 'info')
    openPanel()
  }

  return (
    <main className="landing-login">
      <style>{`
        .landing-login, .landing-login * { box-sizing: border-box; font-family: Inter, system-ui, sans-serif; }
        .landing-login { min-height: 100vh; overflow-x: hidden; background: #fafafa; color: #0f172a; }
        .landing-login svg { display: block; flex-shrink: 0; }
        .ll-toast { position: fixed; top: 24px; right: 24px; z-index: 100; max-width: 360px; background: #fff; border: 1px solid #f1f5f9; border-radius: 18px; box-shadow: 0 24px 60px rgba(15,23,42,.14); padding: 14px 18px; display: flex; align-items: center; gap: 14px; animation: toastIn .4s cubic-bezier(.22,1,.36,1) both; }
        .ll-toast-icon { width: 40px; height: 40px; border-radius: 14px; background: #ecfdf5; color: #10b981; display: grid; place-items: center; flex-shrink: 0; }
        .ll-toast.info .ll-toast-icon { background: #eff6ff; color: #3b82f6; }
        .ll-toast strong { display: block; color: #1e293b; font-size: 13px; }
        .ll-toast p { margin: 2px 0 0; color: #94a3b8; font-size: 11px; }
        .ll-toast button { margin-left: auto; border: 0; background: transparent; color: #cbd5e1; cursor: pointer; }
        .ll-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; transition: all .3s ease; }
        .ll-nav.scrolled { background: rgba(255,255,255,.95); backdrop-filter: blur(20px); border-bottom: 1px solid #f1f5f9; }
        .ll-nav-inner { max-width: 1280px; margin: 0 auto; padding: 0 20px; height: 64px; display: flex; align-items: center; justify-content: space-between; }
        .ll-brand { display: flex; align-items: center; gap: 10px; color: #fff; text-decoration: none; }
        .ll-brand-mark { width: 36px; height: 36px; border-radius: 12px; display: grid; place-items: center; color: #fff; background: rgba(255,255,255,.2); border: 1px solid rgba(255,255,255,.3); box-shadow: 0 10px 24px rgba(15,23,42,.2); backdrop-filter: blur(16px); }
        .ll-nav.scrolled .ll-brand-mark { background: linear-gradient(135deg, ${themeColor}, ${themeColor}dd); border-color: transparent; box-shadow: 0 8px 18px rgba(147,197,253,.35); }
        .ll-brand-mark img, .panel-title img, .footer-brand img, .ll-brand-mark video, .panel-title video, .footer-brand video { width: 100%; height: 100%; object-fit: cover; display: block; border-radius: inherit; }
        .ll-brand-mark span, .panel-title div span, .footer-brand div span { color: #fff; font-size: 16px; font-weight: 1000; line-height: 1; text-shadow: none; }
        .ll-brand span { color: #fff; font-size: 15px; font-weight: 900; letter-spacing: -.03em; text-shadow: 0 8px 20px rgba(15,23,42,.3); }
        .ll-nav.scrolled .ll-brand span { color: #0f172a; text-shadow: none; }
        .ll-links { display: flex; align-items: center; gap: 4px; }
        .ll-links a { color: rgba(255,255,255,.72); text-decoration: none; font-size: 12px; font-weight: 700; padding: 8px 16px; border-radius: 10px; transition: all .2s ease; }
        .ll-links a:hover { color: #fff; background: rgba(255,255,255,.1); }
        .ll-nav.scrolled .ll-links a { color: #64748b; }
        .ll-nav.scrolled .ll-links a:hover { color: #0f172a; background: #f1f5f9; }
        .ll-login-btn { border: 0; background: #fff; color: #1e293b; border-radius: 12px; padding: 10px 20px; font-size: 12px; font-weight: 900; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all .3s ease; }
        .ll-login-btn:hover { background: #f8fafc; box-shadow: 0 12px 26px rgba(15,23,42,.12); }
        .ll-nav.scrolled .ll-login-btn { background: ${themeColor}; color: #fff; }
        .ll-nav.scrolled .ll-login-btn:hover { background: ${themeColor}; }
        .hero { position: relative; height: 100vh; min-height: 600px; overflow: hidden; }
        .hero-bg { position: absolute; inset: 0; }
        .hero-bg img, .hero-bg video { width: 100%; height: 100%; object-fit: cover; display: block; animation: heroZoom 8s ease-out both; }
        .hero-bg::after { content: ""; position: absolute; inset: 0; background: linear-gradient(0deg, rgba(15,23,42,.9), rgba(15,23,42,.4), rgba(15,23,42,.2)); }
        .hero-bg::before { content: ""; position: absolute; inset: 0; z-index: 1; background: linear-gradient(90deg, rgba(15,23,42,.6), transparent); }
        .hero-floats { position: absolute; inset: 0; pointer-events: none; z-index: 2; }
        .paw-float { position: absolute; color: rgba(255,255,255,.1); animation: pawFade 5s ease-out infinite; }
        .paw-float.one { top: 15%; left: 10%; } .paw-float.two { top: 40%; right: 15%; animation-delay: 1s; } .paw-float.three { bottom: 30%; left: 25%; animation-delay: 2s; } .paw-float.four { bottom: 15%; right: 30%; animation-delay: 3s; }
        .bone-spin { position: absolute; top: 25%; right: 20%; color: rgba(255,255,255,.15); animation: boneSpin 4s ease-in-out infinite; }
        .heart-float { position: absolute; top: 60%; left: 8%; color: rgba(255,255,255,.15); animation: floatA 5s ease-in-out infinite; }
        .hero-content { position: relative; z-index: 3; height: 100%; max-width: 1280px; margin: 0 auto; padding: 0 20px 88px; display: flex; flex-direction: column; justify-content: flex-end; }
        .hero-copy { max-width: 580px; }
        .hero-pill { display: inline-flex; align-items: center; gap: 8px; color: rgba(255,255,255,.82); background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.15); backdrop-filter: blur(14px); border-radius: 999px; padding: 8px 16px; font-size: 11px; font-weight: 900; margin-bottom: 20px; animation: fadeUp .8s .2s both; }
        .hero-pill i { width: 8px; height: 8px; border-radius: 999px; background: #34d399; animation: pulse 1.4s infinite; }
        .hero h1 { margin: 0; color: #fff; font-size: clamp(36px, 6vw, 68px); line-height: 1.05; letter-spacing: -.06em; font-weight: 1000; animation: fadeUp .8s .35s both; }
        .grad-text { background: linear-gradient(135deg, ${themeColor}, #7dd3fc); -webkit-background-clip: text; color: transparent; }
        .hero p { color: rgba(255,255,255,.52); font-size: 16px; line-height: 1.7; max-width: 440px; margin: 20px 0 0; animation: fadeUp .8s .5s both; }
        .hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px; animation: fadeUp .8s .65s both; }
        .btn-main { border: 0; background: linear-gradient(135deg, ${themeColor} 0%, #3b82f6 55%, #2563eb 100%); background-size: 200% 200%; color: #fff; font-weight: 900; font-size: 13px; border-radius: 14px; cursor: pointer; position: relative; overflow: hidden; display: inline-flex; align-items: center; justify-content: center; gap: 10px; transition: all .35s cubic-bezier(.22,1,.36,1); }
        .btn-main::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,.15), transparent); background-size: 200% 100%; opacity: 0; }
        .btn-main:hover::after { opacity: 1; animation: shimmer 1.5s linear infinite; }
        .btn-main:hover { background-position: 100% 100%; transform: translateY(-2px); box-shadow: 0 12px 40px rgba(59,130,246,.35); }
        .btn-main.big { padding: 14px 28px; box-shadow: 0 18px 36px rgba(59,130,246,.2); }
        .ghost-btn { text-decoration: none; color: #fff; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2); backdrop-filter: blur(12px); font-weight: 800; font-size: 13px; border-radius: 14px; padding: 14px 24px; display: inline-flex; align-items: center; gap: 10px; transition: all .3s ease; }
        .ghost-btn:hover { background: rgba(255,255,255,.2); }
        .scroll-indicator { position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px; animation: fadeIn 1s 1.5s both; }
        .scroll-indicator span { color: rgba(255,255,255,.32); font-size: 9px; font-weight: 900; letter-spacing: .2em; text-transform: uppercase; }
        .scroll-mouse { width: 20px; height: 32px; border: 2px solid rgba(255,255,255,.2); border-radius: 999px; display: flex; justify-content: center; padding-top: 6px; }
        .scroll-mouse i { width: 4px; height: 8px; border-radius: 999px; background: rgba(255,255,255,.4); animation: bounce 1.2s infinite; }
        .section { position: relative; z-index: 4; padding: 88px 20px; }
        .section.white { background: #fff; }
        .container { max-width: 1280px; margin: 0 auto; }
        .section-head { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 40px; }
        .eyebrow { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: #d97706; font-size: 10px; font-weight: 900; letter-spacing: .15em; text-transform: uppercase; }
        .eyebrow-icon { width: 32px; height: 32px; border-radius: 10px; background: #fef3c7; color: #f59e0b; display: grid; place-items: center; }
        .section h2 { margin: 0; color: #0f172a; font-size: clamp(28px, 3vw, 36px); font-weight: 1000; letter-spacing: -.05em; }
        .section-desc { margin: 8px 0 0; color: #94a3b8; font-size: 14px; }
        .carousel-controls { display: flex; gap: 8px; }
        .round-btn { width: 40px; height: 40px; border: 1px solid #e2e8f0; background: #fff; color: #94a3b8; border-radius: 12px; display: grid; place-items: center; cursor: pointer; transition: all .2s ease; }
        .round-btn:hover { color: #334155; border-color: #cbd5e1; box-shadow: 0 8px 20px rgba(15,23,42,.08); }
        .carousel { display: flex; gap: 16px; overflow-x: auto; padding: 0 4px 16px; scroll-snap-type: x mandatory; }
        .carousel-card { flex: 0 0 240px; position: relative; border-radius: 20px; overflow: hidden; cursor: pointer; scroll-snap-align: start; transition: all .5s cubic-bezier(.22,1,.36,1); }
        .carousel-card:hover { transform: translateY(-12px) scale(1.03); }
        .carousel-card .ratio { aspect-ratio: 3/4; }
        .carousel-card img, .carousel-card video { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .7s cubic-bezier(.22,1,.36,1); }
        .carousel-card:hover img, .carousel-card:hover video { transform: scale(1.1); }
        .cc-overlay { position: absolute; inset: 0; opacity: 0; background: linear-gradient(0deg, rgba(0,0,0,.72), rgba(0,0,0,.1), transparent); transition: opacity .4s ease; }
        .carousel-card:hover .cc-overlay { opacity: 1; }
        .cc-heart { position: absolute; top: 14px; right: 14px; width: 36px; height: 36px; border: 0; background: rgba(255,255,255,.9); color: #64748b; border-radius: 999px; display: grid; place-items: center; box-shadow: 0 10px 24px rgba(15,23,42,.18); transform: scale(.6); opacity: 0; transition: all .3s cubic-bezier(.22,1,.36,1); }
        .carousel-card:hover .cc-heart { transform: scale(1); opacity: 1; }
        .cc-heart:hover { background: #ef4444; color: #fff; }
        .cc-bottom { position: absolute; left: 0; right: 0; bottom: 0; padding: 16px; }
        .status { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px; color: #fff; font-size: 7px; font-weight: 900; letter-spacing: .16em; text-transform: uppercase; }
        .status.green { background: #10b981; } .status.amber { background: #f59e0b; } .status.blue { background: #3b82f6; }
        .cc-bottom h3 { color: #fff; margin: 8px 0 0; font-size: 18px; font-weight: 900; letter-spacing: -.03em; }
        .cc-info { display: flex; gap: 10px; color: rgba(255,255,255,.52); font-size: 11px; margin-top: 4px; transform: translateY(10px); opacity: 0; transition: all .4s cubic-bezier(.22,1,.36,1) .05s; }
        .carousel-card:hover .cc-info { transform: translateY(0); opacity: 1; }
        .pet-empty-card { flex: 1 0 280px; min-height: 220px; border: 1px dashed #cbd5e1; border-radius: 18px; color: #64748b; background: #fff; display: grid; place-items: center; text-align: center; padding: 28px; font-size: 13px; font-weight: 800; }
        .pet-photo-placeholder { height: 100%; min-height: 360px; background: linear-gradient(135deg, #dbeafe, #f8fafc); color: #60a5fa; display: grid; place-items: center; }
        .cta-card { flex: 0 0 240px; aspect-ratio: 3/4; border: 2px dashed #e2e8f0; background: #fff; border-radius: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; cursor: pointer; transition: all .3s ease; }
        .cta-card:hover { border-color: #60a5fa; background: rgba(239,246,255,.35); }
        .cta-card-icon { width: 56px; height: 56px; border-radius: 18px; background: #dbeafe; color: #60a5fa; display: grid; place-items: center; }
        .cta-card p { margin: 0; text-align: center; color: #334155; font-size: 14px; font-weight: 900; }
        .cta-card span { color: #94a3b8; font-size: 11px; text-align: center; line-height: 1.55; }
        .process-head { text-align: center; max-width: 520px; margin: 0 auto 56px; }
        .process-pill { display: inline-flex; align-items: center; gap: 8px; background: #eff6ff; color: #60a5fa; border: 1px solid rgba(191,219,254,.8); border-radius: 999px; padding: 8px 16px; font-size: 11px; font-weight: 900; margin-bottom: 16px; }
        .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 1024px; margin: 0 auto; }
        .step-card { background: #fafafa; border: 1px solid #f1f5f9; border-radius: 20px; padding: 30px 28px 28px; text-align: center; position: relative; transition: all .3s cubic-bezier(.22,1,.36,1); }
        .step-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,.08); }
        .step-num { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); width: 28px; height: 28px; border-radius: 999px; background: #60a5fa; color: #fff; display: grid; place-items: center; font-size: 11px; font-weight: 1000; box-shadow: 0 10px 22px rgba(147,197,253,.45); }
        .step-icon { width: 56px; height: 56px; border-radius: 18px; display: grid; place-items: center; margin: 8px auto 16px; }
        .step-card h3 { margin: 0; color: #1e293b; font-size: 15px; font-weight: 900; }
        .step-card p { margin: 8px 0 0; color: #94a3b8; font-size: 12px; line-height: 1.65; }
        .center-action { text-align: center; margin-top: 40px; }
        .cta-banner { position: relative; overflow: hidden; height: 330px; }
        .cta-banner img, .cta-banner video { width: 100%; height: 100%; object-fit: cover; display: block; }
        .cta-banner::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(15,23,42,.9), rgba(15,23,42,.7), rgba(15,23,42,.3)); }
        .cta-content { position: absolute; inset: 0; z-index: 2; display: flex; align-items: center; }
        .cta-content-inner { max-width: 1280px; margin: 0 auto; width: 100%; padding: 0 20px; }
        .cta-copy { max-width: 520px; }
        .cta-copy h2 { margin: 0; color: #fff; font-size: clamp(24px, 3vw, 32px); line-height: 1.2; font-weight: 1000; letter-spacing: -.04em; }
        .cta-copy h2 span { color: #60a5fa; }
        .cta-copy p { color: rgba(255,255,255,.52); font-size: 13px; line-height: 1.6; margin: 12px 0 0; }
        .white-login { margin-top: 24px; border: 0; background: #fff; color: #1e293b; border-radius: 12px; padding: 12px 24px; font-size: 12px; font-weight: 900; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: all .25s ease; }
        .white-login:hover { transform: translateY(-2px); box-shadow: 0 18px 32px rgba(0,0,0,.18); }
        .footer { background: #0f172a; color: #fff; position: relative; z-index: 4; }
        .footer-inner { max-width: 1280px; margin: 0 auto; padding: 48px 20px 28px; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 36px; margin-bottom: 40px; }
        .footer-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
        .footer-brand div { width: 36px; height: 36px; border-radius: 12px; background: ${themeColor}; display: grid; place-items: center; overflow: hidden; }
        .footer-brand span { font-size: 15px; font-weight: 900; }
        .footer p { color: #94a3b8; font-size: 12px; line-height: 1.7; max-width: 420px; margin: 0; }
        .socials { display: flex; gap: 12px; margin-top: 20px; }
        .socials a { width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,.1); color: #94a3b8; display: grid; place-items: center; transition: all .2s ease; }
        .socials a:hover { background: #60a5fa; color: #fff; }
        .footer h4 { color: #64748b; font-size: 11px; font-weight: 900; letter-spacing: .15em; text-transform: uppercase; margin: 0 0 16px; }
        .footer-list { display: flex; flex-direction: column; gap: 10px; }
        .footer-list a { color: #94a3b8; text-decoration: none; font-size: 12px; transition: color .2s ease; }
        .footer-list a:hover { color: #fff; }
        .footer-bottom { border-top: 1px solid rgba(255,255,255,.1); padding-top: 24px; display: flex; align-items: center; justify-content: space-between; gap: 12px; color: #64748b; font-size: 11px; }
        .footer-safe { display: flex; align-items: center; gap: 8px; }
        .footer-safe svg { color: #34d399; }
        .panel-backdrop { position: fixed; inset: 0; z-index: 60; background: rgba(15,23,42,.5); backdrop-filter: blur(4px); opacity: 0; pointer-events: none; transition: opacity .35s ease; }
        .panel-backdrop.open { opacity: 1; pointer-events: auto; }
        .slide-panel { position: fixed; top: 0; right: 0; bottom: 0; z-index: 70; width: min(520px, 100%); background: #fff; box-shadow: -24px 0 80px rgba(15,23,42,.25); overflow-y: auto; transform: translateX(100%); }
        .slide-panel.open { animation: panelIn .45s cubic-bezier(.22,1,.36,1) both; }
        .slide-panel.closing { animation: panelOut .3s ease-in both; }
        .panel-head { position: sticky; top: 0; z-index: 2; background: rgba(255,255,255,.9); backdrop-filter: blur(20px); border-bottom: 1px solid #f1f5f9; padding: 18px 38px; min-height: 86px; display: flex; align-items: center; justify-content: space-between; }
        .panel-title { display: flex; align-items: center; gap: 10px; }
        .panel-title div { width: 46px; height: 46px; border-radius: 16px; background: linear-gradient(135deg, ${themeColor}, ${themeColor}dd); color: #fff; display: grid; place-items: center; box-shadow: 0 8px 18px rgba(147,197,253,.35); overflow: hidden; }
        .panel-title span { color: #0f172a; font-size: 18px; font-weight: 1000; letter-spacing: -.03em; }
        .panel-close { border: 0; width: 40px; height: 40px; border-radius: 999px; background: #f1f5f9; color: #94a3b8; display: grid; place-items: center; cursor: pointer; transition: all .2s ease; }
        .panel-close:hover { background: #e2e8f0; color: #475569; }
        .panel-body { padding: 14px 38px 28px; }
        .panel-body h2 { margin: 0; color: #0f172a; font-size: 28px; line-height: 1.18; letter-spacing: -.05em; font-weight: 1000; }
        .panel-body.reset-mode > h2:not(.reset-title), .panel-body.reset-mode > p:not(.reset-copy) { display: none; }
        .reset-title { text-align: center; }
        .reset-copy { text-align: center; max-width: 320px; margin-left: auto !important; margin-right: auto !important; }
        .tail-wag { display: inline-flex; margin-left: 12px; transform-origin: bottom center; animation: tailWag .35s ease-in-out infinite; color: #d97706; vertical-align: -3px; }
        .dog-emoji { display: inline-block; margin-left: 12px; font-size: 27px; line-height: 1; transform-origin: bottom center; animation: tailWag .35s ease-in-out infinite; vertical-align: -4px; }
        .panel-body > p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 12px 0 0; }
        .social-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 30px 0 24px; }
        .social-btn { height: 54px; border: 1.5px solid #e2e8f0; background: #f8fafc; color: #475569; border-radius: 14px; font-size: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: all .25s cubic-bezier(.22,1,.36,1); }
        .social-btn:hover { border-color: #cbd5e1; background: #fff; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,.05); }
        .panel-divider { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .panel-divider::before, .panel-divider::after { content: ""; flex: 1; height: 1px; background: #f1f5f9; }
        .panel-divider span { color: #94a3b8; font-size: 11px; font-weight: 1000; letter-spacing: .16em; text-transform: uppercase; }
        .panel-form { display: flex; flex-direction: column; gap: 15px; }
        .reset-panel-form { margin-top: 28px; padding: 22px; border: 1px solid #e0edff; border-radius: 22px; background: linear-gradient(180deg, #f8fbff, #fff); box-shadow: 0 18px 48px rgba(59,130,246,.08); }
        .reset-panel-icon { width: 58px; height: 58px; border-radius: 20px; background: linear-gradient(135deg, #e0f2fe, #dbeafe); color: #2563eb; display: grid; place-items: center; margin: -4px auto 4px; box-shadow: 0 14px 30px rgba(96,165,250,.18); }
        .field label, .field-top label { display: block; color: #64748b; font-size: 11px; font-weight: 1000; letter-spacing: .16em; text-transform: uppercase; margin-bottom: 10px; }
        .field-top { display: flex; align-items: center; justify-content: space-between; }
        .forgot { border: 0; background: transparent; color: #60a5fa; font-size: 11px; font-weight: 1000; cursor: pointer; }
        .input-wrap { height: 56px; display: flex; align-items: center; gap: 0; background: #eef4fc; border: 1.5px solid #dce6f2; border-radius: 14px; overflow: hidden; transition: all .3s cubic-bezier(.22,1,.36,1); }
        .input-wrap:hover { border-color: #cbd5e1; background: #f8fafc; }
        .input-wrap:focus-within { border-color: #60a5fa; background: #fff; box-shadow: 0 0 0 4px rgba(96,165,250,.1), 0 8px 20px rgba(96,165,250,.08); }
        .iw-icon { width: 50px; height: 100%; color: #cbd5e1; display: grid; place-items: center; transition: color .3s ease; }
        .input-wrap:focus-within .iw-icon { color: #60a5fa; }
        .input-wrap input { all: unset; flex: 1; min-width: 0; height: 100%; padding: 0 16px 0 0; color: #0f172a; font-size: 15px; line-height: 56px; font-weight: 600; }
        .input-wrap input::placeholder { color: #cbd5e1; }
        .eye-btn { width: 60px; height: 100%; border: 0; background: transparent; color: #cbd5e1; display: grid; place-items: center; cursor: pointer; }
        .remember { display: flex; align-items: center; gap: 10px; color: #64748b; font-size: 14px; margin-top: -4px; }
        .check-btn { width: 20px; height: 20px; border: 2px solid #e2e8f0; background: #fff; border-radius: 6px; color: #fff; display: grid; place-items: center; cursor: pointer; }
        .check-btn.on { background: #60a5fa; border-color: #60a5fa; }
        .panel-submit { width: 100%; height: 58px; font-size: 15px; border-radius: 15px; margin-top: -2px; }
        .error-box { background: #fef2f2; border: 1px solid #fee2e2; color: #dc2626; font-size: 11px; font-weight: 700; padding: 12px 14px; border-radius: 14px; display: flex; align-items: flex-start; gap: 8px; animation: fadeUp .3s ease both; }
        .panel-signup { margin-top: 28px; padding-bottom: 34px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #94a3b8; font-size: 15px; }
        .panel-signup button { border: 0; background: transparent; color: #60a5fa; font-weight: 1000; cursor: pointer; }
        .auth-modal-backdrop { position: fixed; inset: 0; z-index: 120; background: rgba(15,23,42,.58); backdrop-filter: blur(10px); display: grid; place-items: center; padding: 20px; animation: fadeIn .2s ease both; }
        .auth-modal { width: min(430px, 100%); background: #fff; border: 1px solid #f1f5f9; border-radius: 24px; box-shadow: 0 28px 80px rgba(15,23,42,.24); padding: 24px; animation: fadeUp .32s cubic-bezier(.22,1,.36,1) both; }
        .auth-modal-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
        .auth-modal-title { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .auth-modal-mark { width: 44px; height: 44px; border-radius: 16px; background: #eff6ff; color: #3b82f6; display: grid; place-items: center; flex-shrink: 0; }
        .auth-modal h3 { margin: 0; color: #0f172a; font-size: 20px; line-height: 1.15; letter-spacing: -.04em; font-weight: 1000; }
        .auth-modal p { margin: 4px 0 0; color: #94a3b8; font-size: 12px; line-height: 1.5; }
        .auth-modal-close { width: 38px; height: 38px; border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 13px; color: #64748b; display: grid; place-items: center; cursor: pointer; flex-shrink: 0; }
        .auth-modal-close:hover { background: #f1f5f9; color: #0f172a; }
        .auth-modal-form { display: flex; flex-direction: column; gap: 14px; }
        .auth-modal-actions { display: flex; gap: 12px; margin-top: 4px; }
        .auth-modal-cancel, .auth-modal-submit { height: 48px; border-radius: 14px; font-size: 13px; font-weight: 900; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
        .auth-modal-cancel { width: 118px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; }
        .auth-modal-cancel:hover { background: #f8fafc; color: #0f172a; }
        .auth-modal-submit { flex: 1; border: 0; color: #fff; }
        .auth-modal-submit:disabled, .auth-modal-cancel:disabled { opacity: .68; cursor: not-allowed; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes panelIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes panelOut { from { transform: translateX(0); } to { transform: translateX(100%); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes heartbeat { 0%,100% { transform: scale(1); } 14% { transform: scale(1.25); } 28% { transform: scale(1); } 42% { transform: scale(1.18); } }
        @keyframes tailWag { 0%,100% { transform: rotate(-20deg); } 50% { transform: rotate(20deg); } }
        @keyframes floatA { 0%,100% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-12px) rotate(3deg); } }
        @keyframes boneSpin { 0%,100% { transform: rotate(0deg) translateY(0); } 25% { transform: rotate(15deg) translateY(-5px); } 75% { transform: rotate(-10deg) translateY(-3px); } }
        @keyframes pawFade { 0% { opacity: 0; transform: scale(.3) rotate(-25deg); } 35% { opacity: .5; } 100% { opacity: 0; transform: scale(1.3) rotate(20deg); } }
        @keyframes heroZoom { from { transform: scale(1.1); } to { transform: scale(1); } }
        @keyframes toastIn { from { opacity: 0; transform: translateY(20px) scale(.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
        @media (max-width: 768px) {
          .ll-links, .carousel-controls, .bone-spin, .heart-float { display: none; }
          .hero { min-height: 560px; }
          .hero-content { padding-bottom: 72px; }
          .section-head { align-items: flex-start; }
          .carousel-card, .cta-card { flex-basis: 240px; }
          .steps, .footer-grid { grid-template-columns: 1fr; }
          .footer-bottom { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      {toast && (
        <div className={`ll-toast ${toast.type === 'info' ? 'info' : ''}`}>
          <div className="ll-toast-icon"><Icon name={toast.type === 'info' ? 'info' : 'check'} /></div>
          <div>
            <strong>{toast.title}</strong>
            <p>{toast.message}</p>
          </div>
          <button type="button" onClick={() => setToast(null)} aria-label="Tutup"><Icon name="x" size={16} /></button>
        </div>
      )}

      <nav className={`ll-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="ll-nav-inner">
          <a href="#hero" className="ll-brand">
            <div className="ll-brand-mark">
              {logoIsVideo ? <video src={appSettings.logo_apk} autoPlay muted loop playsInline /> : logoIsImage ? <img src={appSettings.logo_apk} alt="" /> : <span>{logoText}</span>}
            </div>
            <span>{appSettings.nama_apk}</span>
          </a>
          <div className="ll-links">
            <a href="#hero" onClick={(event) => scrollToSection(event, 'hero')}>Beranda</a>
            <a href="#pets" onClick={(event) => scrollToSection(event, 'pets')}>Adopsi</a>
            <a href="#process" onClick={(event) => scrollToSection(event, 'process')}>Cara Adopsi</a>
          </div>
          <button type="button" className="ll-login-btn" onClick={openPanel}>
            <Icon name="login" size={14} />
            Login
          </button>
        </div>
      </nav>

      <section id="hero" className="hero">
        <div className="hero-bg">
          {isVideoMedia(heroBackground) ? (
            <video src={heroBackground} autoPlay muted loop playsInline />
          ) : (
            <img src={heroBackground} alt="" />
          )}
        </div>
        <div className="hero-floats">
          <span className="paw-float one"><Icon name="paw" size={62} /></span>
          <span className="paw-float two"><Icon name="paw" size={52} /></span>
          <span className="paw-float three"><Icon name="paw" size={76} /></span>
          <span className="paw-float four"><Icon name="paw" size={42} /></span>
          <span className="heart-float"><Icon name="heart" size={32} /></span>
        </div>
        <div className="hero-content">
          <div className="hero-copy">
            <div className="hero-pill">
              <i />
              <span>{animalTotal} {heroBadgeText}</span>
            </div>
            <h1>
              {heroTitleLines.length > 0 ? heroTitleLines.map((line, index) => {
                const isLast = index === heroTitleLines.length - 1
                return (
                  <span key={`${line}-${index}`} className={isLast ? 'grad-text' : undefined}>
                    {line}
                    {!isLast && <br />}
                  </span>
                )
              }) : (
                <>
                  Setiap Hewan<br />Layak<br /><span className="grad-text">{heroHighlight}</span>
                </>
              )}
            </h1>
            <p>{heroDescription}</p>
            <div className="hero-actions">
              <button type="button" className="btn-main big" onClick={openPanel}><Icon name="login" size={16} /> {heroPrimaryButton}</button>
              <a href="#pets" className="ghost-btn" onClick={(event) => scrollToSection(event, 'pets')}>
                <Icon name="eye" size={16} /> {heroSecondaryButton}
              </a>
            </div>
          </div>
          <div className="scroll-indicator">
            <span>Scroll</span>
            <div className="scroll-mouse"><i /></div>
          </div>
        </div>
      </section>

      <section id="pets" className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow"><div className="eyebrow-icon"><Icon name="fire" size={17} /></div><span>Populer Minggu Ini</span></div>
              <h2>Hewan</h2>
              <p className="section-desc">Geser untuk melihat lebih banyak hewan.</p>
            </div>
            <div className="carousel-controls">
              <button type="button" className="round-btn" onClick={() => scrollCarousel(-1)}><Icon name="chevronLeft" /></button>
              <button type="button" className="round-btn" onClick={() => scrollCarousel(1)}><Icon name="chevronRight" /></button>
            </div>
          </div>

          <div id="carousel" className="carousel">
            {animalsLoading && <div className="pet-empty-card">Memuat data hewan dari database...</div>}
            {!animalsLoading && featuredAnimals.map((animal) => (
              <div className="carousel-card" key={animal.id}>
                <div className="ratio">
                  {animal.photo ? (
                    isVideoMedia(animal.photo) ? (
                      <video src={animal.photo} muted playsInline />
                    ) : (
                      <img src={animal.photo} alt={animal.name} />
                    )
                  ) : (
                    <div className="pet-photo-placeholder"><Icon name="paw" size={54} /></div>
                  )}
                </div>
                <div className="cc-overlay" />
                <button type="button" className="cc-heart" aria-label="Favorit"><Icon name="heartOutline" size={15} /></button>
                <div className="cc-bottom">
                  <span className={`status ${animalStatusTone(animal.status)}`}>{formatAnimalStatus(animal.status)}</span>
                  <h3>{animal.name}</h3>
                  <div className="cc-info">
                    <span>{animal.species}</span>
                    <span>-</span>
                    <span>{formatAnimalAge(animal.age)}</span>
                    <span>-</span>
                    <span>{animal.activity_preference || 'Suka di rumah'}</span>
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="cta-card" onClick={requestLoginForAllAnimals}>
              <div className="cta-card-icon"><Icon name="plus" size={26} /></div>
              <p>Lihat Semua</p>
              <span>Login untuk melihat<br />hewan lengkap</span>
            </button>
          </div>
        </div>
      </section>

      <section id="process" className="section white">
        <div className="container">
          <div className="process-head">
            <div className="process-pill"><Icon name="info" size={14} /> Mudah &amp; Cepat</div>
            <h2>Cara Adopsi</h2>
            <p className="section-desc">Hanya 3 langkah sederhana untuk membawa hewan barumu pulang.</p>
          </div>
          <div className="steps">
            <div className="step-card">
              <div className="step-num">1</div>
              <div className="step-icon" style={{ background: '#eff6ff', color: '#60a5fa' }}><Icon name="userSearch" size={26} /></div>
              <h3>Pilih Hewan</h3>
              <p>Jelajahi galeri dan temukan hewan yang cocok denganmu.</p>
            </div>
            <div className="step-card">
              <div className="step-num">2</div>
              <div className="step-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}><Icon name="doc" size={26} /></div>
              <h3>Isi Formulir</h3>
              <p>Lengkapi data diri dan alasan adopsi singkat.</p>
            </div>
            <div className="step-card">
              <div className="step-num">3</div>
              <div className="step-icon" style={{ background: '#ecfdf5', color: '#10b981' }}><Icon name="homeHeart" size={26} /></div>
              <h3>Bawa Pulang</h3>
                <p>Datang ke shelter dan bawa hewan barumu pulang!</p>
            </div>
          </div>
          <div className="center-action">
            <button type="button" className="btn-main big" onClick={openPanel}><Icon name="rocket" size={16} /> Mulai Adopsi Sekarang</button>
          </div>
        </div>
      </section>

      <section className="cta-banner">
        {isVideoMedia(heroBackground) ? (
          <video src={heroBackground} autoPlay muted loop playsInline />
        ) : (
          <img src={heroBackground} alt="" />
        )}
        <div className="cta-content">
          <div className="cta-content-inner">
            <div className="cta-copy">
              <h2>Bersama Kita<br /><span>Ciptakan Harapan Baru</span> <span className="tail-wag"><Icon name="paw" size={24} /></span></h2>
              <p>Adopsi adalah langkah kecil yang membawa perubahan besar bagi kehidupan mereka.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">
                <div>{logoIsVideo ? <video src={appSettings.logo_apk} autoPlay muted loop playsInline /> : logoIsImage ? <img src={appSettings.logo_apk} alt="" /> : <span>{logoText}</span>}</div>
                <span>{appSettings.nama_apk}</span>
              </div>
              <p>Platform adopsi hewan terpercaya di Indonesia. Kami membantu menemukan rumah terbaik untuk hewan yang membutuhkan.</p>
              <div className="socials">
                <a href="#" aria-label="Instagram"><Icon name="instagram" size={16} /></a>
                <a href="#" aria-label="Twitter"><Icon name="twitter" size={16} /></a>
                <a href="#" aria-label="Youtube"><Icon name="youtube" size={16} /></a>
              </div>
            </div>
            <div>
              <h4>Navigasi</h4>
              <div className="footer-list">
                <a href="#hero">Beranda</a>
                <a href="#pets">Adopsi</a>
                <a href="#process">Cara Adopsi</a>
                <a href="#hero">Tentang Kami</a>
              </div>
            </div>
            <div>
              <h4>Bantuan</h4>
              <div className="footer-list">
                <a href="#hero">FAQ</a>
                <a href="#hero">Kontak</a>
                <a href="#hero">Kebijakan Privasi</a>
                <a href="#hero">Syarat &amp; Ketentuan</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 {appSettings.nama_apk}. Setiap hewan berhak atas rumah yang penuh kasih.</span>
            <span className="footer-safe"><Icon name="shield" size={13} /> Data terenkripsi &amp; aman</span>
          </div>
        </div>
      </footer>

      <div className={`panel-backdrop ${panelOpen ? 'open' : ''}`} onClick={closePanel} />
      {(panelOpen || closing) && (
        <aside className={`slide-panel ${panelOpen && !closing ? 'open' : ''} ${closing ? 'closing' : ''}`}>
          <div className="panel-head">
            <div className="panel-title">
              <div>{logoIsVideo ? <video src={appSettings.logo_apk} autoPlay muted loop playsInline /> : logoIsImage ? <img src={appSettings.logo_apk} alt="" /> : <span>{logoText}</span>}</div>
              <span>{appSettings.nama_apk}</span>
            </div>
            <button type="button" className="panel-close" onClick={closePanel} aria-label="Tutup"><Icon name="x" size={16} /></button>
          </div>
          <div className={`panel-body ${resetToken ? 'reset-mode' : ''}`}>
            {resetToken && (
              <>
                <h2 className="reset-title">Buat Password Baru</h2>
                <p className="reset-copy">Masukkan password baru untuk akun kamu.</p>
              </>
            )}
            <h2>Selamat Datang<br />Kembali <span className="dog-emoji">🐕</span></h2>
            <p>Masuk untuk mulai perjalanan adopsimu.</p>

            {!resetToken && <div className="social-row">
              <button type="button" className="social-btn" onClick={handleGoogleLogin}><GoogleIcon /> Google</button>
              <button type="button" className="social-btn" onClick={() => showToast('Info', 'Login Apple segera tersedia!', 'info')}><AppleIcon /> Apple</button>
            </div>}

            {!resetToken && <div className="panel-divider"><span>atau email</span></div>}

            {resetToken ? (
              <form className="panel-form reset-panel-form" onSubmit={handleResetPassword}>
                <div className="reset-panel-icon"><Icon name="lock" size={24} /></div>
                <div className="field">
                  <label htmlFor="reset-password">Password Baru</label>
                  <div className="input-wrap">
                    <span className="iw-icon"><Icon name="lock" size={16} /></span>
                    <input
                      id="reset-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan password baru"
                      value={resetPassword}
                      onChange={(event) => setResetPassword(event.target.value)}
                      required
                    />
                    <button type="button" className="eye-btn" onClick={() => setShowPassword((value) => !value)} aria-label="Tampilkan password">
                      <Icon name={showPassword ? 'eye' : 'eyeOff'} size={15} />
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-main panel-submit" disabled={loading}>
                  <span>{loading ? 'Menyimpan...' : 'Simpan Password Baru'}</span>
                  <Icon name="arrow" size={14} />
                </button>

                <button type="button" className="forgot" onClick={() => setResetToken('')}>Kembali ke login</button>
                {error && <div className="error-box"><Icon name="info" size={14} /><span>{error}</span></div>}
              </form>
            ) : (
            <form className="panel-form" onSubmit={handleLogin}>
              <div className="field">
                <label htmlFor="email">Email</label>
                <div className="input-wrap">
                  <span className="iw-icon"><Icon name="mail" size={16} /></span>
                  <input id="email" type="email" placeholder="namamu@email.com" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
                </div>
              </div>

              <div className="field">
                <div className="field-top">
                  <label htmlFor="password">Password</label>
                  <button type="button" className="forgot" onClick={handleForgotPassword}>LUPA?</button>
                </div>
                <div className="input-wrap">
                  <span className="iw-icon"><Icon name="lock" size={16} /></span>
                  <input id="password" type={showPassword ? 'text' : 'password'} placeholder="Masukkan password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
                  <button type="button" className="eye-btn" onClick={() => setShowPassword((value) => !value)} aria-label="Tampilkan password">
                    <Icon name={showPassword ? 'eye' : 'eyeOff'} size={15} />
                  </button>
                </div>
              </div>

              <div className="remember">
                <button type="button" className={`check-btn ${remember ? 'on' : ''}`} onClick={() => setRemember((value) => !value)} aria-label="Ingat saya">
                  {remember && <Icon name="check" size={10} />}
                </button>
                <span>Ingat saya</span>
              </div>

              <button type="submit" className="btn-main panel-submit" disabled={loading}>
                <span>{loading ? 'Memproses...' : 'Masuk ke Akun'}</span>
                <Icon name="arrow" size={14} />
              </button>

              {error && <div className="error-box"><Icon name="info" size={14} /><span>{error}</span></div>}
            </form>
            )}

            <div className="panel-signup">
              Belum punya akun? <button type="button" onClick={() => navigate('/register')}>Daftar gratis</button>
            </div>
          </div>
        </aside>
      )}

      {authModal && (
        <div className="auth-modal-backdrop" onClick={() => !loading && setAuthModal(null)}>
          <section className="auth-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
            <div className="auth-modal-head">
              <div className="auth-modal-title">
                <div className="auth-modal-mark">
                  {authModal === 'google' ? <GoogleIcon /> : <Icon name="mail" size={20} />}
                </div>
                <div>
                  <h3 id="auth-modal-title">{authModal === 'google' ? 'Pilih Email Google' : 'Reset Password'}</h3>
                  <p>{authModal === 'google' ? 'Masukkan email Google yang mau dipakai login.' : 'Masukkan email akun, nanti link reset dibuat.'}</p>
                </div>
              </div>
              <button type="button" className="auth-modal-close" onClick={() => setAuthModal(null)} disabled={loading} aria-label="Tutup popup">
                <Icon name="x" size={16} />
              </button>
            </div>

            <form className="auth-modal-form" onSubmit={authModal === 'google' ? submitGoogleLogin : submitForgotPassword}>
              <div className="field">
                <label htmlFor="auth-modal-email">{authModal === 'google' ? 'Email Google' : 'Email Akun'}</label>
                <div className="input-wrap">
                  <span className="iw-icon"><Icon name="mail" size={16} /></span>
                  <input
                    id="auth-modal-email"
                    type="email"
                    placeholder={authModal === 'google' ? 'emailgoogle@gmail.com' : 'emailakun@gmail.com'}
                    value={authModalEmail}
                    onChange={(event) => setAuthModalEmail(event.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {error && <div className="error-box"><Icon name="info" size={14} /><span>{error}</span></div>}

              <div className="auth-modal-actions">
                <button type="button" className="auth-modal-cancel" onClick={() => setAuthModal(null)} disabled={loading}>
                  Batal
                </button>
                <button type="submit" className="btn-main auth-modal-submit" disabled={loading}>
                  <span>{loading ? 'Memproses...' : authModal === 'google' ? 'Masuk Google' : 'Kirim Reset'}</span>
                  <Icon name="arrow" size={14} />
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}

export default Login
