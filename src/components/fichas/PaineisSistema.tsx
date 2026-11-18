'use client'

import { useState } from 'react'
import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import type { DadosFicha, Sistema } from '@/lib/sistemas/tipos'

/**
 * Partes próprias de cada sistema (v0.35.9): o que é a cara de cada jogo, no lugar certo e fácil de marcar.
 * Nada aqui calcula regra: só mostra e guarda o que o jogador e o mestre marcam (em `marcas` ou nos recursos).
 */
type Props = { s: Sistema; d: DadosFicha; onChange: (d: DadosFicha) => void; somenteLeitura: boolean }
type Marca = boolean | number | string
const card = 'rounded-2xl border border-(--ficha-borda) bg-(--ficha-cartao) p-4 sm:p-5'
const titulo = 'mb-2 flex items-center gap-2 font-bold text-(--ficha-acento) [font-family:var(--ficha-fonte)]'
const dica = 'mb-3 text-xs text-(--a-a998bd)'
const input = 'w-full rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-sm text-white disabled:opacity-70'

function usarMarcas({ d, onChange }: Props) {
  const m = d.marcas ?? {}
  const set = (mud: Record<string, Marca | null>) => {
    const n = { ...m }
    for (const [k, v] of Object.entries(mud)) if (v === null || v === false || v === '') delete n[k]; else n[k] = v
    onChange({ ...d, marcas: n })
  }
  return { m, set, num: (k: string) => Number(m[k]) || 0, txt: (k: string) => typeof m[k] === 'string' ? m[k] as string : '', sim: (k: string) => m[k] === true }
}
const recurso = (d: DadosFicha, id: string) => ({ atual: Number(d.recursos[id]?.atual ?? 0) || 0, max: d.recursos[id]?.max === undefined || d.recursos[id]?.max === null ? null : Number(d.recursos[id]?.max) || 0 })
const mudarRecurso = (p: Props, id: string, atual: number) => p.onChange({ ...p.d, recursos: { ...p.d.recursos, [id]: { ...p.d.recursos[id], atual } } })
// Na ficha manual, o descanso e a mesa usam o máximo guardado aqui (não uma fórmula ao vivo) — por isso
// cada painel precisa de um jeito de editar o máximo, e não só o atual (v0.35.9, achado do Codex).
const mudarMax = (p: Props, id: string, max: number) => p.onChange({ ...p.d, recursos: { ...p.d.recursos, [id]: { ...p.d.recursos[id], atual: Math.min(Number(p.d.recursos[id]?.atual ?? 0) || 0, max), max } } })
function CampoMax({ valor, mudar, rotulo, teto = 20, desabilitado, cor }: { valor: number | null; mudar: (n: number) => void; rotulo: string; teto?: number; desabilitado?: boolean; cor?: string }) {
  return <label className="ml-auto flex items-center gap-1 text-[10px] font-normal" style={{ color: cor ?? 'var(--a-c4b6d4)' }}>máx
    <input type="number" min={0} max={teto} value={valor ?? ''} disabled={desabilitado} aria-label={'Máximo de ' + rotulo}
      onChange={e => mudar(Math.max(0, Math.min(teto, Math.round(Number(e.target.value)) || 0)))}
      className="w-10 rounded border border-(--a-5e4b78) bg-(--s-151123) px-1 text-center text-white disabled:opacity-70" /></label>
}

/** Fileira de caixas: toca numa caixa para marcar até ela (ou desmarcar a última). */
export function Caixas({ total, marcadas, mudar, rotulo, forma = 'quadrado', cor = 'var(--ficha-acento)', desabilitado }: {
  total: number; marcadas: number; mudar: (n: number) => void; rotulo: string; forma?: 'quadrado' | 'circulo' | 'losango' | 'caveira'; cor?: string; desabilitado?: boolean }) {
  return <div className="flex flex-wrap gap-1.5" role="group" aria-label={rotulo}>
    {Array.from({ length: Math.max(0, Math.min(40, total)) }, (_, i) => { const on = i < marcadas
      return <button key={i} type="button" disabled={desabilitado} aria-pressed={on} aria-label={`${rotulo}: ${i + 1}`} onClick={() => mudar(on && marcadas === i + 1 ? i : i + 1)}
        className={'flex h-8 w-8 items-center justify-center border-2 text-sm font-black transition disabled:opacity-70 ' + (forma === 'circulo' || forma === 'caveira' ? 'rounded-full' : forma === 'losango' ? 'rotate-45 rounded-sm' : 'rounded-md')}
        style={{ borderColor: cor, background: on ? cor : 'transparent', color: on ? '#0b0912' : cor }}>
        <span className={forma === 'losango' ? '-rotate-45' : ''}>{forma === 'caveira' ? (on ? '☠' : '') : on ? '✓' : ''}</span></button> })}
  </div>
}

