import React, { useEffect, useState } from 'react'
import authClient from '../api/authClient'
import coursesApi, { CertificateData } from '../api/courses'
import paymentsApi from '../api/paymentsApi'
import Leaderboard from '../components/Leaderboard'
import CertificateModal from '../components/CertificateModal'

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

export default function CourseDetailView({
  courseId,
  onBack,
  onOpenLesson,
  onEditLesson,
  userRole,
}: CourseDetailViewProps) {
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState<'content' | 'leaderboard'>('content')
  const [selectedCohortId, setSelectedCohortId] = useState<number | null>(null)

  // Certificate State
  const [certEligibility, setCertEligibility] = useState<CertificateData | null>(null)
  const [showCertModal, setShowCertModal] = useState(false)
  const [claimingCert, setClaimingCert] = useState(false)

  const loadData = () => {
    setLoading(true)
    Promise.allSettled([
      authClient.fetchCourseDetail(courseId),
      coursesApi.getCertificateEligibility(courseId),
    ])
      .then(([courseRes, certRes]) => {
        if (courseRes.status === 'fulfilled') {
          setCourse(courseRes.value)
          if (courseRes.value?.cohorts?.length > 0) {
            setSelectedCohortId(courseRes.value.cohorts[0].id)
          }
        }
        if (certRes.status === 'fulfilled') {
          setCertEligibility(certRes.value)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
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
        loadData()
      }
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.error || 'Erro ao processar matrícula.')
    } finally {
      setProcessing(false)
    }
  }

  const handleClaimCertificate = async () => {
    setClaimingCert(true)
    try {
      const data = await coursesApi.claimCertificate(courseId)
      if (data.success) {
        setCertEligibility(data)
        setShowCertModal(true)
      } else {
        alert(data.error || 'Não foi possível emitir o certificado no momento.')
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao emitir certificado.')
    } finally {
      setClaimingCert(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 pt-10">
        <div className="h-10 w-1/3 bg-slate-800 rounded"></div>
        <div className="h-64 w-full bg-slate-800 rounded-3xl"></div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <h3 className="text-xl text-slate-400">Curso não encontrado.</h3>
        <button onClick={onBack} className="mt-4 text-[var(--syn-primary)] underline">
          Voltar para a lista
        </button>
      </div>
    )
  }

  const isFree = parseFloat(course.price) === 0
  const progressPercent = certEligibility?.progress_percentage ?? 0
  const isEligibleForCert = certEligibility?.is_eligible || certEligibility?.certificate_id

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors group"
      >
        <i className="bx bx-left-arrow-alt text-xl group-hover:-translate-x-1 transition-transform"></i>
        <span className="text-sm font-bold uppercase tracking-widest">Voltar para catálogo</span>
      </button>

      {/* Course Hero */}
      <header className="relative p-10 rounded-[2.5rem] bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--syn-primary)]/5 blur-[120px] rounded-full -mr-32 -mt-32"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-xs font-bold text-[var(--syn-primary)] uppercase tracking-[0.2em]">
                {isFree ? 'Acesso Gratuito (Freemium)' : `Investimento: R$ ${course.price}`}
              </span>
              {course.is_enrolled && (
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <i className="bx bx-check"></i> Aluno Matriculado
                </span>
              )}
            </div>

            <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">{course.title}</h2>
            <p className="text-slate-400 max-w-2xl leading-relaxed text-sm mb-4">
              {course.description || 'Especialização prática com sandboxes e avaliação cognitiva socrática.'}
            </p>

            {/* Learner Progress Bar if Enrolled */}
            {course.is_enrolled && (
              <div className="max-w-md mt-4">
                <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                  <span className="text-slate-400">Progresso do Curso</span>
                  <span className={progressPercent === 100 ? 'text-emerald-400' : 'text-[var(--syn-primary)]'}>
                    {progressPercent}% Concluído
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 ${
                      progressPercent === 100 ? 'bg-emerald-500' : 'bg-[var(--syn-primary)]'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 shrink-0">
            {!course.is_enrolled ? (
              <button
                disabled={processing}
                onClick={() => handleAction()}
                className="px-8 py-4 rounded-2xl font-black uppercase tracking-tight transition-all bg-[var(--syn-primary)] text-slate-950 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(var(--syn-primary-rgb),0.3)] disabled:opacity-50"
              >
                {processing
                  ? 'Processando...'
                  : isFree
                  ? 'Matricular-se Grátis'
                  : 'Comprar Curso'}
              </button>
            ) : isEligibleForCert ? (
              <button
                onClick={handleClaimCertificate}
                disabled={claimingCert}
                className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black uppercase text-xs tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-95"
              >
                <i className="bx bx-award text-lg"></i>
                {claimingCert ? 'Emitindo...' : 'Visualizar Certificado'}
              </button>
            ) : (
              <div className="px-6 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-bold text-center">
                Conclua 100% das aulas para certificar
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tabs: Content vs Leaderboard */}
      {course.is_enrolled && course.cohorts && course.cohorts.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-slate-800 w-fit">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === 'content' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-white'
              }`}
            >
              Conteúdo & Lições
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-[var(--syn-primary)] text-slate-950 font-black shadow-lg shadow-[var(--syn-primary)]/20'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              <i className="bx bx-trophy mr-1"></i> Ranking da Turma
            </button>
          </div>

          {course.cohorts.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-bold uppercase">Turma:</span>
              <select
                value={selectedCohortId || ''}
                onChange={(e) => setSelectedCohortId(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 outline-none"
              >
                {course.cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' ? (
        <div className="grid gap-6">
          {course.modules.length === 0 && (
            <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-3xl">
              <p className="text-slate-500 font-medium">Nenhum módulo cadastrado para este curso no momento.</p>
            </div>
          )}
          {course.modules.map((module) => (
            <div key={module.id} className="rounded-3xl border border-slate-800 bg-slate-950/50 overflow-hidden shadow-xl">
              <div className="p-6 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">{module.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{module.lessons.length} aulas disponíveis</p>
                </div>
              </div>
              <div className="divide-y divide-slate-800/60">
                {module.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    onClick={() => onOpenLesson(lesson.id, lesson.title)}
                    className="p-4 px-6 hover:bg-slate-900/50 cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-[var(--syn-primary)] transition-colors">
                        <i
                          className={`bx ${
                            lesson.lesson_type === 'video'
                              ? 'bx-play-circle'
                              : lesson.lesson_type === 'assessment'
                              ? 'bx-bot text-cyan-400'
                              : 'bx-code-alt'
                          }`}
                        ></i>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-300 group-hover:text-white block">
                          {lesson.title}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                          {lesson.lesson_type}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {userRole === 'teacher' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditLesson(lesson.id, lesson.title)
                          }}
                          className="text-[10px] font-bold text-slate-500 hover:text-indigo-400 uppercase tracking-widest border border-slate-800 px-3 py-1 rounded-lg transition-colors"
                        >
                          Editar
                        </button>
                      )}
                      <button className="text-[10px] font-bold text-slate-400 group-hover:text-[var(--syn-primary)] uppercase tracking-widest border border-slate-800 px-3 py-1 rounded-lg transition-colors">
                        Acessar Aula
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
          {selectedCohortId ? (
            <Leaderboard cohortId={selectedCohortId} />
          ) : (
            <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-500">
              Nenhuma turma vinculada para este curso.
            </div>
          )}
        </div>
      )}

      {/* Certificate Modal */}
      {showCertModal && certEligibility && (
        <CertificateModal
          certificate={certEligibility}
          onClose={() => setShowCertModal(false)}
        />
      )}
    </div>
  )
}
