'use client'

/**
 * Magias da ficha de D&D 2024 (v0.33.6). Catálogo do SRD 5.2.1 (CC BY 4.0), limites da tabela da classe,
 * CD e ataque mágico já calculados, dano/cura que crescem com o espaço e gasto do espaço ao conjurar.
 */
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { BookOpen, Plus, Search, Sparkles, Trash2, X } from 'lucide-react'
import type { DadosFicha } from '@/lib/sistemas/tipos'
import type { Calculo } from '@/lib/sistemas/calculo'
import { MAGIAS_SRD, type MagiaSrd } from '@/lib/sistemas/dnd2024Magias'
import { classeDoTipo, conjuradoresDnd, contarMagias, expressaoMagia, lerMagiasDnd, limitesMagiasDnd, magiaPorId, motivoBloqueio, recursoDoEspaco, tipoPreparada, type LimitesMagia, type TipoMagia } from '@/lib/sistemas/dnd2024Conjuracao'
import NaTela from '@/components/NaTela'
import MagiasOrigemDnd2024 from './MagiasOrigemDnd2024'

const card = 'rounded-2xl border border-(--a-55456e) bg-(--s-201a32) p-4 sm:p-5'
const chip = 'rounded-full border border-(--a-5e4b78) px-2.5 py-1 text-xs'
const btn = 'inline-flex min-h-9 items-center gap-1 rounded-lg border border-(--a-5e4b78) px-3 py-1.5 text-sm hover:bg-(--s-34294f) disabled:opacity-40'
const sinal = (n: number) => (n >= 0 ? '+' : '') + n
const nomeNivel = (n: number) => n === 0 ? 'Truques' : `${n}º nível`
const NOMES_CLASSE: Record<string, string> = { bardo: 'Bardo', clerigo: 'Clérigo', druida: 'Druida', paladino: 'Paladino', patrulheiro: 'Patrulheiro', feiticeiro: 'Feiticeiro', bruxo: 'Bruxo', mago: 'Mago' }
const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

type Props = {
  d: DadosFicha; c: Calculo; onChange: (d: DadosFicha) => void; somenteLeitura?: boolean
  /** Modo manual: sem limites da tabela (tudo entra como extra). */
  semLimites?: boolean
  rolar: (expressao: string, rotulo: string) => void
}

