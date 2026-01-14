
import React from 'react'
import './styles.css'

export interface PageheaderProps {
  className?: string
  children?: React.ReactNode
}

export const Pageheader: React.FC<PageheaderProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-pageheader ${className}`}>
      <div className="syn-element__title">Pageheader</div>
      <div className="syn-element__body">Pageheader component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Pageheader
