'use client'

import { toast } from 'sonner'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { DadosFicha, Sistema } from '@/lib/sistemas/tipos'

const NOMES_PADRAO: Record<string, string> = {
  arvore: '🌠 Pontos da árvore', vida: '❤️ Vida', atributos: '💪 Pontos de atributo', pericias: '🎯 Pontos de perícia',
  bba: 'Bônus de ataque', ca: 'Defesa', ini: 'Iniciativa', fort: 'Fortitude', ref: 'Reflexos', von: 'Vontade',
}
export const nomeColuna = (s: Sistema, col: string) => s.progressoes?.colunas?.[col] ?? NOMES_PADRAO[col] ?? col
const sinal = (n: number) => (n > 0 ? '+' : '') + n

/** Ganho de uma coluna ao passar do nível n para n+1 (a tabela guarda o total em cada nível). */
export function ganhoNoNivel(tabela: number[], n: number) {
  const atual = n > 0 ? tabela[n - 1] ?? 0 : 0
  return (tabela[n] ?? tabela.at(-1) ?? 0) - atual
}

/** Cartão de progressão: nível de cada classe, o que ele dá e o botão de subir de nível. */
export default function Progressao({ s, d, onChange, somenteLeitura }: { s: Sistema; d: DadosFicha; onChange: (d: DadosFicha) => void; somenteLeitura: boolean }) {
  const p = s.progressoes
  if (!p?.classes.length) return null
  const mudarNivel = (campo: string, nomeCl: string, tabela: Record<string, number[]>, novo: number) => {
    const antes = Math.max(0, Math.min(20, Math.floor(Number(d.campos[campo]) || 0)))
    const n = Math.max(0, Math.min(20, novo))
    if (n === antes) return
    onChange({ ...d, campos: { ...d.campos, [campo]: n } })
    if (n > antes) {
      const ganhos = Object.entries(tabela).map(([col, v]) => [col, (v[n - 1] ?? 0) - (antes > 0 ? v[antes - 1] ?? 0 : 0)] as const).filter(([, g]) => g)
      toast.success(/^n[íi]vel$/i.test(nomeCl) ? `⬆️ Nível ${n}!` : `⬆️ ${nomeCl}: nível ${n}!`, { description: ganhos.length ? ganhos.map(([c, g]) => `${nomeColuna(s, c)} ${sinal(g)}`).join(' · ') : 'Nada novo neste nível.' })
    }
  }
  return <section className="rounded-2xl border border-[#6d5690] bg-gradient-to-br from-[#241a3a] to-[#1a1428] p-4 sm:p-5">
    <h2 className="font-semibold text-[#f2ebff]">📈 Progressão por nível</h2>
    <div className="mt-3 space-y-3">{p.classes.map(cl => {
      const n = Math.max(0, Math.min(20, Math.floor(Number(d.campos[cl.campoNivel]) || 0)))
      const cols = Object.keys(cl.tabela)
      return <div key={cl.id} className="rounded-xl border border-[#3d3152] bg-[#151123] p-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex-1 font-semibold">{cl.nome}</span>
          {!somenteLeitura && <button type="button" aria-label={'Descer nível de ' + cl.nome} disabled={n <= 0} onClick={() => mudarNivel(cl.campoNivel, cl.nome, cl.tabela, n - 1)} className="rounded-lg border border-[#5e4b78] p-1.5 disabled:opacity-30"><ChevronDown size={16} /></button>}
          <span className="min-w-20 text-center text-sm">Nível <strong className="text-2xl tabular-nums text-amber-200">{n}</strong></span>
          {!somenteLeitura && <button type="button" disabled={n >= 20} onClick={() => mudarNivel(cl.campoNivel, cl.nome, cl.tabela, n + 1)} className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#7652ac] to-[#b45309] px-3 py-1.5 text-sm font-semibold disabled:opacity-30"><ChevronUp size={16} /> Subir de nível</button>}
        </div>
        {cols.length > 0 && <div className="mt-3 grid gap-2 sm:grid-cols-2">{cols.map(col => {
          const total = n > 0 ? cl.tabela[col][n - 1] ?? 0 : 0, prox = n < 20 ? ganhoNoNivel(cl.tabela[col], n) : 0
          return <div key={col} className="flex items-center justify-between gap-2 rounded-lg bg-[#201a32] px-3 py-2 text-sm">
            <span className="text-[#d6c8e8]">{nomeColuna(s, col)}</span>
            <span className="tabular-nums"><strong>{total}</strong>{n < 20 && prox !== 0 && <span className="ml-2 text-xs text-emerald-300" title="No próximo nível">({sinal(prox)} no {n + 1})</span>}</span>
          </div>
        })}</div>}
      </div>
    })}</div>
    {p.classes.some(c => 'arvore' in c.tabela) && <p className="mt-2 text-xs text-[#a998bd]">Os pontos da árvore do nível já aparecem em “🌠 Árvore de habilidades”.</p>}
  </section>
}
