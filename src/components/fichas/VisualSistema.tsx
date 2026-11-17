'use client'
/**
 * Visual de cada sistema (v0.35.1): cores, letra dos títulos e o jeito de mostrar atributos e perícias,
 * inspirados no estilo de cada jogo (sem logos nem artes oficiais). Nada aqui calcula regra: só mostra
 * e guarda o que o jogador e o mestre digitam.
 */
import type { CSSProperties } from 'react'
import { Dice5 } from 'lucide-react'
import type { Sistema } from '@/lib/sistemas/tipos'

export type Tema = { acento: string; borda: string; cartao: string; fonte?: string; sombrio?: boolean }
const PADRAO: Tema = { acento: 'var(--a-ed9cd8)', borda: 'var(--a-55456e)', cartao: 'var(--s-201a32)' }
const TEMAS: Record<string, Tema> = {
  'dnd5e-srd': { acento: '#f5a28e', borda: '#9a4545', cartao: '#24191f', fonte: 'var(--font-cinzel), Georgia, serif' },
  pf2e: { acento: '#9ecaff', borda: '#426b9e', cartao: '#172335', fonte: 'var(--font-cinzel), Georgia, serif' },
  'fate-core': { acento: '#c5b0ff', borda: '#7457ad', cartao: '#221b34' },
  blades: { acento: '#c4c8ef', borda: '#62678d', cartao: '#1c202a', fonte: 'var(--font-cormorant), Georgia, serif' },
  brp: { acento: '#a6dfc5', borda: '#45836b', cartao: '#172923', fonte: 'var(--font-cormorant), Georgia, serif' },
  'faroeste-arcano': { acento: '#f1c184', borda: '#9a6637', cartao: '#302219', fonte: 'var(--font-cormorant), Georgia, serif' },
  'ordem-paranormal': { acento: '#ff9da7', borda: '#923846', cartao: '#28191f' },
  tormenta20: { acento: '#a9d1ff', borda: '#476b9b', cartao: '#1b2637', fonte: 'var(--font-cinzel), Georgia, serif' },
  'mork-borg': { acento: '#ffe600', borda: '#ffe600', cartao: '#0a0a0a', sombrio: true },
  assimilacao: { acento: '#e7a5f5', borda: '#8a459b', cartao: '#2c1b32' },
  'call-of-cthulhu': { acento: '#a6e0d2', borda: '#427b76', cartao: '#182925', fonte: 'var(--font-cormorant), Georgia, serif' },
}
export const temaDoSistema = (id: string): Tema => TEMAS[id] ?? PADRAO
export function identidadeVisual(s: Sistema): string {
  if (/lunethernnyis|opositores/i.test(s.nome)) return 'opositores'
  if (/projeto n\.?o\.?v\.?a/i.test(s.nome)) return 'nova'
  return s.id
}
TEMAS.opositores = { acento: '#ddc58d', borda: '#826b9f', cartao: '#211a34', fonte: 'var(--font-cinzel), Georgia, serif' }
TEMAS.nova = { acento: '#ffc18f', borda: '#925e59', cartao: '#292033' }
/** Variáveis CSS que a ficha usa nos cartões e títulos. */
export const estiloTema = (t: Tema) => ({ '--ficha-acento': t.acento, '--ficha-borda': t.borda, '--ficha-cartao': t.cartao, '--ficha-fonte': t.fonte ?? 'inherit' } as CSSProperties)

export type EstiloAtributos = 'com-mod' | 'modificador' | 'hexagonos' | 'padrao'
export type EstiloPericias = 'graus' | 'piramide' | 'acoes' | 'padrao'
export function estiloDoSistema(id: string): { atributos: EstiloAtributos; pericias: EstiloPericias } {
  const atributos: EstiloAtributos = id === 'dnd5e-srd' || id === 'faroeste-arcano' ? 'com-mod'
    : id === 'pf2e' || id === 'tormenta20' || id === 'mork-borg' ? 'modificador' : id === 'ordem-paranormal' ? 'hexagonos' : 'padrao'
  const pericias: EstiloPericias = id === 'fate-core' ? 'piramide' : id === 'blades' ? 'acoes'
    : id === 'dnd5e-srd' || id === 'pf2e' || id === 'ordem-paranormal' || id === 'tormenta20' ? 'graus' : 'padrao'
  return { atributos, pericias }
}

