
import React from 'react'
import './styles.css'

export interface LessonlistProps {
  className?: string
  children?: React.ReactNode
}

export const Lessonlist: React.FC<LessonlistProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-lessonlist ${className}`}>
      <div className="syn-element__title">Lessonlist</div>
      <div className="syn-element__body">Lessonlist component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Lessonlist
