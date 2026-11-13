'use client'

/**
 * Iniciativa e turnos da mesa (v0.33.8): vez de quem e próximo sempre à vista, entrar no meio do combate,
 * desempatar e mudar valores sem perder a vez, adiar o turno e dano/cura em vários de uma vez.
 */
import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { emojiCondicao, nomeCondicao } from '@/lib/condicoes'
import { empatados } from '@/lib/sistemas/ordemCombate'
import NaTela from '@/components/NaTela'
import { btn, input } from './estilos'
import { PrepararCombate, type FichaMesa } from './Combate'
import type { Acao, Estado } from './MesaNova'

type Entrada = Estado['mesa']['iniciativa'][number]
type Tk = Estado['tokens'][number]
const corVida = (p: number) => p > 50 ? '#10b981' : p > 25 ? '#f59e0b' : '#ef4444'

function Avatar({ t, tam = 'h-8 w-8' }: { t?: Tk; tam?: string }) {
  return <span aria-hidden className={tam + ' flex shrink-0 items-center justify-center rounded-full border border-black/40 bg-cover bg-center text-xs font-bold text-black/70'}
    style={{ backgroundColor: t?.cor ?? '#4b3d6b', backgroundImage: t?.imagem_url ? `url("${t.imagem_url}")` : undefined }}>{t && !t.imagem_url ? t.nome[0]?.toUpperCase() : ''}</span>
}
function Vida({ t }: { t?: Tk }) {
  if (!t?.hp_max) return null
  const p = Math.max(0, Math.min(100, (t.hp_atual ?? 0) / t.hp_max * 100))
  return <span className="mt-1 flex items-center gap-1.5"><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/60"><span className="block h-full rounded-full" style={{ width: p + '%', background: corVida(p) }} /></span>
    <span className="text-[11px] tabular-nums text-(--a-d6c8e8)">{t.hp_atual ?? 0}/{t.hp_max}</span></span>
}

