
import React from 'react'
import './styles.css'

export interface EmptystateProps {
  className?: string
  children?: React.ReactNode
}

export const Emptystate: React.FC<EmptystateProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-emptystate ${className}`}>
      <div className="syn-element__title">Emptystate</div>
      <div className="syn-element__body">Emptystate component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Emptystate
