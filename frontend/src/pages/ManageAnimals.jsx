import { useCallback, useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Link, useLocation } from 'react-router-dom'
import CropModal from '../components/CropModal'
import SuperadminSidebar from '../components/SuperadminSidebar'
import { publishLiveData, subscribeLiveData } from '../utils/liveDataEvents'

const emptyForm = {
  name: '',
  species: 'Kucing',
  gender: 'Perempuan',
  age: '',
  activity_preference: 'Suka di rumah',
  status: 'tersedia',
  condition: 'Sehat',
  photo: '',
}

const ACTIVITY_PREFERENCES = [
  'Suka di rumah',
  'Suka main',
  'Suka keluar',
  'Aktif',
  'Tenang',
]

const MEDIA_ACCEPT = 'image/*,video/mp4,video/webm,video/*'
const isVideoMedia = (value = '') => value.startsWith('data:video') || /\.(mp4|webm|ogg)(\?|#|$)/i.test(value)

const getAnimalPhotoSrc = (photo = '') => {
  if (!photo || photo.startsWith('data:')) return photo
  try {
    const url = new URL(photo, window.location.origin)
    url.searchParams.set('_', Date.now().toString())
    return url.toString()
  } catch {
    return `${photo}${photo.includes('?') ? '&' : '?'}_=${Date.now()}`
  }
}

function ManageAnimals() {
  const location = useLocation()
  const [animals, setAnimals] = useState([])
  const [categories, setCategories] = useState(['Semua'])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  )
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5 // Ubah sesuai kebutuhan
  const [totalAnimals, setTotalAnimals] = useState(0)
  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropSource, setCropSource] = useState('')
  const cropImgRef = useRef(null)
  const cropWrapRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 })
  const [cropImageSize, setCropImageSize] = useState({ width: 0, height: 0 })
  const [isUploading, setIsUploading] = useState(false)
  const [isDraggingCrop, setIsDraggingCrop] = useState(false)
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0 })
  const pendingCropMove = useRef({ x: 0, y: 0 })
  const cropMoveFrame = useRef(0)

  // Hitung data untuk halaman saat ini
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredAnimals = animals.filter((animal) => {
    const matchesCategory = selectedCategory === 'Semua' || animal.species === selectedCategory
    const searchableText = [
      animal.name,
      animal.species,
      animal.gender,
      animal.status,
      animal.condition,
      animal.activity_preference,
    ].filter(Boolean).join(' ').toLowerCase()

    return matchesCategory && (!normalizedSearch || searchableText.includes(normalizedSearch))
  })
  const totalPages = Math.ceil(filteredAnimals.length / itemsPerPage)
  const currentPageAnimals = filteredAnimals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const loadAnimals = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/superadmin/animals')
      const data = response.data?.data || []
      setAnimals(data)
      setTotalAnimals(Array.isArray(data) ? data.length : (response.data?.total || 0))
    } catch {
      setAnimals([])
    }
  }

  const loadCategories = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/superadmin/categories')
      setCategories(['Semua', ...(response.data.data || []).map(cat => cat.name)])
    } catch {
      setCategories(['Semua'])
    }
  }

  useEffect(() => {
    let active = true

    ;(async () => {
      try {
        const [animalsRes, categoriesRes] = await Promise.all([
          axios.get('http://localhost:3000/api/superadmin/animals'),
          axios.get('http://localhost:3000/api/superadmin/categories'),
        ])
        if (active) {
          const data = animalsRes.data?.data || []
          setAnimals(data)
          setTotalAnimals(Array.isArray(data) ? data.length : (animalsRes.data?.total || 0))
          setCategories(['Semua', ...(categoriesRes.data.data || []).map(cat => cat.name)])
        }
      } catch {
        if (active) {
          setAnimals([])
          setCategories(['Semua'])
        }
      }
    })()
    const unsubscribeAnimals = subscribeLiveData('animals', loadAnimals)
    const unsubscribeCategories = subscribeLiveData('categories', loadCategories)
    return () => {
      active = false
      unsubscribeAnimals()
      unsubscribeCategories()
    }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setForm((current) => ({ ...current, photo: result }))
      if (file.type.startsWith('video/')) {
        event.target.value = ''
        return
      }
      setCropSource(result)
      setCropImageSize({ width: 0, height: 0 })
      setImgOffset({ x: 0, y: 0 })
      setCropModalOpen(true)
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const openCropFromPreview = (dataUrl) => {
    if (isVideoMedia(dataUrl)) return
    setCropSource(dataUrl)
    setCropImageSize({ width: 0, height: 0 })
    setImgOffset({ x: 0, y: 0 })
    setCropModalOpen(true)
  }

  // Pan & zoom handlers for crop UI
  const onCropMouseDown = (e) => {
    if (!cropImgRef.current) return
    e.preventDefault()
    isPanning.current = true
    setIsDraggingCrop(true)
    panStart.current = { x: e.clientX, y: e.clientY }
  }

  const onCropMouseMove = (e) => {
    if (!isPanning.current) return
    const dx = e.clientX - panStart.current.x
    const dy = e.clientY - panStart.current.y
    panStart.current = { x: e.clientX, y: e.clientY }
    pendingCropMove.current = {
      x: pendingCropMove.current.x + dx,
      y: pendingCropMove.current.y + dy,
    }

    if (!cropMoveFrame.current) {
      cropMoveFrame.current = window.requestAnimationFrame(() => {
        const move = pendingCropMove.current
        pendingCropMove.current = { x: 0, y: 0 }
        cropMoveFrame.current = 0
        setImgOffset((cur) => ({ x: cur.x + move.x, y: cur.y + move.y }))
      })
    }
  }

  const onCropMouseUp = () => {
    isPanning.current = false
    setIsDraggingCrop(false)
  }

  const onCropImageLoad = () => {
    if (!cropImgRef.current || !cropWrapRef.current) return
    const img = cropImgRef.current
    const wrap = cropWrapRef.current.getBoundingClientRect()
    const boxSize = Math.floor(Math.min(wrap.width, wrap.height) * 0.8)
    const scale = Math.max(boxSize / img.naturalWidth, boxSize / img.naturalHeight)
    const width = Math.round(img.naturalWidth * scale)
    const height = Math.round(img.naturalHeight * scale)
    const startX = Math.floor((wrap.width - width) / 2)
    const startY = Math.floor((wrap.height - height) / 2)
    setCropImageSize({ width, height })
    setImgOffset({ x: startX, y: startY })
    setZoom(1)
  }

  const applyCrop = () => {
    if (!cropImgRef.current || !cropWrapRef.current) {
      setCropModalOpen(false)
      return
    }
    const img = cropImgRef.current
    const wrapRect = cropWrapRef.current.getBoundingClientRect()
    const imgRect = img.getBoundingClientRect()
    // crop box is centered square inside wrapper
    const boxSize = Math.floor(Math.min(wrapRect.width, wrapRect.height) * 0.8)
    const boxLeft = Math.floor((wrapRect.width - boxSize) / 2)
    const boxTop = Math.floor((wrapRect.height - boxSize) / 2)

    // image position relative to wrapper
    const imgLeft = imgRect.left - wrapRect.left
    const imgTop = imgRect.top - wrapRect.top
    const sxDisplayed = boxLeft - imgLeft
    const syDisplayed = boxTop - imgTop
    const swDisplayed = boxSize
    const shDisplayed = boxSize

    const naturalW = img.naturalWidth
    const naturalH = img.naturalHeight
    const scaleX = naturalW / imgRect.width
    const scaleY = naturalH / imgRect.height

    const sx = Math.max(0, Math.round(sxDisplayed * scaleX))
    const sy = Math.max(0, Math.round(syDisplayed * scaleY))
    const sw = Math.max(1, Math.round(swDisplayed * scaleX))
    const sh = Math.max(1, Math.round(shDisplayed * scaleY))
    const outputSize = 720

    const canvas = document.createElement('canvas')
    canvas.width = outputSize
    canvas.height = outputSize
    const ctx = canvas.getContext('2d')
    const tmpImg = new Image()
    tmpImg.onload = async () => {
      ctx.drawImage(tmpImg, sx, sy, sw, sh, 0, 0, outputSize, outputSize)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
      // Try upload to backend endpoint; if it fails, fall back to data URL
      setIsUploading(true)
      try {
        const res = await axios.post('http://localhost:3000/api/superadmin/upload-photo', { image: dataUrl })
        const url = res?.data?.url
        if (url) {
          setForm((current) => ({ ...current, photo: url }))
        } else {
          setForm((current) => ({ ...current, photo: dataUrl }))
        }
      } catch {
        // fallback to data URL if upload not available
        setForm((current) => ({ ...current, photo: dataUrl }))
      } finally {
        setIsUploading(false)
        setCropModalOpen(false)
      }
    }
    tmpImg.src = cropSource
  }

  const resetCrop = () => {
    if (!cropImgRef.current || !cropWrapRef.current) return
    const img = cropImgRef.current
    const wrap = cropWrapRef.current.getBoundingClientRect()
    const boxSize = Math.floor(Math.min(wrap.width, wrap.height) * 0.8)
    const scale = Math.max(boxSize / img.naturalWidth, boxSize / img.naturalHeight)
    const width = Math.round(img.naturalWidth * scale)
    const height = Math.round(img.naturalHeight * scale)
    const startX = Math.floor((wrap.width - width) / 2)
    const startY = Math.floor((wrap.height - height) / 2)
    setCropImageSize({ width, height })
    setImgOffset({ x: startX, y: startY })
    setZoom(1)
  }

  // disable body scroll when modal open
  useEffect(() => {
    if (cropModalOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
    return undefined
  }, [cropModalOpen])

  const dispatchAnimalUpdate = () => publishLiveData('animals')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (event.nativeEvent?.submitter?.classList?.contains('photo-clear')) {
      return
    }
    try {
      const payload = { ...form, age: Number(form.age) }
      if (editingId) {
        await axios.put(`http://localhost:3000/api/superadmin/animals/${editingId}`, payload)
      } else {
        await axios.post('http://localhost:3000/api/superadmin/animals', payload)
      }
      await loadAnimals()
      dispatchAnimalUpdate()
      closeDrawer()
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal menyimpan hewan.')
    }
  }

  const openAddDrawer = useCallback(() => {
    const firstCategory = categories.find(c => c !== 'Semua') || 'Kucing'
    setEditingId(null)
    setForm({ ...emptyForm, species: firstCategory })
    setDrawerOpen(true)
  }, [categories])

  useEffect(() => {
    if (!location.pathname.endsWith('/animals/add')) return
    const timer = window.setTimeout(() => {
      openAddDrawer()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [location.pathname, openAddDrawer])

  const openEditDrawer = (animal) => {
    setEditingId(animal.id)
    setForm({
      name: animal.name || '',
      species: animal.species || 'Kucing',
      gender: animal.gender || 'Perempuan',
      age: animal.age?.toString() || '',
      activity_preference: animal.activity_preference || 'Suka di rumah',
      status: animal.status || 'tersedia',
      condition: animal.condition || 'Sehat',
      photo: animal.photo || '',
    })
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus hewan ini?')) return
    try {
      await axios.delete(`http://localhost:3000/api/superadmin/animals/${id}`)
      await loadAnimals()
      dispatchAnimalUpdate()
      if (editingId === id) {
        closeDrawer()
      }
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal menghapus hewan.')
    }
  }

  const handleDeleteAll = async () => {
    if (totalAnimals === 0) {
      window.alert('Tidak ada hewan untuk dihapus.')
      return
    }
    if (!window.confirm(`Hapus semua hewan? Aksi ini akan menghapus ${totalAnimals} hewan secara permanen. Lanjutkan?`)) return
    try {
      const res = await axios.post('http://localhost:3000/api/superadmin/animals/delete-all')
      await loadAnimals()
      dispatchAnimalUpdate()
      if (editingId) closeDrawer()
      window.alert(res.data?.message || 'Semua hewan berhasil dihapus.')
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal menghapus semua hewan.')
    }
  }

  const formatDate = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID')
  }

  const getSpeciesIcon = (species) => {
    switch (species) {
      case 'Kucing': return 'fa-cat'
      case 'Anjing': return 'fa-dog'
      case 'Kelinci': return 'fa-rabbit'
      case 'Burung': return 'fa-dove'
      case 'Hamster': return 'fa-hippo'
      default: return 'fa-paw'
    }
  }

  const getSpeciesColor = (species) => {
    switch (species) {
      case 'Kucing': return 'linear-gradient(135deg, var(--accent), var(--accent-dark))'
      case 'Anjing': return 'linear-gradient(135deg, var(--blue), var(--purple))'
      case 'Kelinci': return 'linear-gradient(135deg, var(--green), var(--teal))'
      case 'Burung': return 'linear-gradient(135deg, var(--purple), var(--blue))'
      case 'Hamster': return 'linear-gradient(135deg, var(--red), var(--accent))'
      default: return 'linear-gradient(135deg, var(--accent), var(--accent-dark))'
    }
  }

  const getStatusTagClass = (status) => {
    switch (status) {
      case 'tersedia': return 'tag-success'
      case 'diadopsi': return 'tag-muted'
      case 'rawat': return 'tag-kitchen'
      default: return 'tag-muted'
    }
  }

  const getConditionTagClass = (condition) => {
    switch (condition) {
      case 'Sehat': return 'tag-success'
      case 'Sakit': return 'tag-danger'
      case 'Sedang Dirawat': return 'tag-warning'
      case 'Butuh Perhatian': return 'tag-kitchen'
      default: return 'tag-muted'
    }
  }

  return (
    <div className="dashboard-layout">
      <SuperadminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
              <div className="topbar-page-title">Kelola Hewan</div>
            </div>
          </div>

          <div className="topbar-right">
            <button className="topbar-btn">
              <i className="fas fa-bell"></i>
              <span className="notif-dot"></span>
            </button>
            <Link to="/dashboard/settings" className="topbar-btn" aria-label="Pengaturan Sistem">
              <i className="fas fa-cog"></i>
            </Link>
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
              <i className="fas fa-paw"></i>
              Daftar Hewan
            </h1>
            <p className="page-header-desc">
              Kelola semua hewan yang tersedia untuk diadopsi.
            </p>
          </div>

          <div className="content-toolbar">
            <div className="search-box">
              <input
                type="text"
                placeholder="Cari nama, spesies, atau kebiasaan..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value)
                  setCurrentPage(1)
                }}
              />
              <button><i className="fas fa-search"></i> Cari</button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="primary-link" onClick={openAddDrawer}>
                <i className="fas fa-plus"></i> Tambah Hewan
              </button>
              <button
                className="danger-link"
                onClick={handleDeleteAll}
                disabled={totalAnimals === 0}
              >
                <i className="fas fa-trash"></i> Hapus Semua
              </button>
            </div>
          </div>

          {/* Category Filter Pills (above panel) */}
          <div className="filter-pills" style={{ marginBottom: '20px' }}>
            {categories.map((category) => (
              <button
                key={category}
                className={`filter-pill ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory(category)
                  setCurrentPage(1)
                }}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Panel / Table */}
          <div className="panel">
            <div className="panel-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2><i className="fas fa-table"></i> Semua Hewan</h2>
                <span>{totalAnimals} hewan</span>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Hewan</th>
                    <th>Spesies</th>
                    <th>Jenis Kelamin</th>
                    <th>Umur</th>
                    <th>Kebiasaan</th>
                    <th>Kondisi</th>
                    <th>Status</th>
                    <th>Terdaftar</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPageAnimals.map((animal) => (
                    <tr key={animal.id}>
                      <td>{animal.id}</td>
                      <td>
                        <div className="user-cell">
                          <div 
                            className="user-avatar"
                            style={{
                              background: animal.photo ? 'none' : getSpeciesColor(animal.species),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '700',
                              overflow: 'hidden',
                            }}
                          >
                            {animal.photo ? (
                              isVideoMedia(animal.photo) ? (
                                <video
                                  src={getAnimalPhotoSrc(animal.photo)}
                                  muted
                                  playsInline
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <img
                                  src={getAnimalPhotoSrc(animal.photo)}
                                  alt={animal.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              )
                            ) : (
                              <i className={`fas ${getSpeciesIcon(animal.species)}`}></i>
                            )}
                          </div>
                          <strong>{animal.name}</strong>
                        </div>
                      </td>
                      <td>{animal.species}</td>
                      <td>{animal.gender}</td>
                      <td>{animal.age} tahun</td>
                      <td>
                        <span className="tag tag-admin">
                          <span className="status-dot"></span>
                          {animal.activity_preference || 'Suka di rumah'}
                        </span>
                      </td>
                      <td>
                        <span className={`tag ${getConditionTagClass(animal.condition)}`}>
                          <span className="status-dot"></span>
                          {animal.condition || 'Sehat'}
                        </span>
                      </td>
                      <td>
                        <span className={`tag ${getStatusTagClass(animal.status)}`}>
                          <span className="status-dot"></span>
                          {animal.status}
                        </span>
                      </td>
                      <td>{formatDate(animal.created_at)}</td>
                      <td>
                        <div className="actions" style={{ justifyContent: 'flex-end' }}>
                          <button 
                            className="btn-open-edit" 
                            onClick={() => openEditDrawer(animal)}
                          >
                            <i className="fas fa-pen"></i> Edit
                          </button>
                          <button 
                            className="btn-delete-user" 
                            onClick={() => handleDelete(animal.id)}
                          >
                            <i className="fas fa-trash"></i> Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-area">
                <div className="pagination-wrap">
                  <div className="pagination-meta">
                    Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredAnimals.length)} dari {filteredAnimals.length} hewan
                  </div>
                  <div className="pagination-links">
                    <button
                      className="pagination-link"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    >
                      &lt;
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        className={`pagination-link ${currentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      className="pagination-link"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Drawer */}
      <div 
        className={`drawer-backdrop ${drawerOpen ? 'open' : ''}`} 
        onClick={closeDrawer}
      ></div>
      <div className={`user-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-head">
          <h3>
            <i className="fas fa-paw"></i>
            {editingId ? 'Edit Hewan' : 'Tambah Hewan'}
          </h3>
          <button className="drawer-close" onClick={closeDrawer}>
            <i className="fas fa-times"></i> Tutup
          </button>
        </div>
        <div className="drawer-body">
          <form className="user-form" onSubmit={handleSubmit}>
            <div className="drawer-field">
              <label htmlFor="name">Nama Hewan</label>
              <input
                type="text"
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Masukkan nama hewan"
              />
            </div>

            <div className="form-grid">
              <div className="drawer-field">
                <label htmlFor="species">Spesies</label>
                <select
                  id="species"
                  name="species"
                  value={form.species}
                  onChange={handleChange}
                >
                  {categories.filter(c => c !== 'Semua').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="drawer-field">
                <label htmlFor="gender">Jenis Kelamin</label>
                <select
                  id="gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                >
                  <option value="Perempuan">Perempuan</option>
                  <option value="Laki-laki">Laki-laki</option>
                </select>
              </div>
            </div>

            <div className="drawer-field">
              <label htmlFor="photo">Foto Hewan</label>
              <label className="animal-photo-upload">
                <i className="fas fa-image" aria-hidden="true"></i>
                <span>Pilih Foto Hewan</span>
                <input
                  type="file"
                  id="photo"
                  accept={MEDIA_ACCEPT}
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
              </label>
              {form.photo && (
                <div className="selected-photo">
                  <button className="photo-clear" title="Hapus foto" onClick={() => setForm((c) => ({ ...c, photo: '' }))}>×</button>
                  {isVideoMedia(form.photo) ? (
                    <video src={form.photo} controls muted playsInline />
                  ) : (
                    <img
                      src={form.photo}
                      alt="Preview foto hewan"
                      title="Klik foto untuk crop"
                      onClick={() => openCropFromPreview(form.photo)}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="form-grid">
              <div className="drawer-field">
                <label htmlFor="age">Umur (tahun)</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  min="0"
                  value={form.age}
                  onChange={handleChange}
                  required
                  placeholder="0"
                />
              </div>

              <div className="drawer-field">
                <label htmlFor="activity_preference">Kebiasaan</label>
                <select
                  id="activity_preference"
                  name="activity_preference"
                  value={form.activity_preference}
                  onChange={handleChange}
                >
                  {ACTIVITY_PREFERENCES.map((preference) => (
                    <option key={preference} value={preference}>{preference}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="drawer-field">
                <label htmlFor="condition">Kondisi</label>
                <select
                  id="condition"
                  name="condition"
                  value={form.condition}
                  onChange={handleChange}
                >
                  <option value="Sehat">Sehat</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Sedang Dirawat">Sedang Dirawat</option>
                  <option value="Butuh Perhatian">Butuh Perhatian</option>
                </select>
              </div>

              <div className="drawer-field">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="tersedia">Tersedia</option>
                  <option value="diadopsi">Diadopsi</option>
                  <option value="rawat">Rawat</option>
                </select>
              </div>
            </div>

            <div className="drawer-buttons">
              <button type="submit" className="primary-link">
                {editingId ? 'Simpan Perubahan' : 'Tambah Hewan'}
              </button>
              <button 
                type="button" 
                className="danger-link"
                onClick={closeDrawer}
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Crop Modal rendered via portal to avoid transform issues */}
      <CropModal open={cropModalOpen} onClose={() => setCropModalOpen(false)}>
        <div className="crop-modal-body" role="dialog" aria-modal="true">
          <div className="crop-modal-head">
            <div>
              <h3>Crop Foto Hewan</h3>
              <p>Geser foto dan atur zoom sampai bagian yang diinginkan masuk kotak.</p>
            </div>
            <button type="button" className="crop-close" onClick={() => setCropModalOpen(false)} aria-label="Tutup crop">
              <i className="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>
            <div className="crop-area">
              <div
                className="crop-image-wrap"
                ref={cropWrapRef}
                onMouseDown={onCropMouseDown}
                onMouseMove={onCropMouseMove}
                onMouseUp={onCropMouseUp}
                onMouseLeave={onCropMouseUp}
              >
                <img
                  ref={cropImgRef}
                  src={cropSource}
                  alt="Crop preview"
                  onLoad={onCropImageLoad}
                  style={{
                    width: cropImageSize.width ? `${cropImageSize.width}px` : 'auto',
                    height: cropImageSize.height ? `${cropImageSize.height}px` : 'auto',
                    transform: `translate(${imgOffset.x}px, ${imgOffset.y}px) scale(${zoom})`,
                    cursor: isDraggingCrop ? 'grabbing' : 'grab',
                  }}
                />

                {/* fixed centered crop box */}
                <div className="crop-box" />
              </div>
            </div>

            <div className="crop-actions">
              <div className="crop-zoom-control">
                <label htmlFor="cropZoom">Zoom</label>
                <input id="cropZoom" type="range" min="0.5" max="3" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
              </div>
                <div className="crop-action-buttons">
                  <button type="button" className="primary-link" onClick={applyCrop} disabled={isUploading}>
                    {isUploading ? 'Menyimpan...' : 'Simpan Crop'}
                  </button>
                  <button className="crop-reset-btn" onClick={resetCrop} type="button">Reset</button>
                  <button type="button" className="danger-link" onClick={() => setCropModalOpen(false)}>Batal</button>
                </div>
            </div>
        </div>
      </CropModal>

    </div>
  )
}

export default ManageAnimals
