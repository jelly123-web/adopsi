const superadminModel = require("../models/superadminModel")

const authRoles = ["costumer", "superadmin", "admin", "petugas"]

function normalizeRole(role = "costumer") {
  if (role === "customer" || role === "user") return "costumer"
  return authRoles.includes(role) ? role : "costumer"
}

async function register(req, res, next) {
  try {
    const { name, email, password, role = "costumer" } = req.body || {}

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Nama, email, dan password wajib diisi.",
      })
    }

    const user = await superadminModel.registerUser({
      name,
      email,
      password,
      role: normalizeRole(role),
    })

    res.status(201).json({
      success: true,
      message: "Akun berhasil dibuat.",
      data: user,
    })
  } catch (error) {
    next(error)
  }
}

async function login(req, res, next) {
  try {
    const { email, password, role } = req.body || {}

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email dan password wajib diisi.",
      })
    }

    const user = await superadminModel.loginUser({
      email,
      password,
      role: role ? normalizeRole(role) : undefined,
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email atau password tidak sesuai.",
      })
    }

    res.json({
      success: true,
      message: "Login berhasil.",
      data: user,
    })
  } catch (error) {
    next(error)
  }
}

async function googleLogin(req, res, next) {
  try {
    const { email, name } = req.body || {}

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email Google wajib diisi.",
      })
    }

    const user = await superadminModel.loginOrRegisterGoogleUser({ email, name })
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Akun Google tidak aktif.",
      })
    }

    res.json({
      success: true,
      message: "Login Google berhasil.",
      data: user,
    })
  } catch (error) {
    next(error)
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body || {}

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email wajib diisi.",
      })
    }

    const reset = await superadminModel.requestPasswordReset(email)
    const resetUrl = reset
      ? `${req.protocol}://${req.get("host").replace(":3000", ":5173")}/login?reset_token=${reset.token}#panel`
      : null

    if (resetUrl) {
      console.log(`[PASSWORD RESET] ${email}: ${resetUrl}`)
    }

    res.json({
      success: true,
      message: "Jika email terdaftar, link reset password sudah dibuat dan dikirim ke email.",
      data: resetUrl ? { reset_url: resetUrl, expires_at: reset.expires_at } : null,
    })
  } catch (error) {
    next(error)
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body || {}

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token dan password baru wajib diisi.",
      })
    }

    const user = await superadminModel.resetPasswordByToken({ token, password })
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token reset password tidak valid atau sudah kedaluwarsa.",
      })
    }

    res.json({
      success: true,
      message: "Password berhasil diganti. Silakan login.",
      data: user,
    })
  } catch (error) {
    next(error)
  }
}

async function getDashboard(req, res, next) {
  try {
    const role = req.query.role ? normalizeRole(req.query.role) : ''
    const data = await superadminModel.getDashboardData(role)
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

async function getUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.max(1, parseInt(req.query.limit) || 6)
    const role = req.query.role ? normalizeRole(req.query.role) : ''
    const result = await superadminModel.listUsers(page, limit, role)
    res.json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
}

async function createUser(req, res, next) {
  try {
    const { name, email, password = "", role = "costumer", status = "aktif" } = req.body || {}

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Nama dan email wajib diisi.",
      })
    }

    const id = await superadminModel.createUser({ name, email, password, role: normalizeRole(role), status })
    res.status(201).json({ success: true, message: "User berhasil dibuat.", data: { id } })
  } catch (error) {
    next(error)
  }
}

async function updateUser(req, res, next) {
  try {
    const id = Number(req.params.id)
    const { name, email, password = "", role = "costumer", status = "aktif" } = req.body || {}

    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID user tidak valid." })
    }

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Nama dan email wajib diisi.",
      })
    }

    const affectedRows = await superadminModel.updateUser(id, { name, email, password, role: normalizeRole(role), status })
    if (!affectedRows) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan." })
    }

    res.json({ success: true, message: "User berhasil diperbarui." })
  } catch (error) {
    next(error)
  }
}

