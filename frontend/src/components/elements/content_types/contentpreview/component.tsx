
import React from 'react'
import './styles.css'

export interface ContentpreviewProps {
  className?: string
  children?: React.ReactNode
}

export const Contentpreview: React.FC<ContentpreviewProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-contentpreview ${className}`}>
      <div className="syn-element__title">Contentpreview</div>
      <div className="syn-element__body">Contentpreview component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Contentpreview
