const dashboardData = {
  stats: [
    { label: "Total User", value: 150, tone: "blue" },
    { label: "Total Hewan", value: 45, tone: "green" },
    { label: "Total Pengajuan", value: 32, tone: "amber" },
    { label: "Adopsi Berhasil", value: 20, tone: "success" },
  ],
  monthlyAdoptions: [
    { month: "Jan", total: 8 },
    { month: "Feb", total: 10 },
    { month: "Mar", total: 12 },
    { month: "Apr", total: 15 },
    { month: "Mei", total: 18 },
    { month: "Jun", total: 20 },
  ],
  animalTypes: [
    { type: "Kucing", total: 21 },
    { type: "Anjing", total: 12 },
    { type: "Kelinci", total: 7 },
    { type: "Burung", total: 3 },
    { type: "Hamster", total: 2 },
  ],
  activities: [
    {
      title: "User baru mendaftar",
      description: "Akun adopter baru masuk ke sistem.",
      time: "5 menit lalu",
    },
    {
      title: "Hewan baru ditambahkan",
      description: "Data hewan siap adopsi berhasil dipublikasikan.",
      time: "18 menit lalu",
    },
    {
      title: "Pengajuan adopsi baru",
      description: "Form pengajuan baru menunggu verifikasi superadmin.",
      time: "42 menit lalu",
    },
    {
      title: "Adopsi baru disetujui",
      description: "Satu pengajuan adopsi telah berubah menjadi berhasil.",
      time: "1 jam lalu",
    },
  ],
}

function getDashboardData() {
  return dashboardData
}

module.exports = {
  getDashboardData,
}
