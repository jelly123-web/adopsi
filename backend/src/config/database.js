const mysql = require("mysql2/promise")

const resolvedHost =
  process.env.DB_HOST && process.env.DB_HOST !== "mysql"
    ? process.env.DB_HOST
    : "127.0.0.1"

// Create a pool without database first to check/create database
let pool

async function ensureDatabaseExists() {
  const tempPool = mysql.createPool({
    host: resolvedHost,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME || process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "123456",
    waitForConnections: true,
    connectionLimit: 10,
    multipleStatements: true,
  })
  const dbName = process.env.DB_DATABASE || process.env.DB_NAME || "adopsi"
  await tempPool.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  await tempPool.end()

  // Now create the real pool with the database
  pool = mysql.createPool({
    host: resolvedHost,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME || process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "123456",
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    multipleStatements: true,
  })

  return pool
}

async function initializeDatabase() {
  if (!pool) {
    await ensureDatabaseExists()
  }

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL,
      role VARCHAR(30) NOT NULL DEFAULT 'user',
      status VARCHAR(30) NOT NULL DEFAULT 'aktif',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY users_email_unique (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS animals (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(120) NOT NULL,
      species VARCHAR(60) NOT NULL,
      gender VARCHAR(20) NOT NULL,
      age INT UNSIGNED NOT NULL DEFAULT 0,
      status VARCHAR(30) NOT NULL DEFAULT 'tersedia',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS adoption_requests (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id INT UNSIGNED NOT NULL,
      animal_id INT UNSIGNED NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'pending',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY adoption_requests_user_id_index (user_id),
      KEY adoption_requests_animal_id_index (animal_id),
      CONSTRAINT adoption_requests_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT adoption_requests_animal_fk FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS adoptions (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      request_id INT UNSIGNED NOT NULL,
      user_id INT UNSIGNED NOT NULL,
      animal_id INT UNSIGNED NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'berhasil',
      approved_at DATETIME NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY adoptions_request_id_unique (request_id),
      KEY adoptions_user_id_index (user_id),
      KEY adoptions_animal_id_index (animal_id),
      CONSTRAINT adoptions_request_fk FOREIGN KEY (request_id) REFERENCES adoption_requests(id) ON DELETE CASCADE,
      CONSTRAINT adoptions_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT adoptions_animal_fk FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS activities (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      type VARCHAR(60) NOT NULL,
      title VARCHAR(120) NOT NULL,
      description VARCHAR(255) NOT NULL,
      entity_type VARCHAR(60) NULL,
      entity_id INT UNSIGNED NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY activities_created_at_index (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  const [[userCountRow]] = await pool.query("SELECT COUNT(*) AS count FROM users")
  if (Number(userCountRow.count) === 0) {
    const users = []
    users.push(["Super Admin", "superadmin@adopsi.test", "superadmin", "aktif"])
    for (let index = 1; index <= 149; index += 1) {
      users.push([
        `User ${String(index).padStart(3, "0")}`,
        `user${String(index).padStart(3, "0")}@adopsi.test`,
        "user",
        index % 11 === 0 ? "nonaktif" : "aktif",
      ])
    }
    await pool.query(
      "INSERT INTO users (name, email, role, status) VALUES ?",
      [users],
    )
  }

  const [[animalCountRow]] = await pool.query("SELECT COUNT(*) AS count FROM animals")
  if (Number(animalCountRow.count) === 0) {
    const animals = []
    const speciesPlan = [
      ["Kucing", 21],
      ["Anjing", 12],
      ["Kelinci", 7],
      ["Burung", 3],
      ["Hamster", 2],
    ]
    let age = 1
    for (const [species, total] of speciesPlan) {
      for (let index = 1; index <= total; index += 1) {
        animals.push([
          `${species} ${String(index).padStart(2, "0")}`,
          species,
          index % 2 === 0 ? "Jantan" : "Betina",
          age,
          "tersedia",
        ])
        age = age >= 8 ? 1 : age + 1
      }
    }
    await pool.query(
      "INSERT INTO animals (name, species, gender, age, status) VALUES ?",
      [animals],
    )
  }

  const [[requestCountRow]] = await pool.query("SELECT COUNT(*) AS count FROM adoption_requests")
  if (Number(requestCountRow.count) === 0) {
    const [users] = await pool.query("SELECT id FROM users WHERE role = 'user' ORDER BY id")
    const [animals] = await pool.query("SELECT id FROM animals ORDER BY id")
    const requests = []
    const statuses = [
      ...Array(20).fill("disetujui"),
      ...Array(8).fill("pending"),
      ...Array(4).fill("ditolak"),
    ]

    statuses.forEach((status, index) => {
      const user = users[index % users.length]
      const animal = animals[index % animals.length]
      const createdAt = new Date(2026, index % 6, (index % 25) + 1, 9, 0, 0)
      requests.push([
        user.id,
        animal.id,
        status,
        createdAt.toISOString().slice(0, 19).replace("T", " "),
      ])
    })

    await pool.query(
      "INSERT INTO adoption_requests (user_id, animal_id, status, created_at) VALUES ?",
      [requests],
    )
  }

  const [[adoptionCountRow]] = await pool.query("SELECT COUNT(*) AS count FROM adoptions")
  if (Number(adoptionCountRow.count) === 0) {
    const [requests] = await pool.query(
      "SELECT id, user_id, animal_id FROM adoption_requests WHERE status = 'disetujui' ORDER BY id LIMIT 20",
    )
    const months = [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5]
    const adoptions = requests.map((request, index) => {
      const monthIndex = months[index] ?? 0
      const approvedAt = new Date(2026, monthIndex, (index % 24) + 1, 15, 0, 0)
      return [
        request.id,
        request.user_id,
        request.animal_id,
        "berhasil",
        approvedAt.toISOString().slice(0, 19).replace("T", " "),
      ]
    })

    await pool.query(
      "INSERT INTO adoptions (request_id, user_id, animal_id, status, approved_at) VALUES ?",
      [adoptions],
    )
  }

  const [[activityCountRow]] = await pool.query("SELECT COUNT(*) AS count FROM activities")
  if (Number(activityCountRow.count) === 0) {
    await pool.query(
      "INSERT INTO activities (type, title, description, entity_type, entity_id, created_at) VALUES ?",
      [[
        ["user", "User baru mendaftar", "Akun adopter baru masuk ke sistem.", "user", 151, "2026-07-22 09:15:00"],
        ["animal", "Hewan baru ditambahkan", "Data hewan siap adopsi berhasil dipublikasikan.", "animal", 46, "2026-07-22 09:28:00"],
        ["request", "Pengajuan adopsi baru", "Form pengajuan baru menunggu verifikasi superadmin.", "adoption_request", 33, "2026-07-22 09:40:00"],
        ["adoption", "Adopsi baru disetujui", "Satu pengajuan adopsi telah berubah menjadi berhasil.", "adoption", 21, "2026-07-22 10:05:00"],
      ]],
    )
  }
}

// Export a getter for the pool to ensure it's initialized
async function getPool() {
  if (!pool) {
    await ensureDatabaseExists()
  }
  return pool
}

// Also export pool as a promise-based getter
module.exports = {
  get pool() {
    if (!pool) {
      throw new Error("Database not initialized. Call initializeDatabase() first.")
    }
    return pool
  },
  initializeDatabase,
  getPool,
}
