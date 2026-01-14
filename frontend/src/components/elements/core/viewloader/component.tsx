
import React from 'react'
import './styles.css'

export interface ViewloaderProps {
  className?: string
  children?: React.ReactNode
}

export const Viewloader: React.FC<ViewloaderProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-viewloader ${className}`}>
      <div className="syn-element__title">Viewloader</div>
      <div className="syn-element__body">Viewloader component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Viewloader
