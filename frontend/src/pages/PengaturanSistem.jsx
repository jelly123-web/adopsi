import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import CropModal from '../components/CropModal'
import SuperadminNavbar from '../components/SuperadminNavbar'
import { publishLiveData } from '../utils/liveDataEvents'

const API_BASE_URL = 'http://localhost:3000/api'
const defaultSettings = {
  nama_apk: 'Adopsi Hewan',
  warna_apk: '#0EA5E9',
  logo_apk: 'A',
  hero_bg_apk: '',
  login_hero_title: 'Setiap Hewan\nLayak\nDicintai',
  login_hero_title_1: 'Setiap Hewan',
  login_hero_title_2: 'Layak',
  login_hero_highlight: 'Dicintai',
  login_hero_description: 'Jangan beli, adopsi. Berikan mereka kesempatan kedua untuk merasakan kehangatan keluarga.',
  login_hero_badge_text: 'hewan sedang menunggu rumah baru',
  login_hero_primary_button: 'Masuk & Adopsi',
  login_hero_secondary_button: 'Jelajahi',
  dashboard_bg_apk: '',
  admin_name: 'Super Admin',
  admin_email: 'admin@adopsi.test'
}

const MEDIA_ACCEPT = 'image/*,video/mp4,video/webm,video/*'
const isVideoMedia = (value = '') => value.startsWith('data:video') || /\.(mp4|webm|ogg)(\?|#|$)/i.test(value)

function MediaPreview({ src, alt = '', className = '', style, onClick }) {
  if (!src) return null
  if (isVideoMedia(src)) {
    return (
      <video
        src={src}
        className={className}
        style={style}
        onClick={onClick}
        autoPlay
        muted
        loop
        playsInline
      />
    )
  }
  return <img src={src} alt={alt} className={className} style={style} onClick={onClick} />
}

function PengaturanSistem() {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  )
  const [formData, setFormData] = useState(defaultSettings)
  const [logoPreview, setLogoPreview] = useState(null)
  const [heroPreview, setHeroPreview] = useState('')
  const [dashboardPreview, setDashboardPreview] = useState('')
  const [cropOpen, setCropOpen] = useState(false)
  const [cropSource, setCropSource] = useState('')
  const [cropTarget, setCropTarget] = useState('logo')
  const [cropZoom, setCropZoom] = useState(1)
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, ox: 0, oy: 0 })
  const [loading, setLoading] = useState(false)
  const cropImgRef = useRef(null)

  const publishSettings = (nextSettings) => {
    localStorage.setItem('appSettings', JSON.stringify(nextSettings))
    window.dispatchEvent(new CustomEvent('app-settings-updated', { detail: nextSettings }))
    publishLiveData('settings', nextSettings)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const next = { ...prev, [name]: value }
      publishSettings(next)
      return next
    })
  }

  const openCropper = (file, target) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target.result
      if (file.type.startsWith('video/')) {
        if (target === 'logo') {
          setLogoPreview(result)
          setFormData(prev => {
            const next = { ...prev, logo_apk: result }
            publishSettings(next)
            return next
          })
        } else if (target === 'hero') {
          setHeroPreview(result)
          setFormData(prev => {
            const next = { ...prev, hero_bg_apk: result }
            publishSettings(next)
            return next
          })
        } else {
          setDashboardPreview(result)
          setFormData(prev => {
            const next = { ...prev, dashboard_bg_apk: result }
            publishSettings(next)
            return next
          })
        }
        return
      }
      setCropTarget(target)
      setCropSource(result)
      setCropZoom(1)
      setCropOffset({ x: 0, y: 0 })
      setCropOpen(true)
    }
    reader.readAsDataURL(file)
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    openCropper(file, 'logo')
    e.target.value = ''
  }

  const handleHeroChange = (e) => {
    const file = e.target.files[0]
    openCropper(file, 'hero')
    e.target.value = ''
  }

  const handleDashboardBgChange = (e) => {
    const file = e.target.files[0]
    openCropper(file, 'dashboard')
    e.target.value = ''
  }

  const openExistingCrop = (target) => {
    const source = target === 'logo' ? logoPreview : target === 'hero' ? heroPreview : dashboardPreview
    if (!source) return
    if (isVideoMedia(source)) return
    setCropTarget(target)
    setCropSource(source)
    setCropZoom(1)
    setCropOffset({ x: 0, y: 0 })
    setCropOpen(true)
  }

  const applyCrop = () => {
    const img = cropImgRef.current
    if (!img) return

    const isLogo = cropTarget === 'logo'
    const outputWidth = isLogo ? 512 : 1600
    const outputHeight = isLogo ? 512 : 900
    const canvas = document.createElement('canvas')
    canvas.width = outputWidth
    canvas.height = outputHeight
    const ctx = canvas.getContext('2d')
    const scale = Math.max(outputWidth / img.naturalWidth, outputHeight / img.naturalHeight) * cropZoom
    const width = img.naturalWidth * scale
    const height = img.naturalHeight * scale
    const x = (outputWidth - width) / 2 + cropOffset.x
    const y = (outputHeight - height) / 2 + cropOffset.y

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, outputWidth, outputHeight)
    ctx.drawImage(img, x, y, width, height)
    const result = canvas.toDataURL('image/jpeg', 0.9)

    if (isLogo) {
      setLogoPreview(result)
      setFormData(prev => {
        const next = { ...prev, logo_apk: result }
        publishSettings(next)
        return next
      })
    } else if (cropTarget === 'hero') {
      setHeroPreview(result)
      setFormData(prev => {
        const next = { ...prev, hero_bg_apk: result }
        publishSettings(next)
        return next
      })
    } else {
      setDashboardPreview(result)
      setFormData(prev => {
        const next = { ...prev, dashboard_bg_apk: result }
        publishSettings(next)
        return next
      })
    }
    setCropOpen(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.put(`${API_BASE_URL}/superadmin/settings`, formData)
      document.documentElement.style.setProperty('--app-accent', formData.warna_apk || '#0EA5E9')
      if (formData.dashboard_bg_apk) {
        document.documentElement.style.setProperty('--dashboard-bg-image', `url("${formData.dashboard_bg_apk}")`)
        document.body.classList.add('has-dashboard-bg')
      } else {
        document.documentElement.style.removeProperty('--dashboard-bg-image')
        document.body.classList.remove('has-dashboard-bg')
      }
      publishSettings(formData)
      alert('Pengaturan berhasil disimpan!')
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal menyimpan pengaturan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let alive = true

    axios.get(`${API_BASE_URL}/superadmin/settings`)
      .then((response) => {
        if (!alive || !response.data.data) return
        const settings = { ...defaultSettings, ...response.data.data }
        setFormData(settings)
        publishSettings(settings)
        if (settings.logo_apk && (settings.logo_apk.startsWith('data:image') || isVideoMedia(settings.logo_apk))) {
          setLogoPreview(settings.logo_apk)
        }
        if (settings.hero_bg_apk && (settings.hero_bg_apk.startsWith('data:image') || isVideoMedia(settings.hero_bg_apk))) {
          setHeroPreview(settings.hero_bg_apk)
        }
        if (settings.dashboard_bg_apk && (settings.dashboard_bg_apk.startsWith('data:image') || isVideoMedia(settings.dashboard_bg_apk))) {
          setDashboardPreview(settings.dashboard_bg_apk)
        }
      })
      .catch((error) => {
        console.error('Gagal memuat pengaturan:', error)
      })

    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo" style={{ 
            background: logoPreview ? 'transparent' : `linear-gradient(135deg, ${formData.warna_apk} 0%, ${formData.warna_apk}dd 100%)`,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {logoPreview ? (
              <MediaPreview src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
            ) : (
              formData.logo_apk
            )}
          </div>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-name">{formData.nama_apk}</div>
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
          <a href="/dashboard/adoptions/verify" className="nav-item">
            <i className="fas fa-check-circle"></i>
            <span>Verifikasi Adopsi</span>
          </a>
          <a href="/dashboard/customers" className="nav-item">
            <i className="fas fa-address-book"></i>
            <span>Data Customer</span>
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
          <Link to="/dashboard/profile" className="sidebar-user" style={{ cursor: 'pointer' }}>
            <div className="sidebar-avatar" style={{ 
              background: logoPreview ? 'transparent' : `linear-gradient(135deg, ${formData.warna_apk} 0%, ${formData.warna_apk}dd 100%)`,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {logoPreview ? (
                <MediaPreview src={logoPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                formData.admin_name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{formData.admin_name}</div>
              <div className="sidebar-user-email">{formData.admin_email}</div>
            </div>
          </Link>
          <button 
            className="sidebar-logout-btn"
            onClick={() => {
              localStorage.removeItem('authUserId')
              localStorage.removeItem('authName')
              localStorage.removeItem('authRole')
              localStorage.removeItem('authEmail')
              localStorage.removeItem('authRemember')
              window.location.href = '/login'
            }}
          >
            <i className="fas fa-sign-out-alt"></i> Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
        <SuperadminNavbar
          pageTitle="Pengaturan Sistem"
          sidebarOpen={sidebarOpen}
          offsetForSidebar={false}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />

        {/* Page Body */}
        <div className="page-body">
          <div className="page-header">
            <h1 className="page-header-title">
              <i className="fas fa-sliders-h"></i>
              Pengaturan Aplikasi
            </h1>
            <p className="page-header-desc">
              Kelola pengaturan umum aplikasi seperti nama, logo, dan warna tema.
            </p>
          </div>

          <div className="settings-shell">
            <div className="settings-card">
              <div className="card-head">
                <h2><i className="fas fa-palette"></i> Pengaturan Aplikasi</h2>
              </div>
              <p>Ubah informasi dasar dan tampilan aplikasi sesuai kebutuhanmu.</p>

              <div className="settings-grid">
                <form className="settings-form" onSubmit={handleSubmit}>
                  <div className="field">
                    <label htmlFor="nama_apk">Nama Aplikasi</label>
                    <input
                      type="text"
                      id="nama_apk"
                      name="nama_apk"
                      value={formData.nama_apk}
                      onChange={handleChange}
                      placeholder="Masukkan nama aplikasi"
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="login_hero_title">Judul Hero Login</label>
                    <textarea
                      id="login_hero_title"
                      name="login_hero_title"
                      value={formData.login_hero_title || [
                        formData.login_hero_title_1,
                        formData.login_hero_title_2,
                        formData.login_hero_highlight,
                      ].filter(Boolean).join('\n')}
                      onChange={handleChange}
                      placeholder={'Setiap Hewan\nLayak\nDicintai'}
                      rows={3}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="login_hero_description">Deskripsi Hero Login</label>
                    <textarea
                      id="login_hero_description"
                      name="login_hero_description"
                      value={formData.login_hero_description}
                      onChange={handleChange}
                      placeholder="Tulis deskripsi hero halaman login"
                      rows={3}
                    />
                  </div>
                  <div className="form-row">
                    <div className="field">
                      <label htmlFor="logo_apk">Logo Aplikasi</label>
                      <div className="file-input-wrapper">
                        <input
                          type="file"
                          id="logo_apk"
                          accept={MEDIA_ACCEPT}
                          onChange={handleLogoChange}
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          className="file-custom-btn"
                          onClick={() => document.getElementById('logo_apk').click()}
                        >
                          <i className="fas fa-upload"></i> Pilih Foto
                        </button>
                        {logoPreview && (
                          <span className="file-name">
                            Foto telah dipilih
                          </span>
                        )}
                      </div>
                      {logoPreview && (
                        <div className="selected-photo">
                          <MediaPreview
                            src={logoPreview}
                            alt="Logo Preview"
                            onClick={() => !isVideoMedia(logoPreview) && openExistingCrop('logo')}
                          />
                          <button
                            type="button"
                            className="photo-clear"
                            onClick={() => {
                              setLogoPreview(null)
                              setFormData(prev => {
                                const next = { ...prev, logo_apk: 'A' }
                                publishSettings(next)
                                return next
                              })
                            }}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="field">
                      <label htmlFor="hero_bg_apk">Background Halaman Login</label>
                      <div className="file-input-wrapper">
                        <input
                          type="file"
                          id="hero_bg_apk"
                          accept={MEDIA_ACCEPT}
                          onChange={handleHeroChange}
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          className="file-custom-btn"
                          onClick={() => document.getElementById('hero_bg_apk').click()}
                        >
                          <i className="fas fa-image"></i> Pilih Background
                        </button>
                      </div>
                      {heroPreview && (
                        <div className="settings-hero-preview">
                          <MediaPreview src={heroPreview} alt="Background Login" onClick={() => !isVideoMedia(heroPreview) && openExistingCrop('hero')} />
                          <button
                            type="button"
                            className="photo-clear"
                            onClick={() => {
                              setHeroPreview('')
                              setFormData(prev => {
                                const next = { ...prev, hero_bg_apk: '' }
                                publishSettings(next)
                                return next
                              })
                            }}
                          >
                            x
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="field">
                      <label htmlFor="dashboard_bg_apk">Background Semua Halaman Dashboard</label>
                      <div className="file-input-wrapper">
                        <input
                          type="file"
                          id="dashboard_bg_apk"
                          accept={MEDIA_ACCEPT}
                          onChange={handleDashboardBgChange}
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          className="file-custom-btn"
                          onClick={() => document.getElementById('dashboard_bg_apk').click()}
                        >
                          <i className="fas fa-image"></i> Pilih Background Dashboard
                        </button>
                      </div>
                      {dashboardPreview && (
                        <div className="settings-hero-preview">
                          <MediaPreview src={dashboardPreview} alt="Background Dashboard" onClick={() => !isVideoMedia(dashboardPreview) && openExistingCrop('dashboard')} />
                          <button
                            type="button"
                            className="photo-clear"
                            onClick={() => {
                              setDashboardPreview('')
                              setFormData(prev => {
                                const next = { ...prev, dashboard_bg_apk: '' }
                                publishSettings(next)
                                return next
                              })
                            }}
                          >
                            x
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="field settings-color-field">
                      <label htmlFor="warna_apk">Warna Tema</label>
                      <div className="settings-color-control">
                        <input
                          type="color"
                          id="warna_apk"
                          name="warna_apk"
                          value={formData.warna_apk}
                          onChange={handleChange}
                        />
                        <span>{formData.warna_apk}</span>
                      </div>
                    </div>
                  </div>

                  <div className="drawer-buttons" style={{ marginTop: '24px', paddingTop: 0 }}>
                    <button type="submit" className="btn-primary btn" disabled={loading}>
                      {loading ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> Menyimpan...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save"></i> Simpan Pengaturan
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="preview-box">
                  <div className="preview-label">
                    <i className="fas fa-eye"></i> Preview
                  </div>
                  {logoPreview ? (
                    <MediaPreview
                      src={logoPreview}
                      alt="Logo Preview"
                      style={{ 
                        width: '100px', 
                        height: '100px', 
                        objectFit: 'cover', 
                        borderRadius: '22px',
                        boxShadow: '0 6px 20px rgba(14, 165, 233, 0.25)'
                      }} 
                    />
                  ) : (
                    <div className="placeholder" style={{ background: `linear-gradient(135deg, ${formData.warna_apk} 0%, ${formData.warna_apk}dd 100%)` }}>
                      {formData.logo_apk}
                    </div>
                  )}
                  <strong>{formData.nama_apk}</strong>
                  <small>{formData.admin_name}</small>

                  <div className="preview-sim">
                    <div className="preview-sim-header">
                      <div className="preview-sim-logo" style={{ 
                        background: logoPreview ? 'transparent' : `linear-gradient(135deg, ${formData.warna_apk} 0%, ${formData.warna_apk}dd 100%)`,
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {logoPreview ? (
                          <MediaPreview
                            src={logoPreview}
                            alt="Preview Logo"
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover', 
                              borderRadius: '8px' 
                            }} 
                          />
                        ) : (
                          formData.logo_apk
                        )}
                      </div>
                      <div className="preview-sim-name">{formData.nama_apk}</div>
                    </div>
                    <div style={{ padding: '12px' }}>
                      <div style={{ height: '6px', borderRadius: '3px', background: 'var(--border-light)', marginBottom: '6px' }}></div>
                      <div style={{ height: '6px', borderRadius: '3px', background: 'var(--border-light)', width: '60%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <CropModal open={cropOpen} onClose={() => setCropOpen(false)}>
        <div className="crop-modal-body settings-crop-body">
          <div className="crop-modal-head">
            <div>
              <h3>
                Crop {cropTarget === 'logo' ? 'Logo Aplikasi' : cropTarget === 'hero' ? 'Background Login' : 'Background Dashboard'}
              </h3>
              <p>Geser gambar dan atur zoom sampai posisinya pas.</p>
            </div>
            <button type="button" className="crop-close" onClick={() => setCropOpen(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div
            className={`settings-crop-stage ${cropTarget === 'logo' ? 'logo' : 'hero-bg'}`}
            onMouseDown={(event) => {
              setDragging(true)
              setDragStart({ x: event.clientX, y: event.clientY, ox: cropOffset.x, oy: cropOffset.y })
            }}
            onMouseMove={(event) => {
              if (!dragging) return
              setCropOffset({
                x: dragStart.ox + event.clientX - dragStart.x,
                y: dragStart.oy + event.clientY - dragStart.y,
              })
            }}
            onMouseUp={() => setDragging(false)}
            onMouseLeave={() => setDragging(false)}
          >
            <img
              ref={cropImgRef}
              src={cropSource}
              alt="Crop"
              draggable="false"
              style={{
                transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropZoom})`,
              }}
            />
            <div className="settings-crop-frame"></div>
          </div>
          <div className="crop-actions">
            <label className="crop-zoom-control">
              <span>Zoom</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={cropZoom}
                onChange={(event) => setCropZoom(Number(event.target.value))}
              />
            </label>
            <div className="crop-action-buttons">
              <button type="button" className="crop-reset-btn" onClick={() => {
                setCropZoom(1)
                setCropOffset({ x: 0, y: 0 })
              }}>
                Reset
              </button>
              <button type="button" className="btn-primary btn" onClick={applyCrop}>
                Simpan Crop
              </button>
            </div>
          </div>
        </div>
      </CropModal>
    </div>
  )
}

export default PengaturanSistem
