import { useEffect, useState } from 'react'
import axios from 'axios'
import SuperadminNavbar from '../components/SuperadminNavbar'
import SuperadminSidebar from '../components/SuperadminSidebar'
import MediaAvatar, { DEFAULT_USER_PHOTO, pickMedia } from '../components/MediaAvatar'
import { publishLiveData, subscribeLiveData } from '../utils/liveDataEvents'

const getCustomerPhoto = (customer) => pickMedia(
  customer.profile_photo,
  customer.admin_avatar,
  customer.avatar,
  customer.photo,
  customer.image,
  customer.profile_image,
  customer.avatar_url,
  customer.photo_url,
  customer.foto,
  customer.gambar,
)

function DataCustomers() {
  const [customers, setCustomers] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  )

  const loadCustomers = async (page = 1) => {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/superadmin/users?page=${page}&limit=10&role=costumer`,
      )
      setCustomers(response.data.data || [])
      setCurrentPage(response.data.page || 1)
      setTotalPages(response.data.pages || 1)
      setTotalCustomers(response.data.total || 0)
      setPageSize(response.data.limit || 10)
    } catch {
      setCustomers([])
      setTotalCustomers(0)
      setTotalPages(1)
    }
  }

  const formatDate = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID')
  }

  const handleDeleteAll = async () => {
    if (totalCustomers === 0) return
    if (!window.confirm('Hapus semua data customer?')) return

    try {
      await axios.post('http://localhost:3000/api/superadmin/customers/delete-all')
      await loadCustomers(1)
      publishLiveData('customers')
    } catch (error) {
      window.alert(error.response?.data?.message || 'Gagal menghapus semua customer.')
    }
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const response = await axios.get(
          'http://localhost:3000/api/superadmin/users?page=1&limit=10&role=costumer',
        )
        if (active) {
          setCustomers(response.data.data || [])
          setCurrentPage(response.data.page || 1)
          setTotalPages(response.data.pages || 1)
          setTotalCustomers(response.data.total || 0)
          setPageSize(response.data.limit || 10)
        }
      } catch {
        if (active) {
          setCustomers([])
          setTotalCustomers(0)
          setTotalPages(1)
        }
      }
    })()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    return subscribeLiveData('customers', () => loadCustomers(currentPage))
  }, [currentPage])

  return (
    <div className="dashboard-layout">
      <SuperadminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className={`main-content ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
        <SuperadminNavbar
          pageTitle="Data Customer"
          sidebarOpen={sidebarOpen}
          offsetForSidebar={false}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />

        <div className="page-body">
          <div className="page-header">
            <h1 className="page-header-title">
              <i className="fas fa-address-book"></i>
              Data Customer
            </h1>
            <p className="page-header-desc">
              Lihat akun customer yang terdaftar di sistem adopsi hewan.
            </p>
          </div>

          <div className="content-toolbar">
            <div></div>
            <button
              type="button"
              className="danger-link"
              onClick={handleDeleteAll}
              disabled={totalCustomers === 0}
            >
              <i className="fas fa-trash"></i> Hapus Semua
            </button>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2><i className="fas fa-table"></i> Semua Customer</h2>
              <span>{totalCustomers} customer</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Terdaftar</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, index) => (
                    <tr key={customer.id}>
                      <td>{(currentPage - 1) * pageSize + index + 1}</td>
                      <td>
                        <div className="user-cell">
                          <MediaAvatar
                            src={getCustomerPhoto(customer)}
                            fallbackSrc={DEFAULT_USER_PHOTO}
                            alt={customer.name || 'Customer'}
                          />
                          <strong>{customer.name}</strong>
                        </div>
                      </td>
                      <td>{customer.email}</td>
                      <td>
                        <span className={`tag ${customer.status === 'aktif' ? 'tag-success' : 'tag-muted'}`}>
                          <span className="status-dot"></span>
                          {customer.status}
                        </span>
                      </td>
                      <td>{formatDate(customer.created_at)}</td>
                    </tr>
                  ))}
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--muted)', padding: '28px' }}>
                        Belum ada data customer.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <div className="pagination-area">
                <div className="pagination-wrap">
                  <div className="pagination-meta">
                    Halaman {currentPage} dari {totalPages}
                  </div>
                  <div className="pagination-links">
                    <button
                      className="pagination-link"
                      disabled={currentPage === 1}
                      onClick={() => loadCustomers(currentPage - 1)}
                    >
                      &lt;
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        className={`pagination-link ${currentPage === page ? 'active' : ''}`}
                        onClick={() => loadCustomers(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      className="pagination-link"
                      disabled={currentPage === totalPages}
                      onClick={() => loadCustomers(currentPage + 1)}
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}

export default DataCustomers
