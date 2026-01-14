
import React from 'react'
import './styles.css'

export interface MarkdowneditorProps {
  className?: string
  children?: React.ReactNode
}

export const Markdowneditor: React.FC<MarkdowneditorProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-markdowneditor ${className}`}>
      <div className="syn-element__title">Markdowneditor</div>
      <div className="syn-element__body">Markdowneditor component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Markdowneditor
