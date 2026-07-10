'use client'

import { useState } from 'react'
import { salvarNotas } from '@/app/actions/campanhas'

export default function NotasMestre({
  campanhaId,
  conteudoInicial,
}: {
  campanhaId: string
  conteudoInicial: string
}) {
  const [conteudo, setConteudo] = useState(conteudoInicial)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  async function salvar() {
    setStatus('saving')
    const result = await salvarNotas(campanhaId, conteudo)
    setStatus(result?.error ? 'error' : 'saved')
    if (!result?.error) setTimeout(() => setStatus('idle'), 2000)
  }

  return (
    <div className="space-y-2">
      <textarea
        value={conteudo}
        onChange={(e) => setConteudo(e.target.value)}
        rows={6}
        placeholder="A trama secreta, os segredos dos NPCs, o tesouro escondido na sala 3..."
        className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 placeholder-slate-600 resize-y"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={salvar}
          disabled={status === 'saving'}
          className="bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-200 px-4 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {status === 'saving' ? 'Salvando...' : 'Salvar notas'}
        </button>
        {status === 'saved' && <span className="text-xs text-emerald-400">✓ Salvo!</span>}
        {status === 'error' && <span className="text-xs text-red-400">Erro ao salvar</span>}
      </div>
    </div>
  )
}
