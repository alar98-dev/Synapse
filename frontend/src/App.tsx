import React from 'react'
import { ThemeProvider } from './theme'
import Layout from './views/Layout'

export default function App() {
  return (
    <ThemeProvider>
      <Layout />
    </ThemeProvider>
  )
}
