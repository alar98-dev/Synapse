import React, { useState } from 'react'
import { CertificateData } from '../api/courses'

interface CertificateModalProps {
  certificate: CertificateData
  onClose: () => void
}

export default function CertificateModal({ certificate, onClose }: CertificateModalProps) {
  const [copied, setCopied] = useState(false)
  const certId = certificate.certificate_id || 'PENDING'
  const verifyUrl = `${window.location.origin}/api/v1/certificates/${certId}/verify/`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700/80 p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
        >
          <i className="bx bx-x text-2xl"></i>
        </button>

        {/* Certificate Card Printable Frame */}
        <div className="rounded-2xl border-2 border-amber-500/30 bg-gradient-to-b from-slate-950 to-slate-900/90 p-8 text-center relative overflow-hidden shadow-inner">
          <div className="absolute top-0 right-0 w-60 h-60 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none"></div>

          {/* Badge Icon */}
          <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-3xl shadow-lg mb-4">
            <i className="bx bx-award"></i>
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400 mb-1">
            Synapse Cognitive Learning Platform
          </p>
          <h2 className="text-2xl font-black text-white tracking-tight mb-2">
            Certificado de Conclusão de Curso
          </h2>

          <div className="my-6">
            <p className="text-xs text-slate-400">Certificamos que o(a) estudante</p>
            <h3 className="text-2xl font-bold text-white mt-1 text-emerald-400">
              {certificate.student_name || 'Estudante'}
            </h3>
            <p className="text-xs text-slate-400 mt-2">
              concluiu com êxito todas as lições obrigatórias e desafios práticos no sandbox do curso:
            </p>
            <h4 className="text-lg font-black text-white mt-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 inline-block">
              {certificate.course_title}
            </h4>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 border-t border-slate-800/80 pt-4 mt-6 font-mono">
            <div>
              <span className="block text-[10px] text-slate-500 uppercase">Data de Emissão</span>
              <span className="text-slate-300 font-bold">
                {certificate.issued_at ? new Date(certificate.issued_at).toLocaleDateString() : 'Hoje'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 uppercase">Código Criptográfico</span>
              <span className="text-amber-400/90 font-bold tracking-wider text-[11px] select-all">
                {certId}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 uppercase">Aproveitamento</span>
              <span className="text-emerald-400 font-bold">100.0%</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={handleCopyLink}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-2 border border-slate-700"
          >
            <i className={`bx ${copied ? 'bx-check text-emerald-400' : 'bx-link'}`}></i>
            {copied ? 'Link de Autenticidade Copiado!' : 'Copiar Link de Verificação'}
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700"
            >
              <i className="bx bx-printer"></i> Imprimir
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase transition-all shadow-lg shadow-emerald-500/20"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
