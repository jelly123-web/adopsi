const API_ORIGIN = 'http://localhost:3000'

export const DEFAULT_USER_PHOTO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%2360A5FA'/%3E%3Cstop offset='1' stop-color='%232563EB'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='96' height='96' rx='48' fill='%23EFF6FF'/%3E%3Ccircle cx='48' cy='36' r='17' fill='url(%23g)'/%3E%3Cpath d='M22 78c4-17 16-27 26-27s22 10 26 27' fill='url(%23g)'/%3E%3C/svg%3E"

export const DEFAULT_ANIMAL_PHOTO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%23BBF7D0'/%3E%3Cstop offset='1' stop-color='%2310B981'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='96' height='96' rx='24' fill='%23ECFDF5'/%3E%3Ccircle cx='32' cy='36' r='9' fill='url(%23g)'/%3E%3Ccircle cx='48' cy='27' r='9' fill='url(%23g)'/%3E%3Ccircle cx='64' cy='36' r='9' fill='url(%23g)'/%3E%3Ccircle cx='39' cy='53' r='8' fill='url(%23g)'/%3E%3Ccircle cx='57' cy='53' r='8' fill='url(%23g)'/%3E%3Cpath d='M27 71c4-14 13-23 21-23s17 9 21 23c2 7-3 12-10 9-5-2-8-3-11-3s-6 1-11 3c-7 3-12-2-10-9z' fill='url(%23g)'/%3E%3C/svg%3E"

export function normalizeMediaUrl(value) {
  const raw = Array.isArray(value) ? value.find(Boolean) : value
  if (!raw) return ''

  const src = String(raw).trim()
  if (!src) return ''
  if (/^(data:|blob:|https?:\/\/)/i.test(src)) return src

  const clean = src.replace(/^\/+/, '')
  return `${API_ORIGIN}/${clean}`
}

export function pickMedia(...values) {
  for (const value of values) {
    const url = normalizeMediaUrl(value)
    if (url) return url
  }
  return ''
}

export function isVideoMedia(value = '') {
  return /^data:video/i.test(value) || /\.(mp4|webm|ogg)(\?|#|$)/i.test(value)
}

function MediaAvatar({ src, fallbackSrc = DEFAULT_USER_PHOTO, alt = '', className = 'user-avatar' }) {
  const media = normalizeMediaUrl(src) || fallbackSrc

  return (
    <div className={`${className} has-media`}>
      {isVideoMedia(media) ? (
        <video src={media} autoPlay muted loop playsInline />
      ) : (
        <img
          src={media}
          alt={alt}
          onError={(event) => {
            if (fallbackSrc && event.currentTarget.src !== fallbackSrc) {
              event.currentTarget.src = fallbackSrc
            }
          }}
        />
      )}
    </div>
  )
}

export default MediaAvatar
