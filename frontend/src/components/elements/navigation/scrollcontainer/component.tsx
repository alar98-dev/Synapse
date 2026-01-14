
import React from 'react'
import './styles.css'

export interface ScrollcontainerProps {
  className?: string
  children?: React.ReactNode
}

export const Scrollcontainer: React.FC<ScrollcontainerProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-scrollcontainer ${className}`}>
      <div className="syn-element__title">Scrollcontainer</div>
      <div className="syn-element__body">Scrollcontainer component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Scrollcontainer
