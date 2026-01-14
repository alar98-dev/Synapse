
import React from 'react'
import './styles.css'

export interface CoursepreviewProps {
  className?: string
  children?: React.ReactNode
}

export const Coursepreview: React.FC<CoursepreviewProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-coursepreview ${className}`}>
      <div className="syn-element__title">Coursepreview</div>
      <div className="syn-element__body">Coursepreview component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Coursepreview
