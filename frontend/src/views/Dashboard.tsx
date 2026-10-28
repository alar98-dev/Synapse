import React, { useEffect, useState } from 'react'
import authClient, { UserStats, CognitiveProfileData } from '../api/authClient'

interface SessionSummary {
  id: number
  lesson: number
  status: string
  started_at: string
}

interface DashboardProps {
  token?: string
}

export default function Dashboard({ token }: DashboardProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [stats, setStats] = useState({
    active_courses: 0,
    lessons_today: 0,
    total_students: 0,
    total_materials: 0,
  })
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [profile, setProfile] = useState<CognitiveProfileData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    // Fetch stats, user gamification metrics, sessions and live cognitive profile in parallel
    Promise.allSettled([
      authClient.fetchSessions(),
      authClient.fetchStats(),
      authClient.fetchUserStats(),
      authClient.fetchCognitiveProfile(),
    ])
      .then(([sessionsRes, statsRes, userStatsRes, profileRes]) => {
        if (!isMounted) return

        if (sessionsRes.status === 'fulfilled' && sessionsRes.value) {
          setSessions(sessionsRes.value)
        }
        if (statsRes.status === 'fulfilled' && statsRes.value) {
          setStats(statsRes.value)
        }
        if (userStatsRes.status === 'fulfilled' && userStatsRes.value) {
          setUserStats(userStatsRes.value)
        }
        if (profileRes.status === 'fulfilled' && profileRes.value) {
          setProfile(profileRes.value)
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [token])

  return (
    <div className="space-y-8 pb-16">
      {/* Gamification & Learner Streak Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800 p-8 flex flex-wrap items-center justify-between gap-6 group backdrop-blur-md shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--syn-primary)]/10 blur-[100px] rounded-full -mr-20 -mt-20"></div>

        <div className="flex items-center gap-6 relative z-10">
          <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-3xl shadow-inner group-hover:scale-110 transition-transform duration-500">
            <i className="bx bxs-flame"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                Ofensiva de Aprendizagem
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
              <span className="text-xs text-slate-400 font-medium">
                {userStats?.username ? `@${userStats.username}` : 'Estudante'}
              </span>
            </div>
            <h3 className="text-3xl font-black text-white mt-1">
              {userStats?.study_streak_days ?? 0} {userStats?.study_streak_days === 1 ? 'Dia Seguido' : 'Dias Seguidos'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              Continue submetendo código e interagindo com o tutor socrático diariamente para manter seu ritmo de evolução ativo.
            </p>
          </div>
        </div>

        {/* Quick User Badges */}
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 text-center min-w-[110px]">
            <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Matrículas</p>
            <p className="text-2xl font-black text-white mt-1">{userStats?.enrolled_courses_count ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 text-center min-w-[110px]">
            <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Aprovações</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              {userStats?.successful_submissions_count ?? 0}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 text-center min-w-[110px]">
            <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Grupo RBAC</p>
            <p className="text-xs font-bold text-cyan-400 mt-2 line-clamp-1">
              {userStats?.groups?.[0] || 'Student'}
            </p>
          </div>
        </div>
      </div>

      {/* Global Metrics Cards */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Cursos ativos" value={stats.active_courses.toString().padStart(2, '0')} trend="+6 no catálogo" />
        <Card label="Aulas hoje" value={stats.lessons_today.toString().padStart(2, '0')} trend="estável" />
        <Card label="Alunos matriculados" value={stats.total_students.toString().padStart(2, '0')} trend="ativos" />
        <Card label="Materiais & Labs" value={stats.total_materials.toString().padStart(2, '0')} trend="disponíveis" />
      </section>

      {/* Main Grid: Sessions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 rounded-3xl bg-slate-900/50 backdrop-blur-sm p-8 border border-slate-800 shadow-xl">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">
                Monitoramento Cognitivo
              </p>
              <h3 className="text-2xl font-bold text-white">Sessões Recentes de Avaliação</h3>
            </div>
            <button
              className="text-xs font-bold text-[var(--syn-primary)] hover:underline uppercase tracking-tighter"
              onClick={() => window.location.reload()}
            >
              Atualizar
            </button>
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
              <i className="bx bx-brain text-5xl text-slate-700 mb-4"></i>
              <p className="text-slate-500 text-sm">Nenhuma sessão ativa de avaliação cognitiva encontrada.</p>
              <p className="text-xs text-slate-600 mt-1">
                Acesse uma lição e inicie o Tutor Socrático para gerar métricas de raciocínio.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {sessions.map((session) => (
              <article
                key={session.id}
                className="rounded-2xl bg-slate-950/40 p-5 border border-slate-800 hover:border-[var(--syn-primary)]/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 group-hover:text-[var(--syn-primary)] transition-colors">
                    <i className="bx bx-brain text-lg"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Aula #{session.lesson}</h4>
                    <p className="text-xs text-slate-500 uppercase tracking-tighter">Sessão #{session.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase border ${
                      session.status === 'converged'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : session.status === 'active'
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {session.status}
                  </span>
                  <p className="text-[10px] text-slate-600 mt-2 font-mono">
                    {session.started_at ? new Date(session.started_at).toLocaleTimeString() : 'N/A'}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Sidebar Activity & Cognitive Profile */}
        <section className="rounded-3xl bg-slate-900/40 p-8 border border-slate-800 flex flex-col justify-between shadow-xl space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <i className="bx bx-radar text-xl text-cyan-400"></i>
                <h3 className="text-lg font-bold text-white">Perfil Cognitivo (IA)</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {profile?.convergence_rate ? `${profile.convergence_rate}% Conv.` : 'Ativo'}
              </span>
            </div>
            
            <div className="space-y-3.5 mb-6">
              <div>
                <div className="flex justify-between text-[11px] font-bold mb-1">
                  <span className="text-slate-400">Compreensão Conceitual</span>
                  <span className="text-cyan-400">{profile?.conceptual_understanding ?? 75}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full transition-all duration-700"
                    style={{ width: `${profile?.conceptual_understanding ?? 75}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold mb-1">
                  <span className="text-slate-400">Raciocínio Causal & Lógica</span>
                  <span className="text-indigo-400">{profile?.causal_reasoning ?? 70}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-400 rounded-full transition-all duration-700"
                    style={{ width: `${profile?.causal_reasoning ?? 70}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold mb-1">
                  <span className="text-slate-400">Transferência de Domínio</span>
                  <span className="text-purple-400">{profile?.transfer_ability ?? 65}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-400 rounded-full transition-all duration-700"
                    style={{ width: `${profile?.transfer_ability ?? 65}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold mb-1">
                  <span className="text-slate-400">Detecção de Anomalias / Debug</span>
                  <span className="text-emerald-400">{profile?.error_detection ?? 80}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                    style={{ width: `${profile?.error_detection ?? 80}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-3">Atividade Pedagógica</h3>
            <div className="space-y-3">
              <ActivityItem text="Catálogo expandido com 6 especializações" time="Recente" />
              <ActivityItem text="Suporte ao Sandbox com streaming lock-free" time="Hoje" />
              <ActivityItem text="Tutor Socrático Polaris 127.0.0.1 ativo" time="Ativo" />
              <ActivityItem text="Perfil cognitivo integrado com dados reais" time="Novo" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-xs text-indigo-300">
            <div className="flex items-center gap-2 font-bold mb-1">
              <i className="bx bx-info-circle"></i> Arquitetura Loopback
            </div>
            Synapse opera em isolamento seguro sem dependências de IPs externos.
          </div>
        </section>
      </div>
    </div>
  )
}

function Card({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6 hover:border-slate-700 transition-all group backdrop-blur-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-4xl font-black text-white group-hover:text-[var(--syn-primary)] transition-colors tracking-tighter">
          {value}
        </p>
        <div className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-400 border border-slate-700">
          {trend}
        </div>
      </div>
    </div>
  )
}

function ActivityItem({ text, time }: { text: string; time: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="mt-1.5 h-2 w-2 rounded-full bg-[var(--syn-primary)] shrink-0 shadow-[0_0_8px_var(--syn-primary)]"></div>
      <div>
        <p className="text-xs text-slate-300 leading-tight font-medium">{text}</p>
        <p className="text-[10px] text-slate-600 mt-1 font-mono">{time}</p>
      </div>
    </div>
  )
}
