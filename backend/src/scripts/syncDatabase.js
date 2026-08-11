const path = require("path")
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") })

const { initializeDatabase, getPool } = require("../config/database")

async function main() {
  await initializeDatabase()
  const pool = await getPool()

  const { rows: tables } = await pool.query(
    `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `,
  )

  const counts = {}
  for (const table of tables) {
    const tableName = table.table_name
    const { rows: [row] } = await pool.query(`SELECT COUNT(*)::int AS total FROM "${tableName}"`)
    counts[tableName] = row.total
  }

  console.log("Database tersambung:", process.env.DB_DATABASE || process.env.DB_NAME || "adopsi")
  console.log("Host:", `${process.env.DB_HOST || "127.0.0.1"}:${process.env.DB_PORT || 5432}`)
  console.log("Tabel aktif:")
  for (const table of tables) {
    console.log(`- ${table.table_name}: ${counts[table.table_name]} data`)
  }

  await pool.end()
}

main().catch((error) => {
  console.error("Gagal sinkron database:", error)
  process.exit(1)
})
