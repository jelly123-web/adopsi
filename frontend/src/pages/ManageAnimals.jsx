import { useEffect, useState } from 'react'
import axios from 'axios'

const emptyForm = {
  name: '',
  species: 'Kucing',
  gender: 'Betina',
  age: '',
  status: 'tersedia',
}

function ManageAnimals() {
  const [animals, setAnimals] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  )

  const loadAnimals = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/superadmin/animals')
      setAnimals(response.data.data || [])
    } catch {
      setAnimals([])
    }
  }

  useEffect(() => {
    let active = true

    ;(async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/superadmin/animals')
        if (active) {
          setAnimals(response.data.data || [])
        }
      } catch {
        if (active) {
          setAnimals([])
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

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
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
      resetForm()
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal menyimpan hewan.')
    }
  }

  const handleEdit = (animal) => {
    setEditingId(animal.id)
    setForm({
      name: animal.name || '',
      species: animal.species || 'Kucing',
      gender: animal.gender || 'Betina',
      age: animal.age?.toString() || '',
      status: animal.status || 'tersedia',
    })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus hewan ini?')) return

    try {
      await axios.delete(`http://localhost:3000/api/superadmin/animals/${id}`)
      await loadAnimals()
      if (editingId === id) {
        resetForm()
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
      case 'Kucing':
        return 'fa-cat'
      case 'Anjing':
        return 'fa-dog'
      case 'Kelinci':
        return 'fa-rabbit'
      case 'Burung':
        return 'fa-dove'
      case 'Hamster':
        return 'fa-hippo'
      default:
        return 'fa-paw'
    }
  }

  const getSpeciesColor = (species) => {
    switch (species) {
      case 'Kucing':
        return 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)'
      case 'Anjing':
        return 'linear-gradient(135deg, var(--blue) 0%, var(--purple) 100%)'
      case 'Kelinci':
        return 'linear-gradient(135deg, var(--green) 0%, var(--teal) 100%)'
      case 'Burung':
        return 'linear-gradient(135deg, var(--purple) 0%, var(--blue) 100%)'
      case 'Hamster':
        return 'linear-gradient(135deg, var(--red) 0%, var(--accent) 100%)'
      default:
        return 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)'
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
          <a href="/dashboard/animals" className="nav-item active">
            <i className="fas fa-paw"></i>
            <span>Kelola Hewan</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">SA</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">Super Admin</div>
              <div className="sidebar-user-email">admin@adopsi.test</div>
            </div>
          </div>
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
              <div className="topbar-kicker">Kelola Hewan</div>
              <div className="topbar-page-title">CRUD Hewan</div>
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
          <div className="two-col">
            {/* Form */}
            <div className="section-card">
              <div className="section-card-header">
                <div className="section-card-title">
                  <i className="fas fa-plus"></i>
                  {editingId ? 'Edit Hewan' : 'Tambah Hewan Baru'}
                </div>
              </div>
              <div className="section-card-body">
                <div style={{ padding: '22px' }}>
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label className="form-label">Nama</label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Jenis</label>
                      <select
                        name="species"
                        value={form.species}
                        onChange={handleChange}
                        className="form-select"
                      >
                        <option value="Kucing">Kucing</option>
                        <option value="Anjing">Anjing</option>
                        <option value="Kelinci">Kelinci</option>
                        <option value="Burung">Burung</option>
                        <option value="Hamster">Hamster</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Jenis Kelamin</label>
                      <select
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
                        className="form-select"
                      >
                        <option value="Betina">Betina</option>
                        <option value="Jantan">Jantan</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Umur (tahun)</label>
                      <input
                        type="number"
                        name="age"
                        min="0"
                        value={form.age}
                        onChange={handleChange}
                        required
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        className="form-select"
                      >
                        <option value="tersedia">tersedia</option>
                        <option value="diadopsi">diadopsi</option>
                        <option value="rawat">rawat</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                      <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                        {editingId ? 'Simpan Perubahan' : 'Tambah Hewan'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={resetForm}
                      >
                        Reset
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="section-card">
              <div className="section-card-header">
                <div className="section-card-title">
                  <i className="fas fa-table"></i>
                  Daftar Hewan
                </div>
              </div>
              <div className="section-card-body">
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>NAMA</th>
                        <th>JENIS</th>
                        <th>KELAMIN</th>
                        <th>UMUR</th>
                        <th>STATUS</th>
                        <th>TERDAFTAR</th>
                        <th>AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {animals.map((animal) => (
                        <tr key={animal.id}>
                          <td>{animal.id}</td>
                          <td>
                            <div className="cell-branch">
                              <div
                                className="cell-branch-dot"
                                style={{
                                  background: getSpeciesColor(animal.species),
                                }}
                              >
                                <i className={`fas ${getSpeciesIcon(animal.species)}`}></i>
                              </div>
                              <div>
                                <div className="cell-branch-name">{animal.name}</div>
                              </div>
                            </div>
                          </td>
                          <td>{animal.species}</td>
                          <td>{animal.gender}</td>
                          <td>{animal.age} tahun</td>
                          <td>
                            <span className={`status-badge ${animal.status}`}>
                              <span className="status-dot"></span>
                              {animal.status}
                            </span>
                          </td>
                          <td>{formatDate(animal.created_at)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => handleEdit(animal)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => handleDelete(animal.id)}
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ManageAnimals
