import React from 'react'
import { createRoot } from 'react-dom/client'
import ChatWidget from './ChatWidget'
import './index.css'

export function mount(el: HTMLElement, props: { courseId?: number, userId?: string } = {}) {
  const root = createRoot(el)
  root.render(<ChatWidget {...props} />)
}

export default ChatWidget