export default function MagiasDnd2024({ d, c, onChange, somenteLeitura = false, semLimites = false, rolar }: Props) {
  const sel = useMemo(() => lerMagiasDnd(d.dndMagias), [d.dndMagias])
  const principal = useMemo(() => limitesMagiasDnd(d), [d])
  const conj = useMemo(() => conjuradoresDnd(d), [d])
  /** Classes conjuradoras (a inicial primeiro); sem nenhuma, a inicial para as mensagens. */
  const ls = conj.length ? conj : [principal]
  const l = ls[0]
  const [abrir, setAbrir] = useState(false)
  const prof = Number(c.vars.prof) || Number(c.derivados.prof) || Number(c.vars.dnd_prof) || 2
  const modDe = (x: LimitesMagia) => x.atributo ? Number(c.mods[x.atributo]) || 0 : 0
  /** Classe de uma magia da ficha (extra usa a inicial, ou a primeira conjuradora). */
  const limiteDa = (tipo: TipoMagia) => ls.find(x => x.classeId === classeDoTipo(tipo, principal.classeId)) ?? l
  const nivelPersonagem = Number(d.campos.nivel) || 1
  const lista = Object.keys(sel).map(id => magiaPorId(id)!).filter(Boolean).sort((a, b) => a.nivel - b.nivel || a.nome.localeCompare(b.nome))
  const grupos = lista.reduce<Map<number, MagiaSrd[]>>((g, m) => g.set(m.nivel, [...(g.get(m.nivel) ?? []), m]), new Map())

  function gravar(novo: Record<string, TipoMagia>) { onChange({ ...d, dndMagias: novo }) }
  function adicionar(m: MagiaSrd, tipo: 'preparada' | 'extra', lc: LimitesMagia) {
    if (tipo === 'preparada' && !semLimites) { const motivo = motivoBloqueio(m, lc, sel); if (motivo) { toast.error(motivo); return } }
    gravar({ ...sel, [m.id]: semLimites || tipo === 'extra' ? 'extra' : tipoPreparada(lc) })
  }
  function remover(id: string) { const { [id]: _fora, ...resto } = sel; void _fora; gravar(resto) }
  function conjurar(m: MagiaSrd, espaco: number, lc: LimitesMagia) {
    const rid = recursoDoEspaco(lc, espaco)
    if (m.nivel > 0 && rid) {
      const atual = Number(d.recursos[rid]?.atual ?? 0) || 0
      if (atual <= 0) { toast.error(`Sem espaços de ${espaco}º nível. Descanse para recuperar.`); return }
      onChange({ ...d, recursos: { ...d.recursos, [rid]: { ...d.recursos[rid], atual: atual - 1 } } })
      toast.success(`${m.nome}: gastou 1 espaço de ${espaco}º nível.`)
    }
    const e = expressaoMagia(m, { espaco, nivelPersonagem, mod: modDe(lc) })
    if (e) rolar(e, `${m.nome}${m.nivel ? ` (espaço ${espaco}º)` : ''}: ${m.cura && !m.dano ? 'cura' : 'dano'}`)
  }

  return <section aria-label="Magias de D&D 2024" className={card + ' space-y-4'}>
    <div className="flex flex-wrap items-start gap-3">
      <div className="min-w-0 flex-1">
        <h3 className="flex items-center gap-2 font-bold text-(--a-ed9cd8)"><Sparkles size={18} aria-hidden /> Magias</h3>
        <p className="text-xs text-(--a-b4aeca)">{l.atributo
          ? `${ls.map(x => `${x.classeNome} ${x.nivel} (${x.atributo})`).join(' + ')}${ls.length > 1 ? ` · espaços da tabela de multiclasse até ${l.espacoMax}º` : ''}${semLimites ? ' · modo manual: sem limites da tabela' : ''}`
          : `${l.classeNome || 'Esta classe'} não conjura pela tabela. Magias de talentos, itens ou subclasses entram como extras.`}</p>
      </div>
      {!somenteLeitura && <button type="button" onClick={() => setAbrir(true)} className={btn + ' border-(--a-8b6cba) bg-(--s-2b2140) font-semibold text-white'}><Plus size={16} aria-hidden /> Adicionar magias</button>}
    </div>
    {l.atributo && ls.map(x => { const n = contarMagias(sel, x), atq = prof + modDe(x); return <div key={x.classeId} className="flex flex-wrap items-center gap-2">
      {ls.length > 1 && <span className="text-xs font-semibold text-(--a-e4d3ff)">{x.classeNome}</span>}
      <span className={chip}>CD <strong className="text-white">{8 + atq}</strong></span>
      <button type="button" disabled={somenteLeitura} onClick={() => rolar(`1d20${sinal(atq)}`, `Ataque mágico${ls.length > 1 ? ` (${x.classeNome})` : ''}`)} className={chip + ' hover:bg-(--s-34294f)'} aria-label={`Rolar ataque mágico ${sinal(atq)}`}>Ataque mágico <strong className="text-white">{sinal(atq)}</strong></button>
      {!semLimites && <>
        {(x.truques > 0 || n.truques > 0) && <span className={chip + (n.truques > x.truques ? ' border-amber-400 text-amber-200' : '')}>Truques {n.truques}/{x.truques}</span>}
        {(x.preparadas > 0 || n.preparadas > 0) && <span className={chip + (n.preparadas > x.preparadas ? ' border-amber-400 text-amber-200' : '')}>Preparadas {n.preparadas}/{x.preparadas}</span>}
        {x.nivelMax > 0 && <span className={chip}>Prepara até {x.nivelMax}º{x.arcana.length ? ` · Arcana ${x.arcana.join('º, ')}º` : ''}</span>}
      </>}
    </div> })}
    <MagiasOrigemDnd2024 d={d} c={c} onChange={onChange} somenteLeitura={somenteLeitura} rolar={rolar} />
    <MagiasOrigemDnd2024 d={d} c={c} onChange={onChange} somenteLeitura={somenteLeitura} rolar={rolar} origemHumana />
    {lista.length === 0 && <p className="rounded-xl border border-dashed border-(--a-55456e) p-4 text-sm text-(--a-c4b6d4)">Nenhuma magia preparada pela classe. {somenteLeitura ? '' : 'Toque em “Adicionar magias” para escolher pelo catálogo do SRD.'}</p>}
    {[...grupos].map(([nivel, ms]) => <div key={nivel} className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-(--a-d3adf0)">{nomeNivel(nivel)}</h4>
      {ms.map(m => { const lc = limiteDa(sel[m.id]); return <LinhaMagia key={m.id} m={m} tipo={sel[m.id]} l={lc} varias={ls.length > 1} ataque={prof + modDe(lc)} mod={modDe(lc)} nivelPersonagem={nivelPersonagem} d={d} somenteLeitura={somenteLeitura}
        rolar={rolar} conjurar={(mm, e) => conjurar(mm, e, lc)} remover={() => remover(m.id)} /> })}
    </div>)}
    <p className="text-[11px] text-(--a-8f84a6)">Magias do SRD 5.2.1 (Wizards of the Coast, CC BY 4.0). Nomes e resumos traduzidos pela plataforma; o texto original fica em “Detalhes”.</p>
    {abrir && <JanelaMagias sel={sel} ls={ls} semLimites={semLimites} adicionar={adicionar} remover={remover} fechar={() => setAbrir(false)} />}
  </section>
}

