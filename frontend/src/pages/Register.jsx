import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function Register() {
  return (
    <main className="public-page">
      <Navbar />
      <section className="auth-page">
        <form className="auth-card">
          <p className="eyebrow">Daftar</p>
          <h1>Register Akun</h1>
          <label>
            Nama
            <input type="text" placeholder="Nama lengkap" />
          </label>
          <label>
            Email
            <input type="email" placeholder="user@email.com" />
          </label>
          <label>
            Password
            <input type="password" placeholder="Buat password" />
          </label>
          <button type="button">Register</button>
        </form>
      </section>
      <Footer />
    </main>
  )
}

export default Register
