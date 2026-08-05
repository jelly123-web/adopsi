import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import SuperadminNavbar from '../components/SuperadminNavbar'
import SuperadminSidebar from '../components/SuperadminSidebar'
import Toast from '../components/Toast'

const API_BASE_URL = 'http://localhost:3000/api'

const roleLabels = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  petugas: 'Petugas',
  costumer: 'Customer',
}

const roleOrder = ['superadmin', 'admin', 'petugas', 'costumer']

const permissionLabels = {
  dashboard_view: 'Lihat Dashboard',
  view_dashboard: 'Lihat Dashboard',
  manage_animals: 'Kelola Hewan',
  view_animals: 'Lihat Daftar Hewan',
  manage_categories: 'Kelola Kategori',
  manage_adoptions: 'Kelola Pengajuan Adopsi',
  verify_adoptions: 'Verifikasi Adopsi',
  view_customers: 'Lihat Data Customer',
  manage_chat: 'Mengelola Chat',
  manage_visits: 'Jadwal Kunjungan',
  view_reports: 'Lihat Laporan',
  view_logs: 'Lihat History Logs',
  restore_data: 'Pulihkan Data',
  submit_adoption: 'Ajukan Adopsi',
  view_status: 'Lihat Status Adopsi',
  chat_with_staff: 'Chat dengan Petugas/Admin',
  full_access: 'Akses Penuh',
}

const permissionOrder = [
  'dashboard_view',
  'view_dashboard',
  'full_access',
  'manage_animals',
  'view_animals',
  'manage_categories',
  'manage_adoptions',
  'verify_adoptions',
  'view_customers',
  'manage_chat',
  'manage_visits',
  'view_reports',
  'view_logs',
  'restore_data',
  'submit_adoption',
  'view_status',
  'chat_with_staff',
]

function getAuthSnapshot() {
  return {
    role: localStorage.getItem('authRole') || 'superadmin',
    name: localStorage.getItem('authName') || 'Super Admin',
  }
}

function HakAkses() {
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth > 768 : true)
  const [permissions, setPermissions] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [toastType, setToastType] = useState('success')
  const [auth, setAuth] = useState(getAuthSnapshot)

  useEffect(() => {
    const refreshAuth = () => setAuth(getAuthSnapshot())
    window.addEventListener('storage', refreshAuth)
    window.addEventListener('auth-profile-updated', refreshAuth)
    return () => {
      window.removeEventListener('storage', refreshAuth)
      window.removeEventListener('auth-profile-updated', refreshAuth)
    }
  }, [])

  const roleOptions = useMemo(
    () => roleOrder.filter((role) => permissions[role]),
    [permissions]
  )

  const orderedPermissionKeys = useMemo(() => {
    const present = new Set()
    Object.values(permissions).forEach((rolePermissions) => {
      Object.keys(rolePermissions || {}).forEach((key) => present.add(key))
    })
    const ordered = permissionOrder.filter((key) => present.has(key))
    const remaining = Array.from(present).filter((key) => !permissionOrder.includes(key)).sort()
    return [...ordered, ...remaining]
  }, [permissions])

  const summary = useMemo(() => {
    const totalRoles = roleOptions.length
    const totalPermissions = orderedPermissionKeys.length
    const enabledCells = roleOptions.reduce((acc, role) => {
      const rolePermissions = permissions[role] || {}
      return acc + Object.values(rolePermissions).filter(Boolean).length
    }, 0)
    const currentRoleEnabled = Object.values(permissions[auth.role] || {}).filter(Boolean).length
    return {
      totalRoles,
      totalPermissions,
      enabledCells,
      currentRoleEnabled,
      coverage: totalPermissions && totalRoles ? Math.round((enabledCells / (totalPermissions * totalRoles)) * 100) : 0,
    }
  }, [auth.role, orderedPermissionKeys.length, permissions, roleOptions])

  const loadPermissions = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/superadmin/permissions`)
      setPermissions(response.data?.data || {})
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
      await Promise.all(
        roleOptions.map((role) =>
          axios.put(`${API_BASE_URL}/superadmin/permissions`, {
            role,
            permissions: permissions[role] || {},
          })
        )
      )
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
        <SuperadminNavbar
          pageTitle="Hak Akses"
          sidebarOpen={sidebarOpen}
          offsetForSidebar={false}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />

        {message && <Toast message={message} type={toastType} onClose={() => setMessage('')} duration={3000} />}

        <div className="page-body access-page">
          <div className="access-stats-grid">
            <div className="access-stat-card">
              <div className="access-stat-label">Total Peran</div>
              <div className="access-stat-value">{summary.totalRoles}</div>
            </div>
            <div className="access-stat-card">
              <div className="access-stat-label">Izin Tersedia</div>
              <div className="access-stat-value">{summary.totalPermissions}</div>
            </div>
            <div className="access-stat-card">
              <div className="access-stat-label">Pengguna</div>
              <div className="access-stat-value access-stat-user">{roleLabels[auth.role] || auth.role}</div>
            </div>
            <div className="access-stat-card">
              <div className="access-stat-label">Izin Aktif</div>
              <div className="access-stat-value">{summary.currentRoleEnabled}</div>
            </div>
          </div>

          <div className="section-card access-checklist-card">
            <div className="section-card-header access-checklist-header">
              <div>
                <div className="section-card-title access-title">
                  <span className="access-title-icon">
                    <i className="fas fa-list" />
                  </span>
                  Daftar Izin
                </div>
                <p className="access-subtitle">Aksi yang diizinkan untuk tiap peran.</p>
              </div>
            </div>

            <div className="section-card-body access-card-body">
              {loading ? (
                <div className="access-loading">
                  <div className="access-loading-line" />
                  <div className="access-loading-table">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              ) : (
                <div className="access-table-wrap">
                  <table className="access-table">
                    <thead>
                      <tr>
                        <th className="access-col-permission">Izin</th>
                        {roleOptions.map((role) => (
                          <th key={role} className="access-col-role">
                            <span className="access-role-dot" aria-hidden="true" />
                            <span>{roleLabels[role] || role}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orderedPermissionKeys.length === 0 ? (
                        <tr>
                          <td colSpan={roleOptions.length + 1} className="access-empty">
                            Tidak ada daftar izin tersedia.
                          </td>
                        </tr>
                      ) : (
                        orderedPermissionKeys.map((key) => (
                          <tr key={key} className={permissions[auth.role]?.[key] ? 'access-row-active' : ''}>
                            <td className="access-permission-cell">
                              <div className="access-permission-name">{permissionLabels[key] || key}</div>
                            </td>
                            {roleOptions.map((role) => (
                              <td key={`${role}-${key}`} className="access-toggle-cell">
                                <label className="access-check">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(permissions[role]?.[key])}
                                    onChange={() => togglePermission(role, key)}
                                    aria-label={`${permissionLabels[key] || key} untuk ${roleLabels[role] || role}`}
                                  />
                                  <span className="access-check-box" aria-hidden="true" />
                                </label>
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="access-card-footer">
                <div className="access-footer-note">
                  <span className="access-footer-dot" />
                  Cakupan {summary.coverage}%
                </div>
                <button
                  type="button"
                  className="btn btn-primary access-save-btn"
                  onClick={saveAllPermissions}
                  disabled={saving || loading}
                >
                  <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`} />
                  {saving ? 'Menyimpan Perubahan' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default HakAkses
