'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { BookOpen, Gift, NotebookPen, Pin, Plus, Save, Trash2, X } from 'lucide-react'
import { api } from '@/lib/nuvem/cliente'
import type { Estado } from './MesaNova'
import { btn, input, msg } from './estilos'

type Sessao = { id: string; numero: number; titulo: string; data: string | null; preparacao?: string; resumo: string; publicada: boolean }
type Nota = { id: string; titulo: string; texto: string; visibilidade: 'privada' | 'mestre' | 'campanha' | 'jogador'; destinatario_id: string | null; fixada: boolean; autor_id: string; atualizada_em: string; autor: { apelido: string } | null }
const VIS: Record<Nota['visibilidade'], string> = { privada: '🔒 Só eu', mestre: '🎩 Eu e o mestre', campanha: '👥 Toda a campanha', jogador: '✉️ Com uma pessoa' }

/** Aba “Diário”: sessões, anotações, e (mestre) biblioteca de itens/poderes e recompensas. */
export default function PainelCampanha({ campanhaId, e, admin }: { campanhaId: string; e: Estado; admin: boolean }) {
  const [aba, setAba] = useState<'diario' | 'notas' | 'recompensas'>('diario')
  return <div className="space-y-3 text-sm">
    <div className="flex gap-1">
      {([['diario', BookOpen, 'Sessões'], ['notas', NotebookPen, 'Anotações'], ...(admin ? [['recompensas', Gift, 'Recompensas']] : [])] as [typeof aba, typeof BookOpen, string][]).map(([id, I, n]) =>
        <button key={id} type="button" onClick={() => setAba(id)} className={'flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs ' + (aba === id ? 'bg-(--a-5b4380)' : 'bg-(--s-1e1a30)')}><I size={14} /> {n}</button>)}
    </div>
    {aba === 'diario' && <Sessoes campanhaId={campanhaId} admin={admin} />}
    {aba === 'notas' && <Notas campanhaId={campanhaId} e={e} admin={admin} />}
    {aba === 'recompensas' && admin && <Recompensas campanhaId={campanhaId} e={e} />}
  </div>
}

