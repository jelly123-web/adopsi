import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import SuperadminNavbar from '../components/SuperadminNavbar'
import SuperadminSidebar from '../components/SuperadminSidebar'
import CustomerLayout from '../components/CustomerLayout'

const API_BASE_URL = 'http://localhost:3000/api'

const roleLabels = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  petugas: 'Petugas',
  costumer: 'Customer',
}

const emptyProfile = {
  admin_name: '',
  admin_email: '',
  admin_phone: '',
  admin_address: '',
  admin_avatar: '',
  current_password: '',
  new_password: '',
  confirm_password: '',
}

const MEDIA_ACCEPT = 'image/*,video/mp4,video/webm,video/*'
const isVideoMedia = (value = '') => value.startsWith('data:video') || /\.(mp4|webm|ogg)(\?|#|$)/i.test(value)

function Profile() {
  const navigate = useNavigate()
  const authUserId = localStorage.getItem('authUserId')
  const authRole = localStorage.getItem('authRole') || 'costumer'
  const roleLabel = roleLabels[authRole] || 'Akun'
  const profileEndpoint = authUserId ? `${API_BASE_URL}/profile/${authUserId}` : ''
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true,
  )
  const [formData, setFormData] = useState(() => ({
    ...emptyProfile,
    admin_name: localStorage.getItem('authName') || roleLabel,
    admin_email: localStorage.getItem('authEmail') || '',
    admin_phone: localStorage.getItem('authPhone') || '',
    admin_address: localStorage.getItem('authAddress') || '',
    admin_avatar: localStorage.getItem('authAvatar') || '',
  }))
  const [saving, setSaving] = useState(false)

  const avatarInitial = useMemo(() => {
    return (formData.admin_name || roleLabel || 'A')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
  }, [formData.admin_name, roleLabel])

  const loadProfile = async () => {
    if (!profileEndpoint) {
      navigate('/login', { replace: true })
      return
    }

    try {
      const response = await axios.get(profileEndpoint)
      const data = response.data.data || {}
      setFormData((current) => ({
        ...current,
        admin_name: data.admin_name || data.name || current.admin_name,
        admin_email: data.admin_email || data.email || current.admin_email,
        admin_phone: data.admin_phone || data.phone || current.admin_phone,
        admin_address: data.admin_address || data.address || current.admin_address,
        admin_avatar: data.admin_avatar || data.profile_photo || '',
        current_password: '',
        new_password: '',
        confirm_password: '',
      }))
      localStorage.setItem('authName', data.admin_name || data.name || '')
      localStorage.setItem('authEmail', data.admin_email || data.email || '')
      localStorage.setItem('authPhone', data.admin_phone || data.phone || '')
      localStorage.setItem('authAddress', data.admin_address || data.address || '')
      localStorage.setItem('authAvatar', data.admin_avatar || data.profile_photo || '')
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal memuat profil.')
    }
  }

  useEffect(() => {
    loadProfile()
  }, [profileEndpoint])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setFormData((current) => ({ ...current, admin_avatar: result }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (formData.new_password || formData.confirm_password) {
      if (formData.new_password !== formData.confirm_password) {
        window.alert('Konfirmasi password tidak cocok.')
        return
      }
    }

    setSaving(true)
    try {
      const response = await axios.put(profileEndpoint, formData)
      const data = response.data?.data || {}
      localStorage.setItem('authName', data.admin_name || data.name || formData.admin_name)
      localStorage.setItem('authEmail', data.admin_email || data.email || formData.admin_email)
      localStorage.setItem('authPhone', data.admin_phone || data.phone || formData.admin_phone)
      localStorage.setItem('authAddress', data.admin_address || data.address || formData.admin_address)
      localStorage.setItem('authAvatar', data.admin_avatar || data.profile_photo || formData.admin_avatar || '')
      window.alert('Profil berhasil disimpan.')
      await loadProfile()
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal menyimpan profil.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    loadProfile()
  }

  const formContent = (
    <section className="content page-body profile-page">
      <header className="profile-hero">
        <div className="profile-hero-avatar-wrap">
          <div className="profile-hero-avatar">
            {formData.admin_avatar ? (
              isVideoMedia(formData.admin_avatar) ? (
                <video src={formData.admin_avatar} autoPlay muted loop playsInline />
              ) : (
                <img src={formData.admin_avatar} alt="Avatar akun" />
              )
            ) : <span>{avatarInitial}</span>}
          </div>
          <p className="profile-hero-note">Foto profil dipakai untuk identitas akun.</p>
        </div>

        <div className="profile-hero-copy">
          <span className="profile-chip">{roleLabel}</span>
          <h1>{formData.admin_name || roleLabel}</h1>
          <p>Kelola detail akun, foto profil, dan password dari halaman ini.</p>
        </div>
      </header>

      <form className="profile-card" onSubmit={handleSubmit}>
        <div className="profile-card-head">
          <div>
            <h2>Account Details</h2>
            <p>Main user info</p>
          </div>
        </div>

        <div className="profile-section-title">
          <span>Nama Akun</span>
          <small>Data utama akun</small>
        </div>

        <div className="profile-fields profile-fields-two">
          <label>
            Nama Lengkap
            <input
              type="text"
              name="admin_name"
              value={formData.admin_name}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              name="admin_email"
              value={formData.admin_email}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        {authRole === 'costumer' && (
          <>
            <div className="profile-section-title">
              <span>Alamat & Kontak</span>
              <small>Untuk keperluan pengajuan adopsi</small>
            </div>
            <div className="profile-fields profile-fields-two">
              <label>
                Nomor Telepon
                <input
                  type="text"
                  name="admin_phone"
                  value={formData.admin_phone}
                  onChange={handleChange}
                />
              </label>
              <label>
                Alamat Lengkap
                <input
                  type="text"
                  name="admin_address"
                  value={formData.admin_address}
                  onChange={handleChange}
                />
              </label>
            </div>
          </>
        )}

        <div className="profile-upload-strip">
          <div className="profile-upload-copy">
            <label>Foto Profil</label>
          </div>
          <label className="profile-upload-button">
            Choose Profile Photo
            <input type="file" accept={MEDIA_ACCEPT} onChange={handleAvatarUpload} />
          </label>
        </div>

        <div className="profile-section-title profile-section-title-spaced">
          <span>Account Security</span>
          <small>Leave blank if you do not want to change the password</small>
        </div>

        <div className="profile-fields profile-fields-two">
          <label>
            Password Saat Ini
            <input
              type="password"
              name="current_password"
              value={formData.current_password}
              onChange={handleChange}
              placeholder="Masukkan password saat ini"
            />
          </label>
          <label>
            Password Baru
            <input
              type="password"
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              placeholder="Masukkan password baru"
            />
          </label>
          <label>
            Konfirmasi Password
            <input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              placeholder="Ulangi password baru"
            />
          </label>
        </div>

        <div className="profile-actions">
          <button type="button" className="profile-secondary-button" onClick={handleReset}>
            Reset
          </button>
          <button type="submit" className="profile-primary-button" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
        </div>
      </form>
    </section>
  )

  if (authRole === 'costumer') {
    return (
      <CustomerLayout>
        <main className="customer-page" style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          {formContent}
        </main>
      </CustomerLayout>
    )
  }

  return (
    <div className="dashboard-layout">
      <SuperadminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={`main-content ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
        <SuperadminNavbar
          pageTitle="Profil Akun"
          statusLabel="LIVE"
          onToggleSidebar={() => setSidebarOpen((current) => !current)}
          sidebarOpen={sidebarOpen}
          offsetForSidebar={false}
        />
        {formContent}
      </main>
    </div>
  )
}

export default Profile
