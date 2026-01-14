
import React from 'react'
import './styles.css'

export interface VideoplayerProps {
  className?: string
  children?: React.ReactNode
}

export const Videoplayer: React.FC<VideoplayerProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-videoplayer ${className}`}>
      <div className="syn-element__title">Videoplayer</div>
      <div className="syn-element__body">Videoplayer component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Videoplayer