async function deleteUser(req, res, next) {
  try {
    const id = Number(req.params.id)

    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID user tidak valid." })
    }

    const existingUser = await superadminModel.findUserById(id)
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan." })
    }

    if (existingUser.role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Akun superadmin tidak bisa dihapus.",
      })
    }

    const deletedBy = "Super Admin"
    const deletedIp = req.ip || req.connection.remoteAddress || "unknown"
    
    const affectedRows = await superadminModel.softDeleteUser(id, { deletedBy, deletedIp })
    if (!affectedRows) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan atau sudah dihapus." })
    }
    
    res.json({ success: true, message: "User berhasil dihapus." })
  } catch (error) {
    next(error)
  }
}

async function deleteAllCustomers(req, res, next) {
  try {
    const deletedBy = "Super Admin"
    const deletedIp = req.ip || req.connection.remoteAddress || "unknown"
    const affectedRows = await superadminModel.softDeleteUsersByRole("costumer", { deletedBy, deletedIp })

    res.json({
      success: true,
      message: affectedRows ? "Semua data customer berhasil dihapus." : "Tidak ada data customer untuk dihapus.",
      deleted: affectedRows,
    })
  } catch (error) {
    next(error)
  }
}

async function getDeletedUsers(req, res, next) {
  try {
    const users = await superadminModel.listDeletedUsers()
    res.json({ success: true, data: users })
  } catch (error) {
    next(error)
  }
}

async function restoreUser(req, res, next) {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID user tidak valid." })
    }
    const affectedRows = await superadminModel.restoreUser(id)
    if (!affectedRows) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan atau tidak dihapus." })
    }
    res.json({ success: true, message: "User berhasil dipulihkan." })
  } catch (error) {
    next(error)
  }
}

async function deleteUserPermanently(req, res, next) {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID user tidak valid." })
    }

    const existingUser = await superadminModel.findDeletedUserById(id)
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan atau tidak dihapus." })
    }

    if (existingUser.role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Akun superadmin tidak bisa dihapus permanen.",
      })
    }

    const affectedRows = await superadminModel.deleteUserPermanently(id)
    if (!affectedRows) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan atau tidak dihapus." })
    }
    res.json({ success: true, message: "User berhasil dihapus permanen." })
  } catch (error) {
    next(error)
  }
}

async function deleteAllDeletedUsers(req, res, next) {
  try {
    const deletedSuperadmins = await superadminModel.countDeletedSuperadmins()
    const affectedRows = await superadminModel.deleteAllDeletedUsers()
    const superadminNotice = deletedSuperadmins > 0 ? " Akun superadmin tidak dihapus permanen." : ""
    res.json({ success: true, message: `${affectedRows} user berhasil dihapus permanen.${superadminNotice}` })
  } catch (error) {
    next(error)
  }
}

async function getAnimals(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.max(1, parseInt(req.query.limit) || 10)
    const search = req.query.search || ''
    const species = req.query.species || ''
    const result = await superadminModel.listAnimals(page, limit, search, species)
    res.json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
}

async function createAnimal(req, res, next) {
  try {
    const { name, species, gender, age, activity_preference = "Suka di rumah", status = "tersedia", condition = "Sehat", photo = null } = req.body || {}
    const parsedAge = Number(age)

    if (!name || !species || !gender || Number.isNaN(parsedAge)) {
      return res.status(400).json({
        success: false,
        message: "Nama, jenis, gender, dan umur wajib diisi.",
      })
    }

    const id = await superadminModel.createAnimal({
      name,
      species,
      gender,
      age: parsedAge,
      activity_preference,
      status,
      condition,
      photo,
    })

    res.status(201).json({ success: true, message: "Hewan berhasil dibuat.", data: { id } })
  } catch (error) {
    next(error)
  }
}

async function uploadPhoto(req, res, next) {
  try {
    const { image } = req.body || {}

    if (!image || typeof image !== "string") {
      return res.status(400).json({
        success: false,
        message: "Data gambar wajib diisi.",
      })
    }

    res.status(201).json({
      success: true,
      message: "Foto siap disimpan ke database.",
      url: image,
    })
  } catch (error) {
    next(error)
  }
}

