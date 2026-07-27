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
    ORDER BY CASE species
      WHEN 'Kucing' THEN 1
      WHEN 'Anjing' THEN 2
      WHEN 'Kelinci' THEN 3
      WHEN 'Burung' THEN 4
      WHEN 'Hamster' THEN 5
      ELSE 6
    END
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
    activities: activityRows.map((row) => ({
      title: row.title,
      description: row.description,
      time: row.time,
    })),
  }
}

async function listUsers() {
  const pool = await getPool()
  const { rows } = await pool.query(`
    SELECT id, name, email, role, status, created_at
    FROM users
    WHERE deleted = FALSE
    ORDER BY id ASC
  `)

  return rows
}

async function createUser(input) {
  const pool = await getPool()
  const { name, email, role, status } = input
  const result = await pool.query(
    `
      INSERT INTO users (name, email, role, status)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `,
    [name, email, role, status],
  )

  return result.rows[0].id
}

async function updateUser(id, input) {
  const pool = await getPool()
  const { name, email, role, status } = input
  const result = await pool.query(
    `
      UPDATE users
      SET name = $1, email = $2, role = $3, status = $4
      WHERE id = $5 AND deleted = FALSE
    `,
    [name, email, role, status, id],
  )

  return result.rowCount
}

async function softDeleteUser(id, { deletedBy, deletedIp }) {
  const pool = await getPool()
  const result = await pool.query(`
    UPDATE users
    SET deleted = TRUE,
        deleted_by = $1,
        deleted_at = CURRENT_TIMESTAMP,
        deleted_ip = $2
    WHERE id = $3 AND deleted = FALSE
  `, [deletedBy, deletedIp, id])
  return result.rowCount
}

async function restoreUser(id) {
  const pool = await getPool()
  const result = await pool.query(`
    UPDATE users
    SET deleted = FALSE,
        deleted_by = NULL,
        deleted_at = NULL,
        deleted_ip = NULL
    WHERE id = $1 AND deleted = TRUE
  `, [id])
  return result.rowCount
}

async function findUserById(id) {
  const pool = await getPool()
  const { rows: [row] } = await pool.query(
    "SELECT id, role FROM users WHERE id = $1 AND deleted = FALSE LIMIT 1",
    [id],
  )

  return row || null
}

async function listDeletedUsers() {
  const pool = await getPool()
  const { rows } = await pool.query(`
    SELECT id, name, email, role, status, deleted, deleted_by, deleted_at, deleted_ip
    FROM users
    WHERE deleted = TRUE
    ORDER BY deleted_at DESC
  `)
  return rows
}

async function listAnimals() {
  const pool = await getPool()
  const { rows } = await pool.query(`
    SELECT id, name, species, gender, age, status, created_at
    FROM animals
    WHERE deleted = FALSE
    ORDER BY id ASC
  `)

  return rows
}

async function createAnimal(input) {
  const pool = await getPool()
  const { name, species, gender, age, status } = input
  const result = await pool.query(
    `
      INSERT INTO animals (name, species, gender, age, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `,
    [name, species, gender, age, status],
  )

  return result.rows[0].id
}

async function updateAnimal(id, input) {
  const pool = await getPool()
  const { name, species, gender, age, status } = input
  const result = await pool.query(
    `
      UPDATE animals
      SET name = $1, species = $2, gender = $3, age = $4, status = $5
      WHERE id = $6 AND deleted = FALSE
    `,
    [name, species, gender, age, status, id],
  )

  return result.rowCount
}

async function softDeleteAnimal(id, { deletedBy, deletedIp }) {
  const pool = await getPool()
  const result = await pool.query(`
    UPDATE animals
    SET deleted = TRUE,
        deleted_by = $1,
        deleted_at = CURRENT_TIMESTAMP,
        deleted_ip = $2
    WHERE id = $3 AND deleted = FALSE
  `, [deletedBy, deletedIp, id])
  return result.rowCount
}

async function restoreAnimal(id) {
  const pool = await getPool()
  const result = await pool.query(`
    UPDATE animals
    SET deleted = FALSE,
        deleted_by = NULL,
        deleted_at = NULL,
        deleted_ip = NULL
    WHERE id = $1 AND deleted = TRUE
  `, [id])
  return result.rowCount
}

async function listDeletedAnimals() {
  const pool = await getPool()
  const { rows } = await pool.query(`
    SELECT id, name, species, gender, age, status, deleted, deleted_by, deleted_at, deleted_ip
    FROM animals
    WHERE deleted = TRUE
    ORDER BY deleted_at DESC
  `)
  return rows
}

