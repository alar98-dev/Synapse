import React, { useState, useEffect, useRef, useCallback } from 'react'
import CodeEditor from '../components/CodeEditor'

type ConnectionStatus = 'CONNECTED' | 'RECONNECTING' | 'FAILED' | 'STOPPED'

export default function AICenterView() {
  const [session] = useState(() => Math.random().toString(36).substring(7))
  const [logs, setLogs] = useState<{ type: string; content: string }[]>([])
  const [status, setStatus] = useState<ConnectionStatus>('RECONNECTING')
  const [input, setInput] = useState(() => localStorage.getItem(`synapse_draft_ai_${session}`) || '')
  const [language, setLanguage] = useState('python')
  const [model, setModel] = useState('openai')
  
  const ws = useRef<WebSocket | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)
  const retryCount = useRef(0)

  // Persist draft on change
  useEffect(() => {
    localStorage.setItem(`synapse_draft_ai_last`, input)
  }, [input])

  // Load last draft if current is empty on start
  useEffect(() => {
    const lastDraft = localStorage.getItem(`synapse_draft_ai_last`)
    if (lastDraft && !input) {
      setInput(lastDraft)
    }
  }, [])

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const socket = new WebSocket(`${protocol}//${host}/ws/execute/${session}/`)

    setStatus('RECONNECTING')

    socket.onopen = () => {
      console.log('[SRE]: Stream link established.')
      setStatus('CONNECTED')
      retryCount.current = 0
      setLogs(prev => [...prev, { type: 'system', content: `[INFO]: Conectado ao Terminal Seguro (Session: ${session})\n` }])
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setLogs((prev) => [...prev, { type: data.type, content: data.content }])
      } catch (e) {
        console.error('[SRE]: Malformed packet ignored.', e)
      }
    }

    socket.onclose = (event) => {
      ws.current = null
      if (retryCount.current < 5) {
        const delay = Math.pow(2, retryCount.current) * 1000
        setStatus('RECONNECTING')
        setLogs(prev => [...prev, { type: 'stderr', content: `[ERR_WS_DROPPED]: Link perdido. Tentativa ${retryCount.current + 1} em ${delay/1000}s...\n` }])
        
        reconnectTimeout.current = setTimeout(() => {
          retryCount.current++
          connect()
        }, delay)
      } else {
        setStatus('FAILED')
        setLogs(prev => [...prev, { type: 'stderr', content: '[ERR_FATAL]: Cota de reconexão excedida. Verifique sua rede.\n' }])
      }
    }

    socket.onerror = () => {
      setStatus('FAILED')
    }

    ws.current = socket
  }, [session])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
      if (ws.current) ws.current.close()
    }
  }, [connect])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  const handleExecute = () => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN || !input.trim()) return

    setLogs((prev) => [...prev, { type: 'system', content: `[EXEC]: Running ${language} code...\n` }])
    
    ws.current.send(JSON.stringify({
      action: 'execute',
      code: input,
      language: language
    }))
  }

  const getStatusConfig = () => {
    switch(status) {
      case 'CONNECTED': return { color: 'bg-emerald-500', text: 'Link Estável', glow: 'shadow-[0_0_10px_#10b981]' }
      case 'RECONNECTING': return { color: 'bg-amber-500', text: 'Recuperando Link', glow: 'shadow-[0_0_10px_#f59e0b]' }
      case 'FAILED': return { color: 'bg-rose-500', text: 'Falha Crítica', glow: 'shadow-[0_0_10px_#f43f5e]' }
      default: return { color: 'bg-slate-500', text: 'Inativo', glow: '' }
    }
  }

  const statusCfg = getStatusConfig()

  return (
    <div className="space-y-6 animate-fadeIn">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter">Centro de Inteligência</h1>
          <p className="text-slate-400 text-sm">Monitoramento de infraestrutura e execução protegida.</p>
        </div>
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all duration-500 ${status === 'CONNECTED' ? 'bg-emerald-500/10 border-emerald-500/20' : status === 'RECONNECTING' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
          <span className={`flex h-2 w-2 rounded-full animate-pulse ${statusCfg.color} ${statusCfg.glow}`}></span>
          <span className={`text-[10px] font-bold uppercase tracking-widest ${status === 'CONNECTED' ? 'text-emerald-500' : status === 'RECONNECTING' ? 'text-amber-500' : 'text-rose-500'}`}>
            {statusCfg.text}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Model Selector */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
             <div className="h-10 w-10 rounded-xl bg-[var(--syn-primary)]/10 flex items-center justify-center text-[var(--syn-primary)]">
                <i className="bx bx-brain text-xl"></i>
             </div>
             <h3 className="text-lg font-bold text-white">Modelo Ativo</h3>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Core Provider</label>
              <select 
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--syn-primary)]/30 transition-all border-hover:border-[var(--syn-primary)]/50"
              >
                <option value="openai">OpenAI (GPT-4o)</option>
                <option value="anthropic">Anthropic (Claude 3.5)</option>
                <option value="groq">Groq (Llama 3 70B)</option>
              </select>
            </div>
            <div className="pt-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-3">
                <span className="text-slate-500">Uso de Tokens (mês)</span>
                <span className="text-[var(--syn-primary)]">74%</span>
              </div>
              <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden p-[1px]">
                <div className="h-full bg-gradient-to-r from-[var(--syn-primary)] to-purple-500 rounded-full shadow-[0_0_10px_rgba(162,128,255,0.3)] transition-all duration-1000" style={{ width: '74%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Roles */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <i className="bx bx-user-voice text-xl"></i>
               </div>
               <h3 className="text-lg font-bold text-white uppercase tracking-tight">Agentes & Personas</h3>
            </div>
            <button 
              disabled
              title="Indisponível no MVP"
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-slate-700 cursor-not-allowed hover:border-slate-700 transition-colors"
            >
              <i className="bx bx-plus text-xl"></i>
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <AgentItem role="AI Coach (Mentor)" desc="Feedback pedagógico e suporte." icon="AC" color="from-indigo-500 to-blue-600" status="Ativo" />
            <AgentItem role="AI Studio Assistant" desc="Criação de conteúdo e roteiros." icon="AS" color="from-pink-500 to-rose-600" status="Ativo" />
          </div>
        </div>

        {/* Playground / Debugger Real-time */}
        <div className="lg:col-span-3 rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
          <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
             <div className="flex items-center gap-3">
               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                 <i className="bx bx-terminal text-lg text-emerald-500"></i> Playground Debugger
               </h3>
             </div>
             <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded">SID: {session}</span>
                <span className="text-[10px] uppercase font-mono text-emerald-500/70 tracking-widest">$ Real_Time_Streaming_Enabled</span>
             </div>
          </div>
          
          <div 
            ref={scrollRef}
            className="p-6 font-mono text-xs space-y-1 h-64 overflow-y-auto scrollbar-hide bg-black/40"
          >
             {logs.length === 0 && <p className="text-slate-700 italic animate-pulse">Aguardando comandos ou saída do sistema...</p>}
             {logs.map((log, i) => (
               <p key={i} className={`leading-relaxed break-all whitespace-pre-wrap ${
                 log.type === 'stdout' ? 'text-slate-300' : 
                 log.type === 'stderr' ? 'text-red-400' : 
                 'text-emerald-500 font-bold'
               }`}>
                 {log.content}
               </p>
             ))}
          </div>

          <div className="p-6 bg-slate-900 border-t border-slate-800 space-y-4">
             <div className="flex justify-between items-center">
                 <div className="flex gap-2">
                    {['python', 'nodejs', 'rust'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-md transition-all ${
                          language === lang ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500 hover:text-white'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                 </div>
                 <button 
                    onClick={handleExecute}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95"
                 >
                    Executar Código
                 </button>
             </div>
             
             <CodeEditor 
                value={input}
                onChange={setInput}
                language={language}
                height="200px"
             />
          </div>
        </div>
      </div>
    </div>
  )
}

function AgentItem({ role, desc, icon, color, status }: { role: string; desc: string; icon: string; color: string; status: string }) {
  const isActive = status === 'Ativo';
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/40 border border-slate-800 hover:border-[var(--syn-primary)]/30 transition-all group">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br ${color} shadow-lg group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-white text-sm">{role}</h4>
        <p className="text-[10px] text-slate-500 leading-tight mt-1">{desc}</p>
      </div>
      <div className={`text-[9px] font-black uppercase px-2 py-1 rounded ${isActive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
        {status}
      </div>
    </div>
  )
}
