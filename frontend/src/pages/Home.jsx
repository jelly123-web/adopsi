import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function Home() {
  return (
    <main className="public-page">
      <Navbar />
      <section className="home-hero">
        <div>
          <p className="eyebrow">Platform Adopsi</p>
          <h1>Temukan rumah baru untuk hewan yang membutuhkan.</h1>
          <p>
            Sistem ini membantu admin mengelola data hewan, user, pengajuan,
            dan status adopsi.
          </p>
          <a className="primary-link" href="/dashboard">Buka Dashboard</a>
        </div>
      </section>
      <Footer />
    </main>
  )
}

export default Home