async function listCategories() {
  const pool = await getPool()
  const { rows } = await pool.query(`
    SELECT id, name, created_at
    FROM categories
    WHERE deleted = FALSE
    ORDER BY id ASC
  `)
  return rows
}

async function createCategory(input) {
  const pool = await getPool()
  const { name } = input
  const result = await pool.query(
    "INSERT INTO categories (name) VALUES ($1) RETURNING id",
    [name],
  )
  return result.rows[0].id
}

async function updateCategory(id, input) {
  const pool = await getPool()
  const { name } = input
  const result = await pool.query(
    "UPDATE categories SET name = $1 WHERE id = $2 AND deleted = FALSE",
    [name, id],
  )
  return result.rowCount
}

async function softDeleteCategory(id, { deletedBy, deletedIp }) {
  const pool = await getPool()
  const result = await pool.query(`
    UPDATE categories
    SET deleted = TRUE,
        deleted_by = $1,
        deleted_at = CURRENT_TIMESTAMP,
        deleted_ip = $2
    WHERE id = $3 AND deleted = FALSE
  `, [deletedBy, deletedIp, id])
  return result.rowCount
}

async function restoreCategory(id) {
  const pool = await getPool()
  const result = await pool.query(`
    UPDATE categories
    SET deleted = FALSE,
        deleted_by = NULL,
        deleted_at = NULL,
        deleted_ip = NULL
    WHERE id = $1 AND deleted = TRUE
  `, [id])
  return result.rowCount
}

async function listDeletedCategories() {
  const pool = await getPool()
  const { rows } = await pool.query(`
    SELECT id, name, deleted, deleted_by, deleted_at, deleted_ip
    FROM categories
    WHERE deleted = TRUE
    ORDER BY deleted_at DESC
  `)
  return rows
}

async function listAdoptionRequests() {
  const pool = await getPool()
  const { rows } = await pool.query(`
    SELECT
      ar.id,
      u.name AS user_name,
      a.name AS animal_name,
      a.species AS animal_species,
      ar.status,
      ar.created_at
    FROM adoption_requests ar
    LEFT JOIN users u ON ar.user_id = u.id
    LEFT JOIN animals a ON ar.animal_id = a.id
    WHERE ar.deleted = FALSE
    ORDER BY ar.id DESC
  `)
  return rows
}

async function updateAdoptionRequest(id, { status }) {
  const pool = await getPool()
  const result = await pool.query(
    "UPDATE adoption_requests SET status = $1 WHERE id = $2 AND deleted = FALSE",
    [status, id],
  )
  if (result.rowCount && status === "disetujui") {
    await pool.query("UPDATE animals SET status = 'diadopsi' WHERE id = (SELECT animal_id FROM adoption_requests WHERE id = $1 AND deleted = FALSE)", [id])
  }
  return result.rowCount
}

async function softDeleteAdoptionRequest(id, { deletedBy, deletedIp }) {
  const pool = await getPool()
  const result = await pool.query(`
    UPDATE adoption_requests
    SET deleted = TRUE,
        deleted_by = $1,
        deleted_at = CURRENT_TIMESTAMP,
        deleted_ip = $2
    WHERE id = $3 AND deleted = FALSE
  `, [deletedBy, deletedIp, id])
  return result.rowCount
}

async function restoreAdoptionRequest(id) {
  const pool = await getPool()
  const result = await pool.query(`
    UPDATE adoption_requests
    SET deleted = FALSE,
        deleted_by = NULL,
        deleted_at = NULL,
        deleted_ip = NULL
    WHERE id = $1 AND deleted = TRUE
  `, [id])
  return result.rowCount
}

async function listDeletedAdoptionRequests() {
  const pool = await getPool()
  const { rows } = await pool.query(`
    SELECT
      ar.id,
      u.name AS user_name,
      a.name AS animal_name,
      a.species AS animal_species,
      ar.status,
      ar.deleted,
      ar.deleted_by,
      ar.deleted_at,
      ar.deleted_ip
    FROM adoption_requests ar
    LEFT JOIN users u ON ar.user_id = u.id
    LEFT JOIN animals a ON ar.animal_id = a.id
    WHERE ar.deleted = TRUE
    ORDER BY ar.deleted_at DESC
  `)
  return rows
}

async function listQuestionnaireQuestions() {
  const pool = await getPool()
  const { rows } = await pool.query(`
    SELECT
      id,
      question,
      answer_type AS "answerType",
      status,
      created_at
    FROM questionnaire_questions
    WHERE deleted = FALSE
    ORDER BY id ASC
  `)
  return rows
}

