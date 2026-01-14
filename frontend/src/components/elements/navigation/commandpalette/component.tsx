
import React from 'react'
import './styles.css'

export interface CommandpaletteProps {
  className?: string
  children?: React.ReactNode
}

export const Commandpalette: React.FC<CommandpaletteProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-commandpalette ${className}`}>
      <div className="syn-element__title">Commandpalette</div>
      <div className="syn-element__body">Commandpalette component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Commandpalette
