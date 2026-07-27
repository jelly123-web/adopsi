import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

const emptyForm = {
  name: '',
  species: 'Kucing',
  gender: 'Betina',
  age: '',
  status: 'tersedia',
}

function ManageAnimals() {
  const [animals, setAnimals] = useState([])
  const [categories, setCategories] = useState(['Semua'])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  )
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5 // Ubah sesuai kebutuhan

  const loadCategories = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/superadmin/categories')
      const data = ['Semua', ...(res.data.data || []).map(cat => cat.name)]
      setCategories(data)
    } catch {
      setCategories(['Semua'])
    }
  }

  // Hitung data untuk halaman saat ini
  const filteredAnimals = selectedCategory === 'Semua'
    ? animals
    : animals.filter(animal => animal.species === selectedCategory)
  const totalPages = Math.ceil(filteredAnimals.length / itemsPerPage)
  const currentPageAnimals = filteredAnimals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const loadAnimals = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/superadmin/animals')
      setAnimals(response.data.data || [])
    } catch {
      setAnimals([])
    }
  }

  // Reset ke halaman pertama ketika kategori berubah atau data hewan berubah
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, animals])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [animalsRes, categoriesRes] = await Promise.all([
          axios.get('http://localhost:3000/api/superadmin/animals'),
          axios.get('http://localhost:3000/api/superadmin/categories'),
        ])
        if (active) {
          setAnimals(animalsRes.data.data || [])
          setCategories(['Semua', ...(categoriesRes.data.data || []).map(cat => cat.name)])
        }
      } catch {
        if (active) {
          setAnimals([])
          setCategories(['Semua'])
        }
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      const payload = { ...form, age: Number(form.age) }
      if (editingId) {
        await axios.put(`http://localhost:3000/api/superadmin/animals/${editingId}`, payload)
      } else {
        await axios.post('http://localhost:3000/api/superadmin/animals', payload)
      }
      await loadAnimals()
      closeDrawer()
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal menyimpan hewan.')
    }
  }

  const openAddDrawer = () => {
    const firstCategory = categories.find(c => c !== 'Semua') || 'Kucing'
    setEditingId(null)
    setForm({ ...emptyForm, species: firstCategory })
    setDrawerOpen(true)
  }

  const openEditDrawer = (animal) => {
    setEditingId(animal.id)
    setForm({
      name: animal.name || '',
      species: animal.species || 'Kucing',
      gender: animal.gender || 'Betina',
      age: animal.age?.toString() || '',
      status: animal.status || 'tersedia',
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
      if (editingId === id) {
        closeDrawer()
      }
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal menghapus hewan.')
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

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo">A</div>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-name">Adopsi Hewan</div>
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
          <a href="/dashboard/animals" className="nav-item active">
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
          <a href="/dashboard/settings" className="nav-item">
            <i className="fas fa-cog"></i>
            <span>Pengaturan Sistem</span>
          </a>
          <a href="/dashboard/restore" className="nav-item">
            <i className="fas fa-undo"></i>
            <span>Pulihkan Data</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <Link to="/dashboard/profile" className="sidebar-user">
            <div className="sidebar-avatar">SA</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">Super Admin</div>
              <div className="sidebar-user-email">admin@adopsi.test</div>
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
              <div className="topbar-page-title">Kelola Hewan</div>
            </div>
          </div>

          <div className="topbar-right">
            <button className="topbar-btn">
              <i className="fas fa-bell"></i>
              <span className="notif-dot"></span>
            </button>
            <button className="topbar-btn">
              <i className="fas fa-cog"></i>
            </button>
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
              <input type="text" placeholder="Cari nama atau spesies..." />
              <button><i className="fas fa-search"></i> Cari</button>
            </div>
            <button className="primary-link" onClick={openAddDrawer}>
              <i className="fas fa-plus"></i> Tambah Hewan
            </button>
          </div>

          {/* Category Filter Pills (above panel) */}
          <div className="filter-pills" style={{ marginBottom: '20px' }}>
            {categories.map((category) => (
              <button
                key={category}
                className={`filter-pill ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Panel / Table */}
          <div className="panel">
            <div className="panel-head">
              <h2><i className="fas fa-table"></i> Semua Hewan</h2>
              <span>{filteredAnimals.length} hewan</span>
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
                    <th>Status</th>
                    <th>Terdaftar</th>
                    <th>Aksi</th>
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
                              background: getSpeciesColor(animal.species),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '700',
                            }}
                          >
                            <i className={`fas ${getSpeciesIcon(animal.species)}`}></i>
                          </div>
                          <strong>{animal.name}</strong>
                        </div>
                      </td>
                      <td>{animal.species}</td>
                      <td>{animal.gender}</td>
                      <td>{animal.age} tahun</td>
                      <td>
                        <span className={`tag ${getStatusTagClass(animal.status)}`}>
                          <span className="status-dot"></span>
                          {animal.status}
                        </span>
                      </td>
                      <td>{formatDate(animal.created_at)}</td>
                      <td>
                        <div className="actions">
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
                  <option value="Betina">Betina</option>
                  <option value="Jantan">Jantan</option>
                </select>
              </div>
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
    </div>
  )
}

export default ManageAnimals
