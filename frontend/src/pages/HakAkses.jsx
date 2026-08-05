import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import SuperadminNavbar from '../components/SuperadminNavbar'
import SuperadminSidebar from '../components/SuperadminSidebar'
import Toast from '../components/Toast'

const API_BASE_URL = 'http://localhost:3000/api'

const roleLabels = {
  admin: 'Admin',
  costumer: 'Customer',
  petugas: 'Petugas',
  superadmin: 'Superadmin',
}

const roleOrder = ['admin', 'costumer', 'petugas', 'superadmin']

const permissionLabels = {
  dashboard_view: 'Lihat Dashboard',
  manage_animals: 'Kelola Hewan',
  manage_categories: 'Kelola Kategori',
  manage_adoptions: 'Kelola Pengajuan Adopsi',
  verify_adoptions: 'Verifikasi Adopsi',
  view_customers: 'Lihat Data Customer',
  manage_chat: 'Mengelola Chat',
  manage_visits: 'Jadwal Kunjungan',
  view_reports: 'Lihat Laporan',
  view_logs: 'Lihat History Logs',
  restore_data: 'Pulihkan Data',
  view_dashboard: 'Lihat Dashboard',
  view_animals: 'Lihat Daftar Hewan',
  submit_adoption: 'Ajukan Adopsi',
  view_status: 'Lihat Status Adopsi',
  chat_with_staff: 'Chat dengan Petugas/Admin',
  full_access: 'Akses Penuh',
}

function HakAkses() {
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth > 768 : true)
  const [permissions, setPermissions] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [toastType, setToastType] = useState('success')

  const roleOptions = useMemo(() => roleOrder.filter((role) => permissions[role]), [permissions])

  const allPermissionKeys = useMemo(() => {
    const keys = new Set()
    Object.values(permissions).forEach((perms) => {
      Object.keys(perms || {}).forEach((key) => keys.add(key))
    })
    return Array.from(keys).sort()
  }, [permissions])

  const loadPermissions = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/superadmin/permissions`)
      const data = response.data?.data || {}
      setPermissions(data)
      setMessage('')
    } catch (error) {
      console.error(error)
      setToastType('error')
      setMessage('Gagal memuat hak akses.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPermissions()
  }, [])

  const togglePermission = (role, key) => {
    setPermissions((current) => ({
      ...current,
      [role]: {
        ...(current[role] || {}),
        [key]: !Boolean(current[role]?.[key]),
      },
    }))
  }

  const saveAllPermissions = async () => {
    try {
      setSaving(true)
      const promises = roleOptions.map((role) =>
        axios.put(`${API_BASE_URL}/superadmin/permissions`, {
          role,
          permissions: permissions[role] || {},
        })
      )
      await Promise.all(promises)
      setToastType('success')
      setMessage('Semua hak akses berhasil disimpan.')
    } catch (error) {
      console.error(error)
      setToastType('error')
      setMessage('Gagal menyimpan hak akses.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dashboard-layout">
      <SuperadminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={`main-content ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
        <SuperadminNavbar pageTitle="Hak Akses" sidebarOpen={sidebarOpen} offsetForSidebar={false} onToggleSidebar={() => setSidebarOpen((open) => !open)} />
        {message && <Toast message={message} type={toastType} onClose={() => setMessage('')} duration={3000} />}
        <div className="page-body">
          <div className="section-card">
            <div className="section-card-header">
              <div className="section-card-title">
                <i className="fas fa-shield-alt" />
                Atur Hak Akses dari Database
              </div>
              <button type="button" className="btn btn-primary" onClick={saveAllPermissions} disabled={saving || loading}>
                {saving ? '💾 Menyimpan...' : '💾 Simpan Semua'}
              </button>
            </div>
            <div className="section-card-body">
              {loading ? (
                <p>Memuat data hak akses...</p>
              ) : (
                <div className="permission-table-wrapper">
                  <table className="permission-table">
                    <thead>
                      <tr>
                        <th className="permission-column-name">Fitur / Izin</th>
                        {roleOptions.map((role) => (
                          <th key={role} className="permission-column-role">
                            <span>{roleLabels[role] || role}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allPermissionKeys.length === 0 ? (
                        <tr>
                          <td colSpan={roleOptions.length + 1} style={{ textAlign: 'center', padding: '16px' }}>
                            Tidak ada daftar izin tersedia.
                          </td>
                        </tr>
                      ) : (
                        allPermissionKeys.map((key) => (
                          <tr key={key}>
                            <td className="permission-name">{permissionLabels[key] || key}</td>
                            {roleOptions.map((role) => (
                              <td key={`${role}-${key}`} className="permission-cell">
                                <input
                                  type="checkbox"
                                  checked={Boolean(permissions[role]?.[key])}
                                  onChange={() => togglePermission(role, key)}
                                />
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default HakAkses
