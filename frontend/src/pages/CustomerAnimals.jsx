import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import CustomerLayout from '../components/CustomerLayout'
import { subscribeLiveData } from '../utils/liveDataEvents'

const isVideoMedia = (value = '') => value.startsWith('data:video') || /\.(mp4|webm|ogg)(\?|#|$)/i.test(value)
const normalizeValue = (value = '') => String(value || '').trim().toLowerCase()
const getAnimalCategory = (animal = {}) => animal.category_name || animal.category || animal.species || ''

const uniqueLabels = (items = []) => {
  const labels = new Map()

  items.filter(Boolean).forEach((item) => {
    const label = String(item).trim()
    const key = normalizeValue(label)

    if (label && !labels.has(key)) {
      labels.set(key, label)
    }
  })

  return [...labels.values()]
}

function AnimalMedia({ src, alt = '' }) {
  if (!src) {
    return (
      <div className="customer-animal-placeholder">
        <i className="fas fa-paw"></i>
      </div>
    )
  }

  if (isVideoMedia(src)) {
    return <video src={src} autoPlay muted loop playsInline />
  }

  return <img src={src} alt={alt} />
}

function CustomerAnimals() {
  const [animals, setAnimals] = useState([])
  const [categories, setCategories] = useState(['Semua'])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [selectedAnimal, setSelectedAnimal] = useState(null)

  const filteredAnimals = useMemo(() => {
    const search = normalizeValue(searchTerm)
    const filterCategory = normalizeValue(selectedCategory)

    return animals.filter((animal) => {
      const category = getAnimalCategory(animal)
      const matchesCategory =
        selectedCategory === 'Semua' ||
        normalizeValue(category) === filterCategory ||
        normalizeValue(animal.species) === filterCategory

      const searchable = [
        animal.name,
        animal.species,
        animal.category,
        animal.category_name,
        animal.gender,
        animal.status,
        animal.condition,
        animal.activity_preference,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return matchesCategory && (!search || searchable.includes(search))
    })
  }, [animals, searchTerm, selectedCategory])

  useEffect(() => {
    let active = true

    const loadAnimalsAndCategories = () => {
      Promise.allSettled([
      axios.get('http://localhost:3000/api/superadmin/animals'),
      axios.get('http://localhost:3000/api/superadmin/categories'),
    ]).then(([animalsResult, categoriesResult]) => {
      if (!active) return

      const animalsData = animalsResult.status === 'fulfilled' ? animalsResult.value.data?.data || [] : []
      const categoryData = categoriesResult.status === 'fulfilled' ? categoriesResult.value.data?.data || [] : []
      const categoryNames = categoryData.map((category) => category.name)
      const fallbackCategories = animalsData.map((animal) => getAnimalCategory(animal))

      setAnimals(animalsData)
      setCategories(['Semua', ...uniqueLabels([...categoryNames, ...fallbackCategories])])
    })
    }

    loadAnimalsAndCategories()
    const unsubscribe = subscribeLiveData(['animals', 'categories'], loadAnimalsAndCategories)
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return (
    <CustomerLayout>
      <main className="customer-page">
        <section className="customer-hero-card">
          <div>
            <span className="customer-pill"><i></i> Jelajahi Hewan</span>
            <h1>Jelajahi Hewan</h1>
            <p>
              Lihat daftar hewan, cari berdasarkan nama atau jenis, filter kategori, lalu klik kartu untuk
              melihat detail.
            </p>
            <div className="customer-feature-list">
              <span><i className="fas fa-list"></i> Daftar hewan</span>
              <span><i className="fas fa-search"></i> Cari nama atau jenis</span>
              <span><i className="fas fa-filter"></i> Filter kategori</span>
              <span><i className="fas fa-eye"></i> Detail hewan</span>
            </div>
          </div>
          <div className="customer-search">
            <i className="fas fa-search"></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari nama hewan atau jenis hewan..."
            />
          </div>
        </section>

        <section className="customer-filter-row">
          <div className="customer-filter-label">
            <i className="fas fa-filter"></i>
            Filter kategori
          </div>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`customer-filter-pill ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category !== 'Semua' ? <i className="fas fa-paw"></i> : null}
              {category}
            </button>
          ))}
        </section>

        <section className="customer-pet-grid">
          {filteredAnimals.map((animal, index) => (
            <button
              key={animal.id}
              type="button"
              className="customer-pet-card"
              style={{ animationDelay: `${index * 0.04}s` }}
              onClick={() => setSelectedAnimal(animal)}
            >
              <div className="customer-pet-media">
                <AnimalMedia src={animal.photo} alt={animal.name} />
                <span className="customer-pet-status">{animal.status || 'tersedia'}</span>
                <span className="customer-pet-heart"><i className="far fa-heart"></i></span>
              </div>
              <div className="customer-pet-info">
                <div>
                  <h2>{animal.name}</h2>
                  <p>{getAnimalCategory(animal) || 'Hewan'} - {animal.age || 0} tahun</p>
                </div>
                <span>{animal.gender || '-'}</span>
              </div>
              <div className="customer-card-footer">
                <span className="customer-location">
                  <i className="fas fa-map-marker-alt"></i>
                  Shelter Adopsi
                </span>
                <span className="customer-card-detail">
                  Lihat Detail
                  <i className="fas fa-arrow-right"></i>
                </span>
              </div>
            </button>
          ))}

          {filteredAnimals.length === 0 ? (
            <div className="customer-empty wide">
              <i className="fas fa-search"></i>
              <strong>Tidak ada hewan yang cocok</strong>
              <p>Coba ubah pencarian atau filter kategori.</p>
            </div>
          ) : null}
        </section>
      </main>

      {selectedAnimal ? (
        <div className="customer-detail-backdrop" onClick={() => setSelectedAnimal(null)}>
          <div className="customer-detail-modal new" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="customer-modal-close" onClick={() => setSelectedAnimal(null)}>
              <i className="fas fa-times"></i>
            </button>
            <div className="customer-detail-media">
              <AnimalMedia src={selectedAnimal.photo} alt={selectedAnimal.name} />
            </div>
            <div className="customer-detail-body">
              <div className="customer-detail-badges">
                <span>{getAnimalCategory(selectedAnimal) || '-'}</span>
                <span>{selectedAnimal.status || 'tersedia'}</span>
              </div>
              <h2>{selectedAnimal.name}</h2>
              <p className="customer-detail-location">
                <i className="fas fa-map-marker-alt"></i>
                Shelter Adopsi
              </p>

              <div className="customer-detail-stats">
                <div><strong>{selectedAnimal.age || 0}</strong><span>Tahun</span></div>
                <div><strong>{selectedAnimal.gender || '-'}</strong><span>Gender</span></div>
                <div><strong>{selectedAnimal.condition || '-'}</strong><span>Kondisi</span></div>
              </div>

              <h3>Tentang {selectedAnimal.name}</h3>
              <p className="customer-detail-desc">
                {selectedAnimal.name} adalah {getAnimalCategory(selectedAnimal) || 'hewan'} yang sedang tersedia
                untuk diadopsi. Kondisinya {selectedAnimal.condition || 'baik'} dan memiliki kebiasaan{' '}
                {selectedAnimal.activity_preference || 'aktif'}.
              </p>

              <div className="customer-detail-tags">
                <span>{selectedAnimal.activity_preference || 'Aktif'}</span>
                <span>{selectedAnimal.condition || 'Sehat'}</span>
                <span>{selectedAnimal.status || 'tersedia'}</span>
              </div>

              <Link to={`/customer/adoptions?animal_id=${selectedAnimal.id}`} className="customer-main-btn detail-action">
                <i className="fas fa-heart"></i>
                Ajukan Adopsi
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </CustomerLayout>
  )
}

export default CustomerAnimals
