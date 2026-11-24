'use client'

import { useState } from 'react'
import { PenLine } from 'lucide-react'
import { DANO_VALIDO, type HabilidadePreenchida } from '@/lib/sistemas/arvore'

/**
 * Espaço em aberto da árvore (v0.36.9): depois de liberar, o jogador escreve a habilidade que combinou com o mestre —
 * nome, descrição, dados de dano, custo (MP, EM… o recurso que o autor escolheu) e usos por combate.
 * Dano e custo podem ficar zerados (habilidade passiva). Ao salvar, ela aparece em “Poderes e habilidades”.
 */
export default function EscreverHabilidade({ inicial, recurso, somenteLeitura, salvar }: {
  inicial?: HabilidadePreenchida; recurso?: { id: string; nome: string }; somenteLeitura: boolean; salvar: (h: HabilidadePreenchida) => void
}) {
  const [h, setH] = useState<HabilidadePreenchida>(inicial ?? {})
  const danoOk = !h.dano || DANO_VALIDO.test(h.dano)
  const mudou = JSON.stringify(h) !== JSON.stringify(inicial ?? {})
  const campo = 'mt-1 w-full min-w-0 rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-sm text-white disabled:opacity-70'
  const num = (v: string) => { const n = Math.max(0, Math.min(999, Math.floor(Number(v) || 0))); return n || undefined }
  return <form data-escrever-habilidade className="mt-3 space-y-2 rounded-xl border border-white/10 bg-white/[.03] p-3" onSubmit={e => { e.preventDefault(); if (danoOk) salvar(h) }}>
    <p className="flex items-center gap-1.5 text-xs font-semibold text-(--ficha-acento)"><PenLine size={14} /> Sua habilidade</p>
    <p className="text-[11px] text-(--a-a998bd)">Escreva o que você combinou com o mestre. Dano e custo podem ficar em branco (habilidade passiva).</p>
    <label className="block text-xs text-(--a-d3adf0)">Nome<input value={h.nome ?? ''} maxLength={60} disabled={somenteLeitura} onChange={e => setH({ ...h, nome: e.target.value })} placeholder="Ex.: Golpe do Trovão" className={campo} /></label>
    <label className="block text-xs text-(--a-d3adf0)">Descrição<textarea rows={3} value={h.descricao ?? ''} maxLength={800} disabled={somenteLeitura} onChange={e => setH({ ...h, descricao: e.target.value })} placeholder="O que a habilidade faz" className={campo} /></label>
    <div className="grid grid-cols-3 gap-2">
      <label className="block text-xs text-(--a-d3adf0)">Dados de dano<input value={h.dano ?? ''} maxLength={40} disabled={somenteLeitura} onChange={e => setH({ ...h, dano: e.target.value || undefined })} placeholder="2d8+3" aria-invalid={!danoOk} className={campo + (danoOk ? '' : ' !border-red-400')} /></label>
      <label className="block text-xs text-(--a-d3adf0)">Custo{recurso ? ` (${recurso.nome})` : ''}<input type="number" min={0} max={999} value={h.custo ?? ''} disabled={somenteLeitura || !recurso} onChange={e => setH({ ...h, custo: num(e.target.value) })} placeholder="0" className={campo} /></label>
      <label className="block text-xs text-(--a-d3adf0)">Usos por combate<input type="number" min={0} max={99} value={h.usos ?? ''} disabled={somenteLeitura} onChange={e => setH({ ...h, usos: num(e.target.value) })} placeholder="sem limite" className={campo} /></label>
    </div>
    {!danoOk && <p role="alert" className="text-[11px] text-red-300">Use só dados e números, como 2d8+3.</p>}
    {!somenteLeitura && <button type="submit" disabled={!mudou || !danoOk} className="min-h-10 rounded-lg bg-(--a-7654bb) px-3 text-xs font-semibold text-white disabled:opacity-40">Salvar habilidade</button>}
  </form>
}
