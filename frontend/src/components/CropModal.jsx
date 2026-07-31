import { createPortal } from 'react-dom'

export default function CropModal({ open, onClose, children }) {
  if (!open) return null
  return createPortal(
    <div className="crop-modal">
      <div className="crop-modal-backdrop" onClick={onClose}></div>
      {children}
    </div>,
    document.body
  )
}
