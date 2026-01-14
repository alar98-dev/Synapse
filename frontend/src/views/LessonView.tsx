import React, { useState, useEffect } from 'react'
import authClient from '../api/authClient'
import CodeEditor from '../components/CodeEditor'

interface ProblemDetail {
  id: number
  title: string
  description: string
  initial_code: string
  public_tests: string
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
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    authClient.fetchLessonDetail(lessonId)
      .then(data => {
        setLesson(data)
        // Load persistency: Saved Draft > Initial Code
        const savedDraft = localStorage.getItem(`synapse_lesson_draft_${lessonId}`)
        if (savedDraft) {
          setCode(savedDraft)
        } else if (data.problem?.initial_code) {
          setCode(data.problem.initial_code)
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [lessonId])

  // Persist code draft
  useEffect(() => {
    if (code && lessonId) {
      localStorage.setItem(`synapse_lesson_draft_${lessonId}`, code)
    }
  }, [code, lessonId])

  if (loading && !lesson) return <div className="p-10 text-white">Carregando aula...</div>

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <button onClick={onBack} className="text-slate-500 hover:text-white flex items-center gap-2">
        <i className="bx bx-arrow-back"></i> Voltar
      </button>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8">
        <h2 className="text-3xl font-black text-white mb-6">{lesson?.title}</h2>
        {lesson?.lesson_type === 'video' && lesson.video_url && (
          <div className="aspect-video bg-black rounded-2xl mb-6 overflow-hidden border border-slate-800">
             <iframe 
               src={lesson.video_url} 
               className="w-full h-full" 
               allowFullScreen
             ></iframe>
          </div>
        )}
        <div className="prose prose-invert max-w-none text-slate-300">
          {lesson?.content}
        </div>
      </div>

      {lesson?.problem && (
        <div className="rounded-3xl bg-slate-950 border border-slate-800 p-8 mt-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <i className="bx bx-code-alt text-xl"></i>
            </div>
            <h3 className="text-xl font-bold text-white">Desafio: {lesson.problem.title}</h3>
          </div>

          <div className="mb-6 text-slate-400 text-sm">
            {lesson.problem.description}
          </div>

          {lesson.problem.public_tests && (
            <div className="mb-6 p-4 bg-slate-900 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Testes Visíveis</h4>
              <pre className="text-xs font-mono text-indigo-300 whitespace-pre-wrap">
                {lesson.problem.public_tests}
              </pre>
            </div>
          )}

          <CodeEditor 
             value={code}
             onChange={setCode}
             language="python"
             height="400px"
             theme="dark"
          />

          <div className="mt-6 flex justify-between items-center">
             <div className="text-xs text-slate-500">
                Pressione <kbd className="bg-slate-800 px-1 rounded">Tab</kbd> para indentar.
             </div>
             <button
               onClick={async () => {
                 setSubmitting(true)
                 try {
                   const res = await authClient.submitSolution(lesson.problem!.id, code)
                   setResult(res)
                 } catch (err) {
                   console.error(err)
                 } finally {
                   setSubmitting(false)
                 }
               }}
               disabled={submitting}
               className="bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
             >
               {submitting ? 'Enviando...' : 'Submeter Resposta'}
             </button>
          </div>

          {result && (
            <div className={`mt-6 p-4 rounded-xl border ${result.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
               <p className={`font-bold ${result.status === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                 {result.status === 'success' ? 'Sucesso!' : 'Falha na execução'}
               </p>
               <pre className="mt-2 text-xs font-mono text-slate-400 whitespace-pre-wrap">
                 {result.result_summary}
               </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
