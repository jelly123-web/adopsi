import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

function PengaturanSistem() {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  )
  const [formData, setFormData] = useState({
    nama_apk: 'Adopsi Hewan',
    warna_apk: '#0EA5E9',
    logo_apk: 'A',
    admin_name: 'Super Admin',
    admin_email: 'admin@adopsi.test'
  })
  const [logoPreview, setLogoPreview] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target.result
        setLogoPreview(base64)
        setFormData(prev => ({ ...prev, logo_apk: base64 }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.put('http://localhost:3000/api/superadmin/settings', formData)
      alert('Pengaturan berhasil disimpan!')
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal menyimpan pengaturan')
    } finally {
      setLoading(false)
    }
  }

  const loadSettings = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/superadmin/settings')
      if (response.data.data) {
        setFormData(response.data.data)
        if (response.data.data.logo_apk && response.data.data.logo_apk.startsWith('data:image')) {
          setLogoPreview(response.data.data.logo_apk)
        }
      }
    } catch (error) {
      console.error('Gagal memuat pengaturan:', error)
    }
  }

  useEffect(() => {
    loadSettings()
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
              <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
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
                <img src={logoPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
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
              <div className="topbar-page-title">Pengaturan Sistem</div>
            </div>
          </div>

          <div className="topbar-right">
            <button className="topbar-btn">
              <i className="fas fa-bell"></i>
              <span className="notif-dot"></span>
            </button>
            <a href="/dashboard/settings" className="topbar-btn active">
              <i className="fas fa-cog"></i>
            </a>
            <div className="live-indicator">
              <span className="live-dot"></span>
              LIVE
            </div>
          </div>
        </header>

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
                  <div className="form-row">
                    <div className="field">
                      <label htmlFor="logo_apk">Logo Aplikasi</label>
                      <div className="file-input-wrapper">
                        <input
                          type="file"
                          id="logo_apk"
                          accept="image/*"
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
                          <img
                            src={logoPreview}
                            alt="Logo Preview"
                            onClick={() => document.getElementById('logo_apk').click()}
                          />
                          <button
                            type="button"
                            className="photo-clear"
                            onClick={() => {
                              setLogoPreview(null)
                              setFormData(prev => ({ ...prev, logo_apk: 'A' }))
                            }}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="field">
                      <label htmlFor="warna_apk">Warna Tema</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', height: '48px' }}>
                        <input
                          type="color"
                          id="warna_apk"
                          name="warna_apk"
                          value={formData.warna_apk}
                          onChange={handleChange}
                          style={{
                            width: '80px',
                            height: '48px',
                            border: '1.5px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                        />
                        <span style={{ fontWeight: 700, color: 'var(--fg)' }}>{formData.warna_apk}</span>
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
                    <img 
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
                          <img 
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
    </div>
  )
}

export default PengaturanSistem
