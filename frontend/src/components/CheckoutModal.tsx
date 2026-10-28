import React, { useState } from 'react'
import paymentsApi from '../api/paymentsApi'
import { Course } from '../api/courses'

interface CheckoutModalProps {
  course: Course
  onClose: () => void
  onSuccess: () => void
}

export default function CheckoutModal({ course, onClose, onSuccess }: CheckoutModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async (simulate: boolean = true) => {
    setLoading(true)
    setError(null)
    try {
      const res = await paymentsApi.createCheckoutSession(course.id, undefined, simulate)
      if (res.url) {
        window.location.href = res.url
      } else if (res.simulated || res.success) {
        alert(res.message || `Matrícula confirmada no curso ${course.title}!`)
        onSuccess()
        onClose()
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao processar sessão de checkout.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
        >
          <i className="bx bx-x text-2xl"></i>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-2xl">
            <i className="bx bx-credit-card"></i>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">
              Checkout Seguro Synapse
            </span>
            <h3 className="text-xl font-black text-white">{course.title}</h3>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            {error}
          </div>
        )}

        <div className="rounded-2xl bg-slate-950/70 border border-slate-800/80 p-6 mb-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Investimento da Especialização</span>
            <span className="text-2xl font-black text-white">R$ {course.price}</span>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <i className="bx bx-check-circle text-emerald-400"></i> Acesso ilimitado ao código e sandboxes
            </div>
            <div className="flex items-center gap-2">
              <i className="bx bx-check-circle text-emerald-400"></i> Tutor Socrático Polaris com IA avançada
            </div>
            <div className="flex items-center gap-2">
              <i className="bx bx-check-circle text-emerald-400"></i> Certificado digital criptografado
            </div>
            <div className="flex items-center gap-2">
              <i className="bx bx-check-circle text-emerald-400"></i> Ranking e turmas colaborativas (Cohorts)
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleCheckout(true)}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <i className="bx bx-loader-alt bx-spin text-base"></i>
            ) : (
              <i className="bx bx-check-shield text-base"></i>
            )}
            Confirmar Matrícula (Ambiente Sandbox)
          </button>

          <p className="text-[10px] text-slate-500 text-center font-mono">
            Processamento em ambiente de desenvolvimento isolado (127.0.0.1).
          </p>
        </div>
      </div>
    </div>
  )
}
