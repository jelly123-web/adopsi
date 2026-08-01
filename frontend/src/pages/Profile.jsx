import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import SuperadminNavbar from '../components/SuperadminNavbar'
import SuperadminSidebar from '../components/SuperadminSidebar'
import CustomerLayout from '../components/CustomerLayout'
import CropModal from '../components/CropModal'

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
  admin_avatar: '',
  admin_background: '',
  current_password: '',
  new_password: '',
  confirm_password: '',
}

const MEDIA_ACCEPT = 'image/*,video/mp4,video/webm,video/*'
const isVideoMedia = (value = '') => value.startsWith('data:video') || /\.(mp4|webm|ogg)(\?|#|$)/i.test(value)
const notifyAuthProfileUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth-profile-updated'))
  }
}

function Profile() {
  const navigate = useNavigate()
  const authUserId = localStorage.getItem('authUserId')
  const authRole = localStorage.getItem('authRole') || 'costumer'
  const roleLabel = roleLabels[authRole] || 'Akun'
  const profileEndpoint = authUserId ? `${API_BASE_URL}/profile/${authUserId}` : ''
  const profileBgStorageKey = authUserId ? `authProfileBackground:${authUserId}` : 'authProfileBackground'
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true,
  )
  const [formData, setFormData] = useState(() => ({
    ...emptyProfile,
    admin_name: localStorage.getItem('authName') || roleLabel,
    admin_email: localStorage.getItem('authEmail') || '',
    admin_avatar: localStorage.getItem('authAvatar') || '',
    admin_background: localStorage.getItem(profileBgStorageKey) || '',
  }))
  const [saving, setSaving] = useState(false)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropSource, setCropSource] = useState('')
  const [zoom, setZoom] = useState(1)
  const [baseZoom, setBaseZoom] = useState(1)
  const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 })
  const [cropImageSize, setCropImageSize] = useState({ width: 0, height: 0 })
  const [isDraggingCrop, setIsDraggingCrop] = useState(false)
  const cropImgRef = useRef(null)
  const cropWrapRef = useRef(null)
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0 })
  const pendingCropMove = useRef({ x: 0, y: 0 })
  const cropMoveFrame = useRef(0)
  const originalAvatarRef = useRef('')

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
        admin_avatar: data.admin_avatar || data.profile_photo || '',
        admin_background: data.admin_background || data.profile_bg_photo || current.admin_background || localStorage.getItem(profileBgStorageKey) || '',
        current_password: '',
        new_password: '',
        confirm_password: '',
      }))
      localStorage.setItem('authName', data.admin_name || data.name || '')
      localStorage.setItem('authEmail', data.admin_email || data.email || '')
      localStorage.setItem('authAvatar', data.admin_avatar || data.profile_photo || '')
      localStorage.setItem(profileBgStorageKey, data.admin_background || data.profile_bg_photo || localStorage.getItem(profileBgStorageKey) || '')
      notifyAuthProfileUpdated()
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

  const openCropFromAvatar = (dataUrl) => {
    if (!dataUrl || isVideoMedia(dataUrl)) return
    const source = originalAvatarRef.current || localStorage.getItem('authAvatarOriginal') || dataUrl
    setCropSource(source)
    setZoom(1)
    setImgOffset({ x: 0, y: 0 })
    setCropImageSize({ width: 0, height: 0 })
    setCropModalOpen(true)
  }

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      if (!result) return
      setFormData((current) => ({ ...current, admin_avatar: result }))
      originalAvatarRef.current = result
      localStorage.setItem('authAvatarOriginal', result)
      if (!isVideoMedia(result)) {
        openCropFromAvatar(result)
      }
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handleBackgroundUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      if (!result) return
      setFormData((current) => ({ ...current, admin_background: result }))
      localStorage.setItem(profileBgStorageKey, result)
      notifyAuthProfileUpdated()
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const clearBackground = () => {
    setFormData((current) => ({ ...current, admin_background: '' }))
    localStorage.removeItem(profileBgStorageKey)
    notifyAuthProfileUpdated()
  }

  const onCropMouseDown = (event) => {
    if (!cropSource) return
    event.preventDefault()
    isPanning.current = true
    setIsDraggingCrop(true)
    panStart.current = {
      x: event.clientX - imgOffset.x,
      y: event.clientY - imgOffset.y,
    }
  }

  const onCropMouseMove = (event) => {
    if (!isPanning.current) return
    pendingCropMove.current = {
      x: event.clientX - panStart.current.x,
      y: event.clientY - panStart.current.y,
    }

    if (cropMoveFrame.current) return
    cropMoveFrame.current = window.requestAnimationFrame(() => {
      setImgOffset(pendingCropMove.current)
      cropMoveFrame.current = 0
    })
  }

  const onCropMouseUp = () => {
    isPanning.current = false
    setIsDraggingCrop(false)
  }

  const onCropImageLoad = () => {
    const img = cropImgRef.current
    const wrap = cropWrapRef.current
    if (!img || !wrap) return

    const naturalW = img.naturalWidth
    const naturalH = img.naturalHeight
    const wrapW = wrap.offsetWidth

    // Compute the max allowed height for wrap
    const maxH = Math.min(480, window.innerHeight - 300)

    // Scale image to fit width first
    const scaleByWidth = wrapW / naturalW
    let fitH = naturalH * scaleByWidth

    // If height exceeds max, clamp it
    if (fitH > maxH) fitH = maxH

    // Set wrap height so it fits the image proportionally
    wrap.style.height = fitH + 'px'

    // Now compute contain-scale with the actual wrap dimensions
    const actualWrapW = wrap.offsetWidth
    const actualWrapH = fitH
    const scaleX = actualWrapW / naturalW
    const scaleY = actualWrapH / naturalH
    const containScale = Math.min(scaleX, scaleY)

    // Center the image inside the wrap
    const scaledW = naturalW * containScale
    const scaledH = naturalH * containScale
    const offsetX = (actualWrapW - scaledW) / 2
    const offsetY = (actualWrapH - scaledH) / 2

    setCropImageSize({ width: naturalW, height: naturalH })
    setBaseZoom(containScale)
    setZoom(containScale)
    setImgOffset({ x: offsetX, y: offsetY })
  }

  const resetCrop = () => {
    const original = originalAvatarRef.current || localStorage.getItem('authAvatarOriginal')
    if (original && original !== cropSource) {
      setCropSource(original)
      setZoom(1)
      setImgOffset({ x: 0, y: 0 })
      setCropImageSize({ width: 0, height: 0 })
      return
    }
    onCropImageLoad()
  }

  const applyAvatarCrop = () => {
    const img = cropImgRef.current
    const wrap = cropWrapRef.current
    const cropBox = wrap?.querySelector('.crop-box')
    if (!img || !wrap || !cropBox) return

    const wrapRect = wrap.getBoundingClientRect()
    const boxRect = cropBox.getBoundingClientRect()

    // zoom is an absolute scale factor: rendered size = naturalSize * zoom
    const naturalW = img.naturalWidth
    const naturalH = img.naturalHeight
    const scaleX = naturalW / (naturalW * zoom)
    const scaleY = naturalH / (naturalH * zoom)
    const sx = (boxRect.left - wrapRect.left - imgOffset.x) * scaleX
    const sy = (boxRect.top - wrapRect.top - imgOffset.y) * scaleY
    const sw = boxRect.width * scaleX
    const sh = boxRect.height * scaleY
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 600
    canvas.height = 600
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)

    setFormData((current) => ({ ...current, admin_avatar: canvas.toDataURL('image/jpeg', 0.92) }))
    setCropModalOpen(false)
  }

  useEffect(() => {
    if (!cropModalOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('mousemove', onCropMouseMove)
    window.addEventListener('mouseup', onCropMouseUp)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('mousemove', onCropMouseMove)
      window.removeEventListener('mouseup', onCropMouseUp)
      if (cropMoveFrame.current) {
        window.cancelAnimationFrame(cropMoveFrame.current)
        cropMoveFrame.current = 0
      }
    }
  }, [cropModalOpen])

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
      const savedName = data.admin_name || data.name || formData.admin_name
      const savedEmail = data.admin_email || data.email || formData.admin_email
      const savedAvatar = data.admin_avatar || data.profile_photo || formData.admin_avatar || ''
      const savedBackground = data.admin_background || data.profile_bg_photo || formData.admin_background || ''

      // Persist to localStorage immediately
      localStorage.setItem('authName', savedName)
      localStorage.setItem('authEmail', savedEmail)
      localStorage.setItem('authAvatar', savedAvatar)
      if (savedBackground) {
        localStorage.setItem(profileBgStorageKey, savedBackground)
      } else {
        localStorage.removeItem(profileBgStorageKey)
      }
      if (originalAvatarRef.current) {
        localStorage.setItem('authAvatarOriginal', originalAvatarRef.current)
      }

      // Update form state immediately so photo stays visible
      setFormData((current) => ({
        ...current,
        admin_name: savedName,
        admin_email: savedEmail,
        admin_avatar: savedAvatar,
        admin_background: savedBackground,
        current_password: '',
        new_password: '',
        confirm_password: '',
      }))

      notifyAuthProfileUpdated()
      window.alert('Profil berhasil disimpan.')
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal menyimpan profil.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    loadProfile()
  }

  const isCustomer = authRole === 'costumer'

  const renderProfileBody = () => (
    <section className="content page-body profile-page">
      <header className={`profile-hero ${formData.admin_background ? 'profile-hero-with-bg' : ''}`}>
        {formData.admin_background ? (
          <div className="profile-hero-bg-media" aria-hidden="true">
            {isVideoMedia(formData.admin_background) ? (
              <video src={formData.admin_background} autoPlay muted loop playsInline />
            ) : (
              <img src={formData.admin_background} alt="" />
            )}
          </div>
        ) : null}
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
            <h2>Detail Akun</h2>
            <p>Informasi utama pengguna</p>
          </div>
        </div>

        <div className="profile-section-title">
          <span>Nama Akun</span>
          <small>Data utama akun</small>
        </div>

        <div className="profile-fields profile-fields-two">
          <label>
            Nama Akun
            <input
              type="text"
              name="admin_name"
              value={formData.admin_name}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Email Akun
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
          </div>
          <label className="profile-upload-button">
            Pilih Foto Profil
            <input type="file" accept={MEDIA_ACCEPT} onChange={handleAvatarUpload} />
          </label>
        </div>

        {formData.admin_avatar ? (
          <div className="profile-photo-preview">
            <button
              type="button"
              className="photo-clear"
              onClick={() => setFormData((current) => ({ ...current, admin_avatar: '' }))}
              aria-label="Hapus foto profil"
            >
              x
            </button>
            {isVideoMedia(formData.admin_avatar) ? (
              <video src={formData.admin_avatar} autoPlay muted loop playsInline />
            ) : (
              <img
                src={formData.admin_avatar}
                alt="Preview foto profil"
              onClick={() => openCropFromAvatar(formData.admin_avatar)}
              />
            )}
            {!isVideoMedia(formData.admin_avatar) ? (
              <span className="profile-photo-hint">Klik foto untuk crop ulang.</span>
            ) : null}
          </div>
        ) : null}

        <div className="profile-upload-strip profile-background-upload-strip">
          <div className="profile-upload-copy">
            <label>Background Profil</label>
            <small>Foto ini tampil di belakang header profil customer/admin.</small>
          </div>
          <label className="profile-upload-button">
            Pilih Background
            <input type="file" accept={MEDIA_ACCEPT} onChange={handleBackgroundUpload} />
          </label>
        </div>

        {formData.admin_background ? (
          <div className="profile-background-preview">
            <button
              type="button"
              className="photo-clear"
              onClick={clearBackground}
              aria-label="Hapus background profil"
            >
              x
            </button>
            {isVideoMedia(formData.admin_background) ? (
              <video src={formData.admin_background} autoPlay muted loop playsInline />
            ) : (
              <img src={formData.admin_background} alt="Preview background profil" />
            )}
          </div>
        ) : null}

        <div className="profile-section-title profile-section-title-spaced">
          <span>Keamanan Akun</span>
          <small>Kosongkan jika tidak ingin mengubah password</small>
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

  const renderCropModal = () => (
    <CropModal open={cropModalOpen} onClose={() => setCropModalOpen(false)}>
      <div className="crop-modal-body profile-crop-modal">
        <div className="crop-modal-head">
          <div>
            <h3>Crop Foto Profil</h3>
            <p>Geser foto dan atur zoom sampai bagian yang diinginkan masuk kotak.</p>
          </div>
          <button
            type="button"
            className="crop-close"
            onClick={() => setCropModalOpen(false)}
            aria-label="Tutup crop foto"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="crop-area">
          <div
            className={`crop-image-wrap ${isDraggingCrop ? 'dragging' : ''}`}
            ref={cropWrapRef}
            onMouseDown={onCropMouseDown}
          >
            <img
              ref={cropImgRef}
              src={cropSource}
              alt="Crop foto profil"
              onLoad={onCropImageLoad}
              draggable={false}
              style={{
                width: (cropImageSize.width || 100) * zoom + 'px',
                height: (cropImageSize.height || 100) * zoom + 'px',
                transform: `translate(${imgOffset.x}px, ${imgOffset.y}px)`,
              }}
            />
            <div className="crop-box profile-crop-box" />
          </div>
        </div>

        <div className="crop-actions">
          <label className="crop-zoom-control">
            Zoom
            <input
              type="range"
              min={baseZoom * 0.5}
              max={baseZoom * 5}
              step="0.01"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </label>
          <div className="crop-action-buttons">
            <button type="button" className="primary-link" onClick={applyAvatarCrop}>
              Simpan Crop
            </button>
            <button type="button" className="crop-reset-btn" onClick={resetCrop}>
              Reset
            </button>
            <button type="button" className="danger-link" onClick={() => setCropModalOpen(false)}>
              Batal
            </button>
          </div>
        </div>
      </div>
    </CropModal>
  )

  if (isCustomer) {
    return (
      <CustomerLayout>
        <main className="customer-page customer-profile-page" style={{ maxWidth: '920px', margin: '0 auto', padding: '32px 20px' }}>
          {renderProfileBody()}
        </main>
        {renderCropModal()}
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
        {renderProfileBody()}
      </main>
      {renderCropModal()}
    </div>
  )
}

export default Profile
