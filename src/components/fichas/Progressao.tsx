'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Minus, Plus, X } from 'lucide-react'
import type { DadosFicha, Sistema } from '@/lib/sistemas/tipos'
import { escolhasDeClassePendentes, progressaoAtiva } from '@/lib/sistemas/calculo'
import { moverPonto, pontosColocados } from '@/lib/sistemas/nivel'

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

type Subida = { titulo: string; ganhos: (readonly [string, number])[] }

/** Cartão de progressão: nível de cada classe, o que ele dá e o botão de subir de nível (com a janela guiada). */
export default function Progressao({ s, d, onChange, somenteLeitura, pontosAtributo = 0, irPara }: {
  s: Sistema; d: DadosFicha; onChange: (d: DadosFicha) => void; somenteLeitura: boolean
  /** Total de pontos de atributo vindos dos níveis (prog_atributos). */
  pontosAtributo?: number
  /** Abre outra seção da ficha (ex.: 'arvore'). */
  irPara?: (secao: string) => void
}) {
  const [subida, setSubida] = useState<Subida | null>(null)
  const [distribuir, setDistribuir] = useState(false)
  const p = s.progressoes
  if (!p?.classes.length) return null
  const ativas = progressaoAtiva(s, d), pendentes = escolhasDeClassePendentes(s, d)
  const colocados = pontosColocados(d), sobrando = pontosAtributo - colocados
  const usaAtributos = s.atributos.length > 0 && ativas.some(a => 'atributos' in a.cl.tabela)
  const mudarNivel = (campo: string, nomeCl: string, tabela: Record<string, number[]>, novo: number) => {
    const antes = Math.max(0, Math.min(20, Math.floor(Number(d.campos[campo]) || 0)))
    const n = Math.max(0, Math.min(20, novo))
    if (n === antes) return
    onChange({ ...d, campos: { ...d.campos, [campo]: n } })
    if (n > antes) {
      const ganhos = Object.entries(tabela).map(([col, v]) => [col, (v[n - 1] ?? 0) - (antes > 0 ? v[antes - 1] ?? 0 : 0)] as const).filter(([, g]) => g)
      setSubida({ titulo: /^n[íi]vel$/i.test(nomeCl) ? `⬆️ Nível ${n}!` : `⬆️ ${nomeCl}: nível ${n}!`, ganhos })
    }
  }
  const janelaAberta = !!subida || distribuir
  const fechar = () => { setSubida(null); setDistribuir(false) }
  return <section className="rounded-2xl border border-[#6d5690] bg-gradient-to-br from-[#241a3a] to-[#1a1428] p-4 sm:p-5">
    <h2 className="font-semibold text-[#f2ebff]">📈 Progressão por nível</h2>
    {usaAtributos && sobrando > 0 && !somenteLeitura && <p className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-[#1f3326]/80 p-2 text-sm text-emerald-200">
      💪 {sobrando} {sobrando === 1 ? 'ponto de atributo' : 'pontos de atributo'} para distribuir
      <button type="button" onClick={() => setDistribuir(true)} className="rounded-lg bg-emerald-700/80 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-600">Distribuir</button></p>}
    {usaAtributos && sobrando < 0 && <p role="alert" className="mt-2 rounded-lg bg-[#3a2a14]/80 p-2 text-sm text-[#f6dca8]">
      ⚠️ Há {-sobrando} {sobrando === -1 ? 'ponto' : 'pontos'} de atributo a mais do que o nível dá.{!somenteLeitura && <> <button type="button" onClick={() => setDistribuir(true)} className="underline">Ajustar</button></>}</p>}
    {pendentes.length > 0 && <p className="mt-2 rounded-lg bg-[#3a2a14]/80 p-2 text-sm text-[#f6dca8]">Escolha {pendentes.map(c => '“' + c.nome + '”').join(' e ')} lá em cima para a ficha usar a tabela de níveis certa.</p>}
    <div className="mt-3 space-y-3">{ativas.map(({ chave, cl, campoNivel, nome, escolha }) => {
      const n = Math.max(0, Math.min(20, Math.floor(Number(d.campos[campoNivel]) || 0)))
      const cols = Object.keys(cl.tabela)
      return <div key={chave} className="rounded-xl border border-[#3d3152] bg-[#151123] p-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex-1 font-semibold">{nome}{escolha && !/^classe$/i.test(escolha) && <span className="ml-2 text-xs font-normal text-[#a998bd]">{escolha}</span>}</span>
          {!somenteLeitura && <button type="button" aria-label={'Descer nível de ' + nome} disabled={n <= 0} onClick={() => mudarNivel(campoNivel, nome, cl.tabela, n - 1)} className="rounded-lg border border-[#5e4b78] p-1.5 disabled:opacity-30"><ChevronDown size={16} /></button>}
          <span className="min-w-20 text-center text-sm">Nível <strong className="text-2xl tabular-nums text-amber-200">{n}</strong></span>
          {!somenteLeitura && <button type="button" disabled={n >= 20} onClick={() => mudarNivel(campoNivel, nome, cl.tabela, n + 1)} className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#7652ac] to-[#b45309] px-3 py-1.5 text-sm font-semibold disabled:opacity-30"><ChevronUp size={16} /> Subir de nível</button>}
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
    {ativas.some(a => 'arvore' in a.cl.tabela) && <p className="mt-2 text-xs text-[#a998bd]">Os pontos da árvore do nível já aparecem em “🌠 Árvore de habilidades”.</p>}

    {janelaAberta && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center" onClick={fechar}>
      <div role="dialog" aria-modal="true" aria-label={subida?.titulo ?? 'Distribuir pontos de atributo'} onClick={ev => ev.stopPropagation()}
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#b99bff] bg-gradient-to-b from-[#2b2045] to-[#161224] p-5 shadow-2xl">
        <div className="flex items-start gap-2">
          <h3 className="flex-1 text-xl font-bold text-amber-200">{subida?.titulo ?? '💪 Pontos de atributo'}</h3>
          <button type="button" onClick={fechar} aria-label="Fechar" className="rounded-lg p-1 text-[#b4aeca] hover:bg-[#34294f]"><X size={18} /></button>
        </div>
        {subida && <>
          <p className="mt-1 text-sm text-[#cfc8e6]">{subida.ganhos.length ? 'Neste nível você ganhou:' : 'Nada novo neste nível, mas parabéns!'}</p>
          {subida.ganhos.length > 0 && <ul className="mt-2 grid gap-1.5">{subida.ganhos.map(([c, g]) =>
            <li key={c} className="flex justify-between rounded-lg bg-[#201a32] px-3 py-1.5 text-sm"><span>{nomeColuna(s, c)}</span><strong className="tabular-nums text-emerald-300">{sinal(g)}</strong></li>)}</ul>}
        </>}
        {usaAtributos && (sobrando !== 0 || colocados > 0) && <div className="mt-4">
          <p className="text-sm font-semibold">{sobrando > 0 ? `Distribua ${sobrando} ${sobrando === 1 ? 'ponto' : 'pontos'} de atributo` : sobrando < 0 ? `Tire ${-sobrando} ${sobrando === -1 ? 'ponto' : 'pontos'} (o nível baixou)` : 'Todos os pontos foram distribuídos ✨'}</p>
          <ul className="mt-2 grid gap-1.5">{s.atributos.map(a => {
            const v = Number(d.atributos[a.id] ?? a.padrao) || 0, deNivel = Math.max(0, Math.floor(Number(d.nivelAtributos?.[a.id]) || 0))
            const mais = moverPonto(s, d, a.id, 1, pontosAtributo), menos = moverPonto(s, d, a.id, -1, pontosAtributo)
            return <li key={a.id} className="flex items-center gap-2 rounded-lg bg-[#201a32] px-3 py-1.5 text-sm">
              <span className="flex-1">{a.nome}{deNivel > 0 && <span className="ml-1 text-xs text-emerald-300">(+{deNivel} de nível)</span>}</span>
              <button type="button" aria-label={'Tirar ponto de ' + a.nome} disabled={!menos} onClick={() => menos && onChange(menos)} className="rounded-md border border-[#5e4b78] p-1 disabled:opacity-30"><Minus size={14} /></button>
              <strong className="w-8 text-center text-lg tabular-nums">{v}</strong>
              <button type="button" aria-label={'Colocar ponto em ' + a.nome} disabled={!mais} onClick={() => mais && onChange(mais)} className="rounded-md border border-[#5e4b78] p-1 disabled:opacity-30"><Plus size={14} /></button>
              <span className="w-10 text-right text-[11px] text-[#8f88a8]">máx {a.max}</span>
            </li>
          })}</ul>
        </div>}
        <div className="mt-4 flex flex-wrap gap-2">
          {subida?.ganhos.some(([c]) => c === 'arvore') && irPara && <button type="button" onClick={() => { fechar(); irPara('arvore') }} className="rounded-lg border border-[#d4a23a] px-3 py-1.5 text-sm text-amber-200 hover:bg-[#3a2a14]">🌠 Ir para a árvore</button>}
          <button type="button" onClick={fechar} className="ml-auto rounded-lg bg-gradient-to-r from-[#7652ac] to-[#b45309] px-4 py-1.5 text-sm font-semibold">{sobrando > 0 && usaAtributos ? 'Depois' : 'Pronto'}</button>
        </div>
      </div>
    </div>}
  </section>
}