const sinal = (n: number) => (n >= 0 ? '+' : '') + n
const num = (v: string) => v.trim() === '' || v.trim() === '-' ? 0 : Math.max(-999, Math.min(999, Math.round(Number(v)) || 0))

/** D&D e Faroeste: o modificador grande no meio e o valor numa “moeda” embaixo. */
export function AtributoComMod({ id, nome, valor, mod, somenteLeitura, mudarValor, mudarMod, rolar }: {
  id: string; nome: string; valor: number; mod: number; somenteLeitura: boolean; mudarValor: (v: number) => void; mudarMod: (v: number) => void; rolar?: () => void
}) {
  return <div className="ficha-atributo-mod relative flex flex-col items-center rounded-[1.4rem] border-2 border-(--ficha-borda) bg-(--s-171325) px-1 pb-4 pt-2 text-center">
    <p className="px-5 text-xs font-bold uppercase tracking-widest text-(--ficha-acento) [font-family:var(--ficha-fonte)]" title={nome}>{id}</p>
    <input type="number" aria-label={'Modificador de ' + nome} value={mod} disabled={somenteLeitura} onChange={e => mudarMod(num(e.target.value))}
      className="w-full bg-transparent text-center text-3xl font-black text-white outline-none disabled:opacity-80" />
    <p className="-mt-1 mb-1 max-w-full truncate px-1 text-[9px] text-(--a-a998bd)">{nome}</p>
    <input type="number" aria-label={nome + ' (valor)'} value={valor} disabled={somenteLeitura} onChange={e => mudarValor(num(e.target.value))}
      className="absolute -bottom-3 left-1/2 w-14 -translate-x-1/2 rounded-full border-2 border-(--ficha-borda) bg-(--s-151123) py-0.5 text-center text-sm font-bold text-white outline-none disabled:opacity-80" />
    {rolar && <button type="button" onClick={rolar} aria-label={'Rolar ' + nome + ' (' + sinal(mod) + ')'} title={'Rolar ' + id} className="absolute right-1 top-1 rounded-md p-1 text-(--ficha-acento) hover:bg-(--s-2b2140)"><Dice5 size={14} /></button>}
  </div>
}

/** PF2e, Tormenta20 e MÖRK BORG: o atributo já é o modificador, num bloco grande com sinal. */
export function AtributoModificador({ id, nome, valor, somenteLeitura, mudar, rolar, sombrio }: {
  id: string; nome: string; valor: number; somenteLeitura: boolean; mudar: (v: number) => void; rolar?: () => void; sombrio?: boolean
}) {
  return <div className={'ficha-atributo-base relative rounded-xl border-2 p-2 text-center ' + (sombrio ? 'border-(--ficha-acento) bg-black' : 'border-(--ficha-borda) bg-(--s-171325)')}>
    <p className={'text-xs font-black uppercase tracking-[0.2em] ' + (sombrio ? 'text-(--ficha-acento)' : 'text-(--ficha-acento) [font-family:var(--ficha-fonte)]')}>{id}</p>
    <input type="number" aria-label={nome} value={valor} disabled={somenteLeitura} onChange={e => mudar(num(e.target.value))}
      className={'w-full bg-transparent text-center font-black text-white outline-none disabled:opacity-80 ' + (sombrio ? 'text-4xl' : 'text-3xl')} />
    <p className={'truncate text-[10px] ' + (sombrio ? 'font-bold uppercase text-white/80' : 'text-(--a-a998bd)')}>{nome}</p>
    {rolar && <button type="button" onClick={rolar} aria-label={'Rolar ' + nome} className="absolute right-1 top-1 rounded-md p-1 text-(--ficha-acento) hover:bg-white/10"><Dice5 size={14} /></button>}
  </div>
}

