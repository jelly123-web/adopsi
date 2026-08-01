const { Pool } = require("pg")
const crypto = require("crypto")

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
    profile_photo TEXT NULL,
    profile_bg_photo TEXT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'costumer',
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
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT NULL`)
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_bg_photo TEXT NULL`)
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(120) NULL`)
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires_at TIMESTAMP NULL`)
  await pool.query(`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'costumer'`)
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
      activity_preference VARCHAR(60) NOT NULL DEFAULT 'Suka di rumah',
      status VARCHAR(30) NOT NULL DEFAULT 'tersedia',
      condition VARCHAR(40) NOT NULL DEFAULT 'Sehat',
      photo TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted BOOLEAN NOT NULL DEFAULT FALSE,
      deleted_by VARCHAR(255) NULL,
      deleted_at TIMESTAMP NULL,
      deleted_ip VARCHAR(45) NULL
    )
  `)
  await pool.query(`ALTER TABLE animals ADD COLUMN IF NOT EXISTS activity_preference VARCHAR(60) NOT NULL DEFAULT 'Suka di rumah'`)
  await pool.query(`ALTER TABLE animals ADD COLUMN IF NOT EXISTS photo TEXT NULL`)
  await pool.query(`ALTER TABLE animals ADD COLUMN IF NOT EXISTS condition VARCHAR(40) NOT NULL DEFAULT 'Sehat'`)
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
  await pool.query(`ALTER TABLE adoption_requests ADD COLUMN IF NOT EXISTS full_name VARCHAR(160) NULL`)
  await pool.query(`ALTER TABLE adoption_requests ADD COLUMN IF NOT EXISTS phone VARCHAR(40) NULL`)
  await pool.query(`ALTER TABLE adoption_requests ADD COLUMN IF NOT EXISTS address TEXT NULL`)
  await pool.query(`ALTER TABLE adoption_requests ADD COLUMN IF NOT EXISTS job VARCHAR(120) NULL`)
  await pool.query(`ALTER TABLE adoption_requests ADD COLUMN IF NOT EXISTS family_count VARCHAR(60) NULL`)
  await pool.query(`ALTER TABLE adoption_requests ADD COLUMN IF NOT EXISTS housing_type VARCHAR(120) NULL`)
  await pool.query(`ALTER TABLE adoption_requests ADD COLUMN IF NOT EXISTS pet_experience VARCHAR(120) NULL`)
  await pool.query(`ALTER TABLE adoption_requests ADD COLUMN IF NOT EXISTS reason TEXT NULL`)
  await pool.query(`ALTER TABLE adoption_requests ADD COLUMN IF NOT EXISTS document_url TEXT NULL`)
  await pool.query(`ALTER TABLE adoption_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL`)
  await pool.query(`ALTER TABLE adoption_requests ADD COLUMN IF NOT EXISTS pickup_date TIMESTAMP NULL`)
  await pool.query(`ALTER TABLE adoption_requests ADD COLUMN IF NOT EXISTS pickup_status VARCHAR(80) NULL`)
  await pool.query(`ALTER TABLE adoption_requests ADD COLUMN IF NOT EXISTS pickup_notified_at TIMESTAMP NULL`)
  await pool.query(`ALTER TABLE adoption_requests ADD COLUMN IF NOT EXISTS pickup_updated_at TIMESTAMP NULL`)

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

  const defaultSettings = [
    ["nama_apk", "Adopsi Hewan"],
    ["warna_apk", "#0EA5E9"],
    ["logo_apk", "A"],
    ["hero_bg_apk", ""],
    ["login_hero_title", "Setiap Hewan\nLayak\nDicintai"],
    ["login_hero_title_1", "Setiap Hewan"],
    ["login_hero_title_2", "Layak"],
    ["login_hero_highlight", "Dicintai"],
    ["login_hero_description", "Jangan beli, adopsi. Berikan mereka kesempatan kedua untuk merasakan kehangatan keluarga."],
    ["login_hero_badge_text", "hewan sedang menunggu rumah baru"],
    ["login_hero_primary_button", "Masuk & Adopsi"],
    ["login_hero_secondary_button", "Jelajahi"],
    ["dashboard_bg_apk", ""],
    ["admin_name", "Super Admin"],
    ["admin_email", "admin@adopsi.test"],
  ]
  const { rows: [settingsCountRow] } = await pool.query("SELECT COUNT(*) AS count FROM settings")
  if (Number(settingsCountRow.count) === 0) {
    await insertRows("settings", ["setting_key", "setting_value"], defaultSettings)
  }
  for (const [key, value] of defaultSettings) {
    await pool.query(
      "INSERT INTO settings (setting_key, setting_value) VALUES ($1, $2) ON CONFLICT (setting_key) DO NOTHING",
      [key, value],
    )
  }

  const defaultSuperadminPassword = `sha256:${crypto.createHash("sha256").update("123456").digest("hex")}`
  await pool.query(
    `
      INSERT INTO users (name, email, password, role, status, deleted)
      VALUES ('Super Admin', 'superadmin@adopsi.test', $1, 'superadmin', 'aktif', FALSE)
      ON CONFLICT (email)
      DO UPDATE SET
        name = 'Super Admin',
        password = COALESCE(users.password, EXCLUDED.password),
        role = 'superadmin',
        status = 'aktif',
        deleted = FALSE,
        deleted_by = NULL,
        deleted_at = NULL,
        deleted_ip = NULL
    `,
    [defaultSuperadminPassword],
  )

  const gmailSuperadminPassword = `sha256:${crypto.createHash("sha256").update("superadmin").digest("hex")}`
  await pool.query(
    `
      INSERT INTO users (name, email, password, role, status, deleted)
      VALUES ('Super Admin', 'superadmin@gmail.com', $1, 'superadmin', 'aktif', FALSE)
      ON CONFLICT (email)
      DO UPDATE SET
        name = 'Super Admin',
        password = EXCLUDED.password,
        role = 'superadmin',
        deleted_at = NULL,
        deleted_ip = NULL
    `,
    [gmailSuperadminPassword],
  )

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id SERIAL PRIMARY KEY,
      msg_id VARCHAR(120) NOT NULL UNIQUE,
      user_id INTEGER NULL,
      sender VARCHAR(60) NOT NULL,
      sender_name VARCHAR(120) NULL,
      target_role VARCHAR(60) NULL,
      text TEXT NOT NULL,
      topic VARCHAR(255) NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await pool.query(`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS target_role VARCHAR(60) NULL`)
  await pool.query(`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE`)
  await pool.query(`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS topic VARCHAR(255) NULL`)
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
