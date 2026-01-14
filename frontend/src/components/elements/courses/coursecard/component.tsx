
import React from 'react'
import './styles.css'

export interface CoursecardProps {
  className?: string
  children?: React.ReactNode
}

export const Coursecard: React.FC<CoursecardProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-coursecard ${className}`}>
      <div className="syn-element__title">Coursecard</div>
      <div className="syn-element__body">Coursecard component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Coursecard
