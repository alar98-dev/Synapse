import React, { useEffect, useState } from 'react'
import coursesApi, { Course } from '../api/courses'
import CohortModal from '../components/CohortModal'

interface CoursesViewProps {
  onOpenCourse: (id: number, title?: string) => void
}

export default function CoursesView({ onOpenCourse }: CoursesViewProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'free' | 'premium'>('all')
  const [loading, setLoading] = useState(false)
  const [enrollingId, setEnrollingId] = useState<number | null>(null)
  const [selectedForCohort, setSelectedForCohort] = useState<{id: number, title: string} | null>(null)

  const fetchCourses = () => {
    setLoading(true)
    const filters: any = {
      search: search || undefined,
      is_published: true,
    }
    if (filter === 'free') {
      filters.max_price = 0
    }

    coursesApi
      .list(filters)
      .then((data) => {
        let result = data
        if (filter === 'free') {
          result = data.filter((c) => parseFloat(c.price || '0') === 0)
        } else if (filter === 'premium') {
          result = data.filter((c) => parseFloat(c.price || '0') > 0)
        }
        setCourses(result)
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchCourses()
  }, [search, filter])

  const handleEnrollFree = async (courseId: number) => {
    setEnrollingId(courseId)
    try {
      await coursesApi.enroll(courseId)
      // Optimistic state update
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId ? { ...c, is_enrolled: true, enrolled_count: (c.enrolled_count || 0) + 1 } : c
        )
      )
    } catch (err: any) {
      alert(err.response?.data?.error || 'Não foi possível completar a inscrição.')
    } finally {
      setEnrollingId(null)
    }
  }

  const getLevelBadge = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return { label: 'Iniciante', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
      case 'intermediate':
        return { label: 'Intermediário', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
      case 'advanced':
        return { label: 'Avançado', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
      default:
        return { label: level || 'Geral', bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20' }
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[var(--syn-primary)] uppercase tracking-widest mb-1">
            Catálogo & Aprendizagem Ativa
          </p>
          <h3 className="text-3xl font-black text-white tracking-tighter">Cursos & Especializações</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {courses.length} Cursos Ativos
          </span>
        </div>
      </header>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm p-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="relative">
            <i className="bx bx-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
            <input
              className="w-64 rounded-xl border border-slate-800 bg-slate-950/50 pl-10 pr-4 py-2 text-sm text-white focus:border-[var(--syn-primary)] outline-none transition-colors"
              placeholder="Buscar curso por título ou tecnologia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition-all border ${
                filter === 'all'
                  ? 'bg-[var(--syn-primary)] text-slate-950 border-[var(--syn-primary)] shadow-lg shadow-[var(--syn-primary)]/20 font-black'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('free')}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition-all border ${
                filter === 'free'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-lg shadow-emerald-500/20 font-black'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <i className="bx bx-gift mr-1"></i> Gratuitos (Freemium)
            </button>
            <button
              onClick={() => setFilter('premium')}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition-all border ${
                filter === 'premium'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-500 shadow-lg shadow-cyan-500/20 font-black'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <i className="bx bx-crown mr-1"></i> Premium
            </button>
          </div>
        </div>

        {loading && (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 animate-pulse bg-slate-800/50 rounded-2xl border border-slate-800"></div>
            ))}
          </div>
        )}

        {!loading && courses.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl">
            <i className="bx bx-book-open text-5xl text-slate-700 mb-4"></i>
            <p className="text-slate-400 font-medium">Nenhum curso encontrado no catálogo para este filtro.</p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {courses.map((course) => {
            const isFree = parseFloat(course.price || '0') === 0
            const levelInfo = getLevelBadge(course.level)

            return (
              <article
                key={course.id}
                className="group rounded-3xl bg-slate-950/60 p-6 border border-slate-800/80 hover:border-[var(--syn-primary)]/50 transition-all flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${levelInfo.bg}`}>
                        {levelInfo.label}
                      </span>
                      {isFree ? (
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <i className="bx bx-check-circle"></i> Gratuito
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                          <i className="bx bx-crown"></i> R$ {course.price}
                        </span>
                      )}
                      {course.certificate && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                          <i className="bx bx-award"></i> Certificado
                        </span>
                      )}
                    </div>
                    {course.is_enrolled && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <i className="bx bx-check"></i> Matriculado
                      </span>
                    )}
                  </div>

                  <h4 className="text-xl font-bold text-white group-hover:text-[var(--syn-primary)] transition-colors line-clamp-1 mb-2">
                    {course.title}
                  </h4>
                  <p className="text-xs text-slate-400 font-normal line-clamp-2 mb-4 leading-relaxed">
                    {course.description || 'Desenvolva competências práticas com sandboxes reais e mentoria socrática.'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <i className="bx bx-user text-slate-400"></i>
                      {course.enrolled_count || 0} alunos
                    </span>
                    {course.slug && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-600 font-mono">
                        #{course.slug}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedForCohort({ id: course.id, title: course.title })}
                    title="Provisionar Turma"
                    className="p-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-[var(--syn-primary)] hover:border-slate-700 transition-all flex items-center gap-2"
                  >
                    <i className="bx bx-group"></i>
                    <span className="text-[10px] font-bold uppercase">+ Turma</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {course.is_enrolled ? (
                      <button
                        onClick={() => onOpenCourse(course.id, course.title)}
                        className="px-5 py-2.5 rounded-xl bg-[var(--syn-primary)] text-slate-950 text-xs font-black uppercase hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[var(--syn-primary)]/20 flex items-center gap-1.5"
                      >
                        <i className="bx bx-play-circle text-base"></i>
                        Acessar Curso
                      </button>
                    ) : isFree ? (
                      <button
                        onClick={() => handleEnrollFree(course.id)}
                        disabled={enrollingId === course.id}
                        className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                      >
                        <i className="bx bx-plus-circle text-base"></i>
                        {enrollingId === course.id ? 'Matriculando...' : 'Matricular Grátis'}
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          alert(
                            `Curso Premium: "${course.title}". Matrícula liberada via checkout ou acesso institucional.`
                          )
                        }
                        className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black uppercase hover:scale-105 active:scale-95 transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
                      >
                        <i className="bx bx-lock-open text-base"></i>
                        Adquirir Curso
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      {selectedForCohort && (
        <CohortModal
          courseId={selectedForCohort.id}
          courseTitle={selectedForCohort.title}
          onClose={() => setSelectedForCohort(null)}
          onSuccess={() => {
            alert('Turma provisionada com sucesso!')
            fetchCourses()
          }}
        />
      )}
    </div>
  )
}
