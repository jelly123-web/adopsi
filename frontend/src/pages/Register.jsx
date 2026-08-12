import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from '../utils/api'
import { publishLiveData } from '../utils/liveDataEvents'

const defaultAppSettings = {
  nama_apk: 'Sahabat Kecil',
  warna_apk: '#60A5FA',
  logo_apk: '',
  hero_bg_apk: '',
  login_hero_title: 'Setiap Hewan\nLayak\nDicintai',
  login_hero_title_1: 'Setiap Hewan',
  login_hero_title_2: 'Layak',
  login_hero_highlight: 'Dicintai',
  login_hero_description: 'Jangan beli, adopsi. Berikan mereka kesempatan kedua untuk merasakan kehangatan keluarga.',
}

const isVideoMedia = (value = '') => value.startsWith('data:video') || /\.(mp4|webm|ogg)(\?|#|$)/i.test(value)

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
    x: <path d="M18 6 6 18M6 6l12 12" />,
    user: (
      <>
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
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
    role: <path d="M4 7h16M6 7v13h12V7M9 7V4h6v3M9 12h6M9 16h4" />,
    check: <path d="m5 12 4 4L19 6" />,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </>
    ),
  }

  return <svg {...common}>{paths[name]}</svg>
}

function Register() {
  const navigate = useNavigate()
  const [appSettings, setAppSettings] = useState(() => {
    const cached = localStorage.getItem('appSettings')
    if (!cached) return defaultAppSettings
    try {
      return { ...defaultAppSettings, ...JSON.parse(cached) }
    } catch {
      localStorage.removeItem('appSettings')
      return defaultAppSettings
    }
  })
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirm_password: '',
    role: 'costumer',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    axios.get(`/superadmin/settings`)
      .then((response) => {
        const settings = response.data?.data || {}
        localStorage.setItem('appSettings', JSON.stringify(settings))
        setAppSettings({ ...defaultAppSettings, ...settings })
      })
      .catch(() => {})

    const handleSettingsUpdated = (event) => {
      setAppSettings({ ...defaultAppSettings, ...(event.detail || {}) })
    }

    const handleStorage = (event) => {
      if (event.key !== 'appSettings' || !event.newValue) return
      try {
        setAppSettings({ ...defaultAppSettings, ...JSON.parse(event.newValue) })
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

  const logoIsImage = appSettings.logo_apk?.startsWith?.('data:image')
  const logoIsVideo = isVideoMedia(appSettings.logo_apk)
  const logoText = appSettings.logo_apk && !logoIsImage && !logoIsVideo ? appSettings.logo_apk : appSettings.nama_apk.charAt(0).toUpperCase()
  const themeColor = appSettings.warna_apk || '#60A5FA'
  const heroBackground = appSettings.hero_bg_apk || 'https://picsum.photos/seed/dog-sunset-golden-light/1920/1080.jpg'
  const heroTitle = appSettings.login_hero_title || [
    appSettings.login_hero_title_1 || defaultAppSettings.login_hero_title_1,
    appSettings.login_hero_title_2 || defaultAppSettings.login_hero_title_2,
    appSettings.login_hero_highlight || defaultAppSettings.login_hero_highlight,
  ].join('\n')
  const heroTitleLines = heroTitle.split(/\r?\n/).filter(Boolean)
  const heroDescription = appSettings.login_hero_description || defaultAppSettings.login_hero_description

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.address.trim() || !form.password) {
      setError('Nama, email, nomor HP, alamat, dan password wajib diisi.')
      return
    }

    if (form.password !== form.confirm_password) {
      setError('Konfirmasi password tidak cocok.')
      return
    }

    try {
      setLoading(true)
      const response = await axios.post(`/auth/register`, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        password: form.password,
        role: form.role,
      })
      const user = response.data?.data || {}
      const role = user.role || form.role || 'costumer'

      localStorage.setItem('authUserId', String(user.id || ''))
      localStorage.setItem('authName', user.name || form.name)
      localStorage.setItem('authRole', role)
      localStorage.setItem('authEmail', user.email || form.email)
      localStorage.setItem('authAvatar', user.profile_photo || '')
      localStorage.setItem('authPhone', user.phone || form.phone)
      localStorage.setItem('authAddress', user.address || form.address)
      localStorage.setItem('authRemember', '1')
      publishLiveData('customers')
      publishLiveData('users')

      navigate(
        role === 'superadmin' ? '/dashboard' : role === 'admin' ? '/admin' : role === 'petugas' ? '/petugas' : '/customer',
        { replace: true },
      )
    } catch (err) {
      const message = err.response?.status === 409
        ? 'Email sudah terdaftar. Gunakan email lain untuk membuat akun.'
        : err.response?.data?.message || 'Register gagal.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const logoMedia = logoIsVideo ? (
    <video src={appSettings.logo_apk} autoPlay muted loop playsInline />
  ) : logoIsImage ? (
    <img src={appSettings.logo_apk} alt="" />
  ) : (
    <span>{logoText}</span>
  )

  return (
    <main className="register-auth" style={{ '--register-accent': themeColor }}>
      <style>{`
        .register-auth, .register-auth * { box-sizing: border-box; font-family: Inter, system-ui, sans-serif; }
        .register-auth { min-height: 100vh; position: relative; overflow: hidden; background: #0f172a; color: #0f172a; }
        .register-bg { position: absolute; inset: 0; overflow: hidden; }
        .register-bg img, .register-bg video { width: 100%; height: 100%; object-fit: cover; display: block; filter: blur(8px); transform: scale(1.12); }
        .register-bg::before { content: ""; position: absolute; inset: 0; z-index: 1; background: linear-gradient(90deg, rgba(15,23,42,.68), rgba(15,23,42,.22) 58%, rgba(15,23,42,.08)); }
        .register-bg::after { content: ""; position: absolute; inset: 0; background: linear-gradient(0deg, rgba(15,23,42,.9), rgba(15,23,42,.48), rgba(15,23,42,.25)); backdrop-filter: blur(5px); }
        .register-nav { position: fixed; top: 0; left: 0; right: min(520px, 100%); z-index: 4; height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 clamp(20px, 8vw, 180px); filter: blur(2.5px); opacity: .72; }
        .register-nav-brand { display: flex; align-items: center; gap: 10px; color: #fff; text-decoration: none; }
        .register-nav-mark { width: 36px; height: 36px; border-radius: 12px; background: rgba(255,255,255,.2); border: 1px solid rgba(255,255,255,.3); color: #fff; display: grid; place-items: center; overflow: hidden; box-shadow: 0 10px 24px rgba(15,23,42,.2); backdrop-filter: blur(16px); }
        .register-nav-mark img, .register-nav-mark video { width: 100%; height: 100%; object-fit: cover; border-radius: inherit; display: block; }
        .register-nav-mark span { color: #fff; font-size: 15px; font-weight: 1000; }
        .register-nav-brand strong { color: #fff; font-size: 15px; font-weight: 1000; letter-spacing: -.03em; text-shadow: 0 8px 20px rgba(15,23,42,.3); }
        .register-nav-links { display: flex; align-items: center; gap: 4px; }
        .register-nav-links a { color: rgba(255,255,255,.72); text-decoration: none; font-size: 12px; font-weight: 800; padding: 8px 16px; border-radius: 10px; transition: all .2s ease; }
        .register-nav-links a:hover { color: #fff; background: rgba(255,255,255,.1); }
        .register-floats { position: absolute; inset: 0; z-index: 2; pointer-events: none; filter: blur(3px); opacity: .7; }
        .register-floats span { position: absolute; color: rgba(255,255,255,.13); }
        .register-floats .paw-a { top: 15%; left: 10%; animation: pawFade 5s ease-out infinite; }
        .register-floats .paw-b { top: 40%; right: 15%; animation: pawFade 5s ease-out 1s infinite; }
        .register-floats .paw-c { bottom: 30%; left: 25%; animation: pawFade 5s ease-out 2s infinite; }
        .register-floats .paw-d { bottom: 15%; right: 30%; animation: pawFade 5s ease-out 3s infinite; }
        .register-bg-copy { position: absolute; left: clamp(32px, 8vw, 182px); bottom: 88px; z-index: 3; max-width: 580px; color: #fff; filter: blur(4px); opacity: .72; }
        .register-hero-pill { display: inline-flex; align-items: center; gap: 8px; color: rgba(255,255,255,.82); background: rgba(255,255,255,.13); border: 1px solid rgba(255,255,255,.18); border-radius: 999px; padding: 8px 16px; font-size: 11px; font-weight: 1000; margin-bottom: 20px; box-shadow: 0 12px 30px rgba(15,23,42,.25); animation: fadeUp .8s .2s both; }
        .register-hero-pill i { width: 8px; height: 8px; border-radius: 999px; background: #34d399; flex-shrink: 0; }
        .register-bg-copy h1 { margin: 0; font-size: clamp(36px, 6vw, 68px); line-height: 1.05; font-weight: 1000; letter-spacing: -.06em; animation: fadeUp .8s .35s both; }
        .register-bg-copy h1 > span { color: #fff; }
        .register-bg-copy .hero-highlight-line { color: var(--register-accent); }
        .register-bg-copy p { margin: 20px 0 0; color: rgba(255,255,255,.58); font-size: 16px; line-height: 1.7; max-width: 440px; font-weight: 600; animation: fadeUp .8s .5s both; }
        .register-hero-actions { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 32px; animation: fadeUp .8s .65s both; }
        .register-hero-primary, .register-hero-secondary { min-width: 156px; height: 58px; border-radius: 15px; display: inline-flex; align-items: center; justify-content: center; gap: 10px; font-size: 14px; font-weight: 1000; text-decoration: none; border: 1px solid rgba(255,255,255,.16); }
        .register-hero-primary { background: linear-gradient(135deg, #38bdf8, #2563eb); color: #fff; box-shadow: 0 18px 42px rgba(37,99,235,.28); }
        .register-hero-secondary { background: rgba(255,255,255,.1); color: rgba(255,255,255,.88); backdrop-filter: blur(12px); }
        .register-panel { position: fixed; top: 0; right: 0; bottom: 0; z-index: 10; width: min(520px, 100%); background: #fff; box-shadow: -24px 0 70px rgba(15,23,42,.22); overflow-y: auto; animation: panelIn .45s cubic-bezier(.22,1,.36,1) both; }
        .panel-head { position: sticky; top: 0; z-index: 2; min-height: 86px; padding: 18px 38px; display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,.9); backdrop-filter: blur(20px); border-bottom: 1px solid #f1f5f9; }
        .panel-title { display: flex; align-items: center; gap: 10px; color: #0f172a; text-decoration: none; }
        .panel-title-mark { width: 46px; height: 46px; border-radius: 16px; background: linear-gradient(135deg, var(--register-accent), var(--register-accent)); color: #fff; display: grid; place-items: center; overflow: hidden; box-shadow: 0 8px 18px rgba(147,197,253,.35); }
        .panel-title-mark img, .panel-title-mark video { width: 100%; height: 100%; object-fit: cover; display: block; border-radius: inherit; }
        .panel-title-mark span { color: #fff; font-size: 17px; font-weight: 1000; line-height: 1; }
        .panel-title strong { display: block; font-size: 18px; line-height: 1; font-weight: 1000; letter-spacing: -.04em; }
        .panel-title small { display: none; }
        .panel-close { width: 40px; height: 40px; border-radius: 999px; border: 0; background: #f1f5f9; color: #94a3b8; display: grid; place-items: center; cursor: pointer; text-decoration: none; transition: all .2s ease; }
        .panel-close:hover { color: #475569; background: #e2e8f0; }
        .panel-body { padding: 14px 38px 28px; }
        .panel-body h2 { margin: 0; color: #0f172a; font-size: 28px; line-height: 1.18; font-weight: 1000; letter-spacing: -.05em; }
        .dog-emoji { display: inline-block; margin-left: 12px; font-size: 26px; animation: tailWag .35s ease-in-out infinite; transform-origin: bottom center; }
        .panel-body > p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 12px 0 0; }
        .social-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 30px 0 24px; }
        .social-btn { height: 54px; border: 1.5px solid #e2e8f0; background: #f8fafc; color: #475569; border-radius: 14px; font-size: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: all .25s cubic-bezier(.22,1,.36,1); }
        .social-btn:hover { border-color: #cbd5e1; background: #fff; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,.05); }
        .panel-divider { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
        .panel-divider::before, .panel-divider::after { content: ""; flex: 1; height: 1px; background: #f1f5f9; }
        .panel-divider span { color: #94a3b8; font-size: 11px; font-weight: 1000; letter-spacing: .16em; text-transform: uppercase; white-space: nowrap; }
        .panel-form { display: flex; flex-direction: column; gap: 14px; }
        .field label, .field-top label { display: block; color: #64748b; font-size: 11px; font-weight: 1000; letter-spacing: .16em; text-transform: uppercase; margin-bottom: 10px; }
        .field-top { display: flex; align-items: center; justify-content: space-between; }
        .forgot { border: 0; background: transparent; color: #60a5fa; font-size: 11px; font-weight: 1000; cursor: pointer; }
        .input-wrap { height: 56px; display: flex; align-items: center; gap: 0; background: #eef4fc; border: 1.5px solid #dce6f2; border-radius: 14px; overflow: hidden; transition: all .3s cubic-bezier(.22,1,.36,1); }
        .input-wrap:hover { border-color: #cbd5e1; background: #f8fafc; }
        .input-wrap:focus-within { border-color: #60a5fa; background: #fff; box-shadow: 0 0 0 4px rgba(96,165,250,.1), 0 8px 20px rgba(96,165,250,.08); }
        .iw-icon { width: 50px; height: 100%; color: #cbd5e1; display: grid; place-items: center; border-right: 1px solid #dce6f2; transition: color .3s ease; flex-shrink: 0; }
        .input-wrap:focus-within .iw-icon { color: #60a5fa; }
        .input-wrap input, .input-wrap select { all: unset; flex: 1; min-width: 0; height: 100%; padding: 0 16px; color: #0f172a; font-size: 15px; line-height: 56px; font-weight: 600; }
        .input-wrap input::placeholder { color: #cbd5e1; }
        .input-wrap select { cursor: pointer; }
        .eye-btn { width: 60px; height: 100%; border: 0; border-left: 1px solid #dce6f2; background: transparent; color: #cbd5e1; display: grid; place-items: center; cursor: pointer; flex-shrink: 0; }
        .panel-submit { width: 100%; height: 58px; border: 0; border-radius: 15px; background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 55%, #2563eb 100%); color: #fff; font-size: 15px; font-weight: 1000; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; margin-top: 2px; box-shadow: 0 16px 36px rgba(59,130,246,.24); }
        .panel-submit:disabled { opacity: .7; cursor: not-allowed; }
        .error-box { background: #fef2f2; border: 1px solid #fee2e2; color: #dc2626; font-size: 11px; font-weight: 800; padding: 12px 14px; border-radius: 14px; display: flex; align-items: flex-start; gap: 8px; }
        .panel-signup { margin-top: 24px; padding-bottom: 28px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #94a3b8; font-size: 15px; }
        .panel-signup a { color: #60a5fa; font-weight: 1000; text-decoration: none; }
        @keyframes panelIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pawFade { 0% { opacity: 0; transform: scale(.3) rotate(-25deg); } 35% { opacity: .5; } 100% { opacity: 0; transform: scale(1.3) rotate(20deg); } }
        @keyframes tailWag { 0%,100% { transform: rotate(-20deg); } 50% { transform: rotate(20deg); } }
        @media (max-width: 760px) {
          .register-nav { right: 0; padding: 0 20px; }
          .register-nav-links { display: none; }
          .register-bg-copy { display: none; }
          .register-panel { width: 100%; }
          .panel-head { padding: 16px 24px; }
          .panel-body { padding: 22px 24px 30px; }
          .panel-body h2 { font-size: 28px; }
        }
      `}</style>

      <div className="register-bg">
        {isVideoMedia(heroBackground) ? (
          <video src={heroBackground} autoPlay muted loop playsInline />
        ) : (
          <img src={heroBackground} alt="" />
        )}
        <div className="register-floats">
          <span className="paw-a"><Icon name="paw" size={60} /></span>
          <span className="paw-b"><Icon name="paw" size={50} /></span>
          <span className="paw-c"><Icon name="paw" size={70} /></span>
          <span className="paw-d"><Icon name="paw" size={42} /></span>
        </div>
        <div className="register-bg-copy">
          <div className="register-hero-pill"><i /> <span>0 hewan sedang menunggu rumah baru</span></div>
          <h1>
            {heroTitleLines.length > 0 ? heroTitleLines.map((line, index) => {
              const isLast = index === heroTitleLines.length - 1
              return (
                <span key={`${line}-${index}`} className={isLast ? 'hero-highlight-line' : undefined}>
                  {line}
                  {index < heroTitleLines.length - 1 && <br />}
                </span>
              )
            }) : (
              <>
                Setiap Hewan<br />Layak<br /><span className="hero-highlight-line">Dicintai</span>
              </>
            )}
          </h1>
          <p>{heroDescription}</p>
          <div className="register-hero-actions">
            <Link to="/login#panel" className="register-hero-primary"><Icon name="arrow" size={16} /> Masuk &amp; Adopsi</Link>
            <Link to="/login#pets" className="register-hero-secondary">Jelajahi</Link>
          </div>
        </div>
      </div>

      <nav className="register-nav">
        <Link to="/login#hero" className="register-nav-brand">
          <div className="register-nav-mark">{logoMedia}</div>
          <strong>{appSettings.nama_apk}</strong>
        </Link>
        <div className="register-nav-links">
          <Link to="/login#hero">Beranda</Link>
          <Link to="/login#pets">Adopsi</Link>
          <Link to="/login#process">Cara Adopsi</Link>
        </div>
      </nav>

      <aside className="register-panel">
        <div className="panel-head">
          <Link to="/login#panel" className="panel-title">
            <div className="panel-title-mark">{logoMedia}</div>
            <span>
              <strong>{appSettings.nama_apk}</strong>
              <small>Daftar akun</small>
            </span>
          </Link>
          <Link to="/login" className="panel-close" aria-label="Tutup">
            <Icon name="x" size={16} />
          </Link>
        </div>

        <div className="panel-body">
          <h2>Daftar Akun <span className="dog-emoji">Ã°Å¸Ââ€¢</span></h2>
          <p>Silahkan daftar.</p>

          <form className="panel-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="register-name">Nama</label>
              <div className="input-wrap">
                <span className="iw-icon"><Icon name="user" size={16} /></span>
                <input id="register-name" type="text" name="name" value={form.name} onChange={handleChange} placeholder="Nama lengkap" required />
              </div>
            </div>

            <div className="field">
              <label htmlFor="register-email">Email</label>
              <div className="input-wrap">
                <span className="iw-icon"><Icon name="mail" size={16} /></span>
                <input id="register-email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="nama@email.com" required />
              </div>
            </div>

            <div className="field">
              <label htmlFor="register-phone">No. Telepon</label>
              <div className="input-wrap">
                <span className="iw-icon"><Icon name="info" size={16} /></span>
                <input id="register-phone" type="text" name="phone" value={form.phone} onChange={handleChange} placeholder="08xxxxxxxxxx" required />
              </div>
            </div>

            <div className="field">
              <label htmlFor="register-address">Alamat Lengkap</label>
              <div className="input-wrap">
                <span className="iw-icon"><Icon name="info" size={16} /></span>
                <input id="register-address" type="text" name="address" value={form.address} onChange={handleChange} placeholder="Alamat lengkap" required />
              </div>
            </div>

            <div className="field">
              <div className="field-top">
                <label htmlFor="register-password">Password</label>
              </div>
              <div className="input-wrap">
                <span className="iw-icon"><Icon name="lock" size={16} /></span>
                <input id="register-password" type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="Masukkan password" required />
                <button type="button" className="eye-btn" onClick={() => setShowPassword((value) => !value)} aria-label="Tampilkan password">
                  <Icon name={showPassword ? 'eye' : 'eyeOff'} size={15} />
                </button>
              </div>
            </div>

            <div className="field">
              <label htmlFor="register-confirm-password">Konfirmasi Password</label>
              <div className="input-wrap">
                <span className="iw-icon"><Icon name="lock" size={16} /></span>
                <input id="register-confirm-password" type={showConfirmPassword ? 'text' : 'password'} name="confirm_password" value={form.confirm_password} onChange={handleChange} placeholder="Ulangi password" required />
                <button type="button" className="eye-btn" onClick={() => setShowConfirmPassword((value) => !value)} aria-label="Tampilkan konfirmasi password">
                  <Icon name={showConfirmPassword ? 'eye' : 'eyeOff'} size={15} />
                </button>
              </div>
            </div>

            {error && <div className="error-box"><Icon name="info" size={14} /><span>{error}</span></div>}

            <button type="submit" className="panel-submit" disabled={loading}>
              <span>{loading ? 'Mendaftarkan...' : 'Daftar Akun'}</span>
              <Icon name={loading ? 'check' : 'arrow'} size={14} />
            </button>
          </form>

          <div className="panel-signup">
            Sudah punya akun? <Link to="/login#panel">Masuk</Link>
          </div>
        </div>
      </aside>
    </main>
  )
}

export default Register
