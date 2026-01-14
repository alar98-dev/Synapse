
import React from 'react'
import './styles.css'

export interface PdfuploaderProps {
  className?: string
  children?: React.ReactNode
}

export const Pdfuploader: React.FC<PdfuploaderProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-pdfuploader ${className}`}>
      <div className="syn-element__title">Pdfuploader</div>
      <div className="syn-element__body">Pdfuploader component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Pdfuploader
