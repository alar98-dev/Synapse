
import React from 'react'
import './styles.css'

export interface CourseoverviewProps {
  className?: string
  children?: React.ReactNode
}

export const Courseoverview: React.FC<CourseoverviewProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-courseoverview ${className}`}>
      <div className="syn-element__title">Courseoverview</div>
      <div className="syn-element__body">Courseoverview component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Courseoverview
