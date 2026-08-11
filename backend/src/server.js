const express = require("express")
const cors = require("cors")
const path = require("path")
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") })

const dashboardRoutes = require("./routes/dashboardRoutes")
const superadminController = require("./controllers/superadminController")
const { initializeDatabase } = require("./config/database")

const app = express()

app.use(cors())
app.use(express.json({ limit: "100mb" }))
app.use(express.urlencoded({ extended: true, limit: "100mb" }))

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`)
  next()
})

app.use("/api", dashboardRoutes)
app.get("/auth/google", superadminController.startGoogleAuth)
app.get("/auth/google/callback", superadminController.handleGoogleCallback)

app.get("/", (req, res) => {
  res.json({
    message: "Backend Adopsi Hewan Berjalan",
  })
})

app.use((error, req, res, next) => {
  console.error("Server error:", error)
  if (error && error.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "File terlalu besar. Gunakan gambar atau video yang lebih kecil.",
    })
  }

  if (error && (error.code === "23505" || error.constraint)) {
    return res.status(409).json({
      success: false,
      message: "Email sudah terdaftar. Gunakan email lain untuk membuat akun.",
    })
  }

  console.error(error)
  res.status(500).json({
    success: false,
    message: "Terjadi kesalahan server.",
  })
})

const PORT = process.env.PORT || 3000

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server berjalan di http://localhost:${PORT}`)
    })
  })
  .catch((error) => {
    console.error("Gagal inisialisasi database:", error)
    process.exit(1)
  })
