
import React from 'react'
import './styles.css'

export interface TabnavigationProps {
  className?: string
  children?: React.ReactNode
}

export const Tabnavigation: React.FC<TabnavigationProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-tabnavigation ${className}`}>
      <div className="syn-element__title">Tabnavigation</div>
      <div className="syn-element__body">Tabnavigation component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Tabnavigation
