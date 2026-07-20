'use client'

import Link from 'next/link'
import { useState } from 'react'
import { alternarVisibilidadeNpc, criarNpcDoBestiario, deletarPersonagem } from '@/app/actions/personagens'
import { bestiario } from '@/lib/bestiario'
import type { Personagem } from '@/types/database'
import CriarPersonagemForm from './CriarPersonagemForm'

export default function NpcPanel({ campanhaId, npcs }: { campanhaId: string; npcs: Personagem[] }) {
  const [busy, setBusy] = useState<string | null>(null)

  async function toggle(npc: Personagem) {
    setBusy(npc.id)
    await alternarVisibilidadeNpc(npc.id, campanhaId, !npc.visivel)
    setBusy(null)
  }

  async function remover(npc: Personagem) {
    if (!confirm(`Remover o NPC "${npc.nome}"?`)) return
    setBusy(npc.id)
    await deletarPersonagem(npc.id, campanhaId)
    setBusy(null)
  }

  return (
    <div className="space-y-3">
      {npcs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {npcs.map((npc) => (
            <div
              key={npc.id}
              className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-950 font-bold shrink-0"
                style={{ backgroundColor: npc.cor, opacity: npc.visivel ? 1 : 0.4 }}
              >
                {npc.nome[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/campanha/${campanhaId}/ficha/${npc.id}`}
                  className="font-medium text-slate-100 truncate hover:text-amber-400 transition-colors block"
                >
                  {npc.nome}
                </Link>
                <p className="text-xs text-slate-500">
                  HP {npc.hp_atual}/{npc.hp_max} · {npc.visivel ? 'Visível aos players' : 'Escondido'}
                </p>
              </div>
              <button
                onClick={() => toggle(npc)}
                disabled={busy === npc.id}
                title={npc.visivel ? 'Esconder dos players' : 'Revelar aos players'}
                className="text-lg hover:scale-110 transition-transform disabled:opacity-40"
              >
                {npc.visivel ? '👁️' : '🙈'}
              </button>
              <button
                onClick={() => remover(npc)}
                disabled={busy === npc.id}
                title="Remover NPC"
                className="text-slate-600 hover:text-red-400 transition-colors disabled:opacity-40"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
      <CriarPersonagemForm campanhaId={campanhaId} isNpc={true} />
      <BestiarioForm campanhaId={campanhaId} />
    </div>
  )
}

function BestiarioForm({ campanhaId }: { campanhaId: string }) {
  const [selecionado, setSelecionado] = useState('')
  const [adicionando, setAdicionando] = useState(false)

  const monstro = bestiario.find((m) => m.id === selecionado)

  async function adicionar() {
    if (!monstro) return
    setAdicionando(true)
    await criarNpcDoBestiario(campanhaId, monstro)
    setAdicionando(false)
    setSelecionado('')
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-2">
      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
        🐉 Ou adicione do bestiário:
      </p>
      <div className="flex gap-2">
        <select
          value={selecionado}
          onChange={(e) => setSelecionado(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
        >
          <option value="">Escolha uma criatura...</option>
          {bestiario.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome} (HP {m.hp} · CA {m.ca})
            </option>
          ))}
        </select>
        <button
          onClick={adicionar}
          disabled={!monstro || adicionando}
          className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors shrink-0"
        >
          {adicionando ? '...' : '+ Invocar'}
        </button>
      </div>
      {monstro && <p className="text-xs text-slate-500 italic">{monstro.descricao}</p>}
    </div>
  )
}
