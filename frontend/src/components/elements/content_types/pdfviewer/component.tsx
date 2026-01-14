
import React from 'react'
import './styles.css'

export interface PdfviewerProps {
  className?: string
  children?: React.ReactNode
}

export const Pdfviewer: React.FC<PdfviewerProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-pdfviewer ${className}`}>
      <div className="syn-element__title">Pdfviewer</div>
      <div className="syn-element__body">Pdfviewer component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Pdfviewer
