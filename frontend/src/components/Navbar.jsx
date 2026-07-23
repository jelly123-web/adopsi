import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <header className="site-navbar">
      <Link className="site-brand" to="/home">
        Adopsi Hewan
      </Link>
      <nav>
        <Link to="/home">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </nav>
    </header>
  )
}

export default Navbar
