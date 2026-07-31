import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import SuperadminNavbar from '../components/SuperadminNavbar'
import SuperadminSidebar from '../components/SuperadminSidebar'
import { subscribeLiveData } from '../utils/liveDataEvents'

const storageKey = 'petugasChatReplies'

function PetugasChat() {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true,
  )
  const [customers, setCustomers] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [message, setMessage] = useState('')
  const [replies, setReplies] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '{}')
    } catch {
      return {}
    }
  })

  const selectedCustomer = useMemo(
    () => customers.find((customer) => String(customer.id) === String(selectedId)),
    [customers, selectedId],
  )
  const conversation = selectedId ? replies[selectedId] || [] : []

  const saveReply = () => {
    if (!selectedId || !message.trim()) return
    const nextReplies = {
      ...replies,
      [selectedId]: [
        ...(replies[selectedId] || []),
        {
          text: message.trim(),
          time: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        },
      ],
    }
    setReplies(nextReplies)
    localStorage.setItem(storageKey, JSON.stringify(nextReplies))
    setMessage('')
  }

  useEffect(() => {
    let active = true
    const loadCustomers = () => {
      axios
      .get('http://localhost:3000/api/superadmin/users?page=1&limit=50&role=costumer')
      .then((response) => {
        if (!active) return
        const data = response.data.data || []
        setCustomers(data)
        setSelectedId((current) => current || String(data[0]?.id || ''))
      })
      .catch(() => {
        if (active) setCustomers([])
      })
    }

    loadCustomers()
    const unsubscribe = subscribeLiveData(['users', 'customers'], loadCustomers)
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return (
    <div className="dashboard-layout">
      <SuperadminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={`main-content ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
        <SuperadminNavbar
          pageTitle="Chat Customer"
          sidebarOpen={sidebarOpen}
          offsetForSidebar={false}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />

        <div className="page-body">
          <div className="page-header">
            <h1 className="page-header-title">
              <i className="fas fa-comments"></i>
              Chat Customer
            </h1>
            <p className="page-header-desc">
              Jawab pertanyaan tentang hewan, proses adopsi, dan jadwal kunjungan customer.
            </p>
          </div>

          <div className="two-col">
            <div className="panel">
              <div className="panel-head">
                <h2><i className="fas fa-address-book"></i> Customer</h2>
                <span>{customers.length} akun</span>
              </div>
              <div className="table-wrap">
                <table>
                  <tbody>
                    {customers.map((customer) => (
                      <tr
                        key={customer.id}
                        onClick={() => setSelectedId(String(customer.id))}
                        style={{ cursor: 'pointer', background: String(customer.id) === String(selectedId) ? 'var(--blue-light)' : '' }}
                      >
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">{customer.name?.charAt(0)?.toUpperCase() || 'C'}</div>
                            <div>
                              <strong>{customer.name}</strong>
                              <div style={{ color: 'var(--muted)', fontSize: 13 }}>{customer.email}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {customers.length === 0 ? (
                      <tr>
                        <td style={{ color: 'var(--muted)', padding: 28, textAlign: 'center' }}>
                          Belum ada customer.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <h2><i className="fas fa-reply"></i> Balasan Petugas</h2>
                <span>{selectedCustomer?.name || 'Pilih customer'}</span>
              </div>
              <div style={{ padding: 24 }}>
                <div className="chat-box">
                  {conversation.map((item, index) => (
                    <div key={`${item.time}-${index}`} className="chat-bubble">
                      <strong>Petugas</strong>
                      <p>{item.text}</p>
                      <span>{item.time}</span>
                    </div>
                  ))}
                  {conversation.length === 0 ? (
                    <div className="empty-state">
                      <em>Belum ada balasan.</em>
                    </div>
                  ) : null}
                </div>

                <textarea
                  className="petugas-textarea"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Tulis jawaban untuk customer..."
                />
                <div className="drawer-buttons" style={{ justifyContent: 'flex-end' }}>
                  <button type="button" className="primary-link" onClick={saveReply} disabled={!selectedId || !message.trim()}>
                    <i className="fas fa-paper-plane"></i> Kirim Balasan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PetugasChat