/* ---------------- D&D (2024 e 2014) ---------------- */
function PainelDnd(p: Props) {
  const { num, set } = usarMarcas(p)
  const [todos, setTodos] = useState(false)
  // Espaços de magia: os recursos espacos_1…9 (máximo = quantos tem; atual = quantos sobram).
  const esp = (c: number) => recurso(p.d, 'espacos_' + c)
  const circulos = Array.from({ length: 9 }, (_, i) => i + 1).filter(c => todos || (esp(c).max ?? 0) > 0)
  const mudarEsp = (c: number, max: number, usados: number) => p.onChange({ ...p.d, recursos: { ...p.d.recursos, ['espacos_' + c]: { ...p.d.recursos['espacos_' + c], max, atual: Math.max(0, max - usados) } } })
  return <>
    <section className={card} aria-label="Salvaguardas contra a morte">
      <h2 className={titulo}>☠️ Salvaguardas contra a morte</h2>
      <p className={dica}>Com 0 PV: role um d20 por turno. Marque os sucessos e as falhas; três de um lado decidem.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><p className="mb-1 text-xs text-emerald-200">Sucessos</p><Caixas total={3} marcadas={num('ms_s')} mudar={n => set({ ms_s: n || null })} rotulo="Sucessos contra a morte" forma="circulo" cor="#6ee7b7" desabilitado={p.somenteLeitura} /></div>
        <div><p className="mb-1 text-xs text-red-200">Falhas</p><Caixas total={3} marcadas={num('ms_f')} mudar={n => set({ ms_f: n || null })} rotulo="Falhas contra a morte" forma="caveira" cor="#f87171" desabilitado={p.somenteLeitura} /></div>
      </div>
      {(num('ms_s') > 0 || num('ms_f') > 0) && !p.somenteLeitura && <button type="button" onClick={() => set({ ms_s: null, ms_f: null })} className="mt-3 inline-flex items-center gap-1 rounded-lg border border-(--a-5e4b78) px-2.5 py-1 text-xs hover:bg-(--s-34294f)"><RotateCcw size={13} /> Limpar</button>}
    </section>
    <section className={card} aria-label="Espaços de magia">
      <div className="mb-2 flex items-center justify-between gap-2"><h2 className={titulo + ' mb-0'}>🔮 Espaços de magia</h2>
        <button type="button" onClick={() => setTodos(t => !t)} className="text-xs text-(--a-c7a8ff) underline">{todos ? 'Só os que tenho' : 'Mostrar os 9 níveis'}</button></div>
      <p className={dica}>Escreva quantos espaços você tem em cada nível e toque para marcar os usados.</p>
      {!circulos.length && <p className="text-sm text-(--a-bfb2cf)">Nenhum espaço anotado. Toque em “Mostrar os 9 níveis”.</p>}
      <div className="space-y-2">{circulos.map(c => { const r = esp(c), max = r.max ?? 0, usados = Math.max(0, max - r.atual)
        return <div key={c} className="flex flex-wrap items-center gap-2 rounded-xl bg-(--s-171325) px-3 py-2">
          <span className="w-16 text-sm font-bold [font-family:var(--ficha-fonte)]">{c}º nível</span>
          <label className="flex items-center gap-1 text-xs text-(--a-c4b6d4)">Total<input type="number" min={0} max={9} value={max || ''} disabled={p.somenteLeitura} aria-label={`Espaços de ${c}º nível`}
            onChange={e => { const t = Math.max(0, Math.min(9, Number(e.target.value) || 0)); mudarEsp(c, t, Math.min(usados, t)) }} className={input + ' !w-14 text-center'} /></label>
          <div className="dnd-cristais-interativos" role="group" aria-label={`Espaços de ${c}º nível`}>{Array.from({length:Math.min(9,max)},(_,i)=><button key={i} type="button" disabled={p.somenteLeitura} aria-pressed={i<r.atual} aria-label={`Espaço ${i+1}: ${i<r.atual?'disponível':'usado'}`} onClick={()=>mudarEsp(c,max,max-(r.atual===i+1?i:i+1))}><svg aria-hidden="true" viewBox="0 0 22 30" data-disponivel={i<r.atual?'sim':'nao'}><path d="M11 1L21 11L11 29L1 11Z"/><path d="M11 1L7 11L11 29L15 11Z M1 11H21" fill="none"/></svg></button>)}</div>
        </div> })}</div>
      {circulos.some(c => (esp(c).max ?? 0) > esp(c).atual) && !p.somenteLeitura && <button type="button" onClick={() => p.onChange({ ...p.d, recursos: { ...p.d.recursos, ...Object.fromEntries(Array.from({ length: 9 }, (_, i) => { const r = esp(i + 1); return ['espacos_' + (i + 1), { ...p.d.recursos['espacos_' + (i + 1)], atual: r.max ?? r.atual }] })) } })}
        className="mt-3 inline-flex items-center gap-1 rounded-lg border border-(--a-5e4b78) px-2.5 py-1 text-xs hover:bg-(--s-34294f)"><RotateCcw size={13} /> Recuperar todos</button>}
    </section>
  </>
}