async function createQuestionnaireQuestion(input) {
  const pool = await getPool()
  const { question, answerType, status } = input
  const result = await pool.query(
    `
      INSERT INTO questionnaire_questions (question, answer_type, status)
      VALUES ($1, $2, $3)
      RETURNING id
    `,
    [question, answerType, status],
  )
  return result.rows[0].id
}

async function updateQuestionnaireQuestion(id, input) {
  const pool = await getPool()
  const { question, answerType, status } = input
  const result = await pool.query(
    `
      UPDATE questionnaire_questions
      SET question = $1,
          answer_type = $2,
          status = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND deleted = FALSE
    `,
    [question, answerType, status, id],
  )
  return result.rowCount
}

async function softDeleteQuestionnaireQuestion(id, { deletedBy, deletedIp }) {
  const pool = await getPool()
  const result = await pool.query(
    `
      UPDATE questionnaire_questions
      SET deleted = TRUE,
          deleted_by = $1,
          deleted_at = CURRENT_TIMESTAMP,
          deleted_ip = $2
      WHERE id = $3 AND deleted = FALSE
    `,
    [deletedBy, deletedIp, id],
  )
  return result.rowCount
}

async function listDeletedQuestionnaireQuestions() {
  const pool = await getPool()
  const { rows } = await pool.query(`
    SELECT
      id,
      question,
      answer_type AS "answerType",
      status,
      deleted,
      deleted_by,
      deleted_at,
      deleted_ip
    FROM questionnaire_questions
    WHERE deleted = TRUE
    ORDER BY deleted_at DESC
  `)
  return rows
}

async function restoreQuestionnaireQuestion(id) {
  const pool = await getPool()
  const result = await pool.query(
    `
      UPDATE questionnaire_questions
      SET deleted = FALSE,
          deleted_by = NULL,
          deleted_at = NULL,
          deleted_ip = NULL
      WHERE id = $1 AND deleted = TRUE
    `,
    [id],
  )
  return result.rowCount
}

async function getSettings() {
  const pool = await getPool()
  const { rows } = await pool.query("SELECT setting_key, setting_value FROM settings")
  const settings = {}
  for (const row of rows) {
    settings[row.setting_key] = row.setting_value
  }
  return settings
}

async function updateSettings(settings) {
  const pool = await getPool()
  for (const [key, value] of Object.entries(settings)) {
    await pool.query(
      "INSERT INTO settings (setting_key, setting_value) VALUES ($1, $2) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value",
      [key, value],
    )
  }
}

async function getProfile() {
  const pool = await getPool()
  const { rows: [settings] } = await pool.query(`
    SELECT
      MAX(CASE WHEN setting_key = 'admin_name' THEN setting_value END) AS admin_name,
      MAX(CASE WHEN setting_key = 'admin_email' THEN setting_value END) AS admin_email,
      MAX(CASE WHEN setting_key = 'admin_avatar' THEN setting_value END) AS admin_avatar
    FROM settings
  `)

  const { rows: [superadmin] } = await pool.query(`
    SELECT id, name, email, password
    FROM users
    WHERE role = 'superadmin' AND deleted = FALSE
    ORDER BY id ASC
    LIMIT 1
  `)

  return {
    admin_name: settings?.admin_name || superadmin?.name || 'Super Admin',
    admin_email: settings?.admin_email || superadmin?.email || 'admin@adopsi.test',
    admin_avatar: settings?.admin_avatar || null,
    password_set: Boolean(superadmin?.password),
  }
}