function Sessoes({ campanhaId, admin }: { campanhaId: string; admin: boolean }) {
  const [lista, setLista] = useState<Sessao[] | null>(null)
  const [edit, setEdit] = useState<Partial<Sessao> | null>(null)
  const carregar = useCallback(() => api<{ sessoes: Sessao[] }>(`campanhas/${campanhaId}/sessoes`).then(r => setLista(r.sessoes)).catch(er => toast.error(msg(er))), [campanhaId])
  useEffect(() => { void carregar() }, [carregar])
  async function salvar() {
    try { await api(`campanhas/${campanhaId}/sessoes`, { method: 'POST', body: edit }); setEdit(null); await carregar(); toast.success('Sessão salva!') } catch (er) { toast.error(msg(er)) }
  }
  if (edit) return <div className="space-y-2">
    <div className="flex gap-2"><input aria-label="Número" type="number" min={1} value={edit.numero ?? 1} onChange={x => setEdit({ ...edit, numero: Number(x.target.value) })} className={input + ' !w-20'} />
      <input aria-label="Título da sessão" value={edit.titulo ?? ''} onChange={x => setEdit({ ...edit, titulo: x.target.value })} placeholder="Título" className={input} /></div>
    <input aria-label="Data" type="date" value={edit.data ?? ''} onChange={x => setEdit({ ...edit, data: x.target.value })} className={input} />
    <label className="block text-xs">🎩 Preparação (só você vê)<textarea rows={5} value={edit.preparacao ?? ''} onChange={x => setEdit({ ...edit, preparacao: x.target.value })} className={input + ' mt-1'} placeholder="Ganchos, encontros, NPCs, segredos…" /></label>
    <label className="block text-xs">📖 Diário / resumo (os jogadores veem quando publicado)<textarea rows={6} value={edit.resumo ?? ''} onChange={x => setEdit({ ...edit, resumo: x.target.value })} className={input + ' mt-1'} placeholder="O que aconteceu na sessão…" /></label>
    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!edit.publicada} onChange={x => setEdit({ ...edit, publicada: x.target.checked })} /> Publicar no diário da campanha</label>
    <div className="flex gap-2"><button type="button" onClick={salvar} className={btn}><Save size={14} /> Salvar</button><button type="button" onClick={() => setEdit(null)} className={btn}>Cancelar</button></div>
  </div>
  return <div className="space-y-2">
    {admin && <button type="button" className={btn} onClick={() => setEdit({ numero: (lista?.[0]?.numero ?? 0) + 1, titulo: '', publicada: false, data: new Date().toISOString().slice(0, 10) })}><Plus size={14} /> Nova sessão</button>}
    {lista?.map(s => <article key={s.id} className="rounded-lg bg-(--s-1e1a30) p-3">
      <div className="flex items-start gap-2"><h4 className="flex-1 font-semibold">Sessão {s.numero}: {s.titulo}</h4>
        {admin && <span className="text-[11px]">{s.publicada ? '📖 publicada' : '🎩 rascunho'}</span>}</div>
      {s.data && <p className="text-[11px] text-(--a-b4aeca)">{new Date(s.data + 'T12:00:00').toLocaleDateString('pt-BR')}</p>}
      {s.resumo && <p className="mt-1 whitespace-pre-wrap break-words">{s.resumo}</p>}
      {admin && s.preparacao && <p className="mt-2 whitespace-pre-wrap break-words rounded bg-(--s-2b2140) p-2 text-xs">🎩 {s.preparacao}</p>}
      {admin && <div className="mt-2 flex gap-2"><button type="button" className={btn} onClick={() => setEdit(s)}>Editar</button>
        <button type="button" className={btn} onClick={async () => { if (!window.confirm('Excluir esta sessão?')) return; try { await api(`campanhas/${campanhaId}/sessoes?sessao=${s.id}`, { method: 'DELETE' }); await carregar() } catch (er) { toast.error(msg(er)) } }}><Trash2 size={14} /></button></div>}
    </article>)}
    {lista?.length === 0 && <p className="text-(--a-b4aeca)">{admin ? 'Prepare sua primeira sessão.' : 'O mestre ainda não publicou nenhuma sessão no diário.'}</p>}
  </div>
}

