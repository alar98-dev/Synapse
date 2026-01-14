
import React from 'react'
import './styles.css'

export interface ErrorboundaryProps {
  className?: string
  children?: React.ReactNode
}

export const Errorboundary: React.FC<ErrorboundaryProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-errorboundary ${className}`}>
      <div className="syn-element__title">Errorboundary</div>
      <div className="syn-element__body">Errorboundary component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Errorboundary
