
import React from 'react'
import './styles.css'

export interface RouterProps {
  className?: string
  children?: React.ReactNode
}

export const Router: React.FC<RouterProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-router ${className}`}>
      <div className="syn-element__title">Router</div>
      <div className="syn-element__body">Router component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Router
