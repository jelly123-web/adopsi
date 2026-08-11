import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import CustomerLayout from '../components/CustomerLayout'
import { publishLiveData, subscribeLiveData } from '../utils/liveDataEvents'

const API_BASE_URL = 'http://localhost:3000/api'
const defaultAppSettings = {
  adoption_location: 'Shelter Sahabat Kecil',
}

const isVideoMedia = (value = '') =>
  value.startsWith('data:video') || /\.(mp4|webm|ogg)(\?|#|$)/i.test(value)

const fallbackPhotos = [
  'https://picsum.photos/seed/orange-tabby-cat-face/700/700.jpg',
  'https://picsum.photos/seed/corgi-puppy-happy-face/700/700.jpg',
  'https://picsum.photos/seed/persian-cat-white-face/700/700.jpg',
  'https://picsum.photos/seed/golden-retriever-portrait/700/700.jpg',
]

const quizQuestions = [
  {
    title: 'Gaya hidupmu lebih ke mana?',
    subtitle: 'Pilih yang paling menggambarkan dirimu.',
    options: [
      { value: 'active', title: 'Aktif & Outdoor', desc: 'Suka jalan, lari, kegiatan outdoor', icon: 'fa-running' },
      { value: 'home', title: 'Homebody', desc: 'Lebih nyaman di rumah, nonton, baca', icon: 'fa-couch' },
      { value: 'social', title: 'Sosial & Fleksibel', desc: 'Suka hangout tapi juga senang di rumah', icon: 'fa-users' },
    ],
  },
  {
    title: 'Seberapa sibuk kamu?',
    subtitle: 'Realistis ya, biar akurat.',
    options: [
      { value: 'free', title: 'Banyak Waktu Luang', desc: 'Bisa dedicated ngurus hewan setiap hari', icon: 'fa-clock' },
      { value: 'moderate', title: 'Cukup Sibuk', desc: 'Kerja tapi masih bisa meluangkan waktu', icon: 'fa-clock' },
      { value: 'busy', title: 'Sangat Sibuk', desc: 'Hampir tidak punya waktu ekstra', icon: 'fa-clock' },
    ],
  },
  {
    title: 'Tempat tinggalmu seperti apa?',
    subtitle: 'Ini penting untuk kenyamanan hewan.',
    options: [
      { value: 'house', title: 'Rumah dengan Halaman', desc: 'Ada taman atau halaman luas', icon: 'fa-home' },
      { value: 'apartment', title: 'Apartemen / Studio', desc: 'Ruang terbatas tapi rapi', icon: 'fa-building' },
      { value: 'kost', title: 'Kos / Kontrakan Kecil', desc: 'Satu kamar, ruang minim', icon: 'fa-door-open' },
    ],
  },
  {
    title: 'Kepribadianmu lebih ke mana?',
    subtitle: 'Pilih yang paling cocok dengan kebiasaanmu.',
    options: [
      { value: 'playful', title: 'Ceria & Playful', desc: 'Suka bercanda, ekspresif, penuh energi', icon: 'fa-smile' },
      { value: 'calm', title: 'Tenang & Pendiam', desc: 'Menikmati suasana tenang dan tidak ribut', icon: 'fa-moon' },
      { value: 'caring', title: 'Perhatian & Penuh Kasih', desc: 'Suka merawat, detail, dan sabar', icon: 'fa-heart' },
    ],
  },
  {
    title: 'Hewan seperti apa yang kamu cari?',
    subtitle: 'Ini membantu rekomendasi terakhir.',
    options: [
      { value: 'cat', title: 'Mandiri & Tenang', desc: 'Cocok untuk ruang kecil dan rutinitas santai', icon: 'fa-cat' },
      { value: 'dog', title: 'Setia & Aktif', desc: 'Cocok untuk keluarga yang sering bergerak', icon: 'fa-dog' },
      { value: 'small', title: 'Kecil & Mudah Dirawat', desc: 'Cocok untuk pemula atau tempat terbatas', icon: 'fa-paw' },
    ],
  },
]

const getEmptyForm = () => ({
  full_name: localStorage.getItem('authName') || '',
  phone: localStorage.getItem('authPhone') || '',
  email: localStorage.getItem('authEmail') || '',
  address: localStorage.getItem('authAddress') || '',
  job: '-',
  family_count: '-',
  housing_type: '-',
  pet_experience: '-',
  reason: 'Pesan adopsi melalui aplikasi.',
  document_url: '',
  pickup_method: '',
})

function normalizeAnimalActivity(value = '') {
  const text = String(value).toLowerCase()
  if (text.includes('rumah') || text.includes('tenang') || text.includes('diam')) return 'home'
  if (text.includes('main') || text.includes('aktif') || text.includes('keluar') || text.includes('jalan')) return 'active'
  return 'neutral'
}

function isSpeciesMatch(animal, expected) {
  const species = String(animal?.species || animal?.category_name || '').toLowerCase()
  if (expected === 'cat') return species.includes('kucing')
  if (expected === 'dog') return species.includes('anjing')
  if (expected === 'small') return !species.includes('anjing')
  return true
}

function isCompatibleWithAnswers(animal, answers) {
  const activity = normalizeAnimalActivity(animal?.activity_preference || animal?.habits || '')
  const species = String(animal?.species || animal?.category_name || '').toLowerCase()
  const isCat = species.includes('kucing')
  const isDog = species.includes('anjing')
  const isSmall = !isDog

  if (answers[0] === 'home' && activity === 'active') return false
  if (answers[0] === 'active' && activity === 'home') return false

  if (answers[2] === 'apartment' || answers[2] === 'kost') {
    if (isDog && activity === 'active') return false
  }

  if (answers[3] === 'calm' && activity === 'active') return false
  if (answers[3] === 'playful' && activity === 'home') return false

  if (answers[4] === 'cat' && !isCat) return false
  if (answers[4] === 'dog' && !isDog) return false
  if (answers[4] === 'small' && !isSmall) return false

  return true
}

function scoreAnimalCompatibility(animal, answers, index = 0) {
  const species = String(animal?.species || animal?.category_name || '').toLowerCase()
  const activity = normalizeAnimalActivity(animal?.activity_preference || animal?.habits || '')
  const condition = String(animal?.condition || animal?.health_condition || '').toLowerCase()
  let score = 50

  if (answers[0] === 'active') {
    score += activity === 'active' ? 22 : activity === 'neutral' ? 8 : -20
    score += species.includes('anjing') ? 10 : 0
  }

  if (answers[0] === 'home') {
    score += activity === 'home' ? 22 : activity === 'neutral' ? 8 : -24
    score += species.includes('kucing') ? 10 : 0
  }

  if (answers[0] === 'social') {
    score += activity === 'neutral' ? 12 : 6
  }

  if (answers[1] === 'free') {
    score += activity === 'active' ? 10 : 4
  }

  if (answers[1] === 'moderate') {
    score += activity === 'neutral' ? 10 : 6
  }

  if (answers[1] === 'busy') {
    score += activity === 'home' || activity === 'neutral' ? 14 : -12
  }

  if (answers[2] === 'house') {
    score += isSpeciesMatch(animal, 'dog') ? 10 : 4
  }

  if (answers[2] === 'apartment' || answers[2] === 'kost') {
    score += isSpeciesMatch(animal, 'cat') ? 14 : isSpeciesMatch(animal, 'small') ? 10 : 0
    score += activity === 'active' ? -14 : 4
  }

  if (answers[3] === 'playful') {
    score += activity === 'active' ? 22 : activity === 'neutral' ? 8 : -18
  }

  if (answers[3] === 'calm') {
    score += activity === 'home' ? 22 : activity === 'neutral' ? 10 : -20
  }

  if (answers[3] === 'caring') {
    score += condition.includes('sehat') || condition.includes('baik') ? 8 : 0
  }

  if (answers[4] === 'cat') {
    score += species.includes('kucing') ? 26 : -18
  }

  if (answers[4] === 'dog') {
    score += species.includes('anjing') ? 26 : -18
  }

  if (answers[4] === 'small') {
    score += isSpeciesMatch(animal, 'small') ? 18 : -10
  }

  return Math.min(99, Math.max(1, score - index))
}

function PetMedia({ animal, className = '' }) {
  const fallback = fallbackPhotos[Math.abs(Number(animal?.id || 0)) % fallbackPhotos.length]
  const src = animal?.photo || fallback

  if (isVideoMedia(src)) return <video className={className} src={src} autoPlay muted loop playsInline />
  return <img className={className} src={src} alt={animal?.name || 'Hewan'} />
}

function CustomerCardIcon({ kind }) {
  if (kind === 'location') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 3L10 14" />
        <path d="M21 3L14 21l-4-7-7-4z" />
      </svg>
    )
  }

  if (kind === 'house') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 11.5L12 5l8 6.5" />
        <path d="M6.5 10.5V19h11v-8.5" />
        <path d="M10 19v-4.5h4V19" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M6.5 18.5c1.3-3 3.3-4.5 5.5-4.5s4.2 1.5 5.5 4.5" />
    </svg>
  )
}

