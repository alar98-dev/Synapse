
import React from 'react'
import './styles.css'

export interface OfflinedetectorProps {
  className?: string
  children?: React.ReactNode
}

export const Offlinedetector: React.FC<OfflinedetectorProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-offlinedetector ${className}`}>
      <div className="syn-element__title">Offlinedetector</div>
      <div className="syn-element__body">Offlinedetector component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Offlinedetector
