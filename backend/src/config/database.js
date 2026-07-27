const { Pool } = require("pg")

const resolvedHost = process.env.DB_HOST || "127.0.0.1"

let pool

function getPoolConfig(databaseName) {
  return {
    host: resolvedHost,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME || process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "123456",
    database: databaseName,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }
}

async function columnExists(tableName, columnName) {
  const result = await pool.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [tableName, columnName],
  )
  return result.rowCount > 0
}

async function insertRows(tableName, columns, rows) {
  if (!rows.length) {
    return null
  }

  const placeholders = rows
    .map((_, rowIndex) => {
      const startIndex = rowIndex * columns.length
      return `(${columns
        .map((_, columnIndex) => `$${startIndex + columnIndex + 1}`)
        .join(", ")})`
    })
    .join(", ")

  const values = rows.flat()
  return pool.query(`INSERT INTO ${tableName} (${columns.join(", ")}) VALUES ${placeholders}`, values)
}

async function ensureDatabaseExists() {
  const dbName = process.env.DB_DATABASE || process.env.DB_NAME || "adopsi"
  const tempPool = new Pool(getPoolConfig("postgres"))

  const existingDatabase = await tempPool.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [dbName],
  )

  if (existingDatabase.rowCount === 0) {
    await tempPool.query(`CREATE DATABASE "${dbName}"`)
  }

  await tempPool.end()

  pool = new Pool(getPoolConfig(dbName))
  return pool
}

