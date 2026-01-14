
import React from 'react'
import './styles.css'

export interface ContentplaceholderProps {
  className?: string
  children?: React.ReactNode
}

export const Contentplaceholder: React.FC<ContentplaceholderProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-contentplaceholder ${className}`}>
      <div className="syn-element__title">Contentplaceholder</div>
      <div className="syn-element__body">Contentplaceholder component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Contentplaceholder
