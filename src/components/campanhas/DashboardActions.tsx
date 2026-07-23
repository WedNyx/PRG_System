'use client'

import { useState } from 'react'
import { criarCampanha, entrarComCodigo } from '@/app/actions/campanhas'
import { sistemasDisponiveis } from '@/lib/fichas'

export default function DashboardActions() {
  const [modal, setModal] = useState<'nova' | 'codigo' | null>(null)

  return (
    <>
      <div className="flex gap-3">
        <button
          onClick={() => setModal('codigo')}
          className="bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Entrar com código
        </button>
        <button
          onClick={() => setModal('nova')}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Nova Campanha
        </button>
      </div>

      {modal === 'nova' && <NovaCampanhaModal onClose={() => setModal(null)} />}
      {modal === 'codigo' && <EntrarCodigoModal onClose={() => setModal(null)} />}
    </>
  )
}

function ModalShell({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-100">{titulo}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

const inputClass =
  'w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder-slate-500'

function NovaCampanhaModal({ onClose }: { onClose: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await criarCampanha(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <ModalShell titulo="Nova Campanha" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome da campanha</label>
          <input name="nome" required maxLength={80} className={inputClass} placeholder="A Maldição de Strahd" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Sistema de regras</label>
          <select name="sistema" className={inputClass} defaultValue="dnd5e">
            {sistemasDisponiveis.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Descrição <span className="text-slate-500">(opcional)</span>
          </label>
          <textarea name="descricao" rows={3} maxLength={500} className={inputClass} placeholder="Uma névoa espessa cobre Barovia..." />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-900 disabled:text-amber-700 text-slate-950 font-semibold rounded-lg px-4 py-2.5 transition-colors"
        >
          {loading ? 'Criando...' : 'Criar campanha'}
        </button>
      </form>
    </ModalShell>
  )
}

function EntrarCodigoModal({ onClose }: { onClose: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await entrarComCodigo(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <ModalShell titulo="Entrar em uma Campanha" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Código de convite</label>
          <input
            name="codigo"
            required
            maxLength={12}
            className={`${inputClass} font-mono uppercase tracking-widest text-center`}
            placeholder="A7X2K9P1"
          />
          <p className="text-xs text-slate-500 mt-2">Peça o código ao mestre da campanha.</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-900 disabled:text-amber-700 text-slate-950 font-semibold rounded-lg px-4 py-2.5 transition-colors"
        >
          {loading ? 'Entrando...' : 'Entrar na campanha'}
        </button>
      </form>
    </ModalShell>
  )
}
