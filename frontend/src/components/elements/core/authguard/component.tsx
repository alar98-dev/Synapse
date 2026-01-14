
import React from 'react'
import './styles.css'

export interface AuthguardProps {
  className?: string
  children?: React.ReactNode
}

export const Authguard: React.FC<AuthguardProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-authguard ${className}`}>
      <div className="syn-element__title">Authguard</div>
      <div className="syn-element__body">Authguard component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Authguard
