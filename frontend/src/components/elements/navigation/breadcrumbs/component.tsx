
import React from 'react'
import './styles.css'

export interface BreadcrumbItem {
  label: string
  onClick?: () => void
  active?: boolean
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  return (
    <nav className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${className}`}>
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 && <i className="bx bx-chevron-right text-slate-600"></i>}
          <button
            onClick={item.onClick}
            disabled={item.active || !item.onClick}
            className={`transition-colors ${
              item.active 
                ? 'text-[var(--syn-primary)]' 
                : 'text-slate-500 hover:text-white cursor-pointer'
            }`}
          >
            {item.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  )
}

export default Breadcrumbs
