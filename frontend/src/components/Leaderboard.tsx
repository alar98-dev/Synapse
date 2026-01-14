import React, { useEffect, useState } from 'react'
import coursesApi from '../api/courses'

interface LeaderboardEntry {
  username: string
  completed_lessons: number
  successful_submissions: number
  total_points: number
  role: string
}

interface LeaderboardProps {
  cohortId: number
}

export default function Leaderboard({ cohortId }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    coursesApi.getLeaderboard(cohortId)
      .then(data => setEntries(data))
      .catch(err => console.error('Failed to fetch leaderboard', err))
      .finally(() => setLoading(false))
  }, [cohortId])

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-12 bg-slate-900/50 rounded-xl border border-slate-800"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-900/80 border-b border-slate-800">
            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Posto</th>
            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estudante</th>
            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Aulas</th>
            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Labs</th>
            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Pontos</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {entries.map((entry, index) => (
            <tr key={entry.username} className={`group hover:bg-white/5 transition-colors ${index === 0 ? 'bg-[var(--syn-primary)]/5' : ''}`}>
              <td className="px-6 py-4">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-black ${
                  index === 0 ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' :
                  index === 1 ? 'bg-slate-300 text-slate-950' :
                  index === 2 ? 'bg-amber-700 text-white' :
                  'text-slate-500 group-hover:text-white'
                }`}>
                  {index + 1}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-inner">
                    {entry.username.substring(0, 2)}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">{entry.username}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-tighter">{entry.role || 'Estudante'}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <span className="text-sm text-slate-300 font-medium">{entry.completed_lessons}</span>
              </td>
              <td className="px-6 py-4 text-center">
                <span className="text-sm text-slate-300 font-medium">{entry.successful_submissions}</span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex flex-col items-end">
                   <span className="text-lg font-black text-white tracking-tighter">{entry.total_points}</span>
                   <div className="h-1 w-16 bg-slate-800 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-[var(--syn-primary)] transition-all duration-1000" style={{ width: `${Math.min((entry.total_points / (entries[0]?.total_points || 1)) * 100, 100)}%` }}></div>
                   </div>
                </div>
              </td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                Nenhuma atividade registrada nesta turma.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