async function updateProfile(input) {
  const pool = await getPool()
  const {
    admin_name,
    admin_email,
    admin_avatar = null,
    current_password = '',
    new_password = '',
    confirm_password = '',
  } = input || {}

  if (!admin_name || !admin_email) {
    throw new Error('Nama dan email admin wajib diisi.')
  }

  if (new_password || confirm_password) {
    if (new_password !== confirm_password) {
      throw new Error('Konfirmasi password tidak cocok.')
    }
  }

  await pool.query('BEGIN')

  try {
    const { rows: [superadmin] } = await pool.query(`
      SELECT id, password
      FROM users
      WHERE role = 'superadmin' AND deleted = FALSE
      ORDER BY id ASC
      LIMIT 1
      FOR UPDATE
    `)

    let superadminId = superadmin?.id || null
    let superadminPassword = superadmin?.password || null

    if (!superadmin) {
      const result = await pool.query(
        `
          INSERT INTO users (name, email, password, role, status)
          VALUES ($1, $2, NULL, 'superadmin', 'aktif')
          RETURNING id, password
        `,
        [admin_name, admin_email],
      )
      superadminId = result.rows[0].id
      superadminPassword = result.rows[0].password
    }

    if (superadminPassword) {
      if (!current_password || current_password !== superadminPassword) {
        throw new Error('Password saat ini tidak sesuai.')
      }
    }

    const nextPassword = new_password ? new_password : superadminPassword

    await pool.query(
      `
        UPDATE users
        SET name = $1,
            email = $2,
            password = $3
        WHERE id = $4
      `,
      [admin_name, admin_email, nextPassword, superadminId],
    )

    const profileSettings = [
      ['admin_name', admin_name],
      ['admin_email', admin_email],
      ['admin_avatar', admin_avatar || ''],
    ]

    for (const [key, value] of profileSettings) {
      await pool.query(
        `
          INSERT INTO settings (setting_key, setting_value)
          VALUES ($1, $2)
          ON CONFLICT (setting_key)
          DO UPDATE SET setting_value = EXCLUDED.setting_value
        `,
        [key, value],
      )
    }

    await pool.query('COMMIT')
  } catch (error) {
    await pool.query('ROLLBACK')
    throw error
  }
}

async function listActivityLogs() {
  const pool = await getPool()
  const { rows } = await pool.query(`
    SELECT id, type, title, description, user_name, user_email, user_role, ip_address, latitude, longitude, location_name, created_at
    FROM activities
    WHERE deleted = FALSE
    ORDER BY created_at DESC, id DESC
  `)
  return rows
}

async function createActivityLog(input) {
  const pool = await getPool()
  const {
    type = "info",
    title,
    description,
    user_name = "Super Admin",
    user_email = "admin@adopsi.test",
    user_role = "superadmin",
    ip_address = "127.0.0.1",
    latitude = null,
    longitude = null,
    location_name = "Unknown Location",
  } = input

  const result = await pool.query(`
    INSERT INTO activities
    (type, title, description, user_name, user_email, user_role, ip_address, latitude, longitude, location_name)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id
  `, [type, title, description, user_name, user_email, user_role, ip_address, latitude, longitude, location_name])

  return result.rows[0].id
}

