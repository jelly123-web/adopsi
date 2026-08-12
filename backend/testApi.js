const axios = require("axios")

async function testApi() {
  const apiBaseUrl = process.env.API_BASE_URL
  if (!apiBaseUrl) {
    console.error("API_BASE_URL wajib diatur sebelum menjalankan test API.")
    return
  }

  try {
    const response = await axios.get(`${apiBaseUrl.replace(/\/$/, "")}/superadmin/users`, {
      params: { page: 1, limit: 6 },
    })
    console.log("API Response:")
    console.log(JSON.stringify(response.data, null, 2))
  } catch (error) {
    console.error("Error:", error.response?.data || error.message)
  }
}

testApi()