async function updateAnimal(req, res, next) {
  try {
    const id = Number(req.params.id)
    const { name, species, gender, age, activity_preference = "Suka di rumah", status = "tersedia", condition = "Sehat", photo = null } = req.body || {}
    const parsedAge = Number(age)

    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID hewan tidak valid." })
    }

    if (!name || !species || !gender || Number.isNaN(parsedAge)) {
      return res.status(400).json({
        success: false,
        message: "Nama, jenis, gender, dan umur wajib diisi.",
      })
    }

    const affectedRows = await superadminModel.updateAnimal(id, {
      name,
      species,
      gender,
      age: parsedAge,
      activity_preference,
      status,
      condition,
      photo,
    })
    if (!affectedRows) {
      return res.status(404).json({ success: false, message: "Hewan tidak ditemukan." })
    }

    res.json({ success: true, message: "Hewan berhasil diperbarui." })
  } catch (error) {
    next(error)
  }
}

async function deleteAnimal(req, res, next) {
  try {
    const id = Number(req.params.id)

    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID hewan tidak valid." })
    }

    const deletedBy = "Super Admin"
    const deletedIp = req.ip || req.connection.remoteAddress || "unknown"
    const affectedRows = await superadminModel.softDeleteAnimal(id, { deletedBy, deletedIp })
    
    if (!affectedRows) {
      return res.status(404).json({ success: false, message: "Hewan tidak ditemukan atau sudah dihapus." })
    }

    res.json({ success: true, message: "Hewan berhasil dihapus." })
  } catch (error) {
    next(error)
  }
}

async function deleteAllAnimals(req, res, next) {
  try {
    const deletedBy = 'Super Admin'
    const deletedIp = req.ip || req.connection.remoteAddress || 'unknown'
    const affected = await superadminModel.softDeleteAllAnimals({ deletedBy, deletedIp })
    res.json({ success: true, message: `${affected} hewan berhasil dihapus.` })
  } catch (error) {
    next(error)
  }
}

async function getDeletedAnimals(req, res, next) {
  try {
    const animals = await superadminModel.listDeletedAnimals()
    res.json({ success: true, data: animals })
  } catch (error) {
    next(error)
  }
}

async function restoreAnimal(req, res, next) {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID hewan tidak valid." })
    }
    const affectedRows = await superadminModel.restoreAnimal(id)
    if (!affectedRows) {
      return res.status(404).json({ success: false, message: "Hewan tidak ditemukan atau tidak dihapus." })
    }
    res.json({ success: true, message: "Hewan berhasil dipulihkan." })
  } catch (error) {
    next(error)
  }
}

async function deleteAnimalPermanently(req, res, next) {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID hewan tidak valid." })
    }
    const affectedRows = await superadminModel.deleteAnimalPermanently(id)
    if (!affectedRows) {
      return res.status(404).json({ success: false, message: "Hewan tidak ditemukan atau tidak dihapus." })
    }
    res.json({ success: true, message: "Hewan berhasil dihapus permanen." })
  } catch (error) {
    next(error)
  }
}

async function deleteAllDeletedAnimals(req, res, next) {
  try {
    const affectedRows = await superadminModel.deleteAllDeletedAnimals()
    res.json({ success: true, message: `${affectedRows} hewan yang dihapus permanen berhasil dihapus.` })
  } catch (error) {
    next(error)
  }
}

// Category handlers
async function getCategories(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.max(1, parseInt(req.query.limit) || 6)
    const search = req.query.search || ''
    const result = await superadminModel.listCategories(page, limit, search)
    res.json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
}

async function createCategory(req, res, next) {
  try {
    const { name } = req.body || {}

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Nama kategori wajib diisi.",
      })
    }

    const id = await superadminModel.createCategory({ name })
    res.status(201).json({ success: true, message: "Kategori berhasil dibuat.", data: { id } })
  } catch (error) {
    next(error)
  }
}

