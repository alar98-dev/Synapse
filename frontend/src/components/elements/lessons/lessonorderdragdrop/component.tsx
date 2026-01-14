
import React from 'react'
import './styles.css'

export interface LessonorderdragdropProps {
  className?: string
  children?: React.ReactNode
}

export const Lessonorderdragdrop: React.FC<LessonorderdragdropProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-lessonorderdragdrop ${className}`}>
      <div className="syn-element__title">Lessonorderdragdrop</div>
      <div className="syn-element__body">Lessonorderdragdrop component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Lessonorderdragdrop