/* ---------------- Pathfinder 2e ---------------- */
function PainelPf2e(p: Props) {
  const { num, set, sim } = usarMarcas(p)
  const her = recurso(p.d, 'heroismo'), mor = recurso(p.d, 'morrendo'), fer = recurso(p.d, 'ferido')
  return <section className={card} aria-label="Turno e heroísmo">
    <h2 className={titulo}>◆ Turno</h2>
    <p className={dica}>Três ações e uma reação por turno. Toque para gastar; “Novo turno” devolve tudo.</p>
    <div className="flex flex-wrap items-center gap-2">
      {[1, 2, 3].map(i => <button key={i} type="button" disabled={p.somenteLeitura} aria-pressed={num('acoes') >= i} aria-label={'Ação ' + i} onClick={() => set({ acoes: num('acoes') === i ? i - 1 || null : i })}
        className={'flex h-10 w-10 rotate-45 items-center justify-center rounded-md border-2 border-(--ficha-acento) ' + (num('acoes') >= i ? 'bg-(--ficha-acento)/20 opacity-40' : 'bg-(--ficha-acento)')}>
        <span className="-rotate-45 text-sm font-black text-black">{i}</span></button>)}
      <button type="button" disabled={p.somenteLeitura} aria-pressed={sim('reacao')} aria-label="Reação" onClick={() => set({ reacao: !sim('reacao') })}
        className={'ml-2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-(--ficha-acento) text-lg ' + (sim('reacao') ? 'opacity-40' : 'bg-(--ficha-acento) text-black')}>⟲</button>
      {!p.somenteLeitura && <button type="button" onClick={() => set({ acoes: null, reacao: null })} className="ml-auto inline-flex items-center gap-1 rounded-lg border border-(--a-5e4b78) px-2.5 py-1 text-xs hover:bg-(--s-34294f)"><RotateCcw size={13} /> Novo turno</button>}
    </div>
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <div><p className="mb-1 flex items-center gap-1 text-xs text-amber-200">Pontos de Heroísmo<CampoMax valor={her.max} mudar={n => mudarMax(p, 'heroismo', n)} rotulo="Pontos de Heroísmo" teto={6} desabilitado={p.somenteLeitura} /></p>
        <Caixas total={Math.max(1, her.max ?? 3)} marcadas={her.atual} mudar={n => mudarRecurso(p, 'heroismo', n)} rotulo="Pontos de Heroísmo" forma="circulo" cor="#fbbf24" desabilitado={p.somenteLeitura} /></div>
      <div><p className="mb-1 flex items-center gap-1 text-xs text-red-200">Morrendo<CampoMax valor={mor.max} mudar={n => mudarMax(p, 'morrendo', n)} rotulo="Morrendo" teto={8} desabilitado={p.somenteLeitura} /></p>
        <Caixas total={Math.max(1, mor.max ?? 4)} marcadas={mor.atual} mudar={n => mudarRecurso(p, 'morrendo', n)} rotulo="Morrendo" forma="caveira" cor="#f87171" desabilitado={p.somenteLeitura} /></div>
      <div><p className="mb-1 flex items-center gap-1 text-xs text-orange-200">Ferido<CampoMax valor={fer.max} mudar={n => mudarMax(p, 'ferido', n)} rotulo="Ferido" teto={8} desabilitado={p.somenteLeitura} /></p>
        <Caixas total={Math.max(1, fer.max ?? 3)} marcadas={fer.atual} mudar={n => mudarRecurso(p, 'ferido', n)} rotulo="Ferido" cor="#fb923c" desabilitado={p.somenteLeitura} /></div>
    </div>
  </section>
}