async function updateCategory(req, res, next) {
  try {
    const id = Number(req.params.id)
    const { name } = req.body || {}

    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID kategori tidak valid." })
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Nama kategori wajib diisi.",
      })
    }

    const affectedRows = await superadminModel.updateCategory(id, { name })
    if (!affectedRows) {
      return res.status(404).json({ success: false, message: "Kategori tidak ditemukan." })
    }

    res.json({ success: true, message: "Kategori berhasil diperbarui." })
  } catch (error) {
    next(error)
  }
}

async function deleteCategory(req, res, next) {
  try {
    const id = Number(req.params.id)

    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID kategori tidak valid." })
    }

    const deletedBy = "Super Admin"
    const deletedIp = req.ip || req.connection.remoteAddress || "unknown"
    const affectedRows = await superadminModel.softDeleteCategory(id, { deletedBy, deletedIp })

    if (!affectedRows) {
      return res.status(404).json({ success: false, message: "Kategori tidak ditemukan atau sudah dihapus." })
    }

    res.json({ success: true, message: "Kategori berhasil dihapus." })
  } catch (error) {
    next(error)
  }
}

async function getDeletedCategories(req, res, next) {
  try {
    const categories = await superadminModel.listDeletedCategories()
    res.json({ success: true, data: categories })
  } catch (error) {
    next(error)
  }
}

async function restoreCategory(req, res, next) {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID kategori tidak valid." })
    }
    const affectedRows = await superadminModel.restoreCategory(id)
    if (!affectedRows) {
      return res.status(404).json({ success: false, message: "Kategori tidak ditemukan atau tidak dihapus." })
    }
    res.json({ success: true, message: "Kategori berhasil dipulihkan." })
  } catch (error) {
    next(error)
  }
}

async function deleteCategoryPermanently(req, res, next) {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID kategori tidak valid." })
    }
    const affectedRows = await superadminModel.deleteCategoryPermanently(id)
    if (!affectedRows) {
      return res.status(404).json({ success: false, message: "Kategori tidak ditemukan atau tidak dihapus." })
    }
    res.json({ success: true, message: "Kategori berhasil dihapus permanen." })
  } catch (error) {
    next(error)
  }
}

async function deleteAllDeletedCategories(req, res, next) {
  try {
    const affectedRows = await superadminModel.deleteAllDeletedCategories()
    res.json({ success: true, message: `${affectedRows} kategori terhapus permanen.` })
  } catch (error) {
    next(error)
  }
}

async function getAdoptionRequests(req, res, next) {
  try {
    const requests = await superadminModel.listAdoptionRequests()
    res.json({ success: true, data: requests })
  } catch (error) {
    next(error)
  }
}

async function createAdoptionRequest(req, res, next) {
  try {
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
    } = req.body || {}

    if (!user_id || !animal_id || !full_name || !phone || !address || !reason) {
      return res.status(400).json({
        success: false,
        message: "Nama lengkap, telepon, alamat, alasan, dan hewan wajib diisi.",
      })
    }

    const id = await superadminModel.createAdoptionRequest({
      user_id: Number(user_id),
      animal_id: Number(animal_id),
      full_name,
      phone,
      address,
      job,
      family_count,
      housing_type,
      pet_experience,
      reason,
      document_url,
    })

    res.status(201).json({
      success: true,
      message: "Pengajuan adopsi berhasil dikirim.",
      data: { id },
    })
  } catch (error) {
    if (error.code === "DUPLICATE_ADOPTION_REQUEST") {
      return res.status(409).json({ success: false, message: error.message })
    }
    next(error)
  }
}

async function updateAdoptionRequest(req, res, next) {
  try {
    const id = Number(req.params.id)
    const body = req.body || {}

    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID pengajuan tidak valid." })
    }

    const payload = {}
    if (typeof body.status === "string" && body.status.trim()) {
      payload.status = body.status.trim()
    }

    ;["pickup_date", "pickup_status", "pickup_notified_at", "pickup_updated_at"].forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        payload[key] = body[key] || null
      }
    })

    if (!Object.keys(payload).length) {
      return res.status(400).json({ success: false, message: "Data pembaruan harus diisi." })
    }

    const affectedRows = await superadminModel.updateAdoptionRequest(id, payload)
    if (!affectedRows) {
      return res.status(404).json({ success: false, message: "Pengajuan tidak ditemukan." })
    }

    res.json({ success: true, message: "Pengajuan berhasil diperbarui." })
  } catch (error) {
    next(error)
  }
}

