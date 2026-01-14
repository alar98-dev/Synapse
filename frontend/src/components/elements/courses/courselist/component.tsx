
import React from 'react'
import './styles.css'

export interface CourselistProps {
  className?: string
  children?: React.ReactNode
}

export const Courselist: React.FC<CourselistProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-courselist ${className}`}>
      <div className="syn-element__title">Courselist</div>
      <div className="syn-element__body">Courselist component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Courselist
