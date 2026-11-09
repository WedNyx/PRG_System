'use client'

import { useState } from 'react'
import { criarConquista, deletarConquista } from '@/app/actions/conquistas'
import type { Conquista } from '@/types/database'

const EMOJIS_SUGERIDOS = ['🏆', '🐉', '⚔️', '👑', '💀', '🗝️', '🏰', '🔥', '⭐', '🎉']

export default function ConquistasPanel({
  campanhaId,
  conquistas,
  souMestre,
}: {
  campanhaId: string
  conquistas: Conquista[]
  souMestre: boolean
}) {
  const [criando, setCriando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [emoji, setEmoji] = useState(EMOJIS_SUGERIDOS[0])

  async function handleCriar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    const form = e.currentTarget
    const result = await criarConquista(new FormData(form))
    if (result?.error) setErro(result.error)
    else {
      form.reset()
      setEmoji(EMOJIS_SUGERIDOS[0])
      setCriando(false)
    }
  }

  const inputClass =
    'w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 placeholder-slate-500'

  return (
    <div className="space-y-3">
      {conquistas.length === 0 && (
        <p className="text-sm text-slate-500">
          {souMestre ? 'Nenhum marco registrado. Marque os momentos importantes da história!' : 'Nenhum marco registrado ainda.'}
        </p>
      )}

      {conquistas.length > 0 && (
        <div className="space-y-2">
          {conquistas.map((c) => (
            <div
              key={c.id}
              className="flex items-start gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4"
            >
              <span className="text-2xl shrink-0">{c.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-100">{c.titulo}</p>
                {c.descricao && <p className="text-sm text-slate-500 mt-0.5">{c.descricao}</p>}
              </div>
              {souMestre && (
                <button
                  onClick={() => confirm(`Excluir o marco "${c.titulo}"?`) && deletarConquista(c.id, campanhaId)}
                  className="text-slate-600 hover:text-red-400 transition-colors text-sm shrink-0"
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {souMestre && !criando && (
        <button
          onClick={() => setCriando(true)}
          className="text-sm bg-slate-800 border border-dashed border-slate-600 hover:border-amber-500 text-slate-400 hover:text-amber-300 px-4 py-2 rounded-lg transition-colors"
        >
          + Novo marco
        </button>
      )}

      {souMestre && criando && (
        <form onSubmit={handleCriar} className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
          {erro && <p className="text-xs text-red-400">{erro}</p>}
          <input type="hidden" name="campanha_id" value={campanhaId} />
          <input type="hidden" name="emoji" value={emoji} />
          <div className="flex gap-1.5 flex-wrap">
            {EMOJIS_SUGERIDOS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`text-lg w-9 h-9 rounded-lg border transition-colors ${
                  emoji === e ? 'bg-amber-500/15 border-amber-500/50' : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          <input name="titulo" required maxLength={80} placeholder="Título (ex: Derrotou o dragão de gelo)" className={inputClass} />
          <textarea name="descricao" rows={2} maxLength={500} placeholder="Descrição (opcional)" className={`${inputClass} resize-y`} />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Registrar marco
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
