import { Navigate } from 'react-router-dom'

function Home() {
  const role = localStorage.getItem('authRole')

  if (role === 'superadmin') return <Navigate to="/dashboard" replace />
  if (role === 'admin') return <Navigate to="/admin" replace />
  if (role === 'petugas') return <Navigate to="/petugas" replace />
  if (role === 'costumer') return <Navigate to="/customer" replace />

  return <Navigate to="/login" replace />
}

export default Home
