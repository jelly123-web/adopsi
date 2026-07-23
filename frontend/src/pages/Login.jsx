import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function Login() {
  return (
    <main className="public-page">
      <Navbar />
      <section className="auth-page">
        <form className="auth-card">
          <p className="eyebrow">Masuk</p>
          <h1>Login Akun</h1>
          <label>
            Email
            <input type="email" placeholder="admin@email.com" />
          </label>
          <label>
            Password
            <input type="password" placeholder="Masukkan password" />
          </label>
          <button type="button">Login</button>
        </form>
      </section>
      <Footer />
    </main>
  )
}

export default Login