async function deleteAdoptionRequest(req, res, next) {
  try {
    const id = Number(req.params.id)

    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID pengajuan tidak valid." })
    }

    const deletedBy = "Super Admin"
    const deletedIp = req.ip || req.connection.remoteAddress || "unknown"
    const affectedRows = await superadminModel.softDeleteAdoptionRequest(id, { deletedBy, deletedIp })

    if (!affectedRows) {
      return res.status(404).json({ success: false, message: "Pengajuan tidak ditemukan atau sudah dihapus." })
    }

    res.json({ success: true, message: "Pengajuan berhasil dihapus." })
  } catch (error) {
    next(error)
  }
}

async function deleteAllAdoptionRequests(req, res, next) {
  try {
    const deletedBy = "Super Admin"
    const deletedIp = req.ip || req.connection.remoteAddress || "unknown"
    const affectedRows = await superadminModel.softDeleteAllAdoptionRequests({ deletedBy, deletedIp })

    if (!affectedRows) {
      return res.status(404).json({ success: false, message: "Tidak ada pengajuan untuk dihapus." })
    }

    res.json({ success: true, message: `${affectedRows} pengajuan berhasil dihapus.` })
  } catch (error) {
    next(error)
  }
}

async function getDeletedAdoptionRequests(req, res, next) {
  try {
    const requests = await superadminModel.listDeletedAdoptionRequests()
    res.json({ success: true, data: requests })
  } catch (error) {
    next(error)
  }
}

async function restoreAdoptionRequest(req, res, next) {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID pengajuan tidak valid." })
    }
    const affectedRows = await superadminModel.restoreAdoptionRequest(id)
    if (!affectedRows) {
      return res.status(404).json({ success: false, message: "Pengajuan tidak ditemukan atau tidak dihapus." })
    }
    res.json({ success: true, message: "Pengajuan berhasil dipulihkan." })
  } catch (error) {
    next(error)
  }
}

async function deleteAdoptionRequestPermanently(req, res, next) {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID pengajuan tidak valid." })
    }
    const affectedRows = await superadminModel.deleteAdoptionRequestPermanently(id)
    if (!affectedRows) {
      return res.status(404).json({ success: false, message: "Pengajuan tidak ditemukan atau tidak dihapus." })
    }
    res.json({ success: true, message: "Pengajuan berhasil dihapus permanen." })
  } catch (error) {
    next(error)
  }
}

async function deleteAllDeletedAdoptionRequests(req, res, next) {
  try {
    const affectedRows = await superadminModel.deleteAllDeletedAdoptionRequests()
    res.json({ success: true, message: `${affectedRows} pengajuan terhapus permanen.` })
  } catch (error) {
    next(error)
  }
}

async function getQuestionnaireQuestions(req, res, next) {
  try {
    const questions = await superadminModel.listQuestionnaireQuestions()
    res.json({ success: true, data: questions })
  } catch (error) {
    next(error)
  }
}

async function createQuestionnaireQuestion(req, res, next) {
  try {
    const { question, answerType = "Pilihan", status = "aktif" } = req.body || {}

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Pertanyaan wajib diisi.",
      })
    }

    const id = await superadminModel.createQuestionnaireQuestion({
      question: question.trim(),
      answerType,
      status,
    })

    res.status(201).json({ success: true, message: "Pertanyaan berhasil dibuat.", data: { id } })
  } catch (error) {
    next(error)
  }
}