export function PainelIniciativa({ e, admin, acao, fichas, atacar }: { e: Estado; admin: boolean; acao: Acao; fichas: FichaMesa[] | null; atacar: (tokenId: string) => void }) {
  const lista = e.mesa?.iniciativa ?? [], turno = Math.min(e.mesa?.turno ?? 0, Math.max(0, lista.length - 1)), rodada = e.mesa?.rodada ?? 1
  const [nome, setNome] = useState(''), [valor, setValor] = useState('')
  const [janela, setJanela] = useState<null | 'preparar' | 'entrar' | 'dano'>(null)
  const [editando, setEditando] = useState<string | null>(null)
  const tokenDe = (x?: Entrada) => x?.tokenId ? e.tokens.find(t => t.id === x.tokenId) : undefined
  const daVez = lista[turno], tVez = tokenDe(daVez), proximo = lista.length > 1 ? lista[(turno + 1) % lista.length] : null
  const minhaVez = !!tVez && tVez.dono_id === e.eu
  const empate = empatados(lista)
  const fazer = (b: Record<string, unknown>) => acao(b).catch(() => ({}))
  const meusFora = e.tokens.filter(t => t.dono_id === e.eu && !lista.some(x => x.tokenId === t.id))
  const sem = e.tokens.filter(t => !lista.some(x => x.tokenId === t.id))

  return <div className="space-y-3">
    {lista.length > 0 && daVez && <section aria-label="Vez" className="sticky top-0 z-10 space-y-2 rounded-xl border border-amber-300/50 bg-gradient-to-br from-[#3b2a17] to-(--s-1e1a30) p-3 shadow-lg">
      <div className="flex items-center gap-3">
        <Avatar t={tVez} tam="h-12 w-12" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wider text-amber-200/80">Rodada {rodada} · vez de</p>
          <p className="truncate text-lg font-bold text-amber-100">{daVez.nome}{minhaVez ? ' (você)' : ''}</p>
          {proximo && <p className="truncate text-xs text-(--a-c4b6d4)">Depois: <strong>{proximo.nome}</strong>{turno === lista.length - 1 ? ` · rodada ${rodada + 1}` : ''}</p>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {admin && <button type="button" onClick={() => void fazer({ acao: 'turno', direcao: -1 })} aria-label="Turno anterior" className={btn + ' !px-3 !py-2'}><ChevronLeft size={16} /></button>}
        {(admin || minhaVez) && tVez && <button type="button" onClick={() => atacar(tVez.id)} className="rounded-lg bg-[#b91c1c] px-3 py-2 text-sm font-semibold text-white">⚔️ Atacar</button>}
        {(admin || minhaVez) && turno < lista.length - 1 && <button type="button" onClick={() => void fazer({ acao: 'iniciativa_adiar', turnoAtual: turno })} className={btn + ' !py-2 text-sm'} title="Troca de lugar com o próximo: ele joga agora e você logo depois">⏭️ Adiar</button>}
        {admin ? <button type="button" onClick={() => void fazer({ acao: 'turno', direcao: 1 })} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-(--a-5b4380) px-3 py-2 text-sm font-semibold hover:bg-(--a-6b5190)">Próximo turno <ChevronRight size={16} /></button>
          : minhaVez && <button type="button" onClick={() => void fazer({ acao: 'turno', direcao: 1, turnoAtual: turno })} className="flex-1 rounded-lg bg-(--a-5b4380) px-3 py-2 text-sm font-semibold hover:bg-(--a-6b5190)">✅ Terminar meu turno</button>}
      </div>
    </section>}

    {admin && <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={() => setJanela('preparar')} className="col-span-2 rounded-xl bg-gradient-to-r from-[#b91c1c] to-(--a-7c3aed) px-3 py-2.5 font-bold shadow-[0_0_14px_#b91c1c44]">⚔️ {lista.length ? 'Preparar de novo' : 'Preparar combate'}</button>
      {lista.length > 0 && <button type="button" onClick={() => setJanela('entrar')} disabled={!sem.length} className={btn + ' justify-center !py-2 text-sm'}>🎲 Entrar no combate</button>}
      <button type="button" onClick={() => setJanela('dano')} className={btn + ' justify-center !py-2 text-sm' + (lista.length ? '' : ' col-span-2')}>💥 Dano em vários</button>
      {lista.length > 0 && <button type="button" onClick={() => { if (confirm('Encerrar o combate e limpar a ordem de turnos?')) void fazer({ acao: 'combate_encerrar' }) }} className={btn + ' col-span-2 justify-center !py-2 text-sm'}>🏳️ Encerrar combate</button>}
    </div>}
    {!admin && lista.length > 0 && meusFora.map(t => <button key={t.id} type="button" onClick={() => void fazer({ acao: 'iniciativa_entrar', tokenId: t.id })} className={btn + ' w-full justify-center !py-2 text-sm'}>🎲 Entrar no combate com {t.nome}</button>)}

    {lista.length > 0 && <ol className="space-y-1.5" aria-label="Ordem do combate">{lista.map((x, i) => {
      const t = tokenDe(x), vez = i === turno
      return <li key={x.id} className={'flex items-center gap-2 rounded-xl p-2 text-sm ' + (vez ? 'bg-gradient-to-r from-(--a-5b4380) to-[#7c2d4a] ring-1 ring-amber-300/60' : 'bg-(--s-1e1a30)')}>
        <span className="w-5 shrink-0 text-center text-[11px] text-(--a-a998bd)">{i + 1}</span>
        <Avatar t={t} />
        <span className="min-w-0 flex-1">
          <span className={'block truncate ' + (vez ? 'font-bold' : '')}>{vez ? '⚔️ ' : ''}{x.nome}{t?.dono_id === e.eu ? <span className="text-[11px] text-sky-300"> · você</span> : null}</span>
          {t?.condicoes?.length ? <span className="block truncate text-[11px]" title={t.condicoes.map(nomeCondicao).join(', ')}>{t.condicoes.map(c => emojiCondicao[c] + (t.condicoes_rodadas?.[c] ? t.condicoes_rodadas[c] : '')).join(' ')}</span> : null}
          <Vida t={t} />
        </span>
        {admin && editando === x.id
          ? <input autoFocus aria-label={'Iniciativa de ' + x.nome} defaultValue={x.valor} inputMode="numeric" className={input + ' !w-14 !p-1 text-center'}
            onBlur={v => { setEditando(null); const n = Number(v.target.value); if (Number.isFinite(n) && n !== x.valor) void fazer({ acao: 'iniciativa_valor', id: x.id, valor: n }) }}
            onKeyDown={v => { if (v.key === 'Enter') (v.target as HTMLInputElement).blur(); if (v.key === 'Escape') setEditando(null) }} />
          : <button type="button" disabled={!admin} onClick={() => setEditando(x.id)} title={admin ? 'Tocar para mudar o valor' : undefined} aria-label={`Iniciativa ${x.valor}${admin ? ', tocar para mudar' : ''}`}
            className={'min-w-9 rounded-lg px-1.5 py-1 text-center font-bold tabular-nums ' + (empate.has(x.id) ? 'bg-amber-500/25 text-amber-100' : 'bg-black/30')}>{x.valor}{empate.has(x.id) && <span className="block text-[9px] font-normal">empate</span>}</button>}
        {admin && <span className="flex flex-col">
          <button type="button" aria-label={'Subir ' + x.nome} disabled={i === 0} onClick={() => void fazer({ acao: 'iniciativa_mover', id: x.id, direcao: -1 })} className="rounded p-1 hover:bg-white/10 disabled:opacity-30"><ArrowUp size={14} /></button>
          <button type="button" aria-label={'Descer ' + x.nome} disabled={i === lista.length - 1} onClick={() => void fazer({ acao: 'iniciativa_mover', id: x.id, direcao: 1 })} className="rounded p-1 hover:bg-white/10 disabled:opacity-30"><ArrowDown size={14} /></button></span>}
        {admin && <button type="button" aria-label={'Tirar do combate: ' + x.nome} onClick={() => void fazer({ acao: 'iniciativa_sair', id: x.id })} className="rounded p-1.5 hover:bg-[#4b253a]"><X size={14} /></button>}
      </li>
    })}</ol>}
    {lista.length === 0 && <p className="text-sm text-(--a-b4aeca)">{admin ? 'Ninguém na iniciativa. “Preparar combate” rola a iniciativa de todos pela ficha (ou pelo bônus que você digitar).' : 'Ainda não há combate.'}</p>}
    {admin && lista.length > 1 && <p className="text-[11px] text-(--a-a998bd)">Toque no número para mudar a iniciativa; ↑↓ desempatam. Quem entra no meio vai para o lugar certo sem mudar de quem é a vez.</p>}
    {admin && <details className="text-sm"><summary className="cursor-pointer text-xs text-(--a-c7a8ff)">Adicionar alguém sem token</summary>
      <form onSubmit={x => { x.preventDefault(); if (!nome.trim()) return
        void fazer({ acao: 'iniciativa', iniciativa: [...lista, { id: crypto.randomUUID(), nome, valor: Number(valor) || 0 }], turno, rodada }); setNome(''); setValor('') }} className="mt-2 flex gap-2">
        <input aria-label="Nome" value={nome} onChange={x => setNome(x.target.value)} placeholder="Nome" className={input} />
        <input aria-label="Valor" value={valor} onChange={x => setValor(x.target.value)} inputMode="numeric" placeholder="Valor" className={input + ' !w-20'} />
        <button type="submit" aria-label="Adicionar" className={btn}><Plus size={14} /></button></form>
    </details>}

    {janela === 'preparar' && <PrepararCombate tokens={e.tokens} fichas={fichas} acao={acao} fechar={() => setJanela(null)} />}
    {janela === 'entrar' && <EntrarNoCombate tokens={sem} acao={acao} fechar={() => setJanela(null)} />}
    {janela === 'dano' && <DanoEmVarios tokens={e.tokens} naOrdem={lista.map(x => x.tokenId).filter((x): x is string => !!x)} acao={acao} fechar={() => setJanela(null)} />}
  </div>
}

function Janela({ titulo, fechar, children }: { titulo: string; fechar: () => void; children: React.ReactNode }) {
  return <NaTela><div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-3" role="dialog" aria-modal="true" aria-label={titulo} onClick={fechar} onKeyDown={x => { if (x.key === 'Escape') fechar() }}>
    <div className="flex max-h-[90vh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-2xl border border-(--a-62527e) bg-(--s-19172c) p-4 text-(--a-f4f0ff)" onClick={x => x.stopPropagation()}>
      <div className="flex items-center gap-2"><h2 className="flex-1 font-bold">{titulo}</h2><button type="button" onClick={fechar} aria-label="Fechar" className="rounded p-1 hover:bg-(--s-34294f)"><X size={18} /></button></div>
      {children}
    </div></div></NaTela>
}

/** Entrar no combate já começado: rola pela ficha (ou bônus digitado) e entra no lugar certo. */
function EntrarNoCombate({ tokens, acao, fechar }: { tokens: Tk[]; acao: Acao; fechar: () => void }) {
  const [sel, setSel] = useState<string[]>([])
  const [indo, setIndo] = useState(false)
  async function entrar() {
    setIndo(true)
    for (const id of sel) await acao({ acao: 'iniciativa_entrar', tokenId: id }).catch(() => {})
    setIndo(false); toast.success(`${sel.length} entrou(aram) no combate.`); fechar()
  }
  return <Janela titulo="🎲 Entrar no combate" fechar={fechar}>
    <p className="text-xs text-(--a-c4b6d4)">Cada um rola a iniciativa pela ficha e entra no lugar certo da ordem. A vez de quem está jogando não muda.</p>
    <ul className="space-y-1">{tokens.map(t => <li key={t.id}><label className="flex items-center gap-2 rounded-lg bg-(--s-1e1a30) p-2 text-sm">
      <input type="checkbox" checked={sel.includes(t.id)} onChange={x => setSel(s => x.target.checked ? [...s, t.id] : s.filter(y => y !== t.id))} /><Avatar t={t} tam="h-6 w-6" /><span className="flex-1 truncate">{t.nome}</span></label></li>)}</ul>
    <button type="button" disabled={!sel.length || indo} onClick={() => void entrar()} className="rounded-lg bg-(--a-5b4380) px-3 py-2 font-semibold disabled:opacity-40">{indo ? 'Rolando…' : `Rolar e entrar (${sel.length})`}</button>
  </Janela>
}

/** Dano ou cura em vários de uma vez (área): rola uma vez; quem passou na resistência leva metade. */
function DanoEmVarios({ tokens, naOrdem, acao, fechar }: { tokens: Tk[]; naOrdem: string[]; acao: Acao; fechar: () => void }) {
  const [sel, setSel] = useState<Record<string, 'inteiro' | 'metade'>>({})
  const [dano, setDano] = useState(''), [rotulo, setRotulo] = useState(''), [cura, setCura] = useState(false), [indo, setIndo] = useState(false)
  const ids = Object.keys(sel)
  async function aplicar() {
    setIndo(true)
    try { const r = await acao({ acao: 'dano_varios', dano, rotulo, cura, alvos: ids.map(id => ({ tokenId: id, metade: sel[id] === 'metade' })) }); toast.success(`${cura ? 'Cura' : 'Dano'} de ${r.total} aplicado(a) em ${ids.length}.`); fechar() }
    catch { /* a mesa já mostra o erro */ } finally { setIndo(false) }
  }
  const ordenados = [...tokens].sort((a, b) => Number(naOrdem.includes(b.id)) - Number(naOrdem.includes(a.id)))
  return <Janela titulo={cura ? '💚 Cura em vários' : '💥 Dano em vários'} fechar={fechar}>
    <div className="flex flex-wrap gap-2">
      <input aria-label="Dano ou cura" value={dano} onChange={x => setDano(x.target.value)} placeholder="8d6 ou 12" className={input + ' !w-28 font-mono'} />
      <input aria-label="Nome (opcional)" value={rotulo} onChange={x => setRotulo(x.target.value)} placeholder="Bola de fogo (opcional)" maxLength={60} className={input + ' min-w-0 flex-1'} />
    </div>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={cura} onChange={x => setCura(x.target.checked)} /> É cura (soma vida)</label>
    <p className="text-xs text-(--a-c4b6d4)">Escolha os alvos. “Metade”: quem passou na resistência. Rola uma vez só para todos.</p>
    <ul className="space-y-1">{ordenados.map(t => { const s = sel[t.id]
      return <li key={t.id} className="flex items-center gap-2 rounded-lg bg-(--s-1e1a30) p-2 text-sm">
        <input type="checkbox" aria-label={'Alvo: ' + t.nome} checked={!!s} onChange={x => setSel(m => { const n = { ...m }; if (x.target.checked) n[t.id] = 'inteiro'; else delete n[t.id]; return n })} />
        <Avatar t={t} tam="h-6 w-6" /><span className="min-w-0 flex-1 truncate">{t.nome}{t.hp_max ? <span className="text-[11px] text-(--a-c4b6d4)"> ❤️ {t.hp_atual ?? 0}/{t.hp_max}</span> : null}</span>
        {s && !cura && <button type="button" onClick={() => setSel(m => ({ ...m, [t.id]: s === 'metade' ? 'inteiro' : 'metade' }))} aria-pressed={s === 'metade'} className={btn + (s === 'metade' ? ' !border-sky-300 !text-sky-200' : '')}>{s === 'metade' ? '½ Metade' : 'Inteiro'}</button>}
      </li> })}</ul>
    <button type="button" disabled={!ids.length || !dano.trim() || indo} onClick={() => void aplicar()} className={'rounded-lg px-3 py-2 font-semibold disabled:opacity-40 ' + (cura ? 'bg-emerald-700' : 'bg-[#b91c1c]')}>{indo ? 'Aplicando…' : `${cura ? 'Curar' : 'Aplicar dano em'} ${ids.length} alvo(s)`}</button>
  </Janela>
}