/** Símbolo curto de cada grau de treino (só para mostrar; a plataforma não soma nada). */
const SIMBOLOS: Record<string, Record<string, string>> = {
  'dnd5e-srd': { nenhum: '○', proficiente: '●', especialista: '◉' },
  pf2e: { destreinado: 'D', treinado: 'T', especialista: 'E', mestre: 'M', lendario: 'L' },
  'ordem-paranormal': { destreinado: '–', treinado: 'T', veterano: 'V', expert: 'E' },
  tormenta20: { destreinado: '○', treinado: '●' },
}
/** Botão do grau de treino: toca para passar ao próximo grau. */
export function GrauPericia({ s, valor, nome, somenteLeitura, mudar }: { s: Sistema; valor: string; nome: string; somenteLeitura: boolean; mudar: (v: string) => void }) {
  const treinos = s.pericias?.treinos ?? []
  if (!treinos.length) return null
  const i = Math.max(0, treinos.findIndex(t => t.id === valor)), atual = treinos[i]
  const simbolo = SIMBOLOS[s.id]?.[atual.id] ?? atual.nome[0]
  const ativo = i > 0
  return <button type="button" disabled={somenteLeitura} onClick={() => mudar(treinos[(i + 1) % treinos.length].id)}
    aria-label={`Grau em ${nome}: ${atual.nome} (toque para mudar)`} title={atual.nome}
    className={'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold ' + (ativo ? 'border-(--ficha-acento) bg-(--ficha-acento)/20 text-(--ficha-acento)' : 'border-(--a-5e4b78) text-(--a-a998bd)')}>{simbolo}</button>
}

/** Escada do Fate, do maior para o menor (só os nomes; o número é o que está digitado). */
export const ESCADA_FATE = ['Medíocre', 'Regular', 'Razoável', 'Bom', 'Ótimo', 'Excepcional', 'Fantástico', 'Épico', 'Lendário']
/** Fate: pirâmide de perícias. Cada degrau mostra as perícias daquele nível; toque para rolar. */
export function PiramideFate({ pericias, valores, somenteLeitura, mudar, rolar }: {
  pericias: { id: string; nome: string }[]; valores: Record<string, number | null>; somenteLeitura: boolean; mudar: (id: string, v: number) => void; rolar: (nome: string, v: number) => void
}) {
  const nivel = (id: string) => Math.max(0, Math.min(8, Number(valores[id]) || 0))
  // Mostra pelo menos do Ótimo (+4) ao Regular (+1), como a pirâmide inicial do Fate.
  const maior = Math.max(4, ...pericias.map(p => nivel(p.id)))
  const degraus = Array.from({ length: maior }, (_, i) => maior - i)
  return <div className="space-y-3">
    <div className="space-y-1.5" role="list" aria-label="Pirâmide de perícias">
      {degraus.map(n => { const aqui = pericias.filter(p => nivel(p.id) === n)
        return <div key={n} role="listitem" className="flex items-center gap-2">
          <span className="w-24 shrink-0 text-right text-xs font-bold text-(--ficha-acento)">{ESCADA_FATE[n] ?? n} <span className="text-white">+{n}</span></span>
          <div className="flex min-h-9 flex-1 flex-wrap justify-center gap-1.5 rounded-lg border border-dashed border-(--ficha-borda) p-1">
            {aqui.length ? aqui.map(p => <button key={p.id} type="button" onClick={() => rolar(p.nome, n)} className="rounded-md border border-(--ficha-acento)/60 bg-(--ficha-acento)/15 px-2 py-1 text-xs font-semibold text-white hover:bg-(--ficha-acento)/30">
              {p.nome}</button>) : <span className="self-center text-[11px] text-(--a-a998bd)">vazio</span>}
          </div>
        </div> })}
    </div>
    <details className="rounded-xl border border-(--ficha-borda) p-2">
      <summary className="cursor-pointer text-sm font-semibold">Colocar cada perícia num degrau</summary>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {pericias.map(p => <label key={p.id} className="flex items-center gap-2 rounded-lg bg-(--s-171325) px-2 py-1.5 text-sm">
          <span className="min-w-0 flex-1 truncate">{p.nome}</span>
          <select aria-label={'Degrau de ' + p.nome} value={nivel(p.id)} disabled={somenteLeitura} onChange={e => mudar(p.id, Number(e.target.value))}
            className="rounded-lg border border-(--a-5e4b78) bg-(--s-151123) px-1 py-1 text-xs">
            {ESCADA_FATE.slice(0, 7).map((nome, i) => <option key={i} value={i}>{nome} (+{i})</option>)}</select>
        </label>)}
      </div>
    </details>
  </div>
}

