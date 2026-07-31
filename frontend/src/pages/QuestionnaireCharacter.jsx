import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import SuperadminNavbar from '../components/SuperadminNavbar'
import SuperadminSidebar from '../components/SuperadminSidebar'

const emptyForm = {
  question: '',
  answerType: 'Pilihan',
  status: 'aktif',
}

function QuestionnaireCharacter() {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true,
  )
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const loadQuestions = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/superadmin/questionnaire-questions')
      setItems(response.data.data || [])
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal memuat data kuisioner.')
      setItems([])
    }
  }

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return items

    return items.filter((item) => {
      return (
        item.question.toLowerCase().includes(query) ||
        item.answerType.toLowerCase().includes(query) ||
        item.status.toLowerCase().includes(query)
      )
    })
  }, [items, search])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    let active = true
    axios.get('http://localhost:3000/api/superadmin/questionnaire-questions')
      .then((response) => {
        if (active) setItems(response.data.data || [])
      })
      .catch((error) => {
        if (!active) return
        window.alert(error.response?.data?.message || 'Gagal memuat data kuisioner.')
        setItems([])
      })
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

  const openCreateDrawer = () => {
    resetForm()
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const payload = {
      question: form.question.trim(),
      answerType: form.answerType,
      status: form.status,
    }

    if (!payload.question) return

    try {
      if (editingId) {
        await axios.put(`http://localhost:3000/api/superadmin/questionnaire-questions/${editingId}`, payload)
      } else {
        await axios.post('http://localhost:3000/api/superadmin/questionnaire-questions', payload)
      }
      await loadQuestions()
      resetForm()
      closeDrawer()
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal menyimpan pertanyaan.')
    }
  }

  const handleEdit = (item) => {
    setEditingId(item.id)
    setForm({
      question: item.question,
      answerType: item.answerType,
      status: item.status,
    })
    setDrawerOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus pertanyaan ini?')) return

    try {
      await axios.delete(`http://localhost:3000/api/superadmin/questionnaire-questions/${id}`)
      await loadQuestions()
      if (editingId === id) {
        resetForm()
      }
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal menghapus pertanyaan.')
    }
  }

  return (
    <div className="dashboard-layout">
      <SuperadminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={`main-content questionnaire-page ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
        <SuperadminNavbar
          pageTitle="Pertanyaan Karakter"
          onToggleSidebar={() => setSidebarOpen((current) => !current)}
          sidebarOpen={sidebarOpen}
          offsetForSidebar={false}
        />

        <section className="content page-body">
          <header className="questionnaire-hero">
            <div className="questionnaire-hero-copy">
              <span className="questionnaire-kicker">Kelola Kuisioner</span>
              <h1>
                <i className="fas fa-clipboard-list" aria-hidden="true" />
                <span>Pertanyaan Kuisioner Karakter</span>
              </h1>
            </div>
            <div className="questionnaire-chip">{filteredItems.length} Pertanyaan</div>
          </header>

          <div className="questionnaire-toolbar">
            <div className="questionnaire-search">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari pertanyaan, tipe jawaban, atau status..."
              />
            </div>
            <button type="button" className="quest-primary" onClick={openCreateDrawer}>
              Tambah Pertanyaan
            </button>
          </div>

          <section className="quest-card quest-table-card">
            <div className="quest-card-head">
              <h2>Daftar Pertanyaan</h2>
              <p>Data kuisioner yang aktif di sistem.</p>
            </div>

            <div className="quest-table-wrap">
              <table className="quest-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Pertanyaan</th>
                    <th>Tipe</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length ? (
                    filteredItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td className="quest-question">{item.question}</td>
                        <td>
                          <span
                            className={`quest-badge ${item.answerType.toLowerCase() === 'skala' ? 'scale' : 'option'}`}
                          >
                            {item.answerType}
                          </span>
                        </td>
                        <td>
                          <span className={`quest-badge ${item.status === 'aktif' ? 'active' : 'inactive'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td>
                          <div className="quest-row-actions">
                            <button type="button" className="quest-text-btn" onClick={() => handleEdit(item)}>
                              <i className="fas fa-pen" aria-hidden="true" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              className="quest-text-btn danger"
                              onClick={() => handleDelete(item.id)}
                            >
                              <i className="fas fa-trash" aria-hidden="true" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5">
                        <div className="quest-empty">Tidak ada pertanyaan yang cocok dengan pencarian.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </main>

      <div
        className={`quest-drawer-backdrop ${drawerOpen ? 'open' : ''}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <aside className={`quest-drawer ${drawerOpen ? 'open' : ''}`} aria-hidden={!drawerOpen}>
        <div className="quest-drawer-head">
          <div>
            <span className="questionnaire-kicker">Tambah Pertanyaan</span>
            <h2>{editingId ? 'Edit Pertanyaan' : 'Form Kuisioner Karakter'}</h2>
          </div>
          <button type="button" className="quest-drawer-close" onClick={closeDrawer}>
            Tutup
          </button>
        </div>

        <form id="questDrawerForm" className="quest-drawer-form" onSubmit={handleSubmit}>
          <label>
            Pertanyaan
            <textarea
              name="question"
              value={form.question}
              onChange={handleChange}
              placeholder="Tulis pertanyaan kuisioner..."
              required
            />
          </label>

          <label>
            Tipe Jawaban
            <select name="answerType" value={form.answerType} onChange={handleChange}>
              <option value="Pilihan">Pilihan</option>
              <option value="Skala">Skala</option>
            </select>
          </label>

          <label>
            Status
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </label>
        </form>

        <div className="quest-drawer-foot">
          <button type="button" className="quest-secondary" onClick={resetForm}>
            Reset
          </button>
          <button type="submit" form="questDrawerForm" className="quest-primary">
            {editingId ? 'Simpan Perubahan' : 'Simpan'}
          </button>
        </div>
      </aside>
    </div>
  )
}

export default QuestionnaireCharacter
