import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import CustomerLayout from '../components/CustomerLayout'
import { publishLiveData } from '../utils/liveDataEvents'

const API_BASE_URL = 'http://localhost:3000/api'
const isVideoMedia = (value = '') => value.startsWith('data:video') || /\.(mp4|webm|ogg)(\?|#|$)/i.test(value)

const fallbackPhotos = [
  'https://picsum.photos/seed/orange-tabby-cat-face/700/700.jpg',
  'https://picsum.photos/seed/corgi-puppy-happy-face/700/700.jpg',
  'https://picsum.photos/seed/persian-cat-white-face/700/700.jpg',
  'https://picsum.photos/seed/golden-retriever-portrait/700/700.jpg',
]

const initialForm = {
  full_name: '',
  phone: '',
  email: '',
  address: '',
  job: '',
  family_count: '',
  housing_type: '',
  pet_experience: '',
  reason: '',
  document_url: '',
}

const quizQuestions = [
  {
    title: 'Gaya hidupmu lebih ke mana?',
    subtitle: 'Pilih yang paling menggambarkan dirimu.',
    options: [
      { value: 'active', title: '🏃 Aktif & Outdoor', desc: 'Suka jalan, lari, kegiatan outdoor', icon: 'fa-running' },
      { value: 'home', title: '🏠 Homebody', desc: 'Lebih nyaman di rumah, nonton, baca', icon: 'fa-couch' },
      { value: 'social', title: '👋 Sosial & Fleksibel', desc: 'Suka hangout tapi juga senang di rumah', icon: 'fa-users' },
    ],
  },
  {
    title: 'Seberapa sibuk kamu?',
    subtitle: 'Realistis ya, biar akurat!',
    options: [
      { value: 'free', title: '🌱 Banyak Waktu Luang', desc: 'Bisa dedicated ngurus hewan setiap hari', icon: 'fa-clock' },
      { value: 'moderate', title: '⚖️ Cukup Sibuk', desc: 'Kerja tapi masih bisa meluangkan waktu', icon: 'fa-clock' },
      { value: 'busy', title: '🔥 Sangat Sibuk', desc: 'Hampir tidak punya waktu ekstra', icon: 'fa-exclamation-circle' },
    ],
  },
  {
    title: 'Tempat tinggalmu seperti apa?',
    subtitle: 'Ini penting untuk kenyamanan hewan.',
    options: [
      { value: 'house', title: '🏘️ Rumah dengan Halaman', desc: 'Ada taman atau halaman luas', icon: 'fa-home' },
      { value: 'apartment', title: '🏢 Apartemen / Studio', desc: 'Ruang terbatas tapi rapi', icon: 'fa-building' },
      { value: 'kost', title: '🛏️ Kos / Kontrakan Kecil', desc: 'Satu kamar, ruang minim', icon: 'fa-door-open' },
    ],
  },
  {
    title: 'Kepribadianmu lebih ke mana?',
    subtitle: 'Terakhir nih!',
    options: [
      { value: 'playful', title: '😄 Ceria & Playful', desc: 'Suka bercanda, ekspresif, penuh energi', icon: 'fa-smile' },
      { value: 'calm', title: '😌 Tenang & Pendiam', desc: 'Menikmati ketenangan, tidak ribut', icon: 'fa-moon' },
      { value: 'caring', title: '🤗 Perhatian & Penuh Kasih', desc: 'Suka merawat, detail, protektif', icon: 'fa-heart' },
    ],
  },
]


function CustomerAdoption() {
  const [searchParams] = useSearchParams()
  const [animals, setAnimals] = useState([])
  const [view, setView] = useState(searchParams.get('animal_id') ? 'detail' : 'quiz')
  const [quizIndex, setQuizIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [selectedAnimalId, setSelectedAnimalId] = useState(searchParams.get('animal_id') || '')
  const [formStep, setFormStep] = useState(1)
  const [documentName, setDocumentName] = useState('')
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sentAnimal, setSentAnimal] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [agreements, setAgreements] = useState({
    check1: false,
    check2: false,
    check3: false,
    check4: false,
  })

  const selectedAnimal = useMemo(
    () => animals.find((animal) => String(animal.id) === String(selectedAnimalId)),
    [animals, selectedAnimalId],
  )

  const recommendations = useMemo(() => {
    const scored = animals.map((animal, index) => {
      let score = 72
      const species = String(animal.species || '').toLowerCase()
      const habit = String(animal.activity_preference || animal.habits || '').toLowerCase()

      if (answers[0] === 'active' && (species.includes('anjing') || habit.includes('keluar') || habit.includes('aktif'))) score += 16
      if (answers[0] === 'home' && (species.includes('kucing') || habit.includes('rumah'))) score += 16
      if (answers[1] === 'busy' && (species.includes('kucing') || species.includes('kelinci') || species.includes('hamster'))) score += 12
      if (answers[2] === 'house' && species.includes('anjing')) score += 10
      if ((answers[2] === 'apartment' || answers[2] === 'kost') && !species.includes('anjing')) score += 12
      if (answers[3] === 'calm' && species.includes('kucing')) score += 10
      if (answers[3] === 'playful' && species.includes('anjing')) score += 10
      if (answers[4] === 'cat' && species.includes('kucing')) score += 14
      if (answers[4] === 'dog' && species.includes('anjing')) score += 14
      if (answers[4] === 'small' && !species.includes('anjing')) score += 10

      return {
        ...animal,
        match: Math.min(98, score - index),
        reason: buildReason(animal, answers),
      }
    })

    return scored.sort((a, b) => b.match - a.match).slice(0, 3)
  }, [animals, answers])

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/superadmin/animals?limit=200`)
      .then((response) => setAnimals(response.data?.data || []))
      .catch(() => setAnimals([]))
  }, [])

  useEffect(() => {
    if (!selectedAnimalId && animals.length && searchParams.get('animal_id')) {
      setSelectedAnimalId(searchParams.get('animal_id'))
    }
  }, [animals, searchParams, selectedAnimalId])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const goView = (nextView) => {
    setMessage(null)
    setView(nextView)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const answerQuestion = (value) => {
    const nextAnswers = { ...answers, [quizIndex]: value }
    setAnswers(nextAnswers)
    setTimeout(() => {
      if (quizIndex < quizQuestions.length - 1) {
        setQuizIndex((current) => current + 1)
      } else {
        setAnswers(nextAnswers)
        goView('results')
      }
    }, 400)
  }

  const openDetail = (animalId) => {
    setSelectedAnimalId(String(animalId))
    goView('detail')
  }

  const startForm = () => {
    setFormStep(1)
    goView('form')
  }

  const handleDocument = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      updateField('document_url', reader.result)
      setDocumentName(file.name)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    setMessage(null)
    setLoading(true)

    try {
      await axios.post(`${API_BASE_URL}/customer/adoption-requests`, {
        user_id: localStorage.getItem('authUserId'),
        animal_id: selectedAnimalId,
        ...form,
      })
      publishLiveData('adoptions')
      setSentAnimal(selectedAnimal)
      goView('success')
      setForm((current) => ({
        ...current,
        phone: '',
        address: '',
        job: '',
        family_count: '',
        housing_type: '',
        pet_experience: '',
        reason: '',
        document_url: '',
      }))
      setDocumentName('')
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Gagal mengirim pengajuan adopsi.' })
    } finally {
      setLoading(false)
    }
  }

  const renderAnimalMedia = (animal, className = '') => {
    const fallback = fallbackPhotos[Math.abs(Number(animal?.id || 0)) % fallbackPhotos.length]
    const media = animal?.photo || fallback
    if (isVideoMedia(media)) return <video className={className} src={media} autoPlay muted loop playsInline />
    return <img className={className} src={media} alt={animal?.name || 'Hewan'} />
  }

  const renderQuiz = () => {
    const question = quizQuestions[quizIndex]
    const progress = Math.round(((quizIndex + 1) / quizQuestions.length) * 100)

    return (
      <section className="customer-adopt-quiz">
        <div className="customer-adopt-head customer-quiz-hero">
          <span className="customer-match-pill"><i className="fas fa-heart"></i> Kecocokan Karakter</span>
          <h1>Hewan Mana yang<br /><span>Cocok Untukmu?</span></h1>
          <p>Jawab 4 pertanyaan singkat dan kami akan merekomendasikan hewan terbaik.</p>
        </div>

        <div className="customer-quiz-panel">
          <div className="customer-quiz-progress">
            <strong>Pertanyaan {quizIndex + 1}/{quizQuestions.length}</strong>
            <span>{progress}%</span>
            <div><i style={{ width: `${progress}%` }} /></div>
          </div>
          <h2>{question.title}</h2>
          <p>{question.subtitle}</p>
          <div className="customer-quiz-options">
            {question.options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`customer-quiz-option ${answers[quizIndex] === option.value ? 'selected' : ''}`}
                onClick={() => answerQuestion(option.value)}
              >
                <span className="customer-radio"><i className="fas fa-check" /></span>
                <section>
                  <strong>{option.title}</strong>
                  <small>{option.desc}</small>
                </section>
                <i className={`fas ${option.icon} customer-quiz-opt-icon`} />
              </button>
            ))}
          </div>
          {quizIndex > 0 ? (
            <button type="button" className="customer-outline-btn customer-quiz-back" onClick={() => setQuizIndex((current) => current - 1)}>
              <i className="fas fa-arrow-left"></i> Kembali
            </button>
          ) : null}
        </div>
      </section>
    )
  }

  const renderResults = () => (
    <section className="customer-adopt-results">
      <div className="customer-adopt-head customer-quiz-hero">
        <span className="customer-match-pill"><i className="fas fa-heart"></i> Kecocokan Karakter</span>
        <h1>Hewan Mana yang<br /><span>Cocok Untukmu?</span></h1>
        <p>Berdasarkan jawabanmu:</p>
      </div>
      <div className="customer-result-star"><i className="fas fa-star"></i></div>
      <h2>Kecocokan Terbaik</h2>
      <div className="customer-result-list">
        {recommendations.map((animal) => (
          <article className="customer-result-card" key={animal.id}>
            <div className="customer-result-photo">
              {renderAnimalMedia(animal)}
              <span><i className="fas fa-star"></i> {animal.match}%</span>
            </div>
            <section>
              <div className="customer-result-title">
                <h3>{animal.name}</h3>
                <small>Tersedia</small>
              </div>
              <p>{animal.species || 'Hewan'} - {animal.age || 0} tahun</p>
              <div className="customer-result-tags">
                <span>{animal.activity_preference || 'Suka di rumah'}</span>
                <span>{animal.health_condition || 'Sehat'}</span>
              </div>
              <div className="customer-result-match">
                <strong>Kecocokan</strong>
                <b>{animal.match}%</b>
                <div><i style={{ width: `${animal.match}%` }} /></div>
              </div>
              <p>{animal.reason}</p>
              <button type="button" className="customer-main-btn small" onClick={() => openDetail(animal.id)}>
                <i className="fas fa-heart"></i> Ajukan Adopsi
              </button>
            </section>
          </article>
        ))}
      </div>
      <button type="button" className="customer-outline-btn" onClick={() => { setAnswers({}); setQuizIndex(0); goView('quiz') }}>
        Ulangi Kuis
      </button>
    </section>
  )

  const renderDetail = () => {
    if (!selectedAnimal) return null
    const traits = [selectedAnimal.activity_preference || 'Suka di rumah', selectedAnimal.health_condition || 'Sehat', selectedAnimal.status || 'tersedia']

    return (
      <section className="customer-detail-page">
        <div className="customer-detail-gallery">
          <div className="customer-detail-main-media">{renderAnimalMedia(selectedAnimal)}</div>
        </div>
        <div className="customer-detail-info">
          <div className="customer-detail-badges">
            <span>{selectedAnimal.species || 'Hewan'}</span>
            <span>{selectedAnimal.breed || selectedAnimal.species || 'Adopsi'}</span>
          </div>
          <h1>{selectedAnimal.name}</h1>
          <p><i className="fas fa-map-marker-alt"></i> Shelter Sahabat Kecil</p>
          <div className="customer-detail-stats">
            <div><strong>{selectedAnimal.age || 0} tahun</strong><span>Umur</span></div>
            <div><strong>{selectedAnimal.weight || '-'}</strong><span>Berat</span></div>
            <div><strong>{selectedAnimal.gender || '-'}</strong><span>Jantan</span></div>
            <div><strong>{selectedAnimal.size || 'Kecil'}</strong><span>Ukuran</span></div>
          </div>
          <h3>Tentang {selectedAnimal.name}</h3>
          <p>{selectedAnimal.description || `${selectedAnimal.name} siap menjadi bagian dari keluargamu. Hewan ini sudah dicek dan menunggu adopter yang tepat.`}</p>
          <h3>Karakter</h3>
          <div className="customer-detail-tags">{traits.map((trait) => <span key={trait}>{trait}</span>)}</div>
          <h3>Kesehatan</h3>
          <div className="customer-health-list">
            {['Vaksinasi lengkap', 'Sudah diperiksa petugas', selectedAnimal.health_condition || 'Sehat dan aktif'].map((item) => (
              <span key={item}><i className="fas fa-check"></i> {item}</span>
            ))}
          </div>
          <div className="customer-detail-actions">
            <button type="button" className="customer-main-btn" onClick={startForm}><i className="fas fa-heart"></i> Ajukan Adopsi</button>
            <button type="button" className="customer-outline-btn"><i className="fas fa-share-alt"></i></button>
          </div>
        </div>
      </section>
    )
  }

  const renderForm = () => (
    <section className="customer-adopt-form-wrap">
      {/* Steps indicator */}
      <div className="customer-order-steps">
        <div className={`customer-order-step ${formStep === 1 ? 'current' : formStep > 1 ? 'done' : ''}`}>
          <div className="customer-step-circle">
            {formStep > 1 ? <i className="fas fa-check" /> : 1}
          </div>
          <span>Data Diri</span>
        </div>
        <div className="customer-step-line" style={{ background: formStep > 1 ? '#10b981' : '#e2e8f0' }} />
        <div className={`customer-order-step ${formStep === 2 ? 'current' : formStep > 2 ? 'done' : ''}`}>
          <div className="customer-step-circle">
            {formStep > 2 ? <i className="fas fa-check" /> : 2}
          </div>
          <span>Pengalaman</span>
        </div>
        <div className="customer-step-line" style={{ background: formStep > 2 ? '#10b981' : '#e2e8f0' }} />
        <div className={`customer-order-step ${formStep === 3 ? 'current' : ''}`}>
          <div className="customer-step-circle">
            3
          </div>
          <span>Konfirmasi</span>
        </div>
      </div>

      {/* Selected Pet Summary */}
      <div className="customer-adopt-pet-summary">
        <div className="customer-adopt-pet-photo">{renderAnimalMedia(selectedAnimal)}</div>
        <div>
          <h3>{selectedAnimal?.name || '-'}</h3>
          <p>{selectedAnimal?.species || '-'} · {selectedAnimal?.age || 0} tahun</p>
        </div>
        <div className="customer-adopt-paw"><i className="fas fa-paw"></i></div>
      </div>

      {message ? <div className={`customer-message ${message.type}`}><i className="fas fa-exclamation-circle"></i>{message.text}</div> : null}

      {formStep === 1 ? (
        <div className="customer-adopt-step">
          <div className="customer-adopt-step-title">
            <h2>Data Diri</h2>
            <p>Pastikan data yang kamu isi sudah benar.</p>
          </div>
          <div className="customer-adopt-grid">
            <div className="customer-field-group">
              <label>Nama Lengkap</label>
              <input value={form.full_name} onChange={(event) => updateField('full_name', event.target.value)} required />
            </div>
            <div className="customer-field-group">
              <label>No. Telepon</label>
              <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="08xxxxxxxxxx" required />
            </div>
            <div className="customer-field-group full-width">
              <label>Email</label>
              <input value={form.email} onChange={(event) => updateField('email', event.target.value)} />
            </div>
            <div className="customer-field-group full-width">
              <label>Alamat Lengkap</label>
              <textarea value={form.address} onChange={(event) => updateField('address', event.target.value)} rows={3} placeholder="Jl. Contoh No. 123, Kota, Provinsi" required />
            </div>
            <div className="customer-field-group">
              <label>Pekerjaan</label>
              <input value={form.job} onChange={(event) => updateField('job', event.target.value)} placeholder="Contoh: Karyawan Swasta" />
            </div>
            <div className="customer-field-group">
              <label>Jumlah Anggota Keluarga</label>
              <select value={form.family_count} onChange={(event) => updateField('family_count', event.target.value)}>
                <option value="">Pilih</option>
                <option>1 (hidup sendiri)</option>
                <option>2-3 orang</option>
                <option>4-5 orang</option>
                <option>6+ orang</option>
              </select>
            </div>
          </div>
          <div className="customer-adopt-actions end">
            <button type="button" className="customer-main-btn" onClick={() => setFormStep(2)} disabled={!form.full_name || !form.phone || !form.address}>Selanjutnya <i className="fas fa-arrow-right"></i></button>
          </div>
        </div>
      ) : null}

      {formStep === 2 ? (
        <div className="customer-adopt-step">
          <div className="customer-adopt-step-title">
            <h2>Pengalaman & Kondisi Rumah</h2>
            <p>Bantu kami memastikan hewan akan nyaman bersamamu.</p>
          </div>
          <div className="customer-adopt-grid">
            <div className="customer-field-group full-width">
              <label>Jenis Tempat Tinggal</label>
              <select value={form.housing_type} onChange={(event) => updateField('housing_type', event.target.value)}>
                <option value="">Pilih</option>
                <option>Rumah dengan halaman luas</option>
                <option>Rumah dengan halaman kecil</option>
                <option>Apartemen</option>
                <option>Kos / Kontrakan</option>
              </select>
            </div>
            <div className="customer-field-group full-width">
              <label>Pernah Memelihara Hewan?</label>
              <select value={form.pet_experience} onChange={(event) => updateField('pet_experience', event.target.value)}>
                <option value="">Pilih</option>
                <option>Ya, pernah (sama jenis)</option>
                <option>Ya, pernah (beda jenis)</option>
                <option>Belum pernah</option>
              </select>
            </div>
            <div className="customer-field-group full-width">
              <label>Alasan Mengadopsi</label>
              <textarea value={form.reason} onChange={(event) => updateField('reason', event.target.value)} rows={3} placeholder="Ceritakan kenapa kamu ingin mengadopsi hewan ini..." required />
            </div>
          </div>
          <div className="customer-field-group full-width" style={{ marginTop: '20px' }}>
            <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', display: 'block' }}>
              APAKAH KAMU SETUJU DENGAN SYARAT BERIKUT?
            </label>
            <div className="customer-checkbox-list">
              <label className="customer-checkbox-row">
                <input
                  type="checkbox"
                  className="adopt-check"
                  checked={agreements.check1}
                  onChange={() => setAgreements((prev) => ({ ...prev, check1: !prev.check1 }))}
                />
                <span>Saya bersedia memberikan makanan, minuman, dan tempat tinggal yang layak.</span>
              </label>
              <label className="customer-checkbox-row">
                <input
                  type="checkbox"
                  className="adopt-check"
                  checked={agreements.check2}
                  onChange={() => setAgreements((prev) => ({ ...prev, check2: !prev.check2 }))}
                />
                <span>Saya bersedia membawa hewan ke dokter hewan jika sakit.</span>
              </label>
              <label className="customer-checkbox-row">
                <input
                  type="checkbox"
                  className="adopt-check"
                  checked={agreements.check3}
                  onChange={() => setAgreements((prev) => ({ ...prev, check3: !prev.check3 }))}
                />
                <span>Saya tidak akan menjual atau membuang hewan yang diadopsi.</span>
              </label>
              <label className="customer-checkbox-row">
                <input
                  type="checkbox"
                  className="adopt-check"
                  checked={agreements.check4}
                  onChange={() => setAgreements((prev) => ({ ...prev, check4: !prev.check4 }))}
                />
                <span>Saya mengizinkan tim Sahabat Kecil melakukan visitasi rutin.</span>
              </label>
            </div>
          </div>
          <div className="customer-adopt-actions">
            <button type="button" className="customer-outline-btn" onClick={() => setFormStep(1)}><i className="fas fa-arrow-left"></i> Kembali</button>
            <button
              type="button"
              className="customer-main-btn"
              onClick={() => setFormStep(3)}
              disabled={!form.reason || !agreements.check1 || !agreements.check2 || !agreements.check3 || !agreements.check4}
            >
              Selanjutnya <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      ) : null}

      {formStep === 3 ? (
        <div className="customer-adopt-step">
          <div className="customer-confirm-icon"><i className="fas fa-clipboard-check"></i></div>
          <div className="customer-adopt-step-title centered">
            <h2>Konfirmasi Pengajuan</h2>
            <p>Periksa sekali lagi sebelum mengirim.</p>
          </div>
          <div className="customer-confirm-card">
            <div className="customer-confirm-pet">
              <div>{renderAnimalMedia(selectedAnimal)}</div>
              <section><strong>{selectedAnimal?.name || '-'}</strong><span>{selectedAnimal?.species || '-'} · {selectedAnimal?.age || 0} tahun</span></section>
            </div>
            <div className="customer-confirm-grid">
              <div><span>Nama</span><strong>{form.full_name || '-'}</strong></div>
              <div><span>Telepon</span><strong>{form.phone || '-'}</strong></div>
              <div><span>Email</span><strong>{form.email || '-'}</strong></div>
              <div><span>Status</span><strong className="amber">Menunggu Verifikasi</strong></div>
            </div>
          </div>
          <div className="customer-adopt-note"><i className="fas fa-info-circle"></i><p>Tim akan memverifikasi pengajuan dalam 1-3 hari kerja. Jika disetujui, kamu akan dihubungi untuk jadwal visitasi dan pengambilan hewan.</p></div>
          <div className="customer-adopt-actions">
            <button type="button" className="customer-outline-btn" onClick={() => setFormStep(2)}><i className="fas fa-arrow-left"></i> Kembali</button>
            <button type="button" className="customer-main-btn" onClick={handleSubmit} disabled={loading}><i className="fas fa-paper-plane"></i> {loading ? 'Mengirim...' : 'Kirim Pengajuan'}</button>
          </div>
        </div>
      ) : null}
    </section>
  )

  return (
    <CustomerLayout>
      <main className={`customer-page customer-adopt-page ${view === 'detail' ? 'wide' : ''}`}>
        {view === 'quiz' ? renderQuiz() : null}
        {view === 'results' ? renderResults() : null}
        {view === 'detail' ? renderDetail() : null}
        {view === 'form' ? renderForm() : null}
        {view === 'success' ? (
          <section className="customer-adopt-success">
            <div className="customer-success-ring"><i className="fas fa-check-circle"></i></div>
            <h2>Pengajuan Terkirim!</h2>
            <p>Pengajuan adopsi <strong>{sentAnimal?.name || selectedAnimal?.name}</strong> berhasil dikirim. Petugas akan memverifikasi data kamu.</p>
            <div>
              <Link to="/customer/status" className="customer-main-btn"><i className="fas fa-clipboard-list"></i> Lihat Status</Link>
              <button type="button" className="customer-outline-btn" onClick={() => { setAnswers({}); setQuizIndex(0); goView('quiz') }}>Ajukan Lagi</button>
            </div>
          </section>
        ) : null}
      </main>
    </CustomerLayout>
  )
}

function buildReason(animal, answers) {
  const species = String(animal.species || 'hewan').toLowerCase()
  if (answers[0] === 'home' || answers[2] === 'apartment' || answers[2] === 'kost') {
    return `${animal.name} cocok untuk ruang kecil dan rutinitas santai.`
  }
  if (answers[0] === 'active' || answers[4] === 'dog') {
    return `${animal.name} cocok untuk adopter yang aktif dan punya waktu bermain.`
  }
  if (answers[3] === 'caring') {
    return `${animal.name} cocok untuk kamu yang telaten dan penuh perhatian.`
  }
  return `${animal.name} punya karakter ${species} yang mudah menyesuaikan dengan kebiasaanmu.`
}

export default CustomerAdoption
