import React, { useState, useEffect, useRef } from 'react'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  height?: string
  theme?: 'dark' | 'light'
}

export default function CodeEditor({ 
  value, 
  onChange, 
  language = 'python', 
  height = '300px',
  theme = 'dark'
}: CodeEditorProps) {
  const [lines, setLines] = useState<number[]>([1])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isDark = theme === 'dark'

  useEffect(() => {
    const lineCount = value.split('\n').length
    setLines(Array.from({ length: lineCount }, (_, i) => i + 1))
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.currentTarget.selectionStart
      const end = e.currentTarget.selectionEnd

      // Insert 4 spaces
      const newValue = value.substring(0, start) + '    ' + value.substring(end)
      onChange(newValue)

      // Reset selection
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4
        }
      }, 0)
    }
  }

  return (
    <div 
      className={`flex w-full rounded-2xl border font-mono text-sm transition-colors overflow-hidden ${
        isDark 
        ? 'border-slate-800 bg-slate-950 text-slate-300' 
        : 'border-slate-200 bg-white text-slate-700'
      }`} 
      style={{ height }}
    >
      <div 
        className={`w-12 text-right pr-3 py-4 select-none border-r transition-colors ${
          isDark 
          ? 'bg-slate-900 text-slate-600 border-slate-800' 
          : 'bg-slate-50 text-slate-400 border-slate-200'
        }`}
      >
        {lines.map((line) => (
          <div key={line} className="h-5 leading-5">{line}</div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        className="flex-1 bg-transparent p-4 outline-none resize-none h-full leading-5 scrollbar-thin transition-colors"
      />
    </div>
  )
}
