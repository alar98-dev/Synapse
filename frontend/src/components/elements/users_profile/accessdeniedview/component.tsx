
import React from 'react'
import './styles.css'

export interface AccessdeniedviewProps {
  className?: string
  children?: React.ReactNode
}

export const Accessdeniedview: React.FC<AccessdeniedviewProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-accessdeniedview ${className}`}>
      <div className="syn-element__title">Accessdeniedview</div>
      <div className="syn-element__body">Accessdeniedview component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Accessdeniedview
