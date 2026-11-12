'use client'

import RolagemAssim, { marcaAssim } from '@/components/dados/RolagemAssim'
import { useEffect, useState } from 'react'
import { BarChart3, Search } from 'lucide-react'
import { api, ErroNuvem } from '@/lib/nuvem/cliente'
import { detectarCritico } from '@/lib/dice'
import { inicioDoPeriodo, type FiltroResultado, type Periodo, type Resumo } from '@/lib/historico'
import { btn, input } from './estilos'

type Ev = { id: number; tipo: 'chat' | 'rolagem' | 'sistema' | 'ataque'; visibilidade: string; personagem: string | null; texto: string | null; expressao: string | null; resultados: number[] | null; total: number | null; criado_em: string
  autor: { apelido: string } | null; dados?: { alvo?: { nome: string }; arma?: string; acerto?: boolean; dano?: { total: number } | null; critico?: boolean; status?: string } | null }
type Membro = { aventureiro_id: string; aventureiro: { apelido: string } | null }
type Tipo = 'dados' | 'rolagem' | 'ataque' | 'chat' | 'sistema' | ''

const TIPOS: [Tipo, string][] = [['dados', '🎲 Dados'], ['ataque', '⚔️ Ataques'], ['chat', '💬 Mensagens'], ['sistema', '📢 Mesa'], ['', 'Tudo']]
const PERIODOS: [Periodo, string][] = [['sessao', 'Esta sessão'], ['hoje', 'Hoje'], ['semana', '7 dias'], ['tudo', 'Tudo']]
const chip = (ativo: boolean) => 'rounded-full border px-2.5 py-1 text-xs ' + (ativo ? 'border-(--a-b99bff) bg-(--s-3a2c58) text-white' : 'border-(--a-3d3152) text-(--a-cfc0df)')