/** Blades: ações em três grupos, com bolinhas (cada bolinha = um dado). */
export function AcoesBlades({ grupos, valores, resistencias, somenteLeitura, mudar, rolar, rolarResistencia }: {
  grupos: [string, { id: string; nome: string }[]][]; valores: Record<string, number | null>
  resistencias: Record<string, { id: string; valor: number } | undefined>
  somenteLeitura: boolean; mudar: (id: string, v: number) => void; rolar: (nome: string, n: number) => void; rolarResistencia: (nome: string, n: number) => void
}) {
  return <div className="grid gap-3 sm:grid-cols-3">
    {grupos.map(([g, acoes]) => { const r = resistencias[g]
      return <div key={g} className="rounded-xl border-2 border-(--ficha-borda) bg-(--s-171325) p-2">
        <div className="mb-2 flex items-center gap-2 border-b border-(--ficha-borda) pb-1.5">
          <h3 className="flex-1 text-sm font-bold uppercase tracking-wider text-(--ficha-acento) [font-family:var(--ficha-fonte)]">{g}</h3>
          {r && <button type="button" onClick={() => rolarResistencia(g, r.valor)} className="rounded-md border border-(--ficha-borda) px-1.5 py-0.5 text-[11px] hover:bg-white/5" title="Rolar resistência">🛡️ {r.valor || 0}d6</button>}
        </div>
        <ul className="space-y-1">{acoes.map(a => { const n = Math.max(0, Math.min(4, Number(valores[a.id]) || 0))
          return <li key={a.id} className="flex items-center gap-1.5">
            <button type="button" onClick={() => rolar(a.nome, n)} className="min-w-0 flex-1 truncate rounded px-1 py-1 text-left text-sm hover:bg-white/5" aria-label={`Rolar ${a.nome} (${n || 2}d6${n ? '' : ', o menor'})`}>{a.nome}</button>
            <span className="flex gap-0.5" role="group" aria-label={'Pontos em ' + a.nome}>{[1, 2, 3, 4].map(i =>
              <button key={i} type="button" disabled={somenteLeitura} onClick={() => mudar(a.id, n === i ? i - 1 : i)} aria-label={`${a.nome}: ${i} ponto${i > 1 ? 's' : ''}`} aria-pressed={i <= n}
                className={'h-6 w-6 rounded-full border-2 ' + (i <= n ? 'border-(--ficha-acento) bg-(--ficha-acento)' : 'border-(--a-5e4b78) bg-transparent')} />)}</span>
          </li> })}</ul>
      </div> })}
  </div>
}

/** Ordem Paranormal: NEX, classe, trilha e origem em destaque no começo da ficha. */
export function ResumoOrdem({ nex, classe, trilha, origem, pe, san }: { nex: number; classe: string; trilha: string; origem: string
  pe: { atual: number; max: number | null }; san: { atual: number; max: number | null } }) {
  const barra = (v: { atual: number; max: number | null }, cor: string) => <div className="h-1.5 overflow-hidden rounded-full bg-black/50"><div className="h-full rounded-full" style={{ width: (v.max ? Math.max(0, Math.min(1, v.atual / v.max)) * 100 : 0) + '%', background: cor }} /></div>
  return <section className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-2xl border-2 border-(--ficha-borda) bg-gradient-to-br from-[#2a1240] to-(--s-171325) p-3 sm:p-4" aria-label="Resumo do agente">
    <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full border-4 border-(--ficha-acento) bg-black/40 shadow-[0_0_18px_#a855f755]">
      <span className="text-[10px] font-bold tracking-widest text-(--ficha-acento)">NEX</span><span className="text-2xl font-black text-white">{nex}%</span></div>
    <div className="min-w-0 space-y-1.5">
      <p className="flex flex-wrap gap-1.5 text-xs">{[['Classe', classe], ['Trilha', trilha], ['Origem', origem]].map(([k, v]) => <span key={k} className="rounded-full border border-(--ficha-borda) bg-black/30 px-2 py-0.5"><span className="text-(--a-a998bd)">{k}:</span> <strong>{v || '—'}</strong></span>)}</p>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div><p className="flex justify-between"><span>⚡ PE</span><strong>{pe.atual}/{pe.max ?? '—'}</strong></p>{barra(pe, '#f59e0b')}</div>
        <div><p className="flex justify-between"><span>🧠 Sanidade</span><strong>{san.atual}/{san.max ?? '—'}</strong></p>{barra(san, '#60a5fa')}</div>
      </div>
    </div>
  </section>
}
