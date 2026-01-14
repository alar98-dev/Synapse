
import React from 'react'
import './styles.css'

export interface TopbarProps {
  className?: string
  children?: React.ReactNode
}

export const Topbar: React.FC<TopbarProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-topbar ${className}`}>
      <div className="syn-element__title">Topbar</div>
      <div className="syn-element__body">Topbar component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Topbar
