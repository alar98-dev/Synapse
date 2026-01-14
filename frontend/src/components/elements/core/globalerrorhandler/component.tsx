
import React from 'react'
import './styles.css'

export interface GlobalerrorhandlerProps {
  className?: string
  children?: React.ReactNode
}

export const Globalerrorhandler: React.FC<GlobalerrorhandlerProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-globalerrorhandler ${className}`}>
      <div className="syn-element__title">Globalerrorhandler</div>
      <div className="syn-element__body">Globalerrorhandler component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Globalerrorhandler
