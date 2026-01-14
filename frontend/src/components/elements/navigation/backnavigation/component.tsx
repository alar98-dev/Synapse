
import React from 'react'
import './styles.css'

export interface BacknavigationProps {
  className?: string
  children?: React.ReactNode
}

export const Backnavigation: React.FC<BacknavigationProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-backnavigation ${className}`}>
      <div className="syn-element__title">Backnavigation</div>
      <div className="syn-element__body">Backnavigation component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Backnavigation
