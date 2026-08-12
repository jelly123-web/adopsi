import axios from 'axios'

// Semua endpoint backend melewati proxy pada origin aplikasi saat ini.
const api = axios.create({
  baseURL: '/api',
})

export default api
