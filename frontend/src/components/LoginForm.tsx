import React, { useState } from 'react'

interface LoginFormProps {
  onLogin: (username: string, password: string) => void
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!username || !password) {
      setError('Informe usuário e senha')
      return
    }
    setError('')
    onLogin(username, password)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-sm bg-slate-900/40 p-8 rounded-3xl border border-slate-800 backdrop-blur-md shadow-2xl">
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Usuário de Acesso</label>
        <div className="relative">
          <i className="bx bx-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
          <input
            className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-11 pr-4 py-3 text-white focus:border-[var(--syn-primary)] focus:ring-1 focus:ring-[var(--syn-primary)]/20 outline-none transition-all placeholder:text-slate-700"
            placeholder="Seu username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Senha de Segurança</label>
        <div className="relative">
          <i className="bx bx-lock-alt absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
          <input
            type="password"
            className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-11 pr-4 py-3 text-white focus:border-[var(--syn-primary)] focus:ring-1 focus:ring-[var(--syn-primary)]/20 outline-none transition-all placeholder:text-slate-700"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-400 text-xs font-medium animate-shake">
          <i className="bx bx-error-circle"></i>
          <span>{error}</span>
        </div>
      )}
      <button
        type="submit"
        className="group relative w-full overflow-hidden rounded-xl bg-[var(--syn-primary)] py-4 text-sm font-black text-slate-950 shadow-lg shadow-[var(--syn-primary)]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <span className="relative z-10 flex items-center justify-center gap-2 uppercase tracking-widest">
          Autenticar Sistema <i className="bx bx-right-arrow-alt text-lg"></i>
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
      </button>
    </form>
  )
}
