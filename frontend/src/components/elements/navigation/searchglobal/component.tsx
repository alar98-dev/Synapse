
import React from 'react'
import './styles.css'

export interface SearchglobalProps {
  className?: string
  children?: React.ReactNode
}

export const Searchglobal: React.FC<SearchglobalProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-searchglobal ${className}`}>
      <div className="syn-element__title">Searchglobal</div>
      <div className="syn-element__body">Searchglobal component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Searchglobal
