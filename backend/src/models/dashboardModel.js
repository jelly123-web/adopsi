const { getPool } = require("../config/database")

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

async function getDashboardData() {
  const pool = await getPool()
  const { rows: [summary] } = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE deleted = FALSE) AS total_user,
      (SELECT COUNT(*) FROM animals WHERE deleted = FALSE) AS total_hewan,
      (SELECT COUNT(*) FROM adoption_requests WHERE deleted = FALSE) AS total_pengajuan,
      (SELECT COUNT(*) FROM adoptions WHERE status = 'berhasil' AND deleted = FALSE) AS adopsi_berhasil
  `)

  const { rows: monthlyRows } = await pool.query(`
    SELECT EXTRACT(MONTH FROM approved_at) AS month_number, COUNT(*) AS total
    FROM adoptions
    WHERE status = 'berhasil' AND deleted = FALSE
    GROUP BY EXTRACT(MONTH FROM approved_at)
    ORDER BY EXTRACT(MONTH FROM approved_at)
  `)

  const { rows: animalRows } = await pool.query(`
    SELECT species AS type, COUNT(*) AS total
    FROM animals
    WHERE deleted = FALSE
    GROUP BY species
    ORDER BY species ASC
  `)

  const { rows: activityRows } = await pool.query(`
    SELECT title, description, created_at AS time
    FROM activities
    WHERE deleted = FALSE
    ORDER BY created_at DESC, id DESC
    LIMIT 4
  `)

  return {
    stats: [
      { label: "Total User", value: Number(summary.total_user), tone: "blue" },
      { label: "Total Hewan", value: Number(summary.total_hewan), tone: "green" },
      { label: "Total Pengajuan", value: Number(summary.total_pengajuan), tone: "amber" },
      { label: "Adopsi Berhasil", value: Number(summary.adopsi_berhasil), tone: "success" },
    ],
    monthlyAdoptions: monthlyRows.map((row) => ({
      month: monthLabels[Number(row.month_number) - 1] || String(row.month_number),
      total: Number(row.total),
    })),
    animalTypes: animalRows.map((row) => ({
      type: row.type,
      total: Number(row.total),
    })),
    activities: activityRows,
  }
}

module.exports = {
  getDashboardData,
}
