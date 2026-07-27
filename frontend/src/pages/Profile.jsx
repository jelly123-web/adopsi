import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import SuperadminNavbar from '../components/SuperadminNavbar'
import SuperadminSidebar from '../components/SuperadminSidebar'

const emptyProfile = {
  admin_name: 'Super Admin',
  admin_email: 'admin@adopsi.test',
  admin_avatar: '',
  current_password: '',
  new_password: '',
  confirm_password: '',
}

function Profile() {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true,
  )
  const [formData, setFormData] = useState(emptyProfile)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const avatarInitial = useMemo(() => {
    return (formData.admin_name || 'S')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
  }, [formData.admin_name])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:3000/api/superadmin/profile')
      const data = response.data.data || {}
      setFormData((current) => ({
        ...current,
        admin_name: data.admin_name || current.admin_name,
        admin_email: data.admin_email || current.admin_email,
        admin_avatar: data.admin_avatar || '',
        current_password: '',
        new_password: '',
        confirm_password: '',
      }))
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal memuat profil.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

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
      await axios.put('http://localhost:3000/api/superadmin/profile', formData)
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

  return (
    <>
      <SuperadminNavbar
        pageKicker="Profil"
        pageTitle="Profil Admin"
        statusLabel="LIVE"
        onToggleSidebar={() => setSidebarOpen((current) => !current)}
        sidebarOpen={sidebarOpen}
      />

      <main className={`main-content ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
        <SuperadminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <section className="content page-body profile-page">
          <header className="profile-hero">
            <div className="profile-hero-avatar-wrap">
              <div className="profile-hero-avatar">
                {formData.admin_avatar ? <img src={formData.admin_avatar} alt="Avatar admin" /> : <span>{avatarInitial}</span>}
              </div>
              <p className="profile-hero-note">Foto profil dipakai untuk identitas akun superadmin.</p>
            </div>

            <div className="profile-hero-copy">
              <span className="profile-chip">Superadmin</span>
              <h1>Super Admin</h1>
              <p>Kelola detail akun, foto profil, dan password admin dari halaman ini.</p>
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
              <span>Nama Admin</span>
              <small>Data utama akun</small>
            </div>

            <div className="profile-fields profile-fields-two">
              <label>
                Nama Admin
                <input
                  type="text"
                  name="admin_name"
                  value={formData.admin_name}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Email Admin
                <input
                  type="email"
                  name="admin_email"
                  value={formData.admin_email}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <div className="profile-upload-strip">
              <div className="profile-upload-copy">
                <label>Foto Profil</label>
                <p>Pilih foto PNG atau JPG. Foto akan disimpan ke database sebagai data gambar.</p>
              </div>
              <label className="profile-upload-button">
                Choose Profile Photo
                <input type="file" accept="image/*" onChange={handleAvatarUpload} />
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
                {saving ? 'Menyimpan...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </section>
      </main>
    </>
  )
}

export default Profile
