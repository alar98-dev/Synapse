
import React from 'react'
import './styles.css'

export interface LessonpreviewProps {
  className?: string
  children?: React.ReactNode
}

export const Lessonpreview: React.FC<LessonpreviewProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-lessonpreview ${className}`}>
      <div className="syn-element__title">Lessonpreview</div>
      <div className="syn-element__body">Lessonpreview component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Lessonpreview
