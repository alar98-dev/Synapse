import React, { useState } from 'react'

const sampleMaterials = [
  { id: 1, title: 'Guia de Ensino Híbrido', type: 'PDF', lesson: 'Aula 01', updated: '2h atrás' },
  { id: 2, title: 'Roadmap 2026', type: 'Slides', lesson: 'Aula 03', updated: '1 dia atrás' },
  { id: 3, title: 'Código de Referência', type: 'Código', lesson: 'Lab Python', updated: '3 dias atrás' },
]

export default function MaterialsView() {
  const [materials, setMaterials] = useState(sampleMaterials)

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Biblioteca por aula</p>
          <h3 className="text-2xl font-semibold text-white">Materiais ativos</h3>
        </div>
        <button 
          disabled
          className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-600 cursor-not-allowed opacity-60"
        >
          + Novo material (Em breve)
        </button>
      </header>
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 space-y-4">
        {materials.map((material) => (
          <article key={material.id} className="rounded-2xl bg-slate-900/50 p-4 ring-1 ring-slate-800 hover:ring-white/30 transition-all opacity-80">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-white">{material.title}</h4>
                <p className="text-sm text-slate-400">{material.lesson}</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/80 bg-indigo-500/10 px-2 py-1 rounded">{material.type}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>{material.updated}</span>
              <div className="flex gap-2">
                <button disabled className="rounded-lg border border-slate-800 px-3 py-1 text-[10px] text-slate-600 cursor-not-allowed">Fixar</button>
                <button disabled className="rounded-lg border border-slate-800 px-3 py-1 text-[10px] text-slate-600 cursor-not-allowed">Compartilhar</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
