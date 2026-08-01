import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import CustomerLayout from '../components/CustomerLayout'
import { publishLiveData } from '../utils/liveDataEvents'

const API_BASE_URL = 'http://localhost:3000/api'

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

const emptyForm = {
  full_name: localStorage.getItem('authName') || '',
  phone: '',
  email: localStorage.getItem('authEmail') || '',
  address: '',
  job: '',
  family_count: '',
  housing_type: '',
  pet_experience: '',
  reason: '',
  document_url: '',
}

function PetMedia({ animal, className = '' }) {
  const fallback = fallbackPhotos[Math.abs(Number(animal?.id || 0)) % fallbackPhotos.length]
  const src = animal?.photo || fallback

  if (isVideoMedia(src)) return <video className={className} src={src} autoPlay muted loop playsInline />
  return <img className={className} src={src} alt={animal?.name || 'Hewan'} />
}

export default function CustomerAdoption() {
  const [searchParams] = useSearchParams()
  const [animals, setAnimals] = useState([])
  const [view, setView] = useState(searchParams.get('animal_id') ? 'detail' : 'quiz')
  const [quizIndex, setQuizIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [selectedAnimalId, setSelectedAnimalId] = useState(searchParams.get('animal_id') || '')
  const [formStep, setFormStep] = useState(1)
  const [form, setForm] = useState(emptyForm)
  const [fileName, setFileName] = useState('')
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sentAnimal, setSentAnimal] = useState(null)

  const selectedAnimal = useMemo(
    () => animals.find((animal) => String(animal.id) === String(selectedAnimalId)),
    [animals, selectedAnimalId],
  )

  const recommendations = useMemo(() => {
    const scored = animals.map((animal, index) => {
      const species = String(animal.species || animal.category_name || '').toLowerCase()
      const habit = String(animal.activity_preference || animal.habits || '').toLowerCase()
      let score = 76

      if (answers[0] === 'active' && (species.includes('anjing') || habit.includes('aktif'))) score += 14
      if (answers[0] === 'home' && (species.includes('kucing') || habit.includes('rumah'))) score += 14
      if (answers[1] === 'busy' && !species.includes('anjing')) score += 10
      if (answers[2] === 'house' && species.includes('anjing')) score += 10
      if ((answers[2] === 'apartment' || answers[2] === 'kost') && !species.includes('anjing')) score += 12
      if (answers[3] === 'calm' && species.includes('kucing')) score += 8
      if (answers[3] === 'playful' && species.includes('anjing')) score += 8
      if (answers[4] === 'cat' && species.includes('kucing')) score += 12
      if (answers[4] === 'dog' && species.includes('anjing')) score += 12
      if (answers[4] === 'small' && !species.includes('anjing')) score += 8

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
      .then((res) => setAnimals(res.data?.data || []))
      .catch(() => setAnimals([]))
  }, [])

  useEffect(() => {
    const animalId = searchParams.get('animal_id')
    if (animalId) {
      setSelectedAnimalId(animalId)
      setView('detail')
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
    setSelectedAnimalId(String(animalId))
    showView('detail')
  }

  const startForm = () => {
    setFormStep(1)
    showView('form')
  }

  const handleFile = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setField('document_url', reader.result)
      setFileName(file.name)
    }
    reader.readAsDataURL(file)
  }

  const submitAdoption = async () => {
    setLoading(true)
    setMessage(null)

    try {
      await axios.post(`${API_BASE_URL}/customer/adoption-requests`, {
        user_id: localStorage.getItem('authUserId'),
        animal_id: selectedAnimalId,
        ...form,
      })
      publishLiveData('adoptions')
      setSentAnimal(selectedAnimal)
      showView('success')
      setForm(emptyForm)
      setFileName('')
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
              <p>{animal.reason}</p>
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

    return (
      <section className="customer-detail-page">
        <div className="customer-detail-gallery">
          <div className="customer-detail-main-media"><PetMedia animal={selectedAnimal} /></div>
        </div>
        <div className="customer-detail-info">
          <div className="customer-detail-badges">
            <span>{selectedAnimal.species || 'Hewan'}</span>
            <span>{selectedAnimal.category_name || selectedAnimal.species || 'Adopsi'}</span>
          </div>
          <h1>{selectedAnimal.name}</h1>
          <p><i className="fas fa-map-marker-alt" /> Shelter Sahabat Kecil</p>
          <div className="customer-detail-stats">
            <div><strong>{selectedAnimal.age || 0} tahun</strong><span>Umur</span></div>
            <div><strong>{selectedAnimal.weight || '-'}</strong><span>Berat</span></div>
            <div><strong>{selectedAnimal.gender || '-'}</strong><span>Gender</span></div>
            <div><strong>{selectedAnimal.size || 'Kecil'}</strong><span>Ukuran</span></div>
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
            <button type="button" className="customer-main-btn" onClick={startForm}><i className="fas fa-heart" /> Ajukan Adopsi</button>
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

      {formStep === 1 ? (
        <div className="customer-adopt-step">
          <div className="customer-adopt-step-title">
            <h2>Data Diri</h2>
            <p>Pastikan data yang kamu isi sudah benar.</p>
          </div>
          <div className="customer-form-grid customer-adopt-grid">
            <label>Nama Lengkap<input value={form.full_name} onChange={(event) => setField('full_name', event.target.value)} required /></label>
            <label>No. Telepon<input value={form.phone} onChange={(event) => setField('phone', event.target.value)} placeholder="08xxxxxxxxxx" required /></label>
            <label className="customer-form-wide">Email<input value={form.email} onChange={(event) => setField('email', event.target.value)} /></label>
            <label className="customer-form-wide">Alamat Lengkap<textarea value={form.address} onChange={(event) => setField('address', event.target.value)} rows={3} required /></label>
            <label>Pekerjaan<input value={form.job} onChange={(event) => setField('job', event.target.value)} placeholder="Contoh: Karyawan Swasta" /></label>
            <label>Jumlah Anggota Keluarga<select value={form.family_count} onChange={(event) => setField('family_count', event.target.value)}><option value="">Pilih</option><option>1 orang</option><option>2-3 orang</option><option>4-5 orang</option><option>6+ orang</option></select></label>
          </div>
          <div className="customer-adopt-actions end">
            <button type="button" className="customer-main-btn" onClick={() => setFormStep(2)} disabled={!form.full_name || !form.phone || !form.address}>Selanjutnya <i className="fas fa-arrow-right" /></button>
          </div>
        </div>
      ) : null}

      {formStep === 2 ? (
        <div className="customer-adopt-step">
          <div className="customer-adopt-step-title">
            <h2>Pengalaman & Kondisi Rumah</h2>
            <p>Bantu kami memastikan hewan akan nyaman bersamamu.</p>
          </div>
          <div className="customer-form-grid customer-adopt-grid">
            <label className="customer-form-wide">Jenis Tempat Tinggal<select value={form.housing_type} onChange={(event) => setField('housing_type', event.target.value)}><option value="">Pilih</option><option>Rumah dengan halaman luas</option><option>Rumah dengan halaman kecil</option><option>Apartemen</option><option>Kos / kontrakan</option></select></label>
            <label className="customer-form-wide">Pernah Memelihara Hewan?<select value={form.pet_experience} onChange={(event) => setField('pet_experience', event.target.value)}><option value="">Pilih</option><option>Ya, pernah hewan sejenis</option><option>Ya, pernah hewan lain</option><option>Belum pernah</option></select></label>
            <label className="customer-form-wide">Alasan Mengadopsi<textarea value={form.reason} onChange={(event) => setField('reason', event.target.value)} rows={3} placeholder="Ceritakan kenapa kamu ingin mengadopsi hewan ini..." required /></label>
          </div>
          <label className="customer-upload-box customer-adopt-upload">
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.mp4,.webm,.ogg,image/*,video/*" onChange={handleFile} />
            <i className="fas fa-cloud-upload-alt" />
            <strong>{fileName || 'Dokumen pendukung opsional'}</strong>
            <span>Untuk KTP, foto rumah, atau bukti pendukung jika diminta petugas. Bisa dilewati.</span>
          </label>
          <div className="customer-adopt-actions">
            <button type="button" className="customer-outline-btn" onClick={() => setFormStep(1)}><i className="fas fa-arrow-left" /> Kembali</button>
            <button type="button" className="customer-main-btn" onClick={() => setFormStep(3)} disabled={!form.reason}>Selanjutnya <i className="fas fa-arrow-right" /></button>
          </div>
        </div>
      ) : null}

      {formStep === 3 ? (
        <div className="customer-adopt-step">
          <div className="customer-confirm-icon"><i className="fas fa-clipboard-check" /></div>
          <div className="customer-adopt-step-title centered">
            <h2>Konfirmasi Pengajuan</h2>
            <p>Periksa sekali lagi sebelum mengirim.</p>
          </div>
          <div className="customer-confirm-card">
            <div className="customer-confirm-pet">
              <div><PetMedia animal={selectedAnimal} /></div>
              <section><strong>{selectedAnimal?.name || '-'}</strong><span>{selectedAnimal?.species || selectedAnimal?.category_name || 'Hewan'}</span></section>
            </div>
            <div className="customer-confirm-grid">
              <div><span>Nama</span><strong>{form.full_name || '-'}</strong></div>
              <div><span>Telepon</span><strong>{form.phone || '-'}</strong></div>
              <div><span>Email</span><strong>{form.email || '-'}</strong></div>
              <div><span>Status</span><strong className="amber">Menunggu Verifikasi</strong></div>
            </div>
          </div>
          <div className="customer-adopt-note"><i className="fas fa-info-circle" /><p>Tim akan memverifikasi pengajuan dalam 1-3 hari kerja. Jika disetujui, kamu akan dihubungi untuk jadwal visitasi dan pengambilan hewan.</p></div>
          <div className="customer-adopt-actions">
            <button type="button" className="customer-outline-btn" onClick={() => setFormStep(2)}><i className="fas fa-arrow-left" /> Kembali</button>
            <button type="button" className="customer-main-btn" onClick={submitAdoption} disabled={loading}><i className="fas fa-paper-plane" /> {loading ? 'Mengirim...' : 'Kirim Pengajuan'}</button>
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
  if (answers[0] === 'home' || answers[2] === 'apartment' || answers[2] === 'kost') {
    return `${animal.name} cocok untuk ruang kecil dan rutinitas santai.`
  }
  if (answers[0] === 'active' || answers[4] === 'dog') {
    return `${animal.name} cocok untuk adopter yang aktif dan punya waktu bermain.`
  }
  if (answers[3] === 'caring') {
    return `${animal.name} cocok untuk kamu yang telaten dan penuh perhatian.`
  }
  return `${animal.name} mudah menyesuaikan dengan kebiasaanmu.`
}
