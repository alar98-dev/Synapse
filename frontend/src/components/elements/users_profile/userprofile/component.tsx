
import React from 'react'
import './styles.css'

export interface UserprofileProps {
  className?: string
  children?: React.ReactNode
}

export const Userprofile: React.FC<UserprofileProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-userprofile ${className}`}>
      <div className="syn-element__title">Userprofile</div>
      <div className="syn-element__body">Userprofile component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Userprofile