function Notas({ campanhaId, e, admin }: { campanhaId: string; e: Estado; admin: boolean }) {
  const [lista, setLista] = useState<Nota[] | null>(null)
  const [edit, setEdit] = useState<Partial<Nota> | null>(null)
  const nomes = Object.fromEntries(e.membros.map(m => [m.aventureiro_id, m.aventureiro?.apelido ?? '?']))
  const carregar = useCallback(() => api<{ notas: Nota[] }>(`campanhas/${campanhaId}/notas`).then(r => setLista(r.notas)).catch(er => toast.error(msg(er))), [campanhaId])
  useEffect(() => { void carregar() }, [carregar])
  async function salvar() {
    try { await api(`campanhas/${campanhaId}/notas`, { method: 'POST', body: { ...edit, destinatarioId: edit?.destinatario_id } }); setEdit(null); await carregar() } catch (er) { toast.error(msg(er)) }
  }
  if (edit) return <div className="space-y-2">
    <input aria-label="Título" value={edit.titulo ?? ''} onChange={x => setEdit({ ...edit, titulo: x.target.value })} placeholder="Título (ex.: Pistas do xerife)" className={input} />
    <textarea aria-label="Texto" rows={7} value={edit.texto ?? ''} onChange={x => setEdit({ ...edit, texto: x.target.value })} className={input} />
    <select aria-label="Quem vê" value={edit.visibilidade ?? 'privada'} onChange={x => setEdit({ ...edit, visibilidade: x.target.value as Nota['visibilidade'] })} className={input}>
      {Object.entries(VIS).filter(([k]) => !(admin && k === 'mestre')).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
    {edit.visibilidade === 'jogador' && <select aria-label="Com quem" value={edit.destinatario_id ?? ''} onChange={x => setEdit({ ...edit, destinatario_id: x.target.value })} className={input}><option value="">Escolha…</option>
      {e.membros.filter(m => m.aventureiro_id !== e.eu).map(m => <option key={m.aventureiro_id} value={m.aventureiro_id}>{m.aventureiro?.apelido}</option>)}</select>}
    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!edit.fixada} onChange={x => setEdit({ ...edit, fixada: x.target.checked })} /> Fixar no topo</label>
    <div className="flex gap-2"><button type="button" onClick={salvar} className={btn}><Save size={14} /> Salvar</button><button type="button" onClick={() => setEdit(null)} className={btn}><X size={14} /> Cancelar</button></div>
  </div>
  return <div className="space-y-2">
    <button type="button" className={btn} onClick={() => setEdit({ titulo: '', texto: '', visibilidade: 'privada' })}><Plus size={14} /> Nova anotação</button>
    {lista?.map(n => <article key={n.id} className="rounded-lg bg-(--s-1e1a30) p-3">
      <div className="flex items-start gap-2"><h4 className="flex-1 font-semibold">{n.fixada && <Pin size={12} className="mr-1 inline" />}{n.titulo}</h4>
        <span className="text-[11px] text-(--a-b4aeca)">{n.visibilidade === 'jogador' ? `✉️ ${n.autor_id === e.eu ? 'para ' + (nomes[n.destinatario_id ?? ''] ?? '?') : 'de ' + (n.autor?.apelido ?? '?')}` : VIS[n.visibilidade]}</span></div>
      {n.autor_id !== e.eu && <p className="text-[11px] text-(--a-b4aeca)">por {n.autor?.apelido}</p>}
      {n.texto && <p className="mt-1 whitespace-pre-wrap break-words">{n.texto}</p>}
      {n.autor_id === e.eu && <div className="mt-2 flex gap-2"><button type="button" className={btn} onClick={() => setEdit(n)}>Editar</button>
        <button type="button" aria-label="Excluir anotação" className={btn} onClick={async () => { if (!window.confirm('Excluir esta anotação?')) return; try { await api(`campanhas/${campanhaId}/notas?nota=${n.id}`, { method: 'DELETE' }); await carregar() } catch (er) { toast.error(msg(er)) } }}><Trash2 size={14} /></button></div>}
    </article>)}
    {lista?.length === 0 && <p className="text-(--a-b4aeca)">Nenhuma anotação ainda.</p>}
  </div>
}