async function initializeDatabase() {
  if (!pool) {
    await ensureDatabaseExists()
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      password VARCHAR(255) NULL,
      role VARCHAR(30) NOT NULL DEFAULT 'user',
      status VARCHAR(30) NOT NULL DEFAULT 'aktif',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted BOOLEAN NOT NULL DEFAULT FALSE,
      deleted_by VARCHAR(255) NULL,
      deleted_at TIMESTAMP NULL,
      deleted_ip VARCHAR(45) NULL
    )
  `)

  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255) NULL`)
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE`)
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) NULL`)
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL`)
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_ip VARCHAR(45) NULL`)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS animals (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      species VARCHAR(60) NOT NULL,
      gender VARCHAR(20) NOT NULL,
      age INTEGER NOT NULL DEFAULT 0,
      status VARCHAR(30) NOT NULL DEFAULT 'tersedia',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted BOOLEAN NOT NULL DEFAULT FALSE,
      deleted_by VARCHAR(255) NULL,
      deleted_at TIMESTAMP NULL,
      deleted_ip VARCHAR(45) NULL
    )
  `)
  await pool.query(`ALTER TABLE animals ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE`)
  await pool.query(`ALTER TABLE animals ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) NULL`)
  await pool.query(`ALTER TABLE animals ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL`)
  await pool.query(`ALTER TABLE animals ADD COLUMN IF NOT EXISTS deleted_ip VARCHAR(45) NULL`)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted BOOLEAN NOT NULL DEFAULT FALSE,
      deleted_by VARCHAR(255) NULL,
      deleted_at TIMESTAMP NULL,
      deleted_ip VARCHAR(45) NULL
    )
  `)
  await pool.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE`)
  await pool.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) NULL`)
  await pool.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL`)
  await pool.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_ip VARCHAR(45) NULL`)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS adoption_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      animal_id INTEGER NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted BOOLEAN NOT NULL DEFAULT FALSE,
      deleted_by VARCHAR(255) NULL,
      deleted_at TIMESTAMP NULL,
      deleted_ip VARCHAR(45) NULL,
      CONSTRAINT adoption_requests_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT adoption_requests_animal_fk FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE
    )
  `)
  await pool.query(`ALTER TABLE adoption_requests ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE`)
  await pool.query(`ALTER TABLE adoption_requests ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) NULL`)
  await pool.query(`ALTER TABLE adoption_requests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL`)
  await pool.query(`ALTER TABLE adoption_requests ADD COLUMN IF NOT EXISTS deleted_ip VARCHAR(45) NULL`)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS adoptions (
      id SERIAL PRIMARY KEY,
      request_id INTEGER NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      animal_id INTEGER NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'berhasil',
      approved_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted BOOLEAN NOT NULL DEFAULT FALSE,
      deleted_by VARCHAR(255) NULL,
      deleted_at TIMESTAMP NULL,
      deleted_ip VARCHAR(45) NULL,
      CONSTRAINT adoptions_request_fk FOREIGN KEY (request_id) REFERENCES adoption_requests(id) ON DELETE CASCADE,
      CONSTRAINT adoptions_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT adoptions_animal_fk FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE
    )
  `)
  await pool.query(`ALTER TABLE adoptions ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE`)
  await pool.query(`ALTER TABLE adoptions ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) NULL`)
  await pool.query(`ALTER TABLE adoptions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL`)
  await pool.query(`ALTER TABLE adoptions ADD COLUMN IF NOT EXISTS deleted_ip VARCHAR(45) NULL`)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS activities (
      id SERIAL PRIMARY KEY,
      type VARCHAR(60) NOT NULL,
      title VARCHAR(120) NOT NULL,
      description VARCHAR(255) NOT NULL,
      entity_type VARCHAR(60) NULL,
      entity_id INTEGER NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted BOOLEAN NOT NULL DEFAULT FALSE,
      deleted_by VARCHAR(255) NULL,
      deleted_at TIMESTAMP NULL,
      deleted_ip VARCHAR(45) NULL
    )
  `)
  await pool.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS user_name VARCHAR(120) NULL`)
  await pool.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS user_email VARCHAR(190) NULL`)
  await pool.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS user_role VARCHAR(60) NULL`)
  await pool.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45) NULL`)
  await pool.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8) NULL`)
  await pool.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8) NULL`)
  await pool.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS location_name VARCHAR(255) NULL`)
  await pool.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`)
  await pool.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE`)
  await pool.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) NULL`)
  await pool.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL`)
  await pool.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS deleted_ip VARCHAR(45) NULL`)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS questionnaire_questions (
      id SERIAL PRIMARY KEY,
      question TEXT NOT NULL,
      answer_type VARCHAR(30) NOT NULL DEFAULT 'Pilihan',
      status VARCHAR(30) NOT NULL DEFAULT 'aktif',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted BOOLEAN NOT NULL DEFAULT FALSE,
      deleted_by VARCHAR(255) NULL,
      deleted_at TIMESTAMP NULL,
      deleted_ip VARCHAR(45) NULL
    )
  `)
  await pool.query(`ALTER TABLE questionnaire_questions ADD COLUMN IF NOT EXISTS answer_type VARCHAR(30) NOT NULL DEFAULT 'Pilihan'`)
  await pool.query(`ALTER TABLE questionnaire_questions ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'aktif'`)
  await pool.query(`ALTER TABLE questionnaire_questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`)
  await pool.query(`ALTER TABLE questionnaire_questions ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE`)
  await pool.query(`ALTER TABLE questionnaire_questions ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) NULL`)
  await pool.query(`ALTER TABLE questionnaire_questions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL`)
  await pool.query(`ALTER TABLE questionnaire_questions ADD COLUMN IF NOT EXISTS deleted_ip VARCHAR(45) NULL`)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      setting_key VARCHAR(120) NOT NULL UNIQUE,
      setting_value TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await pool.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`)

  const { rows: [settingsCountRow] } = await pool.query("SELECT COUNT(*) AS count FROM settings")
  if (Number(settingsCountRow.count) === 0) {
    const defaultSettings = [
      ["nama_apk", "Adopsi Hewan"],
      ["warna_apk", "#0EA5E9"],
      ["logo_apk", "A"],
      ["admin_name", "Super Admin"],
      ["admin_email", "admin@adopsi.test"],
    ]
    await insertRows("settings", ["setting_key", "setting_value"], defaultSettings)
  }
}

async function getPool() {
  if (!pool) {
    await ensureDatabaseExists()
  }
  return pool
}

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
