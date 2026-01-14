
import React from 'react'
import './styles.css'

export interface QuickactionsProps {
  className?: string
  children?: React.ReactNode
}

export const Quickactions: React.FC<QuickactionsProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-quickactions ${className}`}>
      <div className="syn-element__title">Quickactions</div>
      <div className="syn-element__body">Quickactions component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Quickactions