/* ---------------- Fate ---------------- */
function PainelFate(p: Props) {
  const { txt, set } = usarMarcas(p)
  const pd = recurso(p.d, 'pontos_destino')
  // Caixas de estresse (v0.35.9): o próprio recurso é quem diz quantas estão marcadas, igual ao descanso
  // e à mesa já entendem — assim a recuperação no descanso longo e fichas antigas aparecem certas.
  const trilha = (id: string, nome: string, cor: string) => { const r = recurso(p.d, id), total = Math.max(2, Math.min(8, r.max ?? 2))
    const mudarTotal = (n: number) => { const t = Math.max(1, Math.min(8, n)); p.onChange({ ...p.d, recursos: { ...p.d.recursos, [id]: { ...p.d.recursos[id], atual: Math.min(r.atual, t), max: t } } }) }
    return <div><p className="mb-1 flex items-center gap-2 text-xs" style={{ color: cor }}>{nome}
      {!p.somenteLeitura && <span className="ml-auto flex items-center gap-1 text-(--a-c4b6d4)">caixas <button type="button" onClick={() => mudarTotal(total - 1)} className="rounded border border-(--a-5e4b78) px-1.5" aria-label={'Menos caixas de ' + nome}>−</button><button type="button" onClick={() => mudarTotal(total + 1)} className="rounded border border-(--a-5e4b78) px-1.5" aria-label={'Mais caixas de ' + nome}>+</button></span>}</p>
      <Caixas total={total} marcadas={Math.min(total, r.atual)} mudar={n => mudarRecurso(p, id, n)} rotulo={nome} cor={cor} desabilitado={p.somenteLeitura} />
    </div> }
  return <section className={card} aria-label="Destino, estresse e consequências">
    <h2 className={titulo}>✦ Destino, estresse e consequências</h2>
    <p className={dica}>Toque nas caixas de estresse para marcar. As consequências ficam escritas até se recuperar.</p>
    <div className="mb-4 flex flex-wrap items-center gap-2"><span className="text-sm">Pontos de destino</span>
      <Caixas total={Math.max(1, pd.max ?? 3, pd.atual)} marcadas={pd.atual} mudar={n => mudarRecurso(p, 'pontos_destino', n)} rotulo="Pontos de destino" forma="circulo" cor="#6cc4ff" desabilitado={p.somenteLeitura} />
      {!p.somenteLeitura && <span className="flex items-center gap-1 text-(--a-c4b6d4)"><button type="button" onClick={() => mudarRecurso(p, 'pontos_destino', Math.max(0, pd.atual - 1))} className="rounded border border-(--a-5e4b78) px-1.5" aria-label="Menos um ponto de destino">−</button>
        <button type="button" onClick={() => mudarRecurso(p, 'pontos_destino', pd.atual + 1)} className="rounded border border-(--a-5e4b78) px-1.5" aria-label="Mais um ponto de destino">+</button></span>}
      <CampoMax valor={pd.max} mudar={n => mudarMax(p, 'pontos_destino', n)} rotulo="Pontos de destino" teto={10} desabilitado={p.somenteLeitura} /></div>
    <div className="grid gap-3 sm:grid-cols-2">{trilha('estresse_fisico', 'Estresse físico', '#f87171')}{trilha('estresse_mental', 'Estresse mental', '#a78bfa')}</div>
    <div className="mt-4 grid gap-2">{[['cons_suave', 'Suave (2)'], ['cons_moderada', 'Moderada (4)'], ['cons_severa', 'Severa (6)'], ['cons_extra', 'Extra (2)']].map(([k, nome]) =>
      <label key={k} className="flex items-center gap-2 text-sm"><span className="w-28 shrink-0 text-xs text-(--a-c4b6d4)">{nome}</span>
        <input value={txt(k)} maxLength={120} disabled={p.somenteLeitura} onChange={e => set({ [k]: e.target.value })} className={input} placeholder="Consequência (aspecto)" /></label>)}</div>
  </section>
}