function Etiquetas({ m }: { m: MagiaSrd }) {
  return <>
    {m.concentracao && <span className="rounded bg-sky-500/15 px-1.5 text-[11px] text-sky-200" title="Concentração">C</span>}
    {m.ritual && <span className="rounded bg-emerald-500/15 px-1.5 text-[11px] text-emerald-200" title="Ritual">R</span>}
  </>
}

function LinhaMagia({ m, tipo, l, varias, ataque, mod, nivelPersonagem, d, somenteLeitura, rolar, conjurar, remover }: {
  m: MagiaSrd; tipo: TipoMagia; l: LimitesMagia; varias: boolean; ataque: number; mod: number; nivelPersonagem: number; d: DadosFicha; somenteLeitura: boolean
  rolar: Props['rolar']; conjurar: (m: MagiaSrd, espaco: number) => void; remover: () => void
}) {
  const minimo = l.classeId === 'bruxo' && m.nivel > 0 && m.nivel <= l.nivelMax ? l.nivelMax : m.nivel
  const espacos = m.nivel === 0 ? [0] : l.classeId === 'bruxo' ? [minimo] : Array.from({ length: Math.max(1, (l.espacoMax || m.nivel) - m.nivel + 1) }, (_, i) => m.nivel + i)
  const [espaco, setEspaco] = useState(minimo)
  const [texto, setTexto] = useState<string | null>(null)
  const [aberto, setAberto] = useState(false)
  const expr = expressaoMagia(m, { espaco, nivelPersonagem, mod })
  const rid = recursoDoEspaco(l, espaco)
  const restantes = rid ? Number(d.recursos[rid]?.atual ?? 0) || 0 : null
  async function detalhes() {
    setAberto(a => !a)
    if (texto === null) { const t = await import('@/lib/sistemas/dnd2024MagiasTexto'); setTexto(t.TEXTO_MAGIAS_SRD[m.id] ?? '') }
  }
  return <article className="rounded-xl border border-(--a-3d3152) bg-(--s-171325)/70 p-3">
    <div className="flex flex-wrap items-start gap-2">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5 font-semibold text-white">{m.nome} <Etiquetas m={m} />
          {varias && tipo !== 'extra' && <span className="rounded bg-(--s-2b2140) px-1.5 text-[11px] font-normal text-(--a-d3adf0)">{l.classeNome}</span>}
          {tipo === 'extra' && <span className="rounded bg-amber-500/15 px-1.5 text-[11px] font-normal text-amber-200" title="Não conta no limite">extra</span>}</p>
        <p className="text-[11px] text-(--a-a998bd)">{m.en} · {m.escola} · {m.execucao} · {m.alcance} · {m.duracao}</p>
      </div>
      {!somenteLeitura && <button type="button" onClick={remover} aria-label={'Tirar ' + m.nome} className="rounded-lg p-1.5 text-(--a-a998bd) hover:bg-(--s-2b2140) hover:text-white"><Trash2 size={16} /></button>}
    </div>
    {m.resumo && <p className="mt-1 text-sm text-(--a-cfc0df)">{m.resumo}</p>}
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {m.ataque && <button type="button" disabled={somenteLeitura} onClick={() => rolar(`1d20${sinal(ataque)}`, `${m.nome}: ataque`)} className={btn}>Ataque {sinal(ataque)}</button>}
      {m.nivel > 0 && espacos.length > 1 && <label className="flex items-center gap-1 text-xs text-(--a-c4b6d4)">Espaço
        <select value={espaco} onChange={e => setEspaco(Number(e.target.value))} className="rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-1.5 text-sm text-white">
          {espacos.map(e => <option key={e} value={e}>{e}º</option>)}</select></label>}
      {expr && <button type="button" disabled={somenteLeitura} onClick={() => rolar(expr, `${m.nome}: ${m.cura && !m.dano ? 'cura' : 'dano'}`)} className={btn}>{m.cura && !m.dano ? 'Cura' : 'Dano'} {expr}</button>}
      {m.nivel > 0 && rid && <button type="button" disabled={somenteLeitura} onClick={() => conjurar(m, espaco)} className={btn + ' border-(--a-8b6cba)'} title="Gasta um espaço de magia (e rola o dano/cura, se houver)">
        Conjurar{restantes !== null ? ` (${restantes} ${restantes === 1 ? 'espaço' : 'espaços'})` : ''}</button>}
      <button type="button" onClick={detalhes} aria-expanded={aberto} className={btn}><BookOpen size={14} aria-hidden /> Detalhes</button>
    </div>
    {aberto && <div className="mt-2 max-h-72 overflow-y-auto whitespace-pre-line rounded-lg bg-black/25 p-3 text-xs leading-relaxed text-(--a-cfc0df)" lang="en">
      {texto === null ? 'Carregando…' : texto.replace(/\*\*_?|_?\*\*|\*|_/g, '')}</div>}
  </article>
}