async function updateQuestionnaireQuestion(req, res, next) {
  try {
    const id = Number(req.params.id)
    const { question, answerType = "Pilihan", status = "aktif" } = req.body || {}

    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID pertanyaan tidak valid." })
    }

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Pertanyaan wajib diisi.",
      })
    }

    const affectedRows = await superadminModel.updateQuestionnaireQuestion(id, {
      question: question.trim(),
      answerType,
      status,
    })

    if (!affectedRows) {
      return res.status(404).json({ success: false, message: "Pertanyaan tidak ditemukan." })
    }

    res.json({ success: true, message: "Pertanyaan berhasil diperbarui." })
  } catch (error) {
    next(error)
  }
}

async function deleteQuestionnaireQuestion(req, res, next) {
  try {
    const id = Number(req.params.id)

    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID pertanyaan tidak valid." })
    }

    const deletedBy = "Super Admin"
    const deletedIp = req.ip || req.connection.remoteAddress || "unknown"
    const affectedRows = await superadminModel.softDeleteQuestionnaireQuestion(id, { deletedBy, deletedIp })

    if (!affectedRows) {
      return res.status(404).json({ success: false, message: "Pertanyaan tidak ditemukan atau sudah dihapus." })
    }

    res.json({ success: true, message: "Pertanyaan berhasil dihapus." })
  } catch (error) {
    next(error)
  }
}

async function getDeletedQuestionnaireQuestions(req, res, next) {
  try {
    const questions = await superadminModel.listDeletedQuestionnaireQuestions()
    res.json({ success: true, data: questions })
  } catch (error) {
    next(error)
  }
}

async function restoreQuestionnaireQuestion(req, res, next) {
  try {
    const id = Number(req.params.id)

    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID pertanyaan tidak valid." })
    }

    const affectedRows = await superadminModel.restoreQuestionnaireQuestion(id)

    if (!affectedRows) {
      return res.status(404).json({ success: false, message: "Pertanyaan tidak ditemukan atau tidak dihapus." })
    }

    res.json({ success: true, message: "Pertanyaan berhasil dipulihkan." })
  } catch (error) {
    next(error)
  }
}

async function getSettings(req, res, next) {
  try {
    const settings = await superadminModel.getSettings()
    res.json({ success: true, data: settings })
  } catch (error) {
    next(error)
  }
}

async function updateSettings(req, res, next) {
  try {
    const settings = req.body || {}

    await superadminModel.updateSettings(settings)

    res.json({
      success: true,
      message: "Pengaturan berhasil diperbarui.",
    })
  } catch (error) {
    next(error)
  }
}

async function getProfile(req, res, next) {
  try {
    const profile = await superadminModel.getProfile()
    res.json({ success: true, data: profile })
  } catch (error) {
    next(error)
  }
}

async function updateProfile(req, res, next) {
  try {
    await superadminModel.updateProfile(req.body || {})
    res.json({
      success: true,
      message: "Profil berhasil diperbarui.",
    })
  } catch (error) {
    if (error && error.message) {
      return res.status(400).json({
        success: false,
        message: error.message,
      })
    }
    next(error)
  }
}

async function getAccountProfile(req, res, next) {
  try {
    const profile = await superadminModel.getAccountProfile(req.params.id)
    res.json({ success: true, data: profile })
  } catch (error) {
    const status = error.message?.includes("tidak ditemukan") ? 404 : 400
    res.status(status).json({
      success: false,
      message: error.message || "Gagal memuat profil.",
    })
  }
}

async function updateAccountProfile(req, res, next) {
  try {
    const profile = await superadminModel.updateAccountProfile(req.params.id, req.body || {})
    res.json({
      success: true,
      message: "Profil berhasil diperbarui.",
      data: profile,
    })
  } catch (error) {
    const status = error.message?.includes("tidak ditemukan") ? 404 : 400
    res.status(status).json({
      success: false,
      message: error.message || "Gagal memperbarui profil.",
    })
  }
}


async function getReports(req, res, next) {
  try {
    const reports = await superadminModel.getReportsData()
    res.json({ success: true, data: reports })
  } catch (error) {
    next(error)
  }
}

async function getActivityLogs(req, res, next) {
  try {
    const logs = await superadminModel.listActivityLogs()
    res.json({ success: true, data: logs })
  } catch (error) {
    next(error)
  }
}