async function getReportsData() {
  const pool = await getPool()

  const { rows: [summary] } = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE deleted = FALSE) AS total_user,
      (SELECT COUNT(*) FROM animals WHERE deleted = FALSE) AS total_hewan,
      (SELECT COUNT(*) FROM adoption_requests WHERE deleted = FALSE) AS total_pengajuan,
      (SELECT COUNT(*) FROM adoptions WHERE status = 'berhasil' AND deleted = FALSE) AS adopsi_berhasil,
      (SELECT COUNT(*) FROM animals WHERE status = 'tersedia' AND deleted = FALSE) AS hewan_tersedia,
      (SELECT COUNT(*) FROM animals WHERE status = 'diadopsi' AND deleted = FALSE) AS hewan_diadopsi,
      (SELECT COUNT(*) FROM animals WHERE status = 'perawatan' AND deleted = FALSE) AS hewan_perawatan
  `)

  const { rows: monthlyRows } = await pool.query(`
    SELECT EXTRACT(MONTH FROM approved_at) AS month_number, COUNT(*) AS total
    FROM adoptions
    WHERE status = 'berhasil' AND deleted = FALSE
    GROUP BY EXTRACT(MONTH FROM approved_at)
    ORDER BY EXTRACT(MONTH FROM approved_at)
  `)

  const { rows: yearlyRows } = await pool.query(`
    SELECT EXTRACT(YEAR FROM approved_at) AS year_number, COUNT(*) AS total
    FROM adoptions
    WHERE status = 'berhasil' AND deleted = FALSE
    GROUP BY EXTRACT(YEAR FROM approved_at)
    ORDER BY EXTRACT(YEAR FROM approved_at)
  `)

  const { rows: animalRows } = await pool.query(`
    SELECT
      species AS type,
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'tersedia' THEN 1 ELSE 0 END) AS available,
      SUM(CASE WHEN status = 'diadopsi' THEN 1 ELSE 0 END) AS adopted,
      SUM(CASE WHEN status = 'perawatan' THEN 1 ELSE 0 END) AS care
    FROM animals
    WHERE deleted = FALSE
    GROUP BY species
  `)

  const logs = await listActivityLogs()

  return {
    stats: [
      { label: "Total User", value: Number(summary.total_user), tone: "blue" },
      { label: "Total Hewan", value: Number(summary.total_hewan), tone: "green" },
      { label: "Total Pengajuan", value: Number(summary.total_pengajuan), tone: "amber" },
      { label: "Adopsi Berhasil", value: Number(summary.adopsi_berhasil), tone: "success" },
    ],
    statusBreakdown: [
      { label: "Tersedia", value: Number(summary.hewan_tersedia), color: "var(--green)" },
      { label: "Diadopsi", value: Number(summary.hewan_diadopsi), color: "var(--blue)" },
      { label: "Perawatan", value: Number(summary.hewan_perawatan), color: "var(--amber)" },
    ],
    monthlyAdoptions: monthlyRows.map((row) => ({
      month: monthLabels[Number(row.month_number) - 1] || String(row.month_number),
      total: Number(row.total),
    })),
    yearlyAdoptions: yearlyRows.map((row) => ({
      year: String(row.year_number),
      total: Number(row.total),
    })),
    animalTypes: animalRows.map((row) => ({
      type: row.type,
      total: Number(row.total),
      available: Number(row.available),
      adopted: Number(row.adopted),
      care: Number(row.care),
    })),
    activityLogs: logs,
  }
}

async function exportDatabaseBackup() {
  const pool = await getPool()
  const tables = ["settings", "categories", "users", "animals", "adoption_requests", "adoptions", "activities", "questionnaire_questions"]
  const dump = {
    app: "Adopsi Hewan",
    version: "1.0",
    exported_at: new Date().toISOString(),
    database: "adopsi",
    tables: {},
  }
  for (const table of tables) {
    const { rows } = await pool.query(`SELECT * FROM "${table}"`)
    dump.tables[table] = rows
  }
  return dump
}

async function importDatabaseBackup(backupData) {
  const pool = await getPool()
  if (!backupData || typeof backupData !== "object" || !backupData.tables) {
    throw new Error("Format file backup tidak valid. Harus berupa JSON backup sistem adopsi.")
  }

  const tableOrder = ["settings", "categories", "users", "animals", "adoption_requests", "adoptions", "activities", "questionnaire_questions"]
  let restoredCount = 0

  for (const tableName of tableOrder) {
    const rows = backupData.tables[tableName]
    if (!Array.isArray(rows) || rows.length === 0) continue

    for (const row of rows) {
      const keys = Object.keys(row)
      if (keys.length === 0) continue

      const columnsSql = keys.map((k) => `"${k}"`).join(", ")
      const placeholdersSql = keys.map((_, index) => `$${index + 1}`).join(", ")
      const updateSql = keys.map((k) => `"${k}" = EXCLUDED."${k}"`).join(", ")

      const values = keys.map((k) => {
        let val = row[k]
        if (val && typeof val === "string" && val.includes("T") && val.endsWith("Z")) {
          const d = new Date(val)
          if (!Number.isNaN(d.getTime())) {
            val = d.toISOString().slice(0, 19).replace("T", " ")
          }
        }
        return val
      })

      const query = `
        INSERT INTO "${tableName}" (${columnsSql})
        VALUES (${placeholdersSql})
        ON CONFLICT (id) DO UPDATE SET ${updateSql}
      `
      await pool.query(query, values)
      restoredCount += 1
    }
  }

  return restoredCount
}

module.exports = {
  getDashboardData,
  listUsers,
  createUser,
  updateUser,
  softDeleteUser,
  restoreUser,
  findUserById,
  listDeletedUsers,
  listAnimals,
  createAnimal,
  updateAnimal,
  softDeleteAnimal,
  restoreAnimal,
  listDeletedAnimals,
  listCategories,
  createCategory,
  updateCategory,
  softDeleteCategory,
  restoreCategory,
  listDeletedCategories,
  listAdoptionRequests,
  updateAdoptionRequest,
  softDeleteAdoptionRequest,
  restoreAdoptionRequest,
  listDeletedAdoptionRequests,
  listQuestionnaireQuestions,
  createQuestionnaireQuestion,
  updateQuestionnaireQuestion,
  softDeleteQuestionnaireQuestion,
  listDeletedQuestionnaireQuestions,
  restoreQuestionnaireQuestion,
  getSettings,
  updateSettings,
  getProfile,
  updateProfile,
  listActivityLogs,
  createActivityLog,
  getReportsData,
  exportDatabaseBackup,
  importDatabaseBackup,
}
