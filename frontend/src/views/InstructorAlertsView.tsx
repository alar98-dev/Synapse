import React, { useEffect, useState } from 'react'
import authClient from '../api/authClient'

interface EscalatedSession {
  id: number
  user_detail: {
    username: string
    email: string
  }
  lesson_title: string
  status: string
  updated_at: string
}

interface AuditEntry {
  audit_id: string
  actor_id: string
  entity_type: string
  entity_id: string
  action: string
  details: any
  timestamp: string
}

export default function InstructorAlertsView() {
  const [sessions, setSessions] = useState<EscalatedSession[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'alerts' | 'telemetry'>('alerts')

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/v1/cognition/sessions/?status=escalated', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('synapse_token')}`
        }
      })
      const data = await response.json()
      setSessions(data)
    } catch (err) {
      console.error('Failed to fetch alerts', err)
    }
  }

  const fetchTelemetry = async () => {
    try {
      const data = await authClient.fetchAuditLogs()
      setAuditLogs(data)
    } catch (err) {
      console.error('Failed to fetch telemetry', err)
    }
  }

  const loadAll = async () => {
    setLoading(true)
    await Promise.all([fetchAlerts(), fetchTelemetry()])
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
    const interval = setInterval(() => {
      fetchAlerts()
      fetchTelemetry()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <p className="text-xs font-bold text-[var(--syn-primary)] uppercase tracking-[0.4em] mb-2">Central de Monitoramento</p>
          <h3 className="text-4xl font-black text-white tracking-tighter">Alertas & Telemetria</h3>
        </div>
        
        <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
          <button 
            onClick={() => setActiveTab('alerts')}
            className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'alerts' ? 'bg-[var(--syn-primary)] text-slate-950 shadow-lg shadow-[var(--syn-primary)]/20' : 'text-slate-500 hover:text-white'}`}
          >
            Intervenções ({sessions.length})
          </button>
          <button 
            onClick={() => setActiveTab('telemetry')}
            className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'telemetry' ? 'bg-[var(--syn-primary)] text-slate-950 shadow-lg shadow-[var(--syn-primary)]/20' : 'text-slate-500 hover:text-white'}`}
          >
            Logs de Auditoria
          </button>
        </div>
      </header>

      {activeTab === 'alerts' && (
        <div className="grid gap-4">
          {loading && sessions.length === 0 && (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-900 rounded-3xl border border-slate-800"></div>)}
            </div>
          )}

          {!loading && sessions.length === 0 && (
            <div className="py-20 text-center bg-slate-900/40 rounded-[2.5rem] border-2 border-dashed border-slate-800">
              <i className="bx bx-check-shield text-5xl text-emerald-500/20 mb-4"></i>
              <p className="text-slate-500 font-medium">Nenhuma sessão requer intervenção humana no momento.</p>
            </div>
          )}

          {sessions.map(session => (
            <div key={session.id} className="group relative p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 transition-all flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 text-xl border border-rose-500/20">
                  <i className="bx bx-error-alt"></i>
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">{session.user_detail?.username || 'Estudante'} está travado</h4>
                  <p className="text-slate-500 text-sm">Aula: <span className="text-slate-300 font-medium">{session.lesson_title || `ID: ${session.id}`}</span></p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                  <p className="text-[10px] uppercase font-bold text-slate-600 tracking-widest">Escalado em</p>
                  <p className="text-xs text-slate-400">{new Date(session.updated_at).toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => alert('Abrindo chat para intervenção...')}
                  className="px-6 py-3 rounded-xl bg-white text-slate-950 font-bold text-xs uppercase tracking-tighter hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-white/5"
                >
                  Intervir Agora
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'telemetry' && (
        <div className="rounded-[2.5rem] bg-slate-900 border border-slate-800 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Ação</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Entidade</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Ator</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Data/Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {auditLogs.map(log => (
                <tr key={log.audit_id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-8 py-4">
                    <span className="text-sm font-bold text-white block capitalize">{log.action.replace('_', ' ')}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{log.audit_id.substring(0, 8)}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-sm text-slate-300 block">{log.entity_type}</span>
                    <span className="text-[10px] text-slate-600">ID: {log.entity_id || 'N/A'}</span>
                  </td>
                  <td className="px-8 py-4 text-sm text-slate-300 font-medium">
                    {log.actor_id || 'Sistema'}
                  </td>
                  <td className="px-8 py-4 text-xs text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
              {!loading && auditLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-500">
                     Nenhum registro de auditoria encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
