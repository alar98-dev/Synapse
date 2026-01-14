import React, { useEffect, useState } from 'react'
import authClient from '../api/authClient'
import paymentsApi from '../api/paymentsApi'
import Leaderboard from '../components/Leaderboard'

interface CourseDetail {
  id: number
  title: string
  description: string
  price: string
  is_enrolled: boolean
  certificate?: {
    id_code: string
    issued_at: string
  }
  cohorts: {
    id: number
    title: string
    enrollment_open: boolean
    capacity: number
  }[]
  modules: {
    id: number
    title: string
    description: string
    lessons: {
      id: number
      title: string
      lesson_type: string
    }[]
  }[]
}

interface CourseDetailViewProps {
  courseId: number
  onBack: () => void
  onOpenLesson: (id: number, title?: string) => void
  onEditLesson: (id: number, title?: string) => void
  userRole: string | null
}

export default function CourseDetailView({ courseId, onBack, onOpenLesson, onEditLesson, userRole }: CourseDetailViewProps) {
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState<'content' | 'leaderboard'>('content')

  useEffect(() => {
    authClient.fetchCourseDetail(courseId)
      .then(data => setCourse(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [courseId])

  const handleAction = async (cohortId?: number) => {
    if (!course) return
    setProcessing(true)
    try {
      if (parseFloat(course.price) > 0 && !course.is_enrolled) {
        // Redirecionar para o Checkout do Stripe
        const session = await paymentsApi.createCheckoutSession(course.id)
        if (session.url) {
          window.location.href = session.url
        }
      } else {
        // Matrícula direta (curso gratuito ou já pago)
        await authClient.enrollInCourse(courseId, cohortId)
        setCourse({ ...course, is_enrolled: true })
        alert('Matrícula realizada com sucesso!')
      }
    } catch (err) {
      console.error(err)
      alert('Erro ao processar solicitação.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <div className="animate-pulse space-y-4 pt-10"><div className="h-10 w-1/3 bg-slate-800 rounded"></div><div className="h-64 w-full bg-slate-800 rounded-3xl"></div></div>

  if (!course) return (
    <div className="text-center py-20">
      <h3 className="text-xl text-slate-400">Curso não encontrado.</h3>
      <button onClick={onBack} className="mt-4 text-[var(--syn-primary)] underline">Voltar para a lista</button>
    </div>
  )

  const isFree = parseFloat(course.price) === 0

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors group">
        <i className="bx bx-left-arrow-alt text-xl group-hover:-translate-x-1 transition-transform"></i>
        <span className="text-sm font-bold uppercase tracking-widest">Voltar para portfólio</span>
      </button>

      <header className="relative p-10 rounded-[2.5rem] bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--syn-primary)]/5 blur-[120px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="text-xs font-bold text-[var(--syn-primary)] uppercase tracking-[0.3em]">{isFree ? 'Free Access' : `Value: $${course.price}`}</span>
            <h2 className="text-4xl font-black text-white mt-2 mb-4 tracking-tighter">{course.title}</h2>
            <p className="text-slate-400 max-w-2xl leading-relaxed">{course.description}</p>
          </div>
          <div className="flex flex-col gap-3">
            <button 
              disabled={course.is_enrolled || processing}
              onClick={() => handleAction()}
              className={`px-8 py-4 rounded-2xl font-black uppercase tracking-tighter transition-all ${
                course.is_enrolled 
                ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50' 
                : 'bg-[var(--syn-primary)] text-slate-950 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(var(--syn-primary-rgb),0.3)]'
              }`}
            >
              {processing ? 'Processando...' : course.is_enrolled ? 'Já Matriculado' : isFree ? 'Matricular-se Grátis' : 'Comprar Curso'}
            </button>

            {course.certificate && (
              <button 
                onClick={() => alert(`Certificado: ${course.certificate?.id_code}\nEmitido em: ${new Date(course.certificate?.issued_at || '').toLocaleDateString()}`)}
                className="flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold transition-all"
              >
                <i className="bx bx-certification text-xl"></i>
                Ver Certificado
              </button>
            )}
          </div>
        </div>
      </header>

      {course.is_enrolled && course.cohorts && course.cohorts.length > 0 && (
        <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-slate-800 w-fit">
          <button 
            onClick={() => setActiveTab('content')}
            className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'content' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            Conteúdo
          </button>
          <button 
            onClick={() => setActiveTab('leaderboard')}
            className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'leaderboard' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            Ranking da Turma
          </button>
        </div>
      )}

      {activeTab === 'content' ? (
        <div className="grid gap-6">
          {course.modules.length === 0 && (
            <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-3xl">
               <p className="text-slate-600 italic">Nenhum módulo cadastrado para este curso.</p>
            </div>
          )}
          {course.modules.map((module) => (
            <div key={module.id} className="rounded-3xl border border-slate-800 bg-slate-950/50 overflow-hidden">
              <div className="p-6 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">{module.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{module.lessons.length} aulas disponíveis</p>
                </div>
                <button disabled className="p-2 text-slate-600 hover:text-white">
                  <i className="bx bx-dots-vertical-rounded"></i>
                </button>
              </div>
              <div className="divide-y divide-slate-800">
                {module.lessons.map((lesson) => (
                  <div 
                    key={lesson.id} 
                    onClick={() => onOpenLesson(lesson.id, lesson.title)}
                    className="p-4 px-6 hover:bg-slate-900/50 cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-[var(--syn-primary)] transition-colors">
                         <i className={`bx ${lesson.lesson_type === 'video' ? 'bx-play-circle' : 'bx-file-blank'}`}></i>
                      </div>
                      <span className="text-sm font-medium text-slate-300 group-hover:text-white">{lesson.title}</span>
                    </div>
                    <div className="flex gap-2">
                      {userRole === 'teacher' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditLesson(lesson.id, lesson.title);
                          }}
                          className="text-[10px] font-bold text-slate-500 hover:text-indigo-400 uppercase tracking-widest border border-slate-800 px-3 py-1 rounded-lg transition-colors"
                        >
                          Editar
                        </button>
                      )}
                      <button className="text-[10px] font-bold text-slate-400 group-hover:text-[var(--syn-primary)] uppercase tracking-widest border border-slate-800 px-3 py-1 rounded-lg">
                        Acessar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <Leaderboard cohortId={course.cohorts[0].id} />
        </div>
      )}
    </div>
  )
}
