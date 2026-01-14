
import React from 'react'
import './styles.css'

export interface SidebarProps {
  className?: string
  children?: React.ReactNode
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-sidebar ${className}`}>
      <div className="syn-element__title">Sidebar</div>
      <div className="syn-element__body">Sidebar component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Sidebar
