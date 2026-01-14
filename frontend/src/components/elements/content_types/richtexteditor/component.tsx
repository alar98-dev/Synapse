
import React from 'react'
import './styles.css'

export interface RichtexteditorProps {
  className?: string
  children?: React.ReactNode
}

export const Richtexteditor: React.FC<RichtexteditorProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-richtexteditor ${className}`}>
      <div className="syn-element__title">Richtexteditor</div>
      <div className="syn-element__body">Richtexteditor component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Richtexteditor
