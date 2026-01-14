
import React from 'react'
import './styles.css'

export interface AppshellProps {
  className?: string
  children?: React.ReactNode
}

export const Appshell: React.FC<AppshellProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-appshell ${className}`}>
      <div className="syn-element__title">Appshell</div>
      <div className="syn-element__body">Appshell component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Appshell
