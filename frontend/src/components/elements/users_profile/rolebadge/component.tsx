
import React from 'react'
import './styles.css'

export interface RolebadgeProps {
  className?: string
  children?: React.ReactNode
}

export const Rolebadge: React.FC<RolebadgeProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-rolebadge ${className}`}>
      <div className="syn-element__title">Rolebadge</div>
      <div className="syn-element__body">Rolebadge component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Rolebadge
