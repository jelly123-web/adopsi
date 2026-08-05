import { useEffect, useState } from 'react'

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  const [isMounted, setIsMounted] = useState(true)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), duration)
    return () => clearTimeout(timer)
  }, [duration])

  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        setIsMounted(false)
        onClose?.()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isMounted) return null

  const title = type === 'success' ? 'Berhasil' : 'Terjadi kesalahan'
  const iconClass = type === 'success' ? 'fa-check' : 'fa-exclamation-triangle'

  return (
    <div className={`toast toast-${type} ${isVisible ? 'show' : ''}`}>
      <div className="toast-icon">
        <i className={`fas ${iconClass}`} />
      </div>
      <div className="toast-texts">
        <p className="toast-title">{title}</p>
        <p className="toast-message">{message}</p>
      </div>
      <button
        type="button"
        className="toast-close"
        aria-label="Tutup notifikasi"
        onClick={() => setIsVisible(false)}
      >
        &times;
      </button>
    </div>
  )
}
