
import React from 'react'
import './styles.css'

export interface LinkembedProps {
  className?: string
  children?: React.ReactNode
}

export const Linkembed: React.FC<LinkembedProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-linkembed ${className}`}>
      <div className="syn-element__title">Linkembed</div>
      <div className="syn-element__body">Linkembed component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Linkembed
