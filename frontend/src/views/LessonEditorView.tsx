import React, { useState, useEffect } from 'react'
import authClient from '../api/authClient'
import axios from 'axios'

interface LessonDetail {
  id: number
  title: string
  content: string
  lesson_type: string
  video_url?: string
}

interface LessonEditorViewProps {
  lessonId: number
  onBack: () => void
  onSave: () => void
}

export default function LessonEditorView({ lessonId, onBack, onSave }: LessonEditorViewProps) {
  const [lesson, setLesson] = useState<LessonDetail | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    setLoading(true)
    authClient.fetchLessonDetail(lessonId)
      .then(data => {
        setLesson(data)
        setTitle(data.title)
        setContent(data.content)
        setVideoUrl(data.video_url || '')
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [lessonId])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Direct API call for update since authClient might not have it
      await axios.patch(`/api/v1/lessons/${lessonId}/`, {
        title,
        content,
        video_url: videoUrl
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('synapse_token')}`
        }
      })
      alert('Aula salva com sucesso!')
      onSave()
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar aula.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-10 text-white animate-pulse">Carregando editor...</div>

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-slate-500 hover:text-white flex items-center gap-2 transition-colors">
          <i className="bx bx-arrow-back"></i> Voltar
        </button>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setPreview(!preview)}
             className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${preview ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
           >
             {preview ? 'Editar Code' : 'Visualizar'}
           </button>
           <button
             onClick={handleSave}
             disabled={saving}
             className="bg-[var(--syn-primary)] hover:bg-[var(--syn-primary)]/80 text-slate-950 px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
           >
             {saving ? 'Salvando...' : (
               <>
                 <i className="bx bx-save text-lg"></i>
                 Salvar Aula
               </>
             )}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Settings */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Configurações Base</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block uppercase">Título da Aula</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block uppercase">Tipo de Conteúdo</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  value={lesson?.lesson_type}
                  disabled
                >
                  <option value="text">Texto / Markdown</option>
                  <option value="video">Vídeo + Texto</option>
                  <option value="problem">Desafio Técnico</option>
                </select>
              </div>

              {lesson?.lesson_type === 'video' && (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block uppercase">URL do Vídeo</label>
                  <input 
                    type="text" 
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/embed/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-indigo-500/5 border border-indigo-500/10 p-6">
             <h4 className="text-indigo-400 font-bold text-sm mb-2 flex items-center gap-2">
               <i className="bx bx-info-circle"></i>
               Dica do Sistema
             </h4>
             <p className="text-xs text-slate-500 leading-relaxed">
               Utilize Markdown para formatar seu conteúdo. Você pode incluir blocos de código, listas e links. O editor salvará uma versão rascunho automaticamente no seu navegador.
             </p>
          </div>
        </div>

        {/* Editor Area */}
        <div className="lg:col-span-2">
           {preview ? (
             <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 min-h-[500px]">
                <h1 className="text-3xl font-black text-white mb-6">{title}</h1>
                {videoUrl && (
                  <div className="aspect-video bg-black rounded-2xl mb-6 overflow-hidden border border-slate-800">
                    <iframe src={videoUrl} className="w-full h-full" allowFullScreen></iframe>
                  </div>
                )}
                <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap">
                  {content}
                </div>
             </div>
           ) : (
             <div className="rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col h-[600px]">
                <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
                   <div className="flex gap-4">
                      <button className="text-slate-400 hover:text-white"><i className="bx bx-bold"></i></button>
                      <button className="text-slate-400 hover:text-white"><i className="bx bx-italic"></i></button>
                      <button className="text-slate-400 hover:text-white"><i className="bx bx-list-ul"></i></button>
                      <button className="text-slate-400 hover:text-white"><i className="bx bx-code-alt"></i></button>
                   </div>
                   <span className="text-[10px] text-slate-500 font-mono">Markdown Mode</span>
                </div>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="flex-1 bg-transparent p-8 text-slate-300 font-mono text-sm leading-relaxed resize-none focus:outline-none"
                  placeholder="Comece a escrever seu conteúdo aqui..."
                />
             </div>
           )}
        </div>
      </div>
    </div>
  )
}
