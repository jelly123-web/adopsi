const crypto = require("crypto")
const { getPool } = require("../config/database")

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
const validRoles = ["costumer", "superadmin", "admin", "petugas"]

function normalizeRole(role = "costumer") {
  if (role === "customer" || role === "user") return "costumer"
  return validRoles.includes(role) ? role : "costumer"
}

function hashPassword(password) {
  return `sha256:${crypto.createHash("sha256").update(String(password)).digest("hex")}`
}

function verifyPassword(password, storedPassword) {
  if (!storedPassword) return false
  if (storedPassword.startsWith("sha256:")) {
    return hashPassword(password) === storedPassword
  }
  return String(password) === storedPassword
}

async function getDashboardData(role = "") {
  const pool = await getPool()
  const normalizedRole = role ? normalizeRole(role) : ""
  const activityRoleClause = normalizedRole ? "AND user_role = $1" : ""
  const activityParams = normalizedRole ? [normalizedRole] : []
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
    SELECT title, description, user_role, created_at AS time
    FROM activities
    WHERE deleted = FALSE ${activityRoleClause}
    ORDER BY created_at DESC, id DESC
    LIMIT 4
  `, activityParams)

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
      role: row.user_role,
      time: row.time,
    })),
  }
}

async function listUsers(page = 1, limit = 6, role = "") {
  const pool = await getPool()
  const offset = (page - 1) * limit
  const normalizedRole = role ? normalizeRole(role) : ""
  const roleClause = normalizedRole ? "AND role = $3" : ""
  const params = normalizedRole ? [limit, offset, normalizedRole] : [limit, offset]
  const countParams = normalizedRole ? [normalizedRole] : []
  
  const { rows: data } = await pool.query(`
    SELECT id, name, email, role, status, profile_photo, created_at
    FROM users
    WHERE deleted = FALSE ${roleClause}
    ORDER BY id ASC
    LIMIT $1 OFFSET $2
  `, params)

  const { rows: [{ count }] } = await pool.query(`
    SELECT COUNT(*) as count
    FROM users
    WHERE deleted = FALSE ${normalizedRole ? "AND role = $1" : ""}
  `, countParams)

  return {
    data,
    total: parseInt(count),
    page,
    limit,
    pages: Math.ceil(parseInt(count) / limit)
  }
}

async function createUser(input) {
  const pool = await getPool()
  const { name, email, password = "", status } = input
  const role = normalizeRole(input.role)
  const passwordValue = password ? hashPassword(password) : null
  const result = await pool.query(
    `
      INSERT INTO users (name, email, password, role, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `,
    [name, email, passwordValue, role, status],
  )

  return result.rows[0].id
}

async function updateUser(id, input) {
  const pool = await getPool()
  const { name, email, password = "", status } = input
  const role = normalizeRole(input.role)
  const values = [name, email, role, status, id]
  let passwordSql = ""

  if (password) {
    values.push(hashPassword(password))
    passwordSql = `, password = $${values.length}`
  }

  const result = await pool.query(
    `
      UPDATE users
      SET name = $1, email = $2, role = $3, status = $4${passwordSql}
      WHERE id = $5 AND deleted = FALSE
    `,
    values,
  )

  return result.rowCount
}

async function registerUser(input) {
  const pool = await getPool()
  const { name, email, password } = input
  const role = normalizeRole(input.role)

  const result = await pool.query(
    `
      INSERT INTO users (name, email, password, role, status)
      VALUES ($1, $2, $3, $4, 'aktif')
      RETURNING id, name, email, role, status, profile_photo, created_at
    `,
    [name, email, hashPassword(password), role],
  )

  return result.rows[0]
}

async function loginUser({ email, password, role }) {
  const pool = await getPool()
  const { rows: [user] } = await pool.query(
    `
      SELECT id, name, email, password, role, status, profile_photo, profile_bg_photo
      FROM users
      WHERE email = $1 AND deleted = FALSE
      LIMIT 1
    `,
    [email],
  )

  if (!user || user.status !== "aktif" || !verifyPassword(password, user.password)) {
    return null
  }

  if (role && normalizeRole(user.role) !== normalizeRole(role)) {
    return null
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: normalizeRole(user.role),
    status: user.status,
    profile_photo: user.profile_photo || "",
  }
}

async function loginOrRegisterGoogleUser({ email, name = "" }) {
  const pool = await getPool()
  const normalizedEmail = String(email || "").trim().toLowerCase()
  const displayName = String(name || "").trim() || normalizedEmail.split("@")[0] || "Customer"

  if (!normalizedEmail) {
    throw new Error("Email Google wajib diisi.")
  }

  const { rows: [existingUser] } = await pool.query(
    `
      SELECT id, name, email, role, status, profile_photo
      FROM users
      WHERE LOWER(email) = $1 AND deleted = FALSE
      LIMIT 1
    `,
    [normalizedEmail],
  )

  if (existingUser) {
    if (existingUser.status !== "aktif") return null
    return {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      role: normalizeRole(existingUser.role),
      status: existingUser.status,
      profile_photo: existingUser.profile_photo || "",
    }
  }

  const { rows: [createdUser] } = await pool.query(
    `
      INSERT INTO users (name, email, password, role, status)
      VALUES ($1, $2, NULL, 'costumer', 'aktif')
      RETURNING id, name, email, role, status, profile_photo
    `,
    [displayName, normalizedEmail],
  )

  return {
    id: createdUser.id,
    name: createdUser.name,
    email: createdUser.email,
    role: normalizeRole(createdUser.role),
    status: createdUser.status,
    profile_photo: createdUser.profile_photo || "",
  }
}

async function requestPasswordReset(email) {
  const pool = await getPool()
  const normalizedEmail = String(email || "").trim().toLowerCase()
  const token = crypto.randomBytes(24).toString("hex")
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  const { rows: [user] } = await pool.query(
    `
      UPDATE users
      SET reset_password_token = $1,
          reset_password_expires_at = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE LOWER(email) = $3 AND deleted = FALSE AND status = 'aktif'
      RETURNING id, name, email, role
    `,
    [token, expiresAt, normalizedEmail],
  )

  if (!user) return null

  return {
    user,
    token,
    expires_at: expiresAt,
  }
}

async function resetPasswordByToken({ token, password }) {
  const pool = await getPool()
  const { rows: [user] } = await pool.query(
    `
      UPDATE users
      SET password = $1,
          reset_password_token = NULL,
          reset_password_expires_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE reset_password_token = $2
        AND reset_password_expires_at > CURRENT_TIMESTAMP
        AND deleted = FALSE
        AND status = 'aktif'
      RETURNING id, name, email, role, status, profile_photo
    `,
    [hashPassword(password), token],
  )

  if (!user) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: normalizeRole(user.role),
    status: user.status,
    profile_photo: user.profile_photo || "",
  }
}

async function softDeleteUser(id, { deletedBy, deletedIp }) {
  const pool = await getPool()
  const result = await pool.query(`
    UPDATE users
    SET deleted = TRUE,
        deleted_by = $1,
        deleted_at = CURRENT_TIMESTAMP,
        deleted_ip = $2
    WHERE id = $3 AND deleted = FALSE AND role != 'superadmin'
  `, [deletedBy, deletedIp, id])
  return result.rowCount
}

async function softDeleteUsersByRole(role, { deletedBy, deletedIp }) {
  const pool = await getPool()
  const normalizedRole = normalizeRole(role)
  const result = await pool.query(`
    UPDATE users
    SET deleted = TRUE,
        deleted_by = $1,
        deleted_at = CURRENT_TIMESTAMP,
        deleted_ip = $2
    WHERE deleted = FALSE AND role = $3 AND role != 'superadmin'
  `, [deletedBy, deletedIp, normalizedRole])
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

async function deleteUserPermanently(id) {
  const pool = await getPool()
  const result = await pool.query(
    `DELETE FROM users WHERE id = $1 AND deleted = TRUE AND role != 'superadmin'`,
    [id]
  )
  return result.rowCount
}

async function deleteAllDeletedUsers() {
  const pool = await getPool()
  const result = await pool.query(`DELETE FROM users WHERE deleted = TRUE AND role != 'superadmin'`)
  return result.rowCount
}

async function findDeletedUserById(id) {
  const pool = await getPool()
  const { rows: [row] } = await pool.query(
    "SELECT id, role FROM users WHERE id = $1 AND deleted = TRUE LIMIT 1",
    [id],
  )

  return row || null
}

async function countDeletedSuperadmins() {
  const pool = await getPool()
  const { rows: [row] } = await pool.query(
    "SELECT COUNT(*) AS count FROM users WHERE deleted = TRUE AND role = 'superadmin'"
  )

  return Number(row?.count || 0)
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

async function listAnimals(page = 1, limit = 10, search = '', species = '') {
  const pool = await getPool()
  const offset = (page - 1) * limit
  const searchParam = search ? `%${search}%` : '%'
  const speciesClause = species ? `AND species = $4` : ''

  const params = species ? [limit, offset, searchParam, species] : [limit, offset, searchParam]

  const { rows: data } = await pool.query(
    `
      SELECT id, name, species, gender, age, activity_preference, status, condition, photo, created_at
      FROM animals
      WHERE deleted = FALSE AND (name ILIKE $3 OR species ILIKE $3 OR activity_preference ILIKE $3 OR condition ILIKE $3)
      ${speciesClause}
      ORDER BY id ASC
      LIMIT $1 OFFSET $2
    `,
    params
  )

  const countParams = species ? [searchParam, species] : [searchParam]
  const countQuery = species
    ? `SELECT COUNT(*) as count FROM animals WHERE deleted = FALSE AND (name ILIKE $1 OR species ILIKE $1 OR activity_preference ILIKE $1 OR condition ILIKE $1) AND species = $2`
    : `SELECT COUNT(*) as count FROM animals WHERE deleted = FALSE AND (name ILIKE $1 OR species ILIKE $1 OR activity_preference ILIKE $1 OR condition ILIKE $1)`

  const { rows: [{ count }] } = await pool.query(countQuery, countParams)

  return {
    data,
    total: parseInt(count),
    page,
    limit,
    pages: Math.ceil(parseInt(count) / limit)
  }
}

async function softDeleteAllAnimals({ deletedBy, deletedIp }) {
  const pool = await getPool()
  const result = await pool.query(`
    UPDATE animals
    SET deleted = TRUE,
        deleted_by = $1,
        deleted_at = CURRENT_TIMESTAMP,
        deleted_ip = $2
    WHERE deleted = FALSE
  `, [deletedBy, deletedIp])
  return result.rowCount
}

async function createAnimal(input) {
  const pool = await getPool()
  const { name, species, gender, age, activity_preference, status, condition, photo } = input
  const result = await pool.query(
    `
      INSERT INTO animals (name, species, gender, age, activity_preference, status, condition, photo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `,
    [name, species, gender, age, activity_preference, status, condition, photo],
  )

  return result.rows[0].id
}

async function updateAnimal(id, input) {
  const pool = await getPool()
  const { name, species, gender, age, activity_preference, status, condition, photo } = input
  const result = await pool.query(
    `
      UPDATE animals
      SET name = $1, species = $2, gender = $3, age = $4, activity_preference = $5, status = $6, condition = $7, photo = $8
      WHERE id = $9 AND deleted = FALSE
    `,
    [name, species, gender, age, activity_preference, status, condition, photo, id],
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

async function deleteAnimalPermanently(id) {
  const pool = await getPool()
  const result = await pool.query(
    `DELETE FROM animals WHERE id = $1 AND deleted = TRUE`,
    [id]
  )
  return result.rowCount
}

async function deleteAllDeletedAnimals() {
  const pool = await getPool()
  const result = await pool.query(`DELETE FROM animals WHERE deleted = TRUE`)
  return result.rowCount
}

async function listDeletedAnimals() {
  const pool = await getPool()
  const { rows } = await pool.query(`
    SELECT id, name, species, gender, age, activity_preference, status, photo, deleted, deleted_by, deleted_at, deleted_ip
    FROM animals
    WHERE deleted = TRUE
    ORDER BY deleted_at DESC
  `)
  return rows
}

async function listCategories(page = 1, limit = 6, search = '') {
  const pool = await getPool()
  const offset = (page - 1) * limit
  const searchParam = search ? `%${search}%` : '%'
  
  const { rows: data } = await pool.query(`
    SELECT id, name, created_at
    FROM categories
    WHERE deleted = FALSE AND name ILIKE $1
    ORDER BY id ASC
    LIMIT $2 OFFSET $3
  `, [searchParam, limit, offset])

  const { rows: [{ count }] } = await pool.query(`
    SELECT COUNT(*) as count
    FROM categories
    WHERE deleted = FALSE AND name ILIKE $1
  `, [searchParam])

  return {
    data,
    total: parseInt(count),
    page,
    limit,
    pages: Math.ceil(parseInt(count) / limit)
  }
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

async function deleteCategoryPermanently(id) {
  const pool = await getPool()
  const result = await pool.query(
    `DELETE FROM categories WHERE id = $1 AND deleted = TRUE`,
    [id]
  )
  return result.rowCount
}

async function deleteAllDeletedCategories() {
  const pool = await getPool()
  const result = await pool.query(`DELETE FROM categories WHERE deleted = TRUE`)
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
      ar.user_id,
      ar.animal_id,
      u.name AS user_name,
      u.email AS user_email,
      u.profile_photo AS user_profile_photo,
      a.name AS animal_name,
      a.species AS animal_species,
      a.photo AS animal_photo,
      ar.full_name,
      ar.phone,
      ar.address,
      ar.job,
      ar.family_count,
      ar.housing_type,
      ar.pet_experience,
      ar.reason,
      ar.document_url,
      ar.rejection_reason,
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

async function createAdoptionRequest(input) {
  const pool = await getPool()
  const {
    user_id,
    animal_id,
    full_name = "",
    phone = "",
    address = "",
    job = "",
    family_count = "",
    housing_type = "",
    pet_experience = "",
    reason = "",
    document_url = "",
  } = input

  const { rows: [existing] } = await pool.query(
    `
      SELECT id
      FROM adoption_requests
      WHERE user_id = $1
        AND animal_id = $2
        AND deleted = FALSE
        AND status IN ('pending', 'disetujui')
      LIMIT 1
    `,
    [user_id, animal_id],
  )

  if (existing) {
    const duplicateError = new Error("Kamu sudah punya pengajuan aktif untuk hewan ini.")
    duplicateError.code = "DUPLICATE_ADOPTION_REQUEST"
    throw duplicateError
  }

  const result = await pool.query(
    `
      INSERT INTO adoption_requests (
        user_id,
        animal_id,
        full_name,
        phone,
        address,
        job,
        family_count,
        housing_type,
        pet_experience,
        reason,
        document_url,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
      RETURNING id
    `,
    [user_id, animal_id, full_name, phone, address, job, family_count, housing_type, pet_experience, reason, document_url],
  )

  return result.rows[0].id
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

async function softDeleteAllAdoptionRequests({ deletedBy, deletedIp }) {
  const pool = await getPool()
  const result = await pool.query(`
    UPDATE adoption_requests
    SET deleted = TRUE,
        deleted_by = $1,
        deleted_at = CURRENT_TIMESTAMP,
        deleted_ip = $2
    WHERE deleted = FALSE
  `, [deletedBy, deletedIp])
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

async function deleteAdoptionRequestPermanently(id) {
  const pool = await getPool()
  const result = await pool.query(
    `DELETE FROM adoption_requests WHERE id = $1 AND deleted = TRUE`,
    [id]
  )
  return result.rowCount
}

async function deleteAllDeletedAdoptionRequests() {
  const pool = await getPool()
  const result = await pool.query(`DELETE FROM adoption_requests WHERE deleted = TRUE`)
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

  const isPasswordChange = Boolean(new_password || confirm_password)

  if (isPasswordChange) {
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

    if (isPasswordChange && superadminPassword) {
      if (!current_password || !verifyPassword(current_password, superadminPassword)) {
        throw new Error('Password saat ini tidak sesuai.')
      }
    }

    const nextPassword = isPasswordChange ? hashPassword(new_password) : superadminPassword

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

function parseProfileUserId(userId) {
  const id = Number(userId)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("ID akun tidak valid.")
  }
  return id
}

async function getAccountProfile(userId) {
  const id = parseProfileUserId(userId)
  const pool = await getPool()
  const { rows: [user] } = await pool.query(
    `
      SELECT id, name, email, password, role, status, profile_photo
      FROM users
      WHERE id = $1 AND deleted = FALSE
      LIMIT 1
    `,
    [id],
  )

  if (!user) {
    throw new Error("Akun tidak ditemukan.")
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: normalizeRole(user.role),
    status: user.status,
    profile_photo: user.profile_photo || "",
    profile_bg_photo: user.profile_bg_photo || "",
    admin_name: user.name,
    admin_email: user.email,
    admin_avatar: user.profile_photo || "",
    admin_background: user.profile_bg_photo || "",
    password_set: Boolean(user.password),
  }
}

async function updateAccountProfile(userId, input = {}) {
  const id = parseProfileUserId(userId)
  const pool = await getPool()
  const name = String(input.admin_name || input.name || "").trim()
  const email = String(input.admin_email || input.email || "").trim()
  const photo = input.admin_avatar ?? input.profile_photo ?? ""
  const background = input.admin_background ?? input.profile_bg_photo ?? input.profile_background ?? ""
  const currentPassword = input.current_password || ""
  const newPassword = input.new_password || ""
  const confirmPassword = input.confirm_password || ""

  if (!name || !email) {
    throw new Error("Nama dan email akun wajib diisi.")
  }

  const isPasswordChange = Boolean(newPassword || confirmPassword)
  if (isPasswordChange && newPassword !== confirmPassword) {
    throw new Error("Konfirmasi password tidak cocok.")
  }

  await pool.query("BEGIN")

  try {
    const { rows: [user] } = await pool.query(
      `
        SELECT id, password, role
        FROM users
        WHERE id = $1 AND deleted = FALSE
        LIMIT 1
        FOR UPDATE
      `,
      [id],
    )

    if (!user) {
      throw new Error("Akun tidak ditemukan.")
    }

    if (isPasswordChange && user.password) {
      if (!currentPassword || !verifyPassword(currentPassword, user.password)) {
        throw new Error("Password saat ini tidak sesuai.")
      }
    }

    const nextPassword = isPasswordChange ? hashPassword(newPassword) : user.password
    const { rows: [updated] } = await pool.query(
      `
        UPDATE users
        SET name = $1,
            email = $2,
            profile_photo = $3,
            profile_bg_photo = $4,
            password = $5,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6 AND deleted = FALSE
        RETURNING id, name, email, role, status, profile_photo, profile_bg_photo, password
      `,
      [name, email, photo || null, background || null, nextPassword, id],
    )

    if (normalizeRole(updated.role) === "superadmin") {
      const profileSettings = [
        ["admin_name", name],
        ["admin_email", email],
        ["admin_avatar", photo || ""],
        ["admin_background", background || ""],
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
    }

    await pool.query("COMMIT")

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: normalizeRole(updated.role),
      status: updated.status,
      profile_photo: updated.profile_photo || "",
      profile_bg_photo: updated.profile_bg_photo || "",
      admin_name: updated.name,
      admin_email: updated.email,
      admin_avatar: updated.profile_photo || "",
      admin_background: updated.profile_bg_photo || "",
      password_set: Boolean(updated.password),
    }
  } catch (error) {
    await pool.query("ROLLBACK")
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

async function deleteAllActivityLogs() {
  const pool = await getPool()
  const result = await pool.query("DELETE FROM activities")
  return result.rowCount
}

async function getReportsData() {
  const pool = await getPool()

  const { rows: [summary] } = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE deleted = FALSE) AS total_user,
      (SELECT COUNT(*) FROM animals WHERE deleted = FALSE) AS total_hewan,
      (SELECT COUNT(*) FROM adoption_requests WHERE deleted = FALSE) AS total_pengajuan,
      (SELECT COUNT(*) FROM adoption_requests WHERE status = 'disetujui' AND deleted = FALSE) AS adopsi_berhasil,
      (SELECT COUNT(*) FROM animals WHERE status = 'tersedia' AND deleted = FALSE) AS hewan_tersedia,
      (SELECT COUNT(*) FROM animals WHERE status = 'diadopsi' AND deleted = FALSE) AS hewan_diadopsi,
      (SELECT COUNT(*) FROM animals WHERE status = 'perawatan' AND deleted = FALSE) AS hewan_perawatan
  `)

  const { rows: monthlyRows } = await pool.query(`
    SELECT EXTRACT(MONTH FROM created_at) AS month_number, COUNT(*) AS total
    FROM adoption_requests
    WHERE status = 'disetujui'
      AND deleted = FALSE
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
    GROUP BY EXTRACT(MONTH FROM created_at)
    ORDER BY EXTRACT(MONTH FROM created_at)
  `)

  const { rows: yearlyRows } = await pool.query(`
    SELECT EXTRACT(YEAR FROM created_at) AS year_number, COUNT(*) AS total
    FROM adoption_requests
    WHERE status = 'disetujui'
      AND deleted = FALSE
      AND EXTRACT(YEAR FROM created_at) >= EXTRACT(YEAR FROM CURRENT_DATE) - 4
    GROUP BY EXTRACT(YEAR FROM created_at)
    ORDER BY EXTRACT(YEAR FROM created_at)
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
  registerUser,
  loginUser,
  loginOrRegisterGoogleUser,
  requestPasswordReset,
  resetPasswordByToken,
  listUsers,
  createUser,
  updateUser,
  softDeleteUser,
  softDeleteUsersByRole,
  restoreUser,
  deleteUserPermanently,
  deleteAllDeletedUsers,
  findUserById,
  listDeletedUsers,
  deleteUserPermanently,
  deleteAllDeletedUsers,
  findDeletedUserById,
  countDeletedSuperadmins,
  listAnimals,
  createAnimal,
  updateAnimal,
  softDeleteAnimal,
  softDeleteAllAnimals,
  restoreAnimal,
  deleteAnimalPermanently,
  deleteAllDeletedAnimals,
  listDeletedAnimals,
  listCategories,
  createCategory,
  updateCategory,
  softDeleteCategory,
  restoreCategory,
  deleteCategoryPermanently,
  deleteAllDeletedCategories,
  listDeletedCategories,
  listAdoptionRequests,
  createAdoptionRequest,
  updateAdoptionRequest,
  softDeleteAdoptionRequest,
  softDeleteAllAdoptionRequests,
  restoreAdoptionRequest,
  deleteAdoptionRequestPermanently,
  deleteAllDeletedAdoptionRequests,
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
  getAccountProfile,
  updateAccountProfile,
  listActivityLogs,
  createActivityLog,
  deleteAllActivityLogs,
  getReportsData,
  exportDatabaseBackup,
  importDatabaseBackup,
  async getChatMessages(userId = null) {
    const pool = await getPool()
    let query = "SELECT * FROM chat_messages ORDER BY created_at ASC"
    let params = []
    if (userId) {
      query = "SELECT * FROM chat_messages WHERE user_id = $1 ORDER BY created_at ASC"
      params = [userId]
    }
    const { rows } = await pool.query(query, params)
    return rows
  },
  async createChatMessage({ msgId, userId, sender, senderName, targetRole, text, topic }) {
    const pool = await getPool()
    const { rows } = await pool.query(
      `INSERT INTO chat_messages (msg_id, user_id, sender, sender_name, target_role, text, topic)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [msgId, userId, sender, senderName, targetRole, text, topic]
    )
    return rows[0]
  },
  async deleteChatMessage(msgId) {
    const pool = await getPool()
    const result = await pool.query(
      `DELETE FROM chat_messages WHERE msg_id = $1`,
      [msgId]
    )
    return result.rowCount
  },
}
