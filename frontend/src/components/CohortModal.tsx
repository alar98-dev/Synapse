import React, { useState } from 'react'
import coursesApi from '../../api/courses'

interface CohortModalProps {
  courseId: number
  courseTitle: string
  onClose: () => void
  onSuccess: () => void
}

export default function CohortModal({ courseId, courseTitle, onClose, onSuccess }: CohortModalProps) {
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [capacity, setCapacity] = useState(30)
  const [emails, setEmails] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<1 | 2>(1) // 1: Info, 2: Bulk Invite

  const handleCreate = async () => {
    setLoading(true)
    try {
      const cohort = await coursesApi.createCohort({
        course: courseId,
        title,
        start_date: startDate,
        end_date: endDate,
        capacity
      })
      
      if (emails.trim()) {
        const emailList = emails.split(',').map(e => e.trim()).filter(e => e !== '')
        await coursesApi.bulkInvite(cohort.id, emailList)
      }
      
      onSuccess()
      onClose()
    } catch (err) {
      console.error(err)
      alert('Erro ao criar turma ou processar convites.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      // Basic CSV parsing (comma or newline)
      const list = text.split(/[,\n]/).map(e => e.trim()).filter(e => e.includes('@'))
      setEmails(list.join(', '))
    }
    reader.readAsText(file)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <header className="p-8 border-b border-slate-800 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold text-[var(--syn-primary)] uppercase tracking-[0.3em] mb-1">Provisionamento de Turma</p>
            <h3 className="text-2xl font-black text-white tracking-tighter">{courseTitle}</h3>
          </div>
          <button onClick={onClose} className="h-10 w-10 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
            <i className="bx bx-x text-2xl"></i>
          </button>
        </header>

        <div className="p-8 space-y-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nome da Turma</label>
                  <input 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--syn-primary)] outline-none"
                    placeholder="Ex: Turma Alpha 2026"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Início</label>
                    <input 
                      type="date"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--syn-primary)] outline-none"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Término</label>
                    <input 
                      type="date"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--syn-primary)] outline-none"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Capacidade Máxima</label>
                  <input 
                    type="number"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--syn-primary)] outline-none"
                    value={capacity}
                    onChange={e => setCapacity(parseInt(e.target.value))}
                  />
                </div>
              </div>
              <button 
                onClick={() => setStep(2)}
                disabled={!title || !startDate || !endDate}
                className="w-full py-4 bg-[var(--syn-primary)] text-slate-950 font-black uppercase tracking-tighter rounded-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
              >
                Próximo: Convites
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">
                  <span>Emails dos Alunos (separados por vírgula)</span>
                  <span className="text-[var(--syn-primary)]">Opcional</span>
                </label>
                <textarea 
                  className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--syn-primary)] outline-none resize-none"
                  placeholder="aluno1@email.com, aluno2@email.com..."
                  value={emails}
                  onChange={e => setEmails(e.target.value)}
                />
              </div>
              
              <div className="relative">
                <input 
                  type="file" 
                  accept=".csv,.txt" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full py-4 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 group-hover:border-slate-700 transition-colors">
                  <i className="bx bx-upload text-2xl mb-1"></i>
                  <span className="text-[10px] font-bold uppercase">Ou faça upload de um CSV</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setStep(1)}
                  className="px-6 py-4 bg-slate-800 text-slate-400 font-bold uppercase text-xs rounded-2xl hover:text-white transition-colors"
                >
                  Voltar
                </button>
                <button 
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex-1 py-4 bg-[var(--syn-primary)] text-slate-950 font-black uppercase tracking-tighter rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[var(--syn-primary)]/10"
                >
                  {loading ? 'Processando...' : 'Finalizar Provisionamento'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