/* ---------------- Blades in the Dark ---------------- */
const TRAUMAS = ['Frio', 'Assombrado', 'Obcecado', 'Paranoico', 'Imprudente', 'Instável', 'Insensível', 'Vicioso']
function Relogio({ tam, feito, cor }: { tam: number; feito: number; cor: string }) {
  return <svg viewBox="-22 -22 44 44" className="h-14 w-14 shrink-0" aria-hidden>
    {Array.from({ length: tam }, (_, i) => { const a0 = (i / tam) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / tam) * 2 * Math.PI - Math.PI / 2
      return <path key={i} d={`M0 0 L${20 * Math.cos(a0)} ${20 * Math.sin(a0)} A20 20 0 0 1 ${20 * Math.cos(a1)} ${20 * Math.sin(a1)} Z`} fill={i < feito ? cor : 'transparent'} stroke={cor} strokeWidth="1.5" /> })}
  </svg>
}
function PainelBlades(p: Props) {
  const { num, txt, sim, set } = usarMarcas(p)
  const est = recurso(p.d, 'estresse'), tra = recurso(p.d, 'trauma')
  const relogios = [1, 2, 3, 4, 5, 6].filter(i => num(`rel${i}_tam`) > 0)
  const livre = [1, 2, 3, 4, 5, 6].find(i => !num(`rel${i}_tam`))
  return <>
    <section className={card} aria-label="Estresse e trauma">
      <h2 className={titulo}>⚡ Estresse e trauma</h2>
      <p className={dica}>Estresse vai até 9. Quando passar, marque um trauma (com 4, o personagem se aposenta).</p>
      <div className="mb-1 flex items-center gap-1"><CampoMax valor={est.max} mudar={n => mudarMax(p, 'estresse', n)} rotulo="Estresse" teto={16} desabilitado={p.somenteLeitura} /></div>
      <Caixas total={Math.max(1, est.max ?? 9)} marcadas={est.atual} mudar={n => mudarRecurso(p, 'estresse', n)} rotulo="Estresse" cor="#9fdccb" desabilitado={p.somenteLeitura} />
      <div className="mt-4 flex flex-wrap items-center gap-2"><span className="text-xs text-(--a-c4b6d4)">Trauma</span>
        <Caixas total={Math.max(1, tra.max ?? 4)} marcadas={tra.atual} mudar={n => mudarRecurso(p, 'trauma', n)} rotulo="Trauma" forma="circulo" cor="#f87171" desabilitado={p.somenteLeitura} />
        <CampoMax valor={tra.max} mudar={n => mudarMax(p, 'trauma', n)} rotulo="Trauma" teto={8} desabilitado={p.somenteLeitura} /></div>
      <div className="mt-3 flex flex-wrap gap-1.5">{TRAUMAS.map(t => { const k = 'trauma_' + t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
        return <button key={t} type="button" disabled={p.somenteLeitura} aria-pressed={sim(k)} onClick={() => set({ [k]: !sim(k) })}
          className={'rounded-full border px-2.5 py-1 text-xs ' + (sim(k) ? 'border-red-300 bg-red-500/30 text-red-100' : 'border-(--ficha-borda) text-(--a-cfc0df)')}>{t}</button> })}</div>
    </section>
    <section className={card} aria-label="Relógios de progresso">
      <h2 className={titulo}>🕰️ Relógios</h2>
      <p className={dica}>Relógios de progresso (projetos, perigos, cura…). Toque no relógio para avançar; o botão − volta um.</p>
      {!relogios.length && <p className="text-sm text-(--a-bfb2cf)">Nenhum relógio.</p>}
      <div className="grid gap-2 sm:grid-cols-2">{relogios.map(i => { const tam = num(`rel${i}_tam`), feito = num(`rel${i}_feito`)
        return <div key={i} className="flex items-center gap-3 rounded-xl bg-(--s-171325) p-2">
          <button type="button" disabled={p.somenteLeitura} onClick={() => set({ [`rel${i}_feito`]: feito >= tam ? null : feito + 1 })} aria-label={`Avançar relógio ${txt(`rel${i}_nome`) || i}`}><Relogio tam={tam} feito={feito} cor="#9fdccb" /></button>
          <div className="min-w-0 flex-1">
            <input value={txt(`rel${i}_nome`)} maxLength={60} disabled={p.somenteLeitura} onChange={e => set({ [`rel${i}_nome`]: e.target.value })} aria-label="Nome do relógio" className={input + ' !p-1.5'} placeholder="Nome do relógio" />
            <p className="mt-1 flex items-center gap-2 text-xs text-(--a-c4b6d4)">{feito}/{tam}
              {!p.somenteLeitura && <><button type="button" onClick={() => set({ [`rel${i}_feito`]: Math.max(0, feito - 1) || null })} className="rounded border border-(--a-5e4b78) px-1.5" aria-label="Voltar um">−</button>
                <button type="button" onClick={() => set({ [`rel${i}_tam`]: null, [`rel${i}_feito`]: null, [`rel${i}_nome`]: null })} className="ml-auto text-red-200" aria-label="Tirar relógio"><Trash2 size={13} /></button></>}</p>
          </div>
        </div> })}</div>
      {!p.somenteLeitura && livre && <div className="mt-3 flex flex-wrap gap-1.5">{[4, 6, 8].map(t => <button key={t} type="button" onClick={() => set({ [`rel${livre}_tam`]: t })} className="inline-flex items-center gap-1 rounded-lg border border-(--a-5e4b78) px-2.5 py-1 text-xs hover:bg-(--s-34294f)"><Plus size={13} /> Relógio de {t}</button>)}</div>}
    </section>
  </>
}

