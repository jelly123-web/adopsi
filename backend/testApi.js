const axios = require("axios")

async function testApi() {
  try {
    const response = await axios.get("http://localhost:3000/api/superadmin/users?page=1&limit=6")
    console.log("API Response:")
    console.log(JSON.stringify(response.data, null, 2))
  } catch (error) {
    console.error("Error:", error.response?.data || error.message)
  }
}

testApi()
