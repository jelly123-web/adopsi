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

    await superadminModel.deleteUser(id)
    res.json({ success: true, message: "User berhasil dihapus." })
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

    const affectedRows = await superadminModel.deleteAnimal(id)
    if (!affectedRows) {
      return res.status(404).json({ success: false, message: "Hewan tidak ditemukan." })
    }

    res.json({ success: true, message: "Hewan berhasil dihapus." })
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
  getAnimals,
  createAnimal,
  updateAnimal,
  deleteAnimal,
}
