import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
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
    if (label && !labels.has(key)) labels.set(key, label)
  })
  return [...labels.values()]
}

const CATEGORY_ICONS = {
  anjing: '🐕', kucing: '🐱', kelinci: '🐰', burung: '🐦',
  hamster: '🐹', ikan: '🐠', reptil: '🦎', default: '🐾',
}
const getCategoryIcon = (cat = '') => CATEGORY_ICONS[normalizeValue(cat)] || CATEGORY_ICONS.default

const statusColor = (status = '') => {
  const s = normalizeValue(status)
  if (s === 'tersedia' || s === 'available') return { bg: '#DCFCE7', color: '#16A34A', label: 'Tersedia' }
  if (s === 'proses' || s === 'pending') return { bg: '#FEF9C3', color: '#CA8A04', label: 'Proses' }
  if (s === 'diadopsi' || s === 'adopted') return { bg: '#F3F4F6', color: '#6B7280', label: 'Diadopsi' }
  return { bg: '#DCFCE7', color: '#16A34A', label: status || 'Tersedia' }
}

function AnimalMedia({ src, alt = '', className = '' }) {
  if (!src) return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', fontSize: 48 }}>🐾</div>
  )
  if (isVideoMedia(src)) return <video className={className} src={src} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  return <img className={className} src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s cubic-bezier(.22,1,.36,1)' }} />
}