/* ---------------- Faroeste Arcano: cartaz de procurado ---------------- */
function PainelFaroeste(p: Props) {
  const { txt, set } = usarMarcas(p)
  return <section aria-label="Cartaz de procurado" className="relative overflow-hidden rounded-2xl border-4 border-[#6b4a26] bg-[linear-gradient(160deg,#e9d3a6,#cfae75_60%,#b48b52)] p-4 text-[#2a1a0c] shadow-[inset_0_0_40px_#6b4a2688]">
    <p className="text-center text-3xl font-black tracking-[0.25em] [font-family:var(--font-cinzel),Georgia,serif]">PROCURADO</p>
    <p className="text-center text-xs font-bold uppercase tracking-widest">vivo ou morto</p>
    <div className="mx-auto my-3 h-36 w-32 overflow-hidden rounded border-2 border-[#6b4a26] bg-[#d8bf8c] sepia">
      {p.d.retrato
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={p.d.retrato} alt="" className="h-full w-full object-cover" />
        : <span className="flex h-full items-center justify-center text-5xl opacity-50">🤠</span>}
    </div>
    <p className="text-center text-2xl font-black [font-family:var(--font-cormorant),Georgia,serif]">{p.d.nome || 'Sem nome'}</p>
    {!!p.d.campos.estigma && <p className="text-center text-xs italic">“{String(p.d.campos.estigma)}”</p>}
    <label className="mx-auto mt-3 flex max-w-xs items-center gap-2 text-sm font-bold">Recompensa
      <input value={txt('recompensa')} maxLength={40} disabled={p.somenteLeitura} onChange={e => set({ recompensa: e.target.value })} className="w-full rounded border-2 border-[#6b4a26] bg-[#f3e2bd] px-2 py-1 text-center font-black text-[#2a1a0c]" placeholder="$ 500" /></label>
    <label className="mx-auto mt-2 flex max-w-xs items-center gap-2 text-xs font-bold">Crimes
      <input value={txt('crimes')} maxLength={120} disabled={p.somenteLeitura} onChange={e => set({ crimes: e.target.value })} className="w-full rounded border border-[#6b4a26] bg-[#f3e2bd] px-2 py-1 text-[#2a1a0c]" placeholder="Roubo de diligência…" /></label>
  </section>
}

/* ---------------- Tormenta20 e Ordem Paranormal: condições ---------------- */
const CONDICOES_T20 = ['Abalado', 'Agarrado', 'Alquebrado', 'Apavorado', 'Atordoado', 'Caído', 'Cego', 'Confuso', 'Debilitado', 'Desprevenido', 'Enjoado', 'Enredado', 'Envenenado', 'Esmorecido', 'Exausto', 'Fascinado', 'Fatigado', 'Fraco', 'Frustrado', 'Imóvel', 'Inconsciente', 'Indefeso', 'Lento', 'Ofuscado', 'Paralisado', 'Pasmo', 'Sangrando', 'Surdo', 'Surpreendido', 'Vulnerável']
const CONDICOES_OP = ['Abalado', 'Agarrado', 'Alquebrado', 'Apavorado', 'Atordoado', 'Caído', 'Cego', 'Confuso', 'Debilitado', 'Desprevenido', 'Enjoado', 'Enlouquecendo', 'Enredado', 'Envenenado', 'Esmorecido', 'Exausto', 'Fatigado', 'Fraco', 'Frustrado', 'Imóvel', 'Inconsciente', 'Indefeso', 'Lento', 'Machucado', 'Morrendo', 'Ofuscado', 'Paralisado', 'Pasmo', 'Perturbado', 'Sangrando', 'Surdo', 'Surpreendido', 'Vulnerável']
function PainelCondicoes(p: Props & { lista: string[]; tituloTexto: string }) {
  const { sim, set } = usarMarcas(p)
  const chave = (c: string) => 'cond_' + c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const ativas = p.lista.filter(c => sim(chave(c)))
  const [abrir, setAbrir] = useState(false)
  return <section className={card} aria-label="Condições">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className={titulo + ' mb-0'}>{p.tituloTexto}</h2>
      <button type="button" onClick={() => setAbrir(a => !a)} className="text-xs text-(--a-c7a8ff) underline">{abrir ? 'Fechar a lista' : 'Marcar condições'}</button></div>
    <p className="mt-2 flex flex-wrap gap-1.5">{ativas.length ? ativas.map(c => <span key={c} className="rounded-full border border-(--ficha-acento) bg-(--ficha-acento)/20 px-2.5 py-1 text-xs font-semibold">{c}</span>) : <span className="text-sm text-(--a-bfb2cf)">Nenhuma condição.</span>}</p>
    {abrir && <div className="mt-3 flex flex-wrap gap-1.5">{p.lista.map(c => <button key={c} type="button" disabled={p.somenteLeitura} aria-pressed={sim(chave(c))} onClick={() => set({ [chave(c)]: !sim(chave(c)) })}
      className={'rounded-full border px-2.5 py-1 text-xs ' + (sim(chave(c)) ? 'border-(--ficha-acento) bg-(--ficha-acento) font-semibold text-black' : 'border-(--ficha-borda) text-(--a-cfc0df)')}>{c}</button>)}</div>}
  </section>
}

