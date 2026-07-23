const express = require("express")
const cors = require("cors")
require("dotenv").config()

const dashboardRoutes = require("./routes/dashboardRoutes")
const { initializeDatabase } = require("./config/database")

const app = express()

app.use(cors())
app.use(express.json())

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`)
  next()
})

app.use("/api", dashboardRoutes)

app.get("/", (req, res) => {
  res.json({
    message: "Backend Adopsi Hewan Berjalan",
  })
})

app.use((error, req, res, next) => {
  console.error("Server error:", error)
  if (error && error.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      success: false,
      message: "Data sudah ada. Email user atau data hewan mungkin duplikat.",
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