function Recompensas({ campanhaId, e }: { campanhaId: string; e: Estado }) {
  const fichas = e.fichas.filter(f => !f.npc)
  const [sel, setSel] = useState<string[]>([])
  const [r, setR] = useState({ xp: '', pontos: '', item: '', moedas: '', motivo: '' })
  const [enviando, setEnviando] = useState(false)
  const [bib, setBib] = useState<EntradaBib[]>([])
  const [escolhidos, setEscolhidos] = useState<string[]>([])
  useEffect(() => { api<{ biblioteca: EntradaBib[] }>(`campanhas/${campanhaId}/biblioteca`).then(x => setBib(x.biblioteca)).catch(() => {}) }, [campanhaId])
  const nomes = Object.fromEntries(e.membros.map(m => [m.aventureiro_id, m.aventureiro?.apelido ?? '?']))
  async function dar() {
    setEnviando(true)
    try {
      const res = await api<{ recompensados: string[] }>(`campanhas/${campanhaId}/recompensas`, { method: 'POST', body: { ...r, fichaIds: sel, bibliotecaIds: escolhidos } })
      toast.success('Recompensa entregue para ' + res.recompensados.join(', ')); setR({ xp: '', pontos: '', item: '', moedas: '', motivo: '' }); setSel([]); setEscolhidos([])
    } catch (er) { toast.error(msg(er)) } finally { setEnviando(false) }
  }
  return <div className="space-y-2">
    <p className="rounded-lg bg-(--s-2a2142) p-2 text-xs text-(--a-e4d3ff)">📚 Itens e poderes prontos ficam em <b>Mestre → Biblioteca</b> da mesa, com o botão “🎁 Dar”.</p>
    <p className="text-xs text-(--a-b4aeca)">Vai direto para as fichas aprovadas: o XP soma no campo de XP (ou é anotado), itens, poderes e moedas vão para o inventário, e os pontos vão para a árvore de habilidades. Fica no histórico e aparece no chat.</p>
    <div className="space-y-1">{fichas.map(f => <label key={f.id} className="flex items-center gap-2 rounded-lg bg-(--s-1e1a30) p-2">
      <input type="checkbox" checked={sel.includes(f.id)} onChange={x => setSel(s => x.target.checked ? [...s, f.id] : s.filter(y => y !== f.id))} />
      <span className="flex-1">{f.nome || 'sem nome'}</span><span className="text-[11px] text-(--a-b4aeca)">{nomes[f.dono_id]}</span></label>)}</div>
    {fichas.length === 0 && <p className="text-(--a-b4aeca)">Nenhuma ficha aprovada nesta campanha.</p>}
    {fichas.length > 1 && <button type="button" className={btn} onClick={() => setSel(sel.length === fichas.length ? [] : fichas.map(f => f.id))}>{sel.length === fichas.length ? 'Desmarcar todos' : 'Marcar todos'}</button>}
    <div className="grid grid-cols-2 gap-2">
      <input aria-label="XP" value={r.xp} onChange={x => setR({ ...r, xp: x.target.value })} inputMode="numeric" placeholder="XP (ex.: 150)" className={input} />
      <input aria-label="Moedas" value={r.moedas} onChange={x => setR({ ...r, moedas: x.target.value })} placeholder="Moedas (ex.: 20 PO)" className={input} />
      <input aria-label="Pontos de habilidade" value={r.pontos} onChange={x => setR({ ...r, pontos: x.target.value })} inputMode="numeric" placeholder="🌠 Pontos da árvore (ex.: 2)" className={input + ' col-span-2'} />
    </div>
    <input aria-label="Item" value={r.item} onChange={x => setR({ ...r, item: x.target.value })} placeholder="Item rápido (ex.: Revólver encantado)" className={input} />
    {bib.length > 0 && <div className="rounded-lg bg-(--s-1e1a30) p-2">
      <label className="block text-xs text-(--a-c4b6d4)">Da biblioteca
        <select value="" onChange={x => { const v = x.target.value; if (v) setEscolhidos(l => l.length < 20 ? [...l, v] : l) }} className={input + ' mt-1'}>
          <option value="">+ Escolher item ou poder…</option>
          {bib.map(b => <option key={b.id} value={b.id}>{b.tipo === 'item' ? '🎒' : '✨'} {b.nome}</option>)}
        </select></label>
      {escolhidos.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{escolhidos.map((id, i) => <button key={i} type="button" onClick={() => setEscolhidos(l => l.filter((_, k) => k !== i))} className="rounded-full bg-(--s-3a2c58) px-2 py-0.5 text-xs" aria-label="Tirar">{bib.find(b => b.id === id)?.nome} ✕</button>)}</div>}
    </div>}
    <input aria-label="Motivo" value={r.motivo} onChange={x => setR({ ...r, motivo: x.target.value })} placeholder="Motivo (opcional)" className={input} />
    <button type="button" disabled={enviando || !sel.length} onClick={dar} className={btn}><Gift size={14} /> Entregar recompensa</button>
    <p className="text-[11px] text-(--a-9d93b8)">Nas fichas dos sistemas da plataforma, itens e poderes entram prontos no Inventário e em Poderes (com bônus e rolagens). Na Ficha V8, são anotados no inventário.</p>
  </div>
}

type EntradaBib = { id: string; tipo: 'item' | 'poder'; nome: string; dados: Record<string, unknown> }