/* ---------------- Mörk Borg ---------------- */
function PainelMorkBorg(p: Props) {
  const pr = recurso(p.d, 'pressagios'), inf = recurso(p.d, 'infectado')
  return <section aria-label="Presságios" className="-rotate-1 border-4 border-[#ffe600] bg-black p-4 text-[#ffe600]">
    <div className="flex items-center gap-1"><h2 className="text-2xl font-black uppercase tracking-tight [transform:skewX(-8deg)]">Presságios</h2>
      <CampoMax valor={pr.max} mudar={n => mudarMax(p, 'pressagios', n)} rotulo="Presságios" teto={12} cor="#ffe600" desabilitado={p.somenteLeitura} /></div>
    <p className="mb-3 text-xs text-[#ffe600]/70">Role no começo do dia. Gaste para rerrolar, baixar dano, ou o que o livro mandar.</p>
    <Caixas total={Math.max(1, pr.max ?? 4)} marcadas={pr.atual} mudar={n => mudarRecurso(p, 'pressagios', n)} rotulo="Presságios" forma="caveira" cor="#ffe600" desabilitado={p.somenteLeitura} />
    <label className="mt-4 flex items-center gap-2 text-sm font-black uppercase"><input type="checkbox" checked={inf.atual > 0} disabled={p.somenteLeitura} onChange={e => mudarRecurso(p, 'infectado', e.target.checked ? 1 : 0)} className="h-5 w-5 accent-[#ffe600]" /> Infectado</label>
  </section>
}

/* ---------------- Assimilação: cabo de guerra ---------------- */
function PainelAssimilacao(p: Props) {
  const det = recurso(p.d, 'determinacao'), ass = recurso(p.d, 'assimilacao')
  const total = Math.max(10, (det.max ?? 0) + (ass.max ?? 0), det.atual + ass.atual)
  const pd = (det.atual / total) * 100, pa = (ass.atual / total) * 100
  const passo = (id: string, v: number, delta: number) => !p.somenteLeitura && mudarRecurso(p, id, Math.max(0, v + delta))
  const botao = 'h-8 w-8 rounded-lg border border-(--a-5e4b78) text-lg leading-none hover:bg-(--s-34294f) disabled:opacity-40'
  return <section className={card} aria-label="Determinação e Assimilação">
    <h2 className={titulo}>🧬 Determinação × Assimilação</h2>
    <p className={dica}>As duas forças disputam o Infectado. Ajuste os pontos de cada lado.</p>
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold">
      <span className="flex items-center gap-1 text-sky-300">Determinação {det.atual}<CampoMax valor={det.max} mudar={n => mudarMax(p, 'determinacao', n)} rotulo="Determinação" teto={10} desabilitado={p.somenteLeitura} cor="#7dd3fc" /></span>
      <span className="flex items-center gap-1 text-fuchsia-300">{ass.atual} Assimilação<CampoMax valor={ass.max} mudar={n => mudarMax(p, 'assimilacao', n)} rotulo="Assimilação" teto={10} desabilitado={p.somenteLeitura} cor="#f0abfc" /></span>
    </div>
    <div className="relative mt-1 h-6 overflow-hidden rounded-full border-2 border-(--ficha-borda) bg-black/50" role="img" aria-label={`Determinação ${det.atual}, Assimilação ${ass.atual}`}>
      <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-sky-500 to-sky-300 transition-all" style={{ width: pd + '%' }} />
      <div className="absolute inset-y-0 right-0 bg-gradient-to-l from-fuchsia-600 to-fuchsia-400 transition-all" style={{ width: pa + '%' }} />
      <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/70" />
    </div>
    <div className="mt-2 flex justify-between">
      <span className="flex gap-1"><button type="button" className={botao} disabled={p.somenteLeitura} onClick={() => passo('determinacao', det.atual, -1)} aria-label="Menos Determinação">−</button><button type="button" className={botao} disabled={p.somenteLeitura} onClick={() => passo('determinacao', det.atual, 1)} aria-label="Mais Determinação">+</button></span>
      <span className="flex gap-1"><button type="button" className={botao} disabled={p.somenteLeitura} onClick={() => passo('assimilacao', ass.atual, -1)} aria-label="Menos Assimilação">−</button><button type="button" className={botao} disabled={p.somenteLeitura} onClick={() => passo('assimilacao', ass.atual, 1)} aria-label="Mais Assimilação">+</button></span>
    </div>
  </section>
}

/** Recursos que a parte própria do sistema já mostra (não aparecem de novo como barra em “Valores e recursos”). */
export const RECURSOS_NO_PAINEL: Record<string, string[]> = {
  'dnd5e-srd': [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => 'espacos_' + n), pf2e: ['heroismo', 'morrendo', 'ferido'],
  'fate-core': ['pontos_destino', 'estresse_fisico', 'estresse_mental'], blades: ['estresse', 'trauma'],
  'mork-borg': ['pressagios', 'infectado'], assimilacao: ['determinacao', 'assimilacao'],
}

