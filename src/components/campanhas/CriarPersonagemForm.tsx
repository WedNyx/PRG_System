'use client'

import { useState } from 'react'
import { criarPersonagem } from '@/app/actions/personagens'

export default function CriarPersonagemForm({ campanhaId, isNpc }: { campanhaId: string; isNpc: boolean }) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = e.currentTarget
    const result = await criarPersonagem(new FormData(form))
    if (result?.error) {
      setError(result.error)
    } else {
      form.reset()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-2 rounded-lg">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <input type="hidden" name="campanha_id" value={campanhaId} />
        <input type="hidden" name="is_npc" value={String(isNpc)} />
        <input
          name="nome"
          required
          maxLength={60}
          placeholder={isNpc ? 'Nome do NPC (ex: Goblin Chefe)' : 'Nome do seu personagem'}
          className="flex-1 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500 placeholder-slate-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-400 disabled:bg-amber-900 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors shrink-0"
        >
          {loading ? '...' : isNpc ? '+ NPC' : '+ Criar personagem'}
        </button>
      </div>
    </form>
  )
}
