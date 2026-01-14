
import React from 'react'
import './styles.css'

export interface CodeblockeditorProps {
  className?: string
  children?: React.ReactNode
}

export const Codeblockeditor: React.FC<CodeblockeditorProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-codeblockeditor ${className}`}>
      <div className="syn-element__title">Codeblockeditor</div>
      <div className="syn-element__body">Codeblockeditor component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Codeblockeditor
