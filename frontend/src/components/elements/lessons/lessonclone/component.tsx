
import React from 'react'
import './styles.css'

export interface LessoncloneProps {
  className?: string
  children?: React.ReactNode
}

export const Lessonclone: React.FC<LessoncloneProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-lessonclone ${className}`}>
      <div className="syn-element__title">Lessonclone</div>
      <div className="syn-element__body">Lessonclone component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Lessonclone
