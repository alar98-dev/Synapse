
import React from 'react'
import './styles.css'

export interface LessoncardProps {
  className?: string
  children?: React.ReactNode
}

export const Lessoncard: React.FC<LessoncardProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-lessoncard ${className}`}>
      <div className="syn-element__title">Lessoncard</div>
      <div className="syn-element__body">Lessoncard component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Lessoncard
