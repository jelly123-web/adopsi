const { getPool } = require("../config/database")

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

async function getDashboardData() {
  const pool = await getPool()
  const [[summary]] = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM users) AS total_user,
      (SELECT COUNT(*) FROM animals) AS total_hewan,
      (SELECT COUNT(*) FROM adoption_requests) AS total_pengajuan,
      (SELECT COUNT(*) FROM adoptions WHERE status = 'berhasil') AS adopsi_berhasil
  `)

  const [monthlyRows] = await pool.query(`
    SELECT MONTH(approved_at) AS month_number, COUNT(*) AS total
    FROM adoptions
    WHERE status = 'berhasil'
    GROUP BY MONTH(approved_at)
    ORDER BY MONTH(approved_at)
  `)

  const [animalRows] = await pool.query(`
    SELECT species AS type, COUNT(*) AS total
    FROM animals
    GROUP BY species
    ORDER BY FIELD(species, 'Kucing', 'Anjing', 'Kelinci', 'Burung', 'Hamster')
  `)

  const [activityRows] = await pool.query(`
    SELECT title, description, created_at AS time
    FROM activities
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
    activities: activityRows.map((row) => ({
      title: row.title,
      description: row.description,
      time: row.time,
    })),
  }
}

async function listUsers() {
  const pool = await getPool()
  const [rows] = await pool.query(`
    SELECT id, name, email, role, status, created_at
    FROM users
    ORDER BY id ASC
  `)

  return rows
}

async function createUser(input) {
  const pool = await getPool()
  const { name, email, role, status } = input
  const [result] = await pool.query(
    `
      INSERT INTO users (name, email, role, status)
      VALUES (?, ?, ?, ?)
    `,
    [name, email, role, status],
  )

  return result.insertId
}

async function updateUser(id, input) {
  const pool = await getPool()
  const { name, email, role, status } = input
  const [result] = await pool.query(
    `
      UPDATE users
      SET name = ?, email = ?, role = ?, status = ?
      WHERE id = ?
    `,
    [name, email, role, status, id],
  )

  return result.affectedRows
}

async function deleteUser(id) {
  const pool = await getPool()
  const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id])
  return result.affectedRows
}

async function findUserById(id) {
  const pool = await getPool()
  const [[row]] = await pool.query(
    "SELECT id, role FROM users WHERE id = ? LIMIT 1",
    [id],
  )

  return row || null
}

async function listAnimals() {
  const pool = await getPool()
  const [rows] = await pool.query(`
    SELECT id, name, species, gender, age, status, created_at
    FROM animals
    ORDER BY id ASC
  `)

  return rows
}

async function createAnimal(input) {
  const pool = await getPool()
  const { name, species, gender, age, status } = input
  const [result] = await pool.query(
    `
      INSERT INTO animals (name, species, gender, age, status)
      VALUES (?, ?, ?, ?, ?)
    `,
    [name, species, gender, age, status],
  )

  return result.insertId
}

async function updateAnimal(id, input) {
  const pool = await getPool()
  const { name, species, gender, age, status } = input
  const [result] = await pool.query(
    `
      UPDATE animals
      SET name = ?, species = ?, gender = ?, age = ?, status = ?
      WHERE id = ?
    `,
    [name, species, gender, age, status, id],
  )

  return result.affectedRows
}

async function deleteAnimal(id) {
  const pool = await getPool()
  const [result] = await pool.query("DELETE FROM animals WHERE id = ?", [id])
  return result.affectedRows
}

module.exports = {
  getDashboardData,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  findUserById,
  listAnimals,
  createAnimal,
  updateAnimal,
  deleteAnimal,
}
