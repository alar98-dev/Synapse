
import React from 'react'
import './styles.css'

export interface SplitviewProps {
  className?: string
  children?: React.ReactNode
}

export const Splitview: React.FC<SplitviewProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-splitview ${className}`}>
      <div className="syn-element__title">Splitview</div>
      <div className="syn-element__body">Splitview component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Splitview
