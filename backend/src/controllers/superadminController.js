const superadminModel = require("../models/superadminModel")

async function getDashboard(req, res, next) {
  try {
    const data = await superadminModel.getDashboardData()
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

async function getUsers(req, res, next) {
  try {
    const users = await superadminModel.listUsers()
    res.json({ success: true, data: users })
  } catch (error) {
    next(error)
  }
}

async function createUser(req, res, next) {
  try {
    const { name, email, role = "user", status = "aktif" } = req.body || {}

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Nama dan email wajib diisi.",
      })
    }

    const id = await superadminModel.createUser({ name, email, role, status })
    res.status(201).json({ success: true, message: "User berhasil dibuat.", data: { id } })
  } catch (error) {
    next(error)
  }
}

async function updateUser(req, res, next) {
  try {
    const id = Number(req.params.id)
    const { name, email, role = "user", status = "aktif" } = req.body || {}

    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID user tidak valid." })
    }

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Nama dan email wajib diisi.",
      })
    }

    const affectedRows = await superadminModel.updateUser(id, { name, email, role, status })
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

async function getAnimals(req, res, next) {
  try {
    const animals = await superadminModel.listAnimals()
    res.json({ success: true, data: animals })
  } catch (error) {
    next(error)
  }
}

async function createAnimal(req, res, next) {
  try {
    const { name, species, gender, age, status = "tersedia" } = req.body || {}
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
      status,
    })

    res.status(201).json({ success: true, message: "Hewan berhasil dibuat.", data: { id } })
  } catch (error) {
    next(error)
  }
}

async function updateAnimal(req, res, next) {
  try {
    const id = Number(req.params.id)
    const { name, species, gender, age, status = "tersedia" } = req.body || {}
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
      status,
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

// Category handlers
async function getCategories(req, res, next) {
  try {
    const categories = await superadminModel.listCategories()
    res.json({ success: true, data: categories })
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

async function getAdoptionRequests(req, res, next) {
  try {
    const requests = await superadminModel.listAdoptionRequests()
    res.json({ success: true, data: requests })
  } catch (error) {
    next(error)
  }
}

async function updateAdoptionRequest(req, res, next) {
  try {
    const id = Number(req.params.id)
    const { status } = req.body || {}

    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID pengajuan tidak valid." })
    }

    if (!status) {
      return res.status(400).json({ success: false, message: "Status harus diisi." })
    }

    const affectedRows = await superadminModel.updateAdoptionRequest(id, { status })
    if (!affectedRows) {
      return res.status(404).json({ success: false, message: "Pengajuan tidak ditemukan." })
    }

    res.json({ success: true, message: "Status pengajuan berhasil diupdate." })
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
  getDashboard,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getDeletedUsers,
  restoreUser,
  getAnimals,
  createAnimal,
  updateAnimal,
  deleteAnimal,
  getDeletedAnimals,
  restoreAnimal,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getDeletedCategories,
  restoreCategory,
  getAdoptionRequests,
  updateAdoptionRequest,
  deleteAdoptionRequest,
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
  getReports,
  getActivityLogs,
  createActivityLog,
  exportBackup,
  importBackup,
}