async function createActivityLog(req, res, next) {
  try {
    const {
      type = 'info',
      title,
      description,
      user_name,
      user_email,
      user_role,
      latitude,
      longitude,
      location_name,
    } = req.body || {}

    const ip_address = req.ip || req.connection.remoteAddress || '127.0.0.1'

    const id = await superadminModel.createActivityLog({
      type,
      title: title || 'Aktivitas Pengguna',
      description: description || 'Akses halaman',
      user_name: user_name || 'Pengguna Publik',
      user_email: user_email || 'guest@adopsi.test',
      user_role: user_role || 'user',
      ip_address,
      latitude,
      longitude,
      location_name,
    })

    res.status(201).json({ success: true, message: "Activity log berhasil dicatat.", data: { id } })
  } catch (error) {
    next(error)
  }
}

async function deleteAllActivityLogs(req, res, next) {
  try {
    const affectedRows = await superadminModel.deleteAllActivityLogs()
    res.json({
      success: true,
      message: `${affectedRows} history log berhasil dihapus.`,
    })
  } catch (error) {
    next(error)
  }
}
async function exportBackup(req, res, next) {
  try {
    const backup = await superadminModel.exportDatabaseBackup()
    const fileName = `backup-adopsi-${new Date().toISOString().slice(0, 10)}.json`
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.json(backup)
  } catch (error) {
    next(error)
  }
}

async function importBackup(req, res, next) {
  try {
    const backupData = req.body
    const count = await superadminModel.importDatabaseBackup(backupData)
    res.json({
      success: true,
      message: `Database berhasil diperbarui/di-restore (${count} record diproses dengan mode Update bukan Replace).`,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  register,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
  getDashboard,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  deleteAllCustomers,
  getDeletedUsers,
  restoreUser,
  deleteUserPermanently,
  deleteAllDeletedUsers,
  getAnimals,
  uploadPhoto,
  createAnimal,
  updateAnimal,
  deleteAnimal,
  deleteAllAnimals,
  deleteAnimalPermanently,
  getDeletedAnimals,
  restoreAnimal,
  deleteAllDeletedAnimals,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  deleteCategoryPermanently,
  getDeletedCategories,
  restoreCategory,
  deleteAllDeletedCategories,
  getAdoptionRequests,
  createAdoptionRequest,
  updateAdoptionRequest,
  deleteAdoptionRequest,
  deleteAllAdoptionRequests,
  deleteAdoptionRequestPermanently,
  deleteAllDeletedAdoptionRequests,
  getDeletedAdoptionRequests,
  restoreAdoptionRequest,
  getQuestionnaireQuestions,
  createQuestionnaireQuestion,
  updateQuestionnaireQuestion,
  deleteQuestionnaireQuestion,
  getDeletedQuestionnaireQuestions,
  restoreQuestionnaireQuestion,
  getSettings,
  updateSettings,
  getProfile,
  updateProfile,
  getAccountProfile,
  updateAccountProfile,
  getReports,
  getActivityLogs,
  createActivityLog,
  deleteAllActivityLogs,
  exportBackup,
  importBackup,
  getChatMessages: async (req, res, next) => {
    try {
      const { userId } = req.query
      const messages = await superadminModel.getChatMessages(userId || null)
      res.json({ success: true, data: messages })
    } catch (err) {
      next(err)
    }
  },
  createChatMessage: async (req, res, next) => {
    try {
      const { msgId, userId, sender, senderName, targetRole, text, topic } = req.body
      const newMsg = await superadminModel.createChatMessage({ msgId, userId, sender, senderName, targetRole, text, topic })
      res.json({ success: true, data: newMsg })
    } catch (err) {
      next(err)
    }
  },
  deleteChatMessage: async (req, res, next) => {
    try {
      const { msgId } = req.params
      if (!msgId) {
        return res.status(400).json({ success: false, message: "ID pesan wajib diisi." })
      }
      await superadminModel.deleteChatMessage(msgId)
      res.json({ success: true, message: "Pesan berhasil dihapus." })
    } catch (err) {
      next(err)
    }
  },
}
