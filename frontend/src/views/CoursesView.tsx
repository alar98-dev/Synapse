import React, { useEffect, useState } from 'react'
import coursesApi, { Course } from '../api/courses'
import CohortModal from '../components/CohortModal'

interface CoursesViewProps {
  onOpenCourse: (id: number, title?: string) => void
}

export default function CoursesView({ onOpenCourse }: CoursesViewProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'published'>('all')
  const [loading, setLoading] = useState(false)
  const [selectedForCohort, setSelectedForCohort] = useState<{id: number, title: string} | null>(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    
    const filters = {
      search: search || undefined,
      is_published: filter === 'published' ? true : undefined
    }

    coursesApi
      .list(filters)
      .then((data) => {
        if (isMounted) {
          setCourses(data)
        }
      })
      .catch(() => {
        if (isMounted) setCourses([])
      })
      .finally(() => setLoading(false))
    return () => {
      isMounted = false
    }
  }, [search, filter])

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[var(--syn-primary)] uppercase tracking-widest mb-1">Portfolio de cursos</p>
          <h3 className="text-3xl font-black text-white tracking-tighter">Gerenciamento</h3>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Ações desabilitadas</span>
           <button 
             disabled
             className="rounded-xl px-6 py-3 bg-slate-800 text-slate-500 font-bold text-sm border border-slate-700 cursor-not-allowed opacity-60"
           >
             + Criar novo curso
           </button>
        </div>
      </header>
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm p-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="relative">
            <i className="bx bx-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
            <input
              className="w-64 rounded-xl border border-slate-800 bg-slate-950/50 pl-10 pr-4 py-2 text-sm text-white focus:border-[var(--syn-primary)] outline-none transition-colors"
              placeholder="Buscar curso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             <button 
               onClick={() => setFilter('all')}
               className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800'}`}
             >
               Todos
             </button>
             <button 
               onClick={() => setFilter('published')}
               className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${filter === 'published' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800'}`}
             >
               Publicados
             </button>
          </div>
        </div>
        
        {loading && (
          <div className="grid gap-6 md:grid-cols-2">
            {[1,2,3,4].map(i => <div key={i} className="h-40 animate-pulse bg-slate-800/50 rounded-2xl border border-slate-800"></div>)}
          </div>
        )}
        
        {!loading && courses.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl">
            <i className="bx bx-book-add text-5xl text-slate-800 mb-4"></i>
            <p className="text-slate-500">Nenhum curso encontrado para sua busca.</p>
          </div>
        )}
        
        <div className="grid gap-6 md:grid-cols-2">
          {courses.map((course) => (
            <article key={course.id} className="group rounded-3xl bg-slate-950/50 p-6 border border-slate-800 hover:border-[var(--syn-primary)]/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                   <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${course.is_published ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {course.is_published ? 'Publicado' : 'Draft'}
                  </span>
                  <i className="bx bx-dots-horizontal-rounded text-slate-600"></i>
                </div>
                <h4 className="text-xl font-bold text-white group-hover:text-[var(--syn-primary)] transition-colors line-clamp-1">{course.title}</h4>
                <p className="mt-2 text-xs text-slate-500 font-medium">Contém {course.enrolled_count} alunos inscritos</p>
              </div>
              
              <div className="mt-8 flex items-center justify-between">
                <div className="flex -space-x-2">
                   {[1,2,3].map(i => <div key={i} className="h-6 w-6 rounded-full bg-slate-800 border-2 border-slate-950"></div>)}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedForCohort({id: course.id, title: course.title})}
                    title="Novo Cohort"
                    className="p-2 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-[var(--syn-primary)] transition-colors flex items-center gap-2"
                  >
                    <i className="bx bx-group"></i>
                    <span className="text-[10px] font-bold uppercase">+ Turma</span>
                  </button>
                  <button 
                    onClick={() => onOpenCourse(course.id, course.title)}
                    className="px-4 py-2 rounded-lg bg-[var(--syn-primary)] text-slate-950 text-[10px] font-bold uppercase hover:scale-105 transition-transform"
                  >
                    Visualizar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {selectedForCohort && (
        <CohortModal 
          courseId={selectedForCohort.id} 
          courseTitle={selectedForCohort.title}
          onClose={() => setSelectedForCohort(null)}
          onSuccess={() => {
            alert('Turma provisionada com sucesso!')
            // Optional: refresh list if count depends on it
          }}
        />
      )}
    </div>
  )
}
