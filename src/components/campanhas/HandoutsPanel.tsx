'use client'

import { useState } from 'react'
import { alternarHandout, criarHandout, deletarHandout } from '@/app/actions/campanhas'
import type { Handout } from '@/types/database'

type Membro = { id: string; username: string }

export default function HandoutsPanel({
  campanhaId,
  handouts,
  membros,
  souMestre,
}: {
  campanhaId: string
  handouts: Handout[]
  membros: Membro[]
  souMestre: boolean
}) {
  const [criando, setCriando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aberto, setAberto] = useState<string | null>(null)

  async function handleCriar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    const form = e.currentTarget
    const result = await criarHandout(new FormData(form))
    if (result?.error) setErro(result.error)
    else {
      form.reset()
      setCriando(false)
    }
  }

  const inputClass =
    'w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 placeholder-slate-500'

  return (
    <div className="space-y-3">
      {handouts.length === 0 && (
        <p className="text-sm text-slate-500">
          {souMestre ? 'Nenhum handout criado. Crie cartas, segredos e imagens para os players!' : 'Nenhum handout recebido ainda.'}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {handouts.map((h) => (
          <div key={h.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <button
                onClick={() => setAberto(aberto === h.id ? null : h.id)}
                className="font-medium text-slate-100 hover:text-amber-400 transition-colors text-left"
              >
                📜 {h.titulo}
              </button>
              {souMestre && (
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => alternarHandout(h.id, campanhaId, !h.visivel)}
                    title={h.visivel ? 'Ocultar dos players' : 'Entregar aos players'}
                    className="text-sm hover:scale-110 transition-transform"
                  >
                    {h.visivel ? '👁️' : '🙈'}
                  </button>
                  <button
                    onClick={() => confirm(`Excluir "${h.titulo}"?`) && deletarHandout(h.id, campanhaId)}
                    className="text-slate-600 hover:text-red-400 transition-colors text-sm"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
            {souMestre && (
              <p className="text-xs text-slate-500 mt-1">
                {h.visivel ? '✅ Entregue' : '⏳ Rascunho'} ·{' '}
                {h.para_todos
                  ? 'para todos'
                  : `para ${h.destinatarios.map((d) => membros.find((m) => m.id === d)?.username ?? '?').join(', ')}`}
              </p>
            )}
            {aberto === h.id && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                {h.imagem_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={h.imagem_url} alt={h.titulo} className="rounded-lg max-h-64 w-auto mb-2" />
                )}
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{h.conteudo}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {souMestre && !criando && (
        <button
          onClick={() => setCriando(true)}
          className="text-sm bg-slate-800 border border-dashed border-slate-600 hover:border-amber-500 text-slate-400 hover:text-amber-300 px-4 py-2 rounded-lg transition-colors"
        >
          + Novo handout
        </button>
      )}

      {souMestre && criando && (
        <form onSubmit={handleCriar} className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
          {erro && <p className="text-xs text-red-400">{erro}</p>}
          <input type="hidden" name="campanha_id" value={campanhaId} />
          <input name="titulo" required maxLength={80} placeholder="Título (ex: Carta Misteriosa)" className={inputClass} />
          <textarea name="conteudo" rows={3} maxLength={4000} placeholder="Conteúdo do handout..." className={`${inputClass} resize-y`} />
          <input name="imagem_url" placeholder="URL de imagem (opcional)" className={inputClass} />
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Destinatários (nenhum marcado = todos):</p>
            <div className="flex flex-wrap gap-2">
              {membros.map((m) => (
                <label key={m.id} className="flex items-center gap-1.5 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" name="destinatarios" value={m.id} className="accent-amber-500" />
                  {m.username}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Criar (nasce oculto)
            </button>
            <button
              type="button"
              onClick={() => setCriando(false)}
              className="text-sm text-slate-500 hover:text-slate-300 px-3"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
