
import React from 'react'
import './styles.css'

export interface ImageuploaderProps {
  className?: string
  children?: React.ReactNode
}

export const Imageuploader: React.FC<ImageuploaderProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-imageuploader ${className}`}>
      <div className="syn-element__title">Imageuploader</div>
      <div className="syn-element__body">Imageuploader component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Imageuploader