export default function CustomerAdoption() {
  const [searchParams] = useSearchParams()
  const [animals, setAnimals] = useState([])
  const [view, setView] = useState(searchParams.get('animal_id') ? 'detail' : 'quiz')
  const [quizIndex, setQuizIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [selectedAnimalId, setSelectedAnimalId] = useState(searchParams.get('animal_id') || '')
  const [form, setForm] = useState(getEmptyForm)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sentAnimal, setSentAnimal] = useState(null)
  const [activeMedia, setActiveMedia] = useState(null)
  const [appSettings, setAppSettings] = useState(() => {
    try {
      return { ...defaultAppSettings, ...JSON.parse(localStorage.getItem('appSettings') || '{}') }
    } catch {
      return defaultAppSettings
    }
  })

  const selectedAnimal = useMemo(
    () => animals.find((animal) => String(animal.id) === String(selectedAnimalId)),
    [animals, selectedAnimalId],
  )

  const recommendations = useMemo(() => {
    const compatible = animals.filter((animal) => isCompatibleWithAnswers(animal, answers))
    const source = compatible.length > 0 ? compatible : animals

    const scored = source.map((animal, index) => ({
      ...animal,
      match: scoreAnimalCompatibility(animal, answers, index),
    }))

    return scored.sort((a, b) => b.match - a.match).slice(0, 3)
  }, [animals, answers])

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/superadmin/animals?limit=200`)
      .then((res) => setAnimals(res.data?.data || []))
      .catch(() => setAnimals([]))
  }, [])

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/superadmin/settings`)
      .then((res) => {
        const settings = { ...defaultAppSettings, ...(res.data?.data || {}) }
        setAppSettings(settings)
        localStorage.setItem('appSettings', JSON.stringify(settings))
      })
      .catch(() => {})
  }, [])

  // Refresh animal list when admin updates animals
  useEffect(() => {
    const unsubscribe = subscribeLiveData('animals', () => {
      axios
        .get(`${API_BASE_URL}/superadmin/animals?limit=200`)
        .then((res) => setAnimals(res.data?.data || []))
        .catch(() => setAnimals([]))
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const animalId = searchParams.get('animal_id')
    if (animalId) {
      queueMicrotask(() => {
        setSelectedAnimalId(animalId)
        setActiveMedia(null)
        setView('detail')
      })
    }
  }, [searchParams])

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const showView = (nextView) => {
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
        showView('results')
      }
    }, 400)
  }

  const openDetail = (animalId) => {
    setSelectedAnimalId(animalId)
    setActiveMedia(null)
    showView('detail')
  }

  const startForm = () => {
    setForm(getEmptyForm())
    showView('form')
  }

  const submitAdoption = async () => {
    const accountForm = {
      ...form,
      full_name: localStorage.getItem('authName') || form.full_name,
      phone: localStorage.getItem('authPhone') || form.phone,
      email: localStorage.getItem('authEmail') || form.email,
      address: localStorage.getItem('authAddress') || form.address,
      job: form.job || '-',
      family_count: form.family_count || '-',
      housing_type: form.housing_type || '-',
      pet_experience: form.pet_experience || '-',
      reason: form.reason || 'Pesan adopsi melalui aplikasi.',
    }

    if (!accountForm.pickup_method) {
      setMessage({ type: 'error', text: 'Pilih metode pengambilan dulu.' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      await axios.post(`${API_BASE_URL}/customer/adoption-requests`, {
        user_id: localStorage.getItem('authUserId'),
        animal_id: selectedAnimalId,
        ...accountForm,
      })
      publishLiveData('adoptions')
      setSentAnimal(selectedAnimal)
      showView('success')
      setForm(getEmptyForm())
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Gagal mengirim pengajuan adopsi.' })
    } finally {
      setLoading(false)
    }
  }

  const renderQuiz = () => {
    const question = quizQuestions[quizIndex]
    const progress = Math.round(((quizIndex + 1) / quizQuestions.length) * 100)

    return (
      <section className="customer-adopt-quiz">
        <div className="customer-quiz-hero">
          <div className="customer-match-pill"><i className="fas fa-heart heartbeat" /> Kecocokan Karakter</div>
          <h1>Hewan Mana yang<br /><span>Cocok Untukmu?</span></h1>
          <p>Jawab 5 pertanyaan singkat dan kami akan merekomendasikan hewan terbaik.</p>
        </div>
        <div className="customer-quiz-panel">
          <div className="customer-quiz-progress">
            <strong>PERTANYAAN {quizIndex + 1} / {quizQuestions.length}</strong>
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
                <div className="customer-radio"><i className="fas fa-check" /></div>
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
              <i className="fas fa-arrow-left" /> Kembali
            </button>
          ) : null}
        </div>
      </section>
    )
  }

  const renderResults = () => (
    <section className="customer-adopt-results">
      <div className="customer-quiz-hero">
        <div className="customer-match-pill"><i className="fas fa-heart heartbeat" /> Kecocokan Karakter</div>
        <h1>Hewan Mana yang<br /><span>Cocok Untukmu?</span></h1>
        <p>Berdasarkan jawabanmu:</p>
      </div>
      <div className="customer-result-star"><i className="fas fa-star" /></div>
      <h2>Kecocokan Terbaik</h2>
      <div className="customer-result-list">
        {recommendations.map((animal) => (
          <article className="customer-result-card" key={animal.id}>
            <div className="customer-result-photo">
              <PetMedia animal={animal} />
              <span><i className="fas fa-star" /> {animal.match}%</span>
            </div>
            <section>
              <div className="customer-result-title">
                <h3>{animal.name}</h3>
                <small>{animal.status || 'Tersedia'}</small>
              </div>
              <p>{animal.species || animal.category_name || 'Hewan'} - {animal.age || 1} tahun</p>
              <div className="customer-result-tags">
                {[animal.activity_preference, animal.health_condition, animal.gender].filter(Boolean).slice(0, 3).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <div className="customer-result-match">
                <strong>Kecocokan</strong>
                <b>{animal.match}%</b>
                <div><i style={{ width: `${animal.match}%` }} /></div>
              </div>
              <p>{animal.reason || buildReason(animal, answers)}</p>
              <button type="button" className="customer-main-btn small" onClick={() => openDetail(animal.id)}>
                <i className="fas fa-heart" /> Ajukan Adopsi
              </button>
            </section>
          </article>
        ))}
      </div>
      <button type="button" className="customer-outline-btn" onClick={() => { setQuizIndex(0); setAnswers({}); showView('quiz') }}>
        <i className="fas fa-redo" /> Ulangi Kuis
      </button>
    </section>
  )

  const renderDetail = () => {
    if (!selectedAnimal) return null
    const tags = [selectedAnimal.activity_preference, selectedAnimal.health_condition, selectedAnimal.gender].filter(Boolean)

    const mediaList = [
      { type: 'photo', url: selectedAnimal.photo },
      { type: 'photo_top', url: selectedAnimal.photo_top },
      { type: 'photo_back', url: selectedAnimal.photo_back },
      { type: 'video', url: selectedAnimal.video },
    ].filter(m => m.url)

    const mainMediaUrl = activeMedia || selectedAnimal.photo

    return (
      <section className="customer-detail-page">
        <div className="customer-detail-gallery">
          <div className="customer-detail-main-media">
            {isVideoMedia(mainMediaUrl) ? (
              <video src={mainMediaUrl} controls autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <img src={mainMediaUrl} alt={selectedAnimal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>
          {mediaList.length > 1 && (
            <div className="customer-detail-thumbnails" style={{ display: 'flex', gap: 10, marginTop: 10, overflowX: 'auto', paddingBottom: 10 }}>
              {mediaList.map((media, i) => (
                <div
                  key={i}
                  onClick={() => setActiveMedia(media.url)}
                  style={{
                    width: 70, height: 70, flexShrink: 0, borderRadius: 8, overflow: 'hidden',
                    cursor: 'pointer', border: mainMediaUrl === media.url ? '2px solid var(--accent)' : '2px solid transparent'
                  }}
                >
                  {isVideoMedia(media.url) ? (
                    <video src={media.url} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                  ) : (
                    <img src={media.url} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="customer-detail-info">
          <div className="customer-detail-badges">
            <span>{selectedAnimal.species || 'Hewan'}</span>
            <span>{selectedAnimal.category_name || selectedAnimal.species || 'Adopsi'}</span>
          </div>
          <h1>{selectedAnimal.name}</h1>
          <p><i className="fas fa-map-marker-alt" /> {appSettings.adoption_location || defaultAppSettings.adoption_location}</p>
          <div className="customer-detail-stats">
            <div><strong>{selectedAnimal.age || 0} tahun</strong><span>Umur</span></div>
            <div><strong>{selectedAnimal.weight || '-'}</strong><span>Berat</span></div>
            <div><strong>{selectedAnimal.color || '-'}</strong><span>Warna</span></div>
            <div><strong>{selectedAnimal.gender || '-'}</strong><span>Gender</span></div>
          </div>
          <h3>Tentang {selectedAnimal.name}</h3>
          <p>{selectedAnimal.description || `${selectedAnimal.name} siap menjadi bagian dari keluargamu. Hewan ini sedang menunggu adopter yang tepat.`}</p>
          <h3>Karakter</h3>
          <div className="customer-detail-tags">
            {(tags.length ? tags : ['Ramah', 'Siap Diadopsi']).map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          <h3>Kesehatan</h3>
          <div className="customer-health-list">
            {['Vaksinasi lengkap', 'Sudah diperiksa petugas', selectedAnimal.health_condition || 'Sehat dan aktif'].map((item) => (
              <span key={item}><i className="fas fa-check" /> {item}</span>
            ))}
          </div>
          <div className="customer-detail-actions">
            <button type="button" className="customer-main-btn" onClick={startForm} disabled={loading}>
              {loading ? <><i className="fas fa-spinner fa-spin" /> Memproses...</> : <><i className="fas fa-heart" /> Ajukan Adopsi</>}
            </button>
            <button type="button" className="customer-outline-btn"><i className="fas fa-share-alt" /></button>
          </div>
        </div>
      </section>
    )
  }

  const renderForm = () => (
    <section className="customer-adopt-form-wrap">
      <div className="customer-adopt-pet-summary">
        <div className="customer-adopt-pet-photo"><PetMedia animal={selectedAnimal} /></div>
        <div>
          <h3>{selectedAnimal?.name || '-'}</h3>
          <p>{selectedAnimal?.species || selectedAnimal?.category_name || 'Hewan'} - {selectedAnimal?.age || 0} tahun</p>
        </div>
        <div className="customer-adopt-paw"><i className="fas fa-paw" /></div>
      </div>

      {message ? <div className={`customer-message ${message.type}`}><i className="fas fa-exclamation-circle" />{message.text}</div> : null}

      <div className="customer-adopt-step customer-quick-order">
        <div className="customer-adopt-step-title centered">
          <h2>Metode Pengambilan</h2>
          <p>Pilih cara pengambilan hewan. Data akunmu akan dipakai otomatis.</p>
        </div>

        <div className="customer-location-card">
          <span className="customer-card-icon customer-card-icon-location">
            <CustomerCardIcon kind="location" />
          </span>
          <div>
            <span>Lokasi Tempat Adopsi</span>
            <strong>{appSettings.adoption_location || defaultAppSettings.adoption_location}</strong>
          </div>
        </div>

        <div className="customer-pickup-options">
          <button
            type="button"
            className={`customer-pickup-option ${form.pickup_method === 'langsung' ? 'selected' : ''}`}
            onClick={() => setField('pickup_method', 'langsung')}
          >
            <span className="customer-pickup-check"><i className="fas fa-check" /></span>
            <span className="customer-card-icon customer-pickup-icon customer-card-icon-pickup">
              <CustomerCardIcon kind="house" />
            </span>
            <strong>Ambil langsung di tempat</strong>
          </button>
          <button
            type="button"
            className={`customer-pickup-option ${form.pickup_method === 'antar' ? 'selected' : ''}`}
            onClick={() => setField('pickup_method', 'antar')}
          >
            <span className="customer-pickup-check"><i className="fas fa-check" /></span>
            <span className="customer-card-icon customer-pickup-icon customer-card-icon-pickup">
              <CustomerCardIcon kind="person" />
            </span>
            <strong>Diantar oleh petugas</strong>
          </button>
        </div>

        <div className="customer-adopt-actions end">
          <button type="button" className="customer-main-btn" onClick={submitAdoption} disabled={loading || !form.pickup_method}>
            <i className={loading ? 'fas fa-spinner fa-spin' : 'fas fa-shopping-bag'} />
            {loading ? 'Memesan...' : 'Pesan Adopsi'}
          </button>
        </div>
      </div>
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
            <div className="customer-success-ring"><i className="fas fa-check-circle" /></div>
            <h2>Pengajuan Terkirim!</h2>
            <p>Pengajuan adopsi <strong>{sentAnimal?.name || selectedAnimal?.name}</strong> berhasil dikirim. Petugas akan memverifikasi data kamu.</p>
            <div>
              <Link to="/customer/status" className="customer-main-btn"><i className="fas fa-clipboard-list" /> Lihat Status</Link>
              <button type="button" className="customer-outline-btn" onClick={() => { setQuizIndex(0); setAnswers({}); showView('quiz') }}>Ajukan Lagi</button>
            </div>
          </section>
        ) : null}
      </main>
    </CustomerLayout>
  )
}

function buildReason(animal, answers) {
  const species = String(animal?.species || animal?.category_name || '').toLowerCase()
  const activity = normalizeAnimalActivity(animal?.activity_preference || animal?.habits || '')

  if (answers[0] === 'home' || answers[3] === 'calm') {
    return `${animal.name} cenderung tenang dan cocok untuk suasana rumah yang santai.`
  }
  if (answers[0] === 'active' || answers[3] === 'playful') {
    return `${animal.name} lebih cocok untuk adopter yang aktif dan suka interaksi.`
  }
  if (answers[4] === 'cat' || species.includes('kucing')) {
    return `${animal.name} sesuai untuk kamu yang mencari hewan mandiri dan tenang.`
  }
  if (answers[4] === 'dog' || species.includes('anjing')) {
    return `${animal.name} cocok untuk kamu yang siap dengan hewan yang lebih ekspresif dan interaktif.`
  }
  if (activity === 'home') {
    return `${animal.name} punya kebiasaan yang lebih santai dan tidak terlalu ramai.`
  }
  if (answers[3] === 'caring') {
    return `${animal.name} cocok untuk kamu yang telaten dan penuh perhatian.`
  }
  return `${animal.name} mudah menyesuaikan dengan kebiasaanmu.`
}