/** A parte própria do sistema, mostrada no Principal (null quando o sistema não tem). */
export default function PainelDoSistema(p: Props) {
  switch (p.s.id) {
    case 'dnd5e-srd': case 'dnd5e-manual': return <PainelDnd {...p} />
    case 'pf2e': return <PainelPf2e {...p} />
    case 'fate-core': return <PainelFate {...p} />
    case 'blades': return <PainelBlades {...p} />
    case 'faroeste-arcano': return <PainelFaroeste {...p} />
    case 'tormenta20': return <PainelCondicoes {...p} lista={CONDICOES_T20} tituloTexto="⚔️ Condições" />
    case 'ordem-paranormal': return <PainelCondicoes {...p} lista={CONDICOES_OP} tituloTexto="🩸 Condições" />
    case 'mork-borg': return <PainelMorkBorg {...p} />
    case 'assimilacao': return <PainelAssimilacao {...p} />
    default: return null
  }
}

/**
 * Faixa no alto da ficha (v0.35.9): o clima de cada jogo, sem logos nem artes oficiais — só cores, um símbolo genérico
 * e uma frase que lembra como o jogo é jogado.
 */
const FAIXAS: Record<string, { simbolo: string; frase: string; fundo: string; borda: string }> = {
  'dnd5e-srd': { simbolo: '⚔️', frase: 'Aventureiro · d20 contra a CA e a CD', fundo: 'linear-gradient(120deg,#3a0f14,#1c0d12 60%,#2a1a0e)', borda: '#c0263a' },
  pf2e: { simbolo: '🛡️', frase: 'Três ações por turno · graus de sucesso', fundo: 'linear-gradient(120deg,#0f1d3a,#11131f 60%,#2b2410)', borda: '#e8b84a' },
  'fate-core': { simbolo: '✦', frase: 'Aspectos, façanhas e a escada de adjetivos', fundo: 'linear-gradient(120deg,#0b2236,#141026 60%,#1d0f2f)', borda: '#6cc4ff' },
  blades: { simbolo: '🗡️', frase: 'Ação, risco e efeito · estresse e relógios', fundo: 'linear-gradient(120deg,#0c1d1b,#0f0f14 60%,#1f1a12)', borda: '#9fdccb' },
  brp: { simbolo: '🔎', frase: 'Arquivo de investigação · d100 abaixo do valor', fundo: 'linear-gradient(120deg,#2a2416,#141210 60%,#1b2620)', borda: '#d6bf8f' },
  'call-of-cthulhu': { simbolo: '🕯️', frase: 'Investigador · d100 normal, difícil e extremo', fundo: 'linear-gradient(120deg,#0c2420,#0e1214 60%,#231c12)', borda: '#9fd8c4' },
  'faroeste-arcano': { simbolo: '🤠', frase: 'Pólvora e feitiçaria no Velho Oeste', fundo: 'linear-gradient(120deg,#3a2410,#1a120b 60%,#2b1d10)', borda: '#eab26a' },
  'ordem-paranormal': { simbolo: '🩸', frase: 'Agente · o paranormal está por perto', fundo: 'linear-gradient(120deg,#2a0f3a,#120b18 60%,#2a0a12)', borda: '#d8a6ff' },
  tormenta20: { simbolo: '⭐', frase: 'Herói · d20 + atributo + perícia', fundo: 'linear-gradient(120deg,#3a0d0d,#160b0b 60%,#2a160b)', borda: '#ff7a6b' },
  'mork-borg': { simbolo: '💀', frase: 'O mundo está morrendo. Você também.', fundo: '#000', borda: '#ffe600' },
  assimilacao: { simbolo: '🧬', frase: 'Sobreviver depois do Colapso', fundo: 'linear-gradient(120deg,#0c2a28,#0f0f16 60%,#2a0f2e)', borda: '#5eead4' },
}
export function FaixaDoSistema({ s, nome }: { s: Sistema; nome: string }) {
  const f = FAIXAS[s.id]; if (!f) return null
  const mork = s.id === 'mork-borg'
  return <div className={'relative overflow-hidden rounded-2xl border-2 px-4 py-3 ' + (mork ? '-rotate-[0.6deg]' : '')} style={{ background: f.fundo, borderColor: f.borda, boxShadow: `0 0 22px -8px ${f.borda}` }} aria-hidden>
    <span className="pointer-events-none absolute -right-2 -top-4 select-none text-[5.5rem] leading-none opacity-[.13]">{f.simbolo}</span>
    <p className={'relative truncate text-xl font-bold [font-family:var(--ficha-fonte)] ' + (mork ? 'uppercase tracking-tight text-[#ffe600] [transform:skewX(-8deg)]' : 'text-white')}>{f.simbolo} {nome || 'Personagem sem nome'}</p>
    <p className="relative mt-0.5 text-xs" style={{ color: f.borda }}>{f.frase}</p>
  </div>
}
