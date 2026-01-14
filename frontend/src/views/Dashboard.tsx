import React, { useEffect, useState } from 'react'
import authClient from '../api/authClient'

interface SessionSummary {
  id: number
  lesson: number
  status: string
  started_at: string
}

interface DashboardProps {
  token: string
}

export default function Dashboard({ token }: DashboardProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [stats, setStats] = useState({
    active_courses: 0,
    lessons_today: 0,
    total_students: 0,
    total_materials: 0
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    
    // Fetch stats and sessions in parallel
    Promise.all([
      authClient.fetchSessions(token),
      authClient.fetchStats()
    ]).then(([sessionsData, statsData]) => {
      if (isMounted) {
        if (sessionsData) setSessions(sessionsData)
        if (statsData) setStats(statsData)
      }
    }).finally(() => {
      if (isMounted) setLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [token])

  return (
    <div className="space-y-8">
      {/* AI Insight Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 flex items-center gap-6 group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--syn-primary)]/10 blur-[100px] rounded-full -mr-20 -mt-20"></div>
        <div className="h-16 w-16 rounded-2xl bg-[var(--syn-primary)]/20 flex items-center justify-center text-[var(--syn-primary)] text-3xl shadow-inner border border-[var(--syn-primary)]/20 group-hover:scale-110 transition-transform duration-500">
           <i className="bx bxs-magic-wand"></i>
        </div>
        <div className="relative z-10 flex-1">
          <h3 className="text-xl font-bold text-white mb-2">Synapse AI Insights</h3>
          <p className="text-slate-400 max-w-2xl leading-relaxed">
            Sua taxa de conclusão aumentou <span className="text-emerald-400 font-bold">12.5%</span> esta semana. 
            Sugerimos focar no módulo de <span className="text-[var(--syn-primary)] font-semibold">Redes Neurais</span> para o próximo sprint.
          </p>
        </div>
        <button 
          disabled
          className="relative z-10 bg-slate-800/50 text-slate-500 px-6 py-3 rounded-xl text-xs font-bold border border-slate-700 cursor-not-allowed flex items-center gap-2"
        >
          <span>Detalhes completos</span>
          <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-400 uppercase">Em breve</span>
        </button>
      </div>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Cursos ativos" value={stats.active_courses.toString().padStart(2, '0')} trend="+2" />
        <Card label="Aulas hoje" value={stats.lessons_today.toString().padStart(2, '0')} trend="estável" />
        <Card label="Alunos" value={stats.total_students.toString().padStart(2, '0')} trend="+5" />
        <Card label="Materiais" value={stats.total_materials.toString().padStart(2, '0')} trend="-1" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 rounded-3xl bg-slate-900/50 backdrop-blur-sm p-8 border border-slate-800">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Live Monitoring</p>
              <h3 className="text-2xl font-bold text-white">Sessões Recentes</h3>
            </div>
            <button className="text-xs font-bold text-[var(--syn-primary)] hover:underline uppercase tracking-tighter" onClick={() => window.location.reload()}>Atualizar agora</button>
          </header>
          
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 w-full animate-pulse bg-slate-800 rounded-2xl border border-slate-700"></div>
              ))}
            </div>
          )}
          
          {!loading && sessions.length === 0 && (
            <div className="py-20 text-center">
               <i className="bx bx-scan text-5xl text-slate-700 mb-4"></i>
               <p className="text-slate-500 text-sm">Nenhuma sessão ativa encontrada.</p>
            </div>
          )}

          <div className="space-y-4">
            {sessions.map((session) => (
              <article key={session.id} className="rounded-2xl bg-slate-950/40 p-5 border border-slate-800 hover:border-[var(--syn-primary)]/30 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 group-hover:text-[var(--syn-primary)] transition-colors">
                    <i className="bx bx-brain"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Aula {session.lesson}</h4>
                    <p className="text-xs text-slate-500 uppercase tracking-tighter">Sessão #{session.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${session.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-400'}`}>
                    {session.status}
                  </span>
                  <p className="text-[10px] text-slate-600 mt-2 font-mono">{new Date(session.started_at).toLocaleTimeString()}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-slate-900/30 p-8 border border-slate-800 flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6">Atividade Recente</h3>
          <div className="space-y-6 flex-1">
            <ActivityItem text="Nova aula publicada em ML" time="12 min atrás" />
            <ActivityItem text="Material extra: RAG Setup" time="45 min atrás" />
            <ActivityItem text="Momento ao vivo agendado" time="2h atrás" />
            <ActivityItem text="Backup do sistema concluído" time="5h atrás" />
          </div>
          <button 
            disabled
            className="w-full mt-8 py-3 rounded-xl border border-slate-800 text-slate-600 text-[10px] font-bold uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-2"
          >
            Ver logs completos (Em breve)
          </button>
        </section>
      </div>
    </div>
  )
}

function Card({ label, value, trend }: { label: string; value: string; trend: string }) {
  const isUp = trend.startsWith('+');
  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 hover:border-slate-700 transition-all group">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-4xl font-black text-white group-hover:text-[var(--syn-primary)] transition-colors tracking-tighter">{value}</p>
        <div className={`text-[10px] font-bold px-2 py-1 rounded-lg ${isUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
          {trend}
        </div>
      </div>
    </div>
  )
}

function ActivityItem({ text, time }: { text: string; time: string }) {
  return (
    <div className="flex gap-4">
      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--syn-primary)] shrink-0 shadow-[0_0_10px_var(--syn-primary)]"></div>
      <div>
        <p className="text-sm text-slate-300 leading-tight">{text}</p>
        <p className="text-[10px] text-slate-600 mt-1">{time}</p>
      </div>
    </div>
  )
}

