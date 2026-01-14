import React, { useMemo, useState, useEffect } from 'react'
import LoginForm from '../components/LoginForm'
import Dashboard from './Dashboard'
import CoursesView from './CoursesView'
import MaterialsView from './MaterialsView'
import AICenterView from './AICenterView'
import CourseDetailView from './CourseDetailView'
import LessonView from './LessonView'
import LessonEditorView from './LessonEditorView'
import InstructorAlertsView from './InstructorAlertsView'
import authClient from '../api/authClient'
import Breadcrumbs, { BreadcrumbItem } from '../components/elements/navigation/breadcrumbs/component'

export default function Layout() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('synapse_token'))
  const [view, setView] = useState<'dashboard' | 'courses' | 'materials' | 'ai-center' | 'course-detail' | 'lesson' | 'alerts' | 'lesson-edit'>('dashboard')
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [selectedCourseTitle, setSelectedCourseTitle] = useState<string | null>(null)
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null)
  const [selectedLessonTitle, setSelectedLessonTitle] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Fetch user profile on mount or token change
  useEffect(() => {
    if (token) {
      authClient.fetchCurrentUser()
        .then(user => setUserRole(user.role))
        .catch(() => setUserRole('student'))
    }
  }, [token])

  // Sync token with localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('synapse_token', token)
    } else {
      localStorage.removeItem('synapse_token')
    }
  }, [token])

  const handleLogin = async (username: string, password: string) => {
    try {
      const result = await authClient.login(username, password)
      if (result?.access) {
        setToken(result.access)
        setView('dashboard')
      }
    } catch (err) {
      console.error('Login failed', err)
      alert('Falha na autenticação. Verifique suas credenciais.')
    }
  }

  const handleLogout = () => {
    setToken(null)
    localStorage.removeItem('synapse_token')
  }

  const handleOpenCourse = (id: number, title?: string) => {
    setSelectedCourseId(id)
    if (title) setSelectedCourseTitle(title)
    setView('course-detail')
  }

  const handleOpenLesson = (id: number, title?: string) => {
    setSelectedLessonId(id)
    if (title) setSelectedLessonTitle(title)
    setView('lesson')
  }

  const handleEditLesson = (id: number, title?: string) => {
    setSelectedLessonId(id)
    if (title) setSelectedLessonTitle(title)
    setView('lesson-edit')
  }

  const breadcrumbs = useMemo((): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { label: 'Portal', onClick: () => setView('dashboard') }
    ]

    if (view === 'dashboard') {
      items.push({ label: 'Dashboard', active: true })
    } else if (view === 'courses') {
      items.push({ label: 'Meus Cursos', active: true })
    } else if (view === 'course-detail') {
      items.push({ label: 'Cursos', onClick: () => setView('courses') })
      items.push({ label: selectedCourseTitle || 'Detalhes do Curso', active: true })
    } else if (view === 'lesson') {
      items.push({ label: 'Cursos', onClick: () => setView('courses') })
      if (selectedCourseId) {
        items.push({ label: selectedCourseTitle || 'Curso', onClick: () => setView('course-detail') })
      }
      items.push({ label: selectedLessonTitle || 'Aula', active: true })
    } else if (view === 'lesson-edit') {
      items.push({ label: 'Cursos', onClick: () => setView('courses') })
      if (selectedCourseId) {
        items.push({ label: selectedCourseTitle || 'Curso', onClick: () => setView('course-detail') })
      }
      items.push({ label: (selectedLessonTitle || 'Aula') + ' (Editor)', active: true })
    } else if (view === 'ai-center') {
      items.push({ label: 'AI Center', active: true })
    } else if (view === 'materials') {
      items.push({ label: 'Materiais', active: true })
    } else if (view === 'alerts') {
      items.push({ label: 'Alertas', active: true })
    }

    return items
  }, [view, selectedCourseId, selectedCourseTitle, selectedLessonTitle])

  const navItems = useMemo(
    () => [
      { key: 'dashboard', label: 'Dashboard', icon: 'bx-grid-alt' },
      { key: 'alerts', label: 'Alertas', icon: 'bx-error-circle' },
      { key: 'courses', label: 'Meus Cursos', icon: 'bx-book-open' },
      { key: 'materials', label: 'Materiais', icon: 'bx-folder' },
      { key: 'ai-center', label: 'AI Center', icon: 'bx-brain' },
    ],
    [],
  )

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">SYNAPSE</h1>
            <p className="text-slate-500 text-sm uppercase tracking-[0.4em]">Instructor Portal</p>
          </div>
          <LoginForm onLogin={handleLogin} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-[260px] border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl flex flex-col fixed inset-y-0 z-50">
        <div className="p-8">
          <h2 className="text-2xl font-black tracking-tighter text-white">SYNAPSE</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] mt-1">Cognitive OS</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4 px-4">Menu Principal</div>
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setView(item.key as any)
                setSelectedCourseId(null)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                view === item.key || (item.key === 'courses' && view === 'course-detail')
                ? 'bg-[var(--syn-primary)] text-slate-950 font-bold shadow-lg shadow-[var(--syn-primary)]/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <i className={`bx ${item.icon} text-xl ${view === item.key || (item.key === 'courses' && view === 'course-detail') ? 'text-slate-950' : 'text-slate-500 group-hover:text-[var(--syn-primary)]'}`}></i>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <i className="bx bx-log-out text-xl"></i>
            <span className="text-sm font-medium">Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-[260px]">
        {/* Topbar */}
        <header className="h-20 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
          <div>
            <Breadcrumbs items={breadcrumbs} className="mb-1" />
            <h2 className="text-xl font-bold text-white capitalize">{view.replace('-', ' ')}</h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <i className="bx bx-bell text-xl text-slate-400"></i>
              <span className="absolute top-0 right-0 h-2 w-2 bg-[var(--syn-primary)] rounded-full border-2 border-slate-950"></span>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
              <div className="text-right">
                <p className="text-sm font-bold text-white leading-none">Admin User</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-tighter mt-1">Lead Instructor</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--syn-primary)] to-purple-600 flex items-center justify-center font-bold text-slate-950 shadow-inner">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic View Content */}
        <div className="p-8 max-w-7xl mx-auto">
          {view === 'dashboard' && <Dashboard token={token!} />}
          {view === 'alerts' && <InstructorAlertsView />}
          {view === 'courses' && <CoursesView onOpenCourse={handleOpenCourse} />}
          {view === 'materials' && <MaterialsView />}
          {view === 'ai-center' && <AICenterView />}
          {view === 'course-detail' && selectedCourseId && (
            <CourseDetailView 
              courseId={selectedCourseId} 
              onBack={() => setView('courses')} 
              onOpenLesson={handleOpenLesson} 
              onEditLesson={handleEditLesson}
              userRole={userRole}
            />
          )}
          {view === 'lesson' && selectedLessonId && (
            <LessonView lessonId={selectedLessonId} onBack={() => setView('course-detail')} />
          )}
          {view === 'lesson-edit' && selectedLessonId && (
            <LessonEditorView 
              lessonId={selectedLessonId} 
              onBack={() => setView('course-detail')} 
              onSave={() => setView('course-detail')} 
            />
          )}
        </div>
      </main>
    </div>
  )
}

