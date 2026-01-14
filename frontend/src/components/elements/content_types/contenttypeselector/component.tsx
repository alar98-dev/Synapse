
import React from 'react'
import './styles.css'

export interface ContenttypeselectorProps {
  className?: string
  children?: React.ReactNode
}

export const Contenttypeselector: React.FC<ContenttypeselectorProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-contenttypeselector ${className}`}>
      <div className="syn-element__title">Contenttypeselector</div>
      <div className="syn-element__body">Contenttypeselector component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Contenttypeselector
