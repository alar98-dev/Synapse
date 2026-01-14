
import React from 'react'
import './styles.css'

export interface VideouploaderProps {
  className?: string
  children?: React.ReactNode
}

export const Videouploader: React.FC<VideouploaderProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-videouploader ${className}`}>
      <div className="syn-element__title">Videouploader</div>
      <div className="syn-element__body">Videouploader component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Videouploader
