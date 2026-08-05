const permissionDefinitions = {
  admin: [
    {
      key: "dashboard_view",
      label: "Lihat dashboard",
      description: "Admin bisa melihat ringkasan dashboard utama.",
    },
    {
      key: "manage_animals",
      label: "Kelola hewan",
      description: "Admin bisa menambah, mengubah, dan menghapus data hewan.",
    },
    {
      key: "manage_categories",
      label: "Kelola kategori",
      description: "Admin bisa mengelola kategori hewan.",
    },
    {
      key: "manage_adoptions",
      label: "Kelola pengajuan adopsi",
      description: "Admin bisa melihat dan mengatur pengajuan adopsi.",
    },
    {
      key: "verify_adoptions",
      label: "Verifikasi adopsi",
      description: "Admin bisa memverifikasi proses adopsi.",
    },
    {
      key: "view_customers",
      label: "Lihat data customer",
      description: "Admin bisa melihat daftar customer.",
    },
    {
      key: "manage_chat",
      label: "Mengelola chat",
      description: "Admin bisa membuka dan menanggapi sesi chat.",
    },
    {
      key: "manage_visits",
      label: "Mengatur jadwal kunjungan",
      description: "Admin bisa mengatur jadwal kunjungan.",
    },
    {
      key: "view_reports",
      label: "Lihat laporan",
      description: "Admin bisa melihat laporan sistem.",
    },
    {
      key: "view_logs",
      label: "Lihat history logs",
      description: "Admin bisa melihat riwayat aktivitas.",
    },
    {
      key: "restore_data",
      label: "Pulihkan data",
      description: "Admin bisa memulihkan data yang terhapus.",
    },
  ],
  costumer: [
    {
      key: "view_dashboard",
      label: "Lihat dashboard",
      description: "Customer bisa melihat panel dashboard pengguna.",
    },
    {
      key: "view_animals",
      label: "Lihat daftar hewan",
      description: "Customer bisa melihat hewan yang tersedia.",
    },
    {
      key: "submit_adoption",
      label: "Ajukan adopsi",
      description: "Customer bisa mengajukan permohonan adopsi.",
    },
    {
      key: "view_status",
      label: "Lihat status adopsi",
      description: "Customer bisa memantau status pengajuan adopsi.",
    },
    {
      key: "chat_with_staff",
      label: "Chat dengan petugas/admin",
      description: "Customer bisa membuka ruang chat.",
    },
  ],
  petugas: [
    {
      key: "dashboard_view",
      label: "Lihat dashboard",
      description: "Petugas bisa melihat dashboard.",
    },
    {
      key: "manage_animals",
      label: "Kelola data hewan",
      description: "Petugas bisa mengelola data hewan.",
    },
    {
      key: "manage_adoptions",
      label: "Kelola pengajuan adopsi",
      description: "Petugas bisa melihat dan mengelola pengajuan.",
    },
    {
      key: "manage_chat",
      label: "Mengelola chat",
      description: "Petugas bisa membuka dan menanggapi chat.",
    },
    {
      key: "manage_visits",
      label: "Mengatur jadwal kunjungan",
      description: "Petugas bisa mengatur jadwal kunjungan.",
    },
  ],
  superadmin: [
    {
      key: "full_access",
      label: "Akses penuh",
      description: "Superadmin memiliki akses penuh ke seluruh fitur.",
    },
  ],
}

function getDefaultPermissions() {
  return Object.fromEntries(
    Object.entries(permissionDefinitions).map(([role, definitions]) => [
      role,
      Object.fromEntries(definitions.map((definition) => [definition.key, true])),
    ]),
  )
}

function normalizePermissionsForRole(permissionInput = [], permissionKeys = []) {
  const normalized = {}
  const entries = Array.isArray(permissionInput) ? permissionInput : []
  const permissionLookup = new Map(entries.map((entry) => [entry.key, entry]))

  for (const key of permissionKeys) {
    const entry = permissionLookup.get(key)
    normalized[key] = entry ? Boolean(entry.allowed) : false
  }

  return normalized
}

module.exports = {
  permissionDefinitions,
  getDefaultPermissions,
  normalizePermissionsForRole,
}
