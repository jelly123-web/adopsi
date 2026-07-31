const { Pool } = require("pg")

const pool = new Pool({
  host: "127.0.0.1",
  port: 5432,
  user: "postgres",
  password: "123456",
  database: "adopsi",
})

async function checkUsers() {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, deleted, deleted_at FROM users ORDER BY id"
    )
    console.log("Users in database:")
    console.table(result.rows)

    const deletedResult = await pool.query(
      "SELECT COUNT(*) as total FROM users WHERE deleted = FALSE"
    )
    console.log("\nActive users (deleted = FALSE):", deletedResult.rows[0].total)

    const allResult = await pool.query(
      "SELECT COUNT(*) as total FROM users"
    )
    console.log("Total users (including deleted):", allResult.rows[0].total)

    await pool.end()
  } catch (error) {
    console.error("Error:", error.message)
    process.exit(1)
  }
}

checkUsers()
