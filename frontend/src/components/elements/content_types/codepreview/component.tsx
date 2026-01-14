
import React from 'react'
import './styles.css'

export interface CodepreviewProps {
  className?: string
  children?: React.ReactNode
}

export const Codepreview: React.FC<CodepreviewProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-codepreview ${className}`}>
      <div className="syn-element__title">Codepreview</div>
      <div className="syn-element__body">Codepreview component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Codepreview
