
import React from 'react'
import './styles.css'

export interface InfinitescrollProps {
  className?: string
  children?: React.ReactNode
}

export const Infinitescroll: React.FC<InfinitescrollProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-infinitescroll ${className}`}>
      <div className="syn-element__title">Infinitescroll</div>
      <div className="syn-element__body">Infinitescroll component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Infinitescroll
