
import React from 'react'
import './styles.css'

export interface AccordionProps {
  className?: string
  children?: React.ReactNode
}

export const Accordion: React.FC<AccordionProps> = ({ className = '', children }) => {
  return (
    <div className={`syn-element syn-accordion ${className}`}>
      <div className="syn-element__title">Accordion</div>
      <div className="syn-element__body">Accordion component — placeholder implementation.</div>
      {children}
    </div>
  )
}

export default Accordion