/** Histórico de rolagens da campanha: filtros (quem, personagem, tipo, período, crítico/falha, texto) e resumo da sessão. */
export default function HistoricoRolagens({ campanhaId, membros }: { campanhaId: string; membros: Membro[] }) {
  const [f, setF] = useState<{ autor: string; personagem: string; tipo: Tipo; periodo: Periodo; resultado: FiltroResultado; busca: string }>({ autor: '', personagem: '', tipo: 'dados', periodo: 'sessao', resultado: '', busca: '' })
  const [lista, setLista] = useState<Ev[] | null>(null)
  const [resumo, setResumo] = useState<{ resumo: Resumo; total: number } | null>(null)
  const [verResumo, setVerResumo] = useState(true)
  const [sessaoEm, setSessaoEm] = useState<string | null | undefined>(undefined)
  const [erro, setErro] = useState('')
  const [mais, setMais] = useState(0)

  const params = (extra: Record<string, string> = {}) => {
    const desde = f.periodo === 'sessao' && sessaoEm === undefined ? null : inicioDoPeriodo(f.periodo, new Date(), sessaoEm)
    return new URLSearchParams({ historico: '1', ...(f.autor && { autor: f.autor }), ...(f.tipo && { tipo: f.tipo }), ...(f.personagem.trim() && { personagem: f.personagem.trim() }),
      ...(f.busca.trim() && { busca: f.busca.trim() }), ...(f.resultado && { resultado: f.resultado }), ...(desde && { desde }), ...extra })
  }
  // Atraso curto ao digitar; recarrega quando os filtros mudam.
  useEffect(() => {
    let vivo = true
    const t = setTimeout(() => {
      api<{ eventos: Ev[]; sessaoAbertaEm: string | null }>(`mesa/${campanhaId}?${params()}`).then(r => {
        if (!vivo) return
        if (sessaoEm === undefined) { setSessaoEm(r.sessaoAbertaEm); return } // 1ª vez: descobre quando a sessão abriu e busca de novo
        setLista(r.eventos); setErro('')
      }).catch(e => { if (vivo) setErro(e instanceof ErroNuvem ? e.message : 'Falha de conexão.') })
      api<{ resumo: Resumo; total: number }>(`mesa/${campanhaId}?${params({ resumo: '1' })}`).then(r => { if (vivo) setResumo(r) }).catch(() => {})
    }, 250)
    return () => { vivo = false; clearTimeout(t) }
  }, [campanhaId, f, sessaoEm]) // eslint-disable-line react-hooks/exhaustive-deps

  async function carregarMais() {
    const ult = lista?.at(-1)?.id; if (!ult) return
    try { const r = await api<{ eventos: Ev[] }>(`mesa/${campanhaId}?${params({ antes: String(ult) })}`); setLista(l => [...(l ?? []), ...r.eventos]); setMais(m => m + 1) } catch { /* fica como está */ }
  }
  const set = (p: Partial<typeof f>) => { setF(x => ({ ...x, ...p })); setMais(0) }

  return <div className="flex min-h-0 flex-1 flex-col gap-2">
    <div className="flex flex-wrap gap-1">{PERIODOS.map(([id, n]) => <button key={id} type="button" className={chip(f.periodo === id)} onClick={() => set({ periodo: id })}>{n}</button>)}</div>
    <div className="flex flex-wrap gap-1">{TIPOS.map(([id, n]) => <button key={id || 'tudo'} type="button" className={chip(f.tipo === id)} onClick={() => set({ tipo: id })}>{n}</button>)}</div>
    <div className="grid grid-cols-2 gap-2">
      <select aria-label="Quem" value={f.autor} onChange={x => set({ autor: x.target.value })} className={input}><option value="">Todos</option>{membros.map(m => <option key={m.aventureiro_id} value={m.aventureiro_id}>{m.aventureiro?.apelido}</option>)}</select>
      <input aria-label="Personagem" value={f.personagem} onChange={x => set({ personagem: x.target.value })} placeholder="Personagem" className={input} />
    </div>
    <div className="flex flex-wrap items-center gap-1">
      <button type="button" className={chip(f.resultado === 'critico')} onClick={() => set({ resultado: f.resultado === 'critico' ? '' : 'critico' })}>🎯 Só críticos (20)</button>
      <button type="button" className={chip(f.resultado === 'falha')} onClick={() => set({ resultado: f.resultado === 'falha' ? '' : 'falha' })}>💀 Só falhas (1)</button>
      <span className="relative min-w-[9rem] flex-1"><Search size={13} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-(--a-8f88a8)" />
        <input aria-label="Procurar no texto" value={f.busca} onChange={x => set({ busca: x.target.value })} placeholder="Procurar (ex.: Furtividade)" className={input + ' !py-1 pl-7 text-xs'} /></span>
    </div>

    {resumo && resumo.total > 0 && <section className="rounded-xl border border-(--a-55456e) bg-(--s-1d1730) p-3 text-sm">
      <button type="button" onClick={() => setVerResumo(v => !v)} aria-expanded={verResumo} className="flex w-full items-center gap-2 text-left font-semibold"><BarChart3 size={16} /> Resumo {PERIODOS.find(p => p[0] === f.periodo)?.[1].toLowerCase()}<span className="ml-auto text-xs font-normal text-(--a-b4aeca)">{verResumo ? 'esconder' : 'mostrar'}</span></button>
      {verResumo && <>
        <div className="mt-2 grid grid-cols-3 gap-1.5 text-center sm:grid-cols-6">
          {[['🎲', resumo.resumo.rolagens, 'rolagens'], ['⚔️', resumo.resumo.ataques, 'ataques'], ['✅', resumo.resumo.acertos, 'acertos'], ['🎯', resumo.resumo.criticos, 'críticos'], ['💀', resumo.resumo.falhas, 'falhas'], ['💥', resumo.resumo.maiorDano?.valor ?? '—', 'maior dano']].map(([i, v, n]) =>
            <div key={String(n)} className="rounded-lg bg-(--s-151123) p-1.5"><p className="text-lg font-bold tabular-nums">{i} {v}</p><p className="text-[10px] text-(--a-b4aeca)">{n}</p></div>)}
        </div>
        {resumo.resumo.maiorDano && <p className="mt-2 text-xs text-(--a-e4d3ff)">💥 Maior dano: <b>{resumo.resumo.maiorDano.valor}</b> de {resumo.resumo.maiorDano.quem}{resumo.resumo.maiorDano.alvo ? ` em ${resumo.resumo.maiorDano.alvo}` : ''}.</p>}
        {resumo.resumo.maiorRolagem && <p className="text-xs text-(--a-e4d3ff)">🏔️ Maior rolagem: <b>{resumo.resumo.maiorRolagem.valor}</b> ({resumo.resumo.maiorRolagem.expressao}) de {resumo.resumo.maiorRolagem.quem}.</p>}
        {resumo.resumo.porPersonagem.length > 0 && <table className="mt-2 w-full text-xs"><thead><tr className="text-left text-(--a-b4aeca)"><th className="font-normal">Quem</th><th className="text-right font-normal">rolou</th><th className="text-right font-normal">média d20</th><th className="text-right font-normal">🎯</th><th className="text-right font-normal">💀</th></tr></thead>
          <tbody>{resumo.resumo.porPersonagem.slice(0, 10).map(p => <tr key={p.nome} className="border-t border-(--a-2b2140)"><td className="truncate py-1">{p.nome}</td><td className="text-right tabular-nums">{p.rolagens}</td>
            <td className={'text-right tabular-nums ' + (p.mediaD20 !== null && p.mediaD20 >= 12 ? 'text-emerald-300' : p.mediaD20 !== null && p.mediaD20 <= 8 ? 'text-red-300' : '')}>{p.mediaD20 ?? '—'}</td><td className="text-right tabular-nums">{p.criticos}</td><td className="text-right tabular-nums">{p.falhas}</td></tr>)}</tbody></table>}
      </>}
    </section>}

    {erro && <p role="alert" className="text-sm text-red-200">{erro}</p>}
    <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto text-sm">{lista?.map(ev => {
      const crit = ev.expressao && ev.resultados ? detectarCritico(ev.expressao, ev.resultados) : null
      return <li key={ev.id} className={'rounded-lg border p-2 ' + (crit === 'critico' ? 'border-emerald-700/70 bg-emerald-950/30' : crit === 'falha' ? 'border-red-800/70 bg-red-950/30' : 'border-transparent bg-(--s-1e1a30)')}>
        <span className="text-[11px] text-(--a-b4aeca)">{new Date(ev.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {ev.personagem || ev.autor?.apelido || 'Mesa'}{ev.personagem && ev.autor?.apelido ? ` (${ev.autor.apelido})` : ''}{ev.visibilidade !== 'publica' && ' · 🔒'}{crit === 'critico' ? ' · 🎯 crítico' : crit === 'falha' ? ' · 💀 falha' : ''}</span><br />
        {marcaAssim(ev.dados) && ev.expressao && ev.resultados ? <>{ev.tipo === 'ataque' && ev.dados ? <>⚔️ {(ev.dados as { arma?: string }).arma} em <b>{(ev.dados as { alvo?: { nome: string } }).alvo?.nome}</b> → {(ev.dados as { acerto?: boolean }).acerto ? <span className="text-emerald-300">acertou</span> : <span className="text-red-300">errou</span>}</> : ev.texto && <span className="text-(--a-e4d3ff)">{ev.texto}</span>}
            <RolagemAssim expressao={ev.expressao} resultados={ev.resultados} {...marcaAssim(ev.dados)!} compacto /></>
          : ev.tipo === 'rolagem' ? <>{ev.texto && <span className="text-(--a-e4d3ff)">{ev.texto}: </span>}🎲 {ev.expressao} → [{ev.resultados?.join(', ')}] = <strong>{ev.total}</strong></>
          : ev.tipo === 'ataque' && ev.dados ? <>⚔️ {ev.dados.arma} em <b>{ev.dados.alvo?.nome}</b>: {ev.total} → {ev.dados.acerto ? <span className="text-emerald-300">acertou{ev.dados.dano ? `, ${ev.dados.dano.total} de dano` : ''}{ev.dados.status === 'ignorado' ? ' (anulado)' : ''}</span> : <span className="text-red-300">errou</span>}</>
          : <span className="whitespace-pre-wrap">{ev.texto}</span>}
      </li>
    })}
      {lista?.length === 0 && <li className="rounded-lg border border-dashed border-(--a-55456e) p-3 text-(--a-b4aeca)">Nada encontrado com esses filtros.</li>}
      {lista === null && !erro && <li className="text-(--a-b4aeca)">Carregando…</li>}
    </ul>
    {lista && lista.length >= 100 * (mais + 1) && <button type="button" className={btn + ' justify-center'} onClick={() => void carregarMais()}>Carregar mais</button>}
  </div>
}
