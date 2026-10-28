import React, { useState, useEffect, useRef } from 'react'
import authClient from '../api/authClient'
import CodeEditor from '../components/CodeEditor'
import { useExecutionStream, ExecutionResult } from '../hooks/useExecutionStream'

interface ProblemDetail {
  id: number
  title: string
  description: string
  initial_code: string
  public_tests: string
}

interface EvaluationTurn {
  id?: number
  speaker: 'student' | 'llm'
  content: string
  timestamp?: string
  inference?: any
}

interface AssessmentSessionData {
  id: number
  status: 'active' | 'converged' | 'failed' | 'escalated'
  needs_human_intervention: boolean
  turns: EvaluationTurn[]
}

interface LessonDetail {
  id: number
  title: string
  content: string
  lesson_type: string
  video_url?: string
  problem?: ProblemDetail
}

interface LessonViewProps {
  lessonId: number
  onBack: () => void
}

export default function LessonView({ lessonId, onBack }: LessonViewProps) {
  const [lesson, setLesson] = useState<LessonDetail | null>(null)
  const [code, setCode] = useState('')
  const [activeTab, setActiveTab] = useState<'content' | 'sandbox' | 'socratic'>('content')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentSubmissionId, setCurrentSubmissionId] = useState<number | null>(null)

  // Socratic Assessment State
  const [session, setSession] = useState<AssessmentSessionData | null>(null)
  const [studentInput, setStudentInput] = useState('')
  const [socraticLoading, setSocraticLoading] = useState(false)

  // Sandbox Stream Hook
  const streamSessionId = `synapse-lesson-${lessonId}`
  const {
    status: streamStatus,
    logs: streamLogs,
    result: streamResult,
    execute,
    clearLogs,
  } = useExecutionStream({
    sessionId: streamSessionId,
    onFinish: (res: ExecutionResult) => {
      setSubmitting(false)
    },
  })

  const consoleEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    authClient
      .fetchLessonDetail(lessonId)
      .then((data: LessonDetail) => {
        setLesson(data)
        const savedDraft = localStorage.getItem(`synapse_lesson_draft_${lessonId}`)
        if (savedDraft) {
          setCode(savedDraft)
        } else if (data.problem?.initial_code) {
          setCode(data.problem.initial_code)
        }

        if (data.lesson_type === 'assessment') {
          setActiveTab('socratic')
        } else if (data.problem) {
          setActiveTab('sandbox')
        } else {
          setActiveTab('content')
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [lessonId])

  // Persist code draft
  useEffect(() => {
    if (code && lessonId) {
      localStorage.setItem(`synapse_lesson_draft_${lessonId}`, code)
    }
  }, [code, lessonId])

  // Scroll console to bottom on new logs
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [streamLogs])

  const handleResetCode = () => {
    if (lesson?.problem?.initial_code) {
      if (confirm('Deseja restaurar o código para o template inicial? As alterações não salvas serão perdidas.')) {
        setCode(lesson.problem.initial_code)
        localStorage.removeItem(`synapse_lesson_draft_${lessonId}`)
      }
    }
  }

  const handleExecuteSandbox = async () => {
    if (!lesson?.problem) return
    setSubmitting(true)
    clearLogs()

    try {
      const sub = await authClient.submitSolution(lesson.problem.id, code)
      setCurrentSubmissionId(sub.id)
      execute(code, 'python', sub.id)
    } catch (err: any) {
      console.error('Falha ao submeter solução:', err)
      alert(err.response?.data?.error || 'Erro ao despachar execução no sandbox.')
      setSubmitting(false)
    }
  }

  const handleStartSocratic = async () => {
    setSocraticLoading(true)
    try {
      const newSession = await authClient.createAssessmentSession(lessonId)
      setSession(newSession)
    } catch (err: any) {
      console.error('Falha ao iniciar sessão socrática:', err)
      alert(err.response?.data?.error || 'Erro ao inicializar sessão com o tutor de IA.')
    } finally {
      setSocraticLoading(false)
    }
  }

  const handleSendSocraticResponse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || !studentInput.trim() || socraticLoading) return

    const inputMsg = studentInput.trim()
    setStudentInput('')
    setSocraticLoading(true)

    // Optimistic user turn
    const optimisticTurn: EvaluationTurn = {
      speaker: 'student',
      content: inputMsg,
      timestamp: new Date().toISOString(),
    }

    setSession((prev) =>
      prev ? { ...prev, turns: [...prev.turns, optimisticTurn] } : null
    )

    try {
      const res = await authClient.respondAssessmentSession(session.id, inputMsg)
      const tutorTurn: EvaluationTurn = {
        speaker: 'llm',
        content: res.llm_response,
        timestamp: new Date().toISOString(),
      }
      setSession((prev) =>
        prev
          ? {
              ...prev,
              status: res.session_status,
              turns: [...prev.turns, tutorTurn],
            }
          : null
      )
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao processar resposta no tutor de IA.')
    } finally {
      setSocraticLoading(false)
    }
  }

  if (loading && !lesson) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400">
        <i className="bx bx-loader-alt bx-spin text-4xl mb-3 text-[var(--syn-primary)]"></i>
        <p className="font-medium text-sm">Carregando ambiente da aula...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      {/* Navigation & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl transition-all hover:border-slate-700"
        >
          <i className="bx bx-arrow-back text-lg"></i> Voltar ao Curso
        </button>

        <div className="flex items-center gap-2">
          {lesson?.lesson_type && (
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Tipo: {lesson.lesson_type}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('content')}
          className={`pb-3 px-4 text-xs font-bold uppercase transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'content'
              ? 'border-[var(--syn-primary)] text-[var(--syn-primary)]'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <i className="bx bx-book-open text-base"></i>
          Conteúdo & Teoria
        </button>

        {lesson?.problem && (
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`pb-3 px-4 text-xs font-bold uppercase transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'sandbox'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <i className="bx bx-code-alt text-base"></i>
            Laboratório Prático
          </button>
        )}

        <button
          onClick={() => setActiveTab('socratic')}
          className={`pb-3 px-4 text-xs font-bold uppercase transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'socratic'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <i className="bx bx-bot text-base"></i>
          Tutor Socrático (IA)
        </button>
      </div>

      {/* TAB 1: Theory / Video Content */}
      {activeTab === 'content' && (
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-8 backdrop-blur-sm shadow-xl">
          <h2 className="text-3xl font-black text-white mb-6 tracking-tight">{lesson?.title}</h2>

          {lesson?.lesson_type === 'video' && lesson.video_url && (
            <div className="aspect-video bg-black rounded-2xl mb-8 overflow-hidden border border-slate-800 shadow-2xl">
              <iframe src={lesson.video_url} className="w-full h-full" allowFullScreen></iframe>
            </div>
          )}

          <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-sm whitespace-pre-line">
            {lesson?.content}
          </div>

          {lesson?.problem && (
            <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveTab('sandbox')}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
              >
                Ir para o Desafio Prático <i className="bx bx-right-arrow-alt text-lg"></i>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Hands-on Sandbox */}
      {activeTab === 'sandbox' && lesson?.problem && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-8 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <i className="bx bx-terminal text-2xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{lesson.problem.title}</h3>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    Sandbox Isolado • Python 3
                  </span>
                </div>
              </div>

              <button
                onClick={handleResetCode}
                className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-1.5"
              >
                <i className="bx bx-refresh text-base"></i> Restaurar Código
              </button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-6">{lesson.problem.description}</p>

            {lesson.problem.public_tests && (
              <div className="mb-6 p-4 bg-slate-950/70 rounded-2xl border border-slate-800/80">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  <i className="bx bx-check-shield text-emerald-400"></i> Casos de Teste Públicos
                </div>
                <pre className="text-xs font-mono text-emerald-400/90 whitespace-pre-wrap">
                  {lesson.problem.public_tests}
                </pre>
              </div>
            )}

            {/* Code Editor */}
            <div className="rounded-2xl overflow-hidden border border-slate-800">
              <CodeEditor
                value={code}
                onChange={setCode}
                language="python"
                height="380px"
                theme="dark"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Ambiente de Execução Seguro (Loopback 127.0.0.1)
              </div>

              <button
                onClick={handleExecuteSandbox}
                disabled={submitting}
                className="px-8 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black uppercase transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <i className="bx bx-loader-alt bx-spin text-base"></i> Executando...
                  </>
                ) : (
                  <>
                    <i className="bx bx-play text-base"></i> Executar no Sandbox
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Real-time Execution Console & Output */}
          <div className="rounded-3xl bg-slate-950 border border-slate-800 p-6 font-mono text-xs shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 text-slate-400">
              <div className="flex items-center gap-2">
                <i className="bx bx-terminal text-lg text-indigo-400"></i>
                <span className="font-bold text-slate-300">Console de Execução</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                  Status: {streamStatus}
                </span>
              </div>

              {streamResult && (
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-lg font-bold text-[10px] uppercase border ${
                      streamResult.status === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {streamResult.status === 'success' ? '✓ Aprovado' : '✗ Falha no Teste'}
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    Código de saída: {streamResult.exit_code}
                  </span>
                </div>
              )}
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1 pr-2 scrollbar-thin">
              {streamLogs.length === 0 ? (
                <div className="text-slate-600 italic py-4">
                  Aguardando envio do código para compilação e teste unitário...
                </div>
              ) : (
                streamLogs.map((log, index) => {
                  let color = 'text-slate-300'
                  if (log.type === 'stderr') color = 'text-rose-400'
                  if (log.type === 'system') color = 'text-cyan-400'
                  if (log.type === 'result') color = 'text-emerald-400 font-bold'

                  return (
                    <div key={index} className={`${color} whitespace-pre-wrap leading-relaxed`}>
                      {log.content}
                    </div>
                  )
                })
              )}
              <div ref={consoleEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Socratic Assessment Dialogue */}
      {activeTab === 'socratic' && (
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-8 backdrop-blur-sm shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <h3 className="text-xl font-black text-white">Tutor Cognitivo Socrático</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Motor Polaris & Gemma-3 avaliando compreensão conceitual e raciocínio crítico em tempo real.
              </p>
            </div>

            {session && (
              <div className="flex items-center gap-2">
                {session.needs_human_intervention && (
                  <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase flex items-center gap-1">
                    <i className="bx bx-user-voice"></i> Escalonado para Tutor Humano
                  </span>
                )}
                <span
                  className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase border ${
                    session.status === 'converged'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  }`}
                >
                  Sessão: {session.status}
                </span>
              </div>
            )}
          </div>

          {!session ? (
            <div className="text-center py-16 space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-3xl">
                <i className="bx bx-conversation"></i>
              </div>
              <h4 className="text-lg font-bold text-white">Pronto para a sabatina socrática?</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Neste modo, a IA não te dá respostas prontas. Ela desafia suas premissas de arquitetura,
                design de software e algoritmos até atingir a convergência do conhecimento.
              </p>
              <button
                onClick={handleStartSocratic}
                disabled={socraticLoading}
                className="mt-2 px-8 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                {socraticLoading ? 'Iniciando Sessão...' : 'Iniciar Diálogo Socrático'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Turns History */}
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin">
                {session.turns.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 text-xs text-cyan-300">
                    O Tutor Cognitivo está aguardando suas considerações sobre o tema desta aula.
                  </div>
                ) : (
                  session.turns.map((turn, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${turn.speaker === 'student' ? 'justify-end' : 'justify-start'}`}
                    >
                      {turn.speaker === 'llm' && (
                        <div className="h-8 w-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 text-lg">
                          <i className="bx bx-bot"></i>
                        </div>
                      )}
                      <div
                        className={`p-4 rounded-2xl text-xs max-w-xl leading-relaxed ${
                          turn.speaker === 'student'
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none'
                        }`}
                      >
                        <div className="text-[10px] font-bold uppercase mb-1 opacity-70">
                          {turn.speaker === 'student' ? 'Você' : 'Tutor Socrático'}
                        </div>
                        {turn.content}
                      </div>
                      {turn.speaker === 'student' && (
                        <div className="h-8 w-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 text-lg">
                          <i className="bx bx-user"></i>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Response input */}
              <form onSubmit={handleSendSocraticResponse} className="flex gap-2">
                <input
                  type="text"
                  value={studentInput}
                  onChange={(e) => setStudentInput(e.target.value)}
                  placeholder="Escreva sua resposta ou reflexão conceitual..."
                  disabled={socraticLoading || session.status === 'converged'}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:border-cyan-500 outline-none transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={socraticLoading || !studentInput.trim() || session.status === 'converged'}
                  className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
                >
                  {socraticLoading ? (
                    <i className="bx bx-loader-alt bx-spin text-base"></i>
                  ) : (
                    <i className="bx bx-send text-base"></i>
                  )}
                  Enviar
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