export default function CustomerAnimals() {
  const [animals, setAnimals] = useState([])
  const [categories, setCategories] = useState(['Semua'])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [heartedIds, setHeartedIds] = useState(new Set())

  const filteredAnimals = useMemo(() => {
    const search = normalizeValue(searchTerm)
    const filterCategory = normalizeValue(selectedCategory)
    return animals.filter((animal) => {
      const category = getAnimalCategory(animal)
      const matchesCategory =
        selectedCategory === 'Semua' ||
        normalizeValue(category) === filterCategory ||
        normalizeValue(animal.species) === filterCategory
      const searchable = [animal.name, animal.species, animal.category, animal.category_name, animal.gender, animal.status, animal.condition]
        .filter(Boolean).join(' ').toLowerCase()
      return matchesCategory && (!search || searchable.includes(search))
    })
  }, [animals, searchTerm, selectedCategory])

  useEffect(() => {
    let active = true
    const load = () => {
      Promise.allSettled([
        axios.get('http://localhost:3000/api/superadmin/animals'),
        axios.get('http://localhost:3000/api/superadmin/categories'),
      ]).then(([animalsRes, catsRes]) => {
        if (!active) return
        const animalsData = animalsRes.status === 'fulfilled' ? animalsRes.value.data?.data || [] : []
        const categoryData = catsRes.status === 'fulfilled' ? catsRes.value.data?.data || [] : []
        const categoryNames = categoryData.map((c) => c.name)
        const fallbackCategories = animalsData.map((a) => getAnimalCategory(a))
        setAnimals(animalsData)
        setCategories(['Semua', ...uniqueLabels([...categoryNames, ...fallbackCategories])])
      })
    }
    load()
    const unsub = subscribeLiveData(['animals', 'categories'], load)
    return () => { active = false; unsub() }
  }, [])

  const toggleHeart = (e, id) => {
    e.stopPropagation()
    setHeartedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <CustomerLayout>
      <main className="customer-page">
        <div className="customer-animals-page" style={{ padding: '28px 32px 56px', maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

          <div className="customer-animals-hero" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 28, height: 28, background: '#FEF3C7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🐾</div>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Temukan Sahabatmu</span>
              </div>
              <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.5px' }}>Daftar Hewan</h1>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: '4px 0 0' }}>{filteredAnimals.length} hewan tersedia untuk diadopsi</p>
            </div>
            <div className="customer-animals-search" style={{ position: 'relative', minWidth: 260 }}>
              <i className="fas fa-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#CBD5E1', fontSize: 13 }}></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama, jenis..."
                style={{
                  width: '100%', height: 40, paddingLeft: 40, paddingRight: 16,
                  background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12,
                  fontSize: 12, color: '#1E293B', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
            {categories.map((cat) => {
              const active = selectedCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '7px 16px', borderRadius: 999, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    border: active ? '1px solid #60A5FA' : '1px solid #E2E8F0',
                    background: active ? '#60A5FA' : '#fff',
                    color: active ? '#fff' : '#475569',
                    boxShadow: active ? '0 4px 12px rgba(96,165,250,.3)' : 'none',
                    transition: 'all .22s cubic-bezier(.22,1,.36,1)',
                  }}
                >
                  {cat !== 'Semua' && <span style={{ fontSize: 13 }}>{getCategoryIcon(cat)}</span>}
                  {cat}
                </button>
              )
            })}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: 16,
          }}>
            {filteredAnimals.map((animal) => {
              const st = statusColor(animal.status)
              const hearted = heartedIds.has(animal.id)
              return (
                <div
                  key={animal.id}
                  onClick={() => setSelectedAnimal(animal)}
                  style={{
                    background: '#fff', borderRadius: 20, overflow: 'hidden',
                    border: '1px solid #F1F5F9', cursor: 'pointer',
                    transition: 'all .35s cubic-bezier(.22,1,.36,1)',
                  }}
                >
                  <div style={{ position: 'relative', aspectRatio: '4/5', overflow: 'hidden' }}>
                    <AnimalMedia className="pc-img" src={animal.photo} alt={animal.name} />
                    <div style={{ position: 'absolute', top: 10, left: 10, background: st.bg, color: st.color, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '3px 10px', borderRadius: 999 }}>
                      {st.label}
                    </div>
                    <button
                      onClick={(e) => toggleHeart(e, animal.id)}
                      style={{
                        position: 'absolute', top: 10, right: 10,
                        width: 32, height: 32, borderRadius: '50%',
                        background: hearted ? '#EF4444' : 'rgba(255,255,255,.9)',
                        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: hearted ? '#fff' : '#94A3B8', fontSize: 12,
                        boxShadow: '0 2px 8px rgba(0,0,0,.15)',
                      }}
                    >
                      <i className={hearted ? 'fas fa-heart' : 'far fa-heart'}></i>
                    </button>
                  </div>
                  <div style={{ padding: '12px 14px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{animal.name}</h3>
                      <span style={{ fontSize: 10, color: '#94A3B8' }}>{animal.gender || ''}</span>
                    </div>
                    <p style={{ margin: '3px 0 0', fontSize: 11, color: '#94A3B8' }}>{getAnimalCategory(animal) || 'Hewan'} · {animal.age || 0} tahun</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, color: '#94A3B8' }}>
                      <i className="fas fa-map-marker-alt" style={{ fontSize: 10 }}></i>
                      <span style={{ fontSize: 10 }}>Shelter Adopsi</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredAnimals.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px 24px', color: '#94A3B8' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <strong style={{ display: 'block', fontSize: 16, color: '#475569', marginBottom: 8 }}>Tidak ada hewan yang cocok</strong>
              <p style={{ fontSize: 13 }}>Coba ubah pencarian atau filter kategori.</p>
            </div>
          )}
        </div>

        {selectedAnimal && (
          <div
            onClick={() => setSelectedAnimal(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', backdropFilter: 'blur(6px)',
              zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff', borderRadius: 24, width: '100%', maxWidth: 640,
                maxHeight: '90vh', overflow: 'auto', position: 'relative',
                boxShadow: '0 32px 80px rgba(0,0,0,.18)',
              }}
            >
              <button
                onClick={() => setSelectedAnimal(null)}
                style={{
                  position: 'absolute', top: 16, right: 16, zIndex: 10,
                  width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: 'rgba(255,255,255,.9)', color: '#475569', fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <i className="fas fa-times"></i>
              </button>

              <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', borderRadius: '24px 24px 0 0' }}>
                <AnimalMedia src={selectedAnimal.photo} alt={selectedAnimal.name} />
              </div>

              <div style={{ padding: '24px 28px 28px' }}>
                <h2 style={{ fontSize: 30, fontWeight: 900, color: '#0F172A', margin: '0 0 6px' }}>{selectedAnimal.name}</h2>
                <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 20px' }}>Shelter Adopsi</p>
                <Link
                  to={`/customer/adoptions?animal_id=${selectedAnimal.id}`}
                  className="btn-main"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    width: '100%', height: 48, borderRadius: 14, textDecoration: 'none',
                    color: '#fff', fontSize: 14, fontWeight: 700,
                  }}
                >
                  <i className="fas fa-heart"></i>
                  Ajukan Adopsi
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </CustomerLayout>
  )
}