function JanelaMagias({ sel, ls, semLimites, adicionar, remover, fechar }: {
  sel: Record<string, TipoMagia>; ls: LimitesMagia[]; semLimites: boolean
  adicionar: (m: MagiaSrd, t: 'preparada' | 'extra', l: LimitesMagia) => void; remover: (id: string) => void; fechar: () => void
}) {
  const [classe, setClasse] = useState(ls[0].classeId)
  const l = ls.find(x => x.classeId === classe) ?? ls[0]
  const [busca, setBusca] = useState('')
  const [nivel, setNivel] = useState<number | 'todos'>('todos')
  const [daClasse, setDaClasse] = useState(!!l.atributo)
  const [limite, setLimite] = useState(40)
  const n = contarMagias(sel, l)
  const q = semAcento(busca.trim())
  const filtradas = MAGIAS_SRD.filter(m => (nivel === 'todos' || m.nivel === nivel)
    && (!daClasse || m.classes.some(c => (m.nivel === 0 ? l.listasTruque : l.listas).includes(c)))
    && (!q || semAcento(m.nome).includes(q) || m.en.toLowerCase().includes(q) || semAcento(m.escola).includes(q)))
    .sort((a, b) => a.nivel - b.nivel || a.nome.localeCompare(b.nome))
  return <NaTela><div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-3 sm:p-4" onMouseDown={e => { if (e.target === e.currentTarget) fechar() }}>
    <div role="dialog" aria-modal="true" aria-labelledby="magias-titulo" onKeyDown={e => { if (e.key === 'Escape') fechar() }}
      className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl border border-(--a-62527e) bg-(--s-19172c) text-(--a-f4f0ff) shadow-2xl">
      <div className="space-y-3 border-b border-(--a-3d3152) p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <h2 id="magias-titulo" className="flex-1 text-lg font-bold">Adicionar magias</h2>
          <button type="button" onClick={fechar} aria-label="Fechar" className="rounded-lg p-1 hover:bg-(--s-2b2140)"><X size={20} /></button>
        </div>
        {!semLimites && l.atributo && <p className="text-xs text-(--a-c4b6d4)">{ls.length > 1 ? l.classeNome + ': ' : ''}Truques {n.truques}/{l.truques} · Preparadas {n.preparadas}/{l.preparadas} · até {l.nivelMax}º nível. <strong>Extra</strong> é para magia que veio de subclasse, talento, item ou do mestre (não conta no limite).</p>}
        {ls.length > 1 && !semLimites && <div role="radiogroup" aria-label="Preparar pela classe" className="flex flex-wrap gap-1.5">
          {ls.map(x => <button key={x.classeId} type="button" role="radio" aria-checked={x.classeId === l.classeId} onClick={() => { setClasse(x.classeId); setLimite(40) }}
            className={'rounded-full border px-3 py-1 text-sm ' + (x.classeId === l.classeId ? 'border-(--a-8b6cba) bg-(--s-2b2140) text-white' : 'border-(--a-5e4b78) text-(--a-c4b6d4)')}>{x.classeNome} {x.nivel}</button>)}
        </div>}
        <div className="flex flex-wrap gap-2">
          <label className="relative min-w-0 flex-1 basis-48"><span className="sr-only">Buscar magia</span>
            <Search size={16} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-(--a-a998bd)" aria-hidden />
            <input autoFocus value={busca} onChange={e => { setBusca(e.target.value); setLimite(40) }} placeholder="Nome em português ou inglês, ou escola"
              className="w-full rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 pl-8 text-white" /></label>
          <select aria-label="Nível" value={nivel} onChange={e => { setNivel(e.target.value === 'todos' ? 'todos' : Number(e.target.value)); setLimite(40) }} className="rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-white">
            <option value="todos">Todos os níveis</option>{[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(x => <option key={x} value={x}>{nomeNivel(x)}</option>)}</select>
        </div>
        {l.atributo && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={daClasse} onChange={e => { setDaClasse(e.target.checked); setLimite(40) }} />
          Só a lista de {l.listas.map(x => NOMES_CLASSE[x]).join(', ')}{l.listasTruque.length > 1 ? ` (truques: ${l.listasTruque.map(x => NOMES_CLASSE[x]).join(', ')})` : ''}</label>}
      </div>
      <ul className="flex-1 space-y-2 overflow-y-auto p-4 sm:p-5">
        {filtradas.length === 0 && <li className="text-sm text-(--a-c4b6d4)">Nenhuma magia encontrada.</li>}
        {filtradas.slice(0, limite).map(m => {
          const ja = sel[m.id]
          const motivo = semLimites ? null : motivoBloqueio(m, l, sel)
          return <li key={m.id} className="rounded-xl border border-(--a-3d3152) bg-(--s-171325)/70 p-3">
            <div className="flex flex-wrap items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-1.5 font-semibold text-white">{m.nome} <Etiquetas m={m} /></p>
                <p className="text-[11px] text-(--a-a998bd)">{nomeNivel(m.nivel).replace('Truques', 'Truque')} · {m.escola} · {m.classes.map(x => NOMES_CLASSE[x]).join(', ')}</p>
              </div>
              {ja ? <button type="button" onClick={() => remover(m.id)} className={btn + ' border-emerald-500/50 text-emerald-200'}>✓ Na ficha</button>
                : <div className="flex gap-1.5">
                  {!semLimites && <button type="button" disabled={!!motivo} onClick={() => adicionar(m, 'preparada', l)} className={btn + ' border-(--a-8b6cba)'}>{m.nivel === 0 ? 'Aprender' : 'Preparar'}</button>}
                  <button type="button" onClick={() => adicionar(m, 'extra', l)} className={btn} title="Não conta no limite da classe">{semLimites ? 'Adicionar' : 'Extra'}</button>
                </div>}
            </div>
            {m.resumo && <p className="mt-1 text-xs text-(--a-cfc0df)">{m.resumo}</p>}
            {!ja && motivo && <p className="mt-1 text-[11px] text-amber-200/90">{motivo}</p>}
          </li>
        })}
        {filtradas.length > limite && <li><button type="button" onClick={() => setLimite(x => x + 60)} className={btn + ' w-full justify-center'}>Mostrar mais ({filtradas.length - limite})</button></li>}
      </ul>
    </div>
  </div></NaTela>
}
