
import React from 'react'
import './styles.css'

export interface ApiclientProps {
  className?: string
  children?: React.ReactNode
}

export const Apiclient: React.FC<ApiclientProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-apiclient ${className}`}>
      <div className="syn-element__title">Apiclient</div>
      <div className="syn-element__body">Apiclient component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Apiclient
