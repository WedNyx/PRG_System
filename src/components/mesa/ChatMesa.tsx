'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Dices, History, Image as ImageIcon, Lock, Send, X } from 'lucide-react'
import { separarEventos, type AbaChat } from '@/lib/mesa/abasChat'
import RolagemAssim, { marcaAssim } from '@/components/dados/RolagemAssim'
import { estiloPapel } from './papeis'
import { CartaoAtaque } from './Combate'
import { enviarImagem } from './enviarImagem'
import { msg } from './estilos'
import type { Acao, Estado, Evento } from './MesaNova'

/**
 * Chat da mesa (v0.36.4): uma aba lateral própria, que recolhe. Conversa em balões (as minhas à direita),
 * mensagens seguidas da mesma pessoa juntas, e as rolagens separadas em Dados, Combate e Mestre.
 */
const DADOS = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100']
const hora = (d: string) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
const ABAS = [['conversa', '💬', 'Conversa'], ['dados', '🎲', 'Dados'], ['combate', '⚔️', 'Combate'], ['mestre', '🎩', 'Mestre']] as const
const IMAGEM = /^https:\/\/[^\s]+\.(?:png|jpe?g|gif|webp)(?:\?[^\s]*)?$/i
const COR_PAPEL: Record<string, string> = { mestre: '#f5c46b', comestre: '#f5d58a', jogador: '#7cc4f5', espectador: '#6ee7b7' }

type Props = { campanhaId: string; e: Estado; nomes: Record<string, string>; papelDe: Record<string, string>; admin: boolean; espectador: boolean
  acao: Acao; destacar: (ev: Evento) => void; abrirHistorico: () => void; recolher: () => void }

export default function ChatMesa({ campanhaId, e, nomes, papelDe, admin, espectador, acao, destacar, abrirHistorico, recolher }: Props) {
  const [texto, setTexto] = useState('')
  const [enviandoImagem, setEnviandoImagem] = useState(false)
  const [expr, setExpr] = useState('')
  const [vis, setVis] = useState<'publica' | 'mestre' | 'privada'>('publica')
  const [dest, setDest] = useState('')
  const [pers, setPers] = useState('')
  const [opcoes, setOpcoes] = useState(false)
  const lista = useRef<HTMLDivElement>(null)
  const [aba, setAba] = useState<AbaChat>('conversa')
  const combateAgora = (e.mesa?.iniciativa?.length ?? 0) > 0
  const abaDe = useMemo(() => separarEventos(e.eventos, papelDe, combateAgora), [e.eventos, papelDe, combateAgora])
  const eventos = e.eventos.filter(ev => abaDe.get(ev.id) === aba)
  const ultimos = useMemo(() => { const u: Record<AbaChat, number> = { conversa: 0, dados: 0, combate: 0, mestre: 0 }; for (const ev of e.eventos) { const a = abaDe.get(ev.id); if (a) u[a] = Math.max(u[a], ev.id) } return u }, [e.eventos, abaDe])
  const [visto, setVisto] = useState<Record<AbaChat, number>>({ conversa: 0, dados: 0, combate: 0, mestre: 0 })
  const iniciado = useRef(false)
  useEffect(() => {
    if (!iniciado.current && Object.values(ultimos).some(Boolean)) { setVisto(ultimos); iniciado.current = true; return }
    setVisto(v => v[aba] >= ultimos[aba] ? v : { ...v, [aba]: ultimos[aba] })
  }, [aba, ultimos])
  const novos = (t: AbaChat) => t === aba ? 0 : e.eventos.filter(ev => abaDe.get(ev.id) === t && ev.id > visto[t] && ev.autor_id !== e.eu).length
  // Desce para a última mensagem quando chega algo novo (ou ao trocar de aba).
  useEffect(() => { const el = lista.current; if (el) el.scrollTop = el.scrollHeight }, [eventos.length, aba])
  const meus = e.fichas.filter(f => f.dono_id === e.eu || (admin && f.npc))

  async function rolar(x: string) {
    if (!x.trim()) return
    const r = await acao({ acao: 'evento', tipo: 'rolagem', expressao: x.trim(), visibilidade: vis, destinatarioId: dest, personagem: pers }).catch(() => null)
    const ev = r?.evento as Evento | undefined
    if (ev?.expressao && ev.resultados) destacar(ev)
  }
  async function enviar() {
    if (!texto.trim()) return
    if (/^\/r(oll)?\s+/i.test(texto)) { await rolar(texto.replace(/^\/r(oll)?\s+/i, '')); setTexto(''); toast(`🎲 A rolagem foi para “${combateAgora ? 'Combate' : admin ? 'Mestre' : 'Dados'}”.`); return }
    await acao({ acao: 'evento', tipo: 'chat', texto, visibilidade: vis, destinatarioId: dest, personagem: pers }).then(() => setTexto('')).catch(() => {})
  }
  async function enviarFoto(arq?: File) {
    if (!arq) return
    if (!arq.type.startsWith('image/')) { toast.error('Escolha uma imagem.'); return }
    setEnviandoImagem(true)
    try {
      const { url } = await enviarImagem(campanhaId, e.eu, arq)
      await acao({ acao: 'evento', tipo: 'chat', texto: url, visibilidade: vis, destinatarioId: dest, personagem: pers })
      toast.success('Imagem enviada ao chat.')
    } catch (err) { toast.error(msg(err)) } finally { setEnviandoImagem(false) }
  }

  const rotuloVis = vis === 'publica' ? '👀 Todos' : vis === 'mestre' ? '🔒 Só o mestre' : `✉️ ${nomes[dest] ?? 'Privado'}`
  return <div className="flex h-full min-h-0 flex-col">
    {/* Cabeçalho: título, histórico e recolher; abas com o número de novidades. */}
    <div className="shrink-0 space-y-2 border-b border-(--a-373251) bg-(--s-17142a) px-3 pb-2 pt-2.5">
      <div className="flex items-center gap-2">
        <h2 className="flex-1 font-bold">💬 Chat da mesa</h2>
        <button type="button" onClick={abrirHistorico} aria-label="Histórico de rolagens" title="Histórico de rolagens" className="rounded-lg p-1.5 hover:bg-(--s-34294f)"><History size={17} /></button>
        <button type="button" onClick={recolher} aria-label="Recolher o chat" title="Recolher o chat" className="rounded-lg p-1.5 hover:bg-(--s-34294f)"><X size={18} /></button>
      </div>
      <div role="tablist" aria-label="Conversa, dados, combate ou mestre" className="grid grid-cols-4 gap-1 rounded-xl bg-(--s-100f20) p-1 text-[11px]">
        {ABAS.map(([id, icone, rot]) => { const n = novos(id)
          return <button key={id} type="button" role="tab" aria-selected={aba === id} onClick={() => setAba(id)}
            className={'relative flex flex-col items-center rounded-lg px-1 py-1 font-semibold transition ' + (aba === id ? 'bg-(--a-7654bb) text-white' : 'text-(--a-cfc0df) hover:bg-(--s-2b2140)')}>
            <span aria-hidden className="text-sm leading-none">{icone}</span>{rot}
            {n > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-[#e5484d] px-1 text-[10px] leading-4 text-white">{n > 99 ? '99+' : n}</span>}</button> })}
      </div>
    </div>

    {/* Mensagens */}
    <div ref={lista} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3" aria-live="polite">
      {eventos.length === 0 && <p className="mt-6 text-center text-sm text-(--a-b4aeca)">{aba === 'conversa' ? 'Ninguém falou ainda. Mande um oi!' : aba === 'combate' ? 'Nenhum combate por enquanto.' : aba === 'mestre' ? 'O mestre ainda não rolou nada.' : 'Nada por aqui ainda. Role um dado!'}</p>}
      <ul className="space-y-1">{eventos.map((ev, i) => {
        const ant = eventos[i - 1], meu = ev.autor_id === e.eu, sistema = ev.tipo === 'sistema'
        const papel = papelDe[ev.autor_id ?? ''], st = estiloPapel(papel)
        const quem = ev.personagem || ev.autor?.apelido || (sistema ? 'Mesa' : '?')
        // Junta mensagens seguidas da mesma pessoa (até 3 min).
        const junto = !!ant && ant.autor_id === ev.autor_id && (ant.personagem ?? '') === (ev.personagem ?? '') && ant.tipo !== 'sistema' && !sistema
          && Date.parse(ev.criado_em) - Date.parse(ant.criado_em) < 180000
        const privado = ev.visibilidade !== 'publica' && <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-black/25 px-1.5 text-[10px]"><Lock size={9} />{ev.visibilidade === 'mestre' ? 'só o mestre' : 'para ' + (nomes[ev.destinatario_id ?? ''] ?? '?')}</span>
        if (sistema) return <li key={ev.id} className="py-1 text-center"><span className="inline-block rounded-full bg-(--s-1e1a30) px-3 py-1 text-[11px] text-(--a-cfc0df)">{ev.texto} · {hora(ev.criado_em)}</span></li>
        const conteudo = ev.tipo === 'rolagem' && marcaAssim(ev.dados) && ev.expressao && ev.resultados
          ? <div>{ev.texto && <p className="text-xs opacity-80">🎲 {ev.texto}</p>}<RolagemAssim expressao={ev.expressao} resultados={ev.resultados} {...marcaAssim(ev.dados)!} /></div>
          : ev.tipo === 'rolagem' ? <div className="flex items-center gap-3">
              <span className="flex h-11 min-w-11 items-center justify-center rounded-xl bg-black/30 px-2 text-xl font-black text-(--a-ed9cd8)">{ev.total}</span>
              <span className="min-w-0 text-xs"><span className="block font-semibold text-(--a-c7a8ff)">🎲 {ev.expressao}</span><span className="block opacity-80">[{ev.resultados?.join(', ')}]
                {ev.expressao?.includes('d20') && ev.resultados?.[0] === 20 && ' ✨ 20 natural!'}{ev.expressao?.includes('d20') && ev.resultados?.[0] === 1 && ' 💀 1 natural'}</span>
                {ev.texto && <span className="block opacity-80">{ev.texto}</span>}</span></div>
          : ev.tipo === 'ataque' && ev.dados ? <CartaoAtaque d={ev.dados} admin={admin} rolagem={ev.expressao && ev.resultados ? { expressao: ev.expressao, resultados: ev.resultados } : undefined} />
          // eslint-disable-next-line @next/next/no-img-element
          : ev.tipo === 'chat' && ev.texto && IMAGEM.test(ev.texto) ? <a href={ev.texto} target="_blank" rel="noopener noreferrer" className="block"><img src={ev.texto} alt="Imagem enviada no chat" loading="lazy" className="max-h-60 max-w-full rounded-lg" /></a>
          : <p className="whitespace-pre-wrap break-words">{ev.texto}</p>
        return <li key={ev.id} className={'flex gap-2 ' + (meu ? 'flex-row-reverse' : '') + (junto ? '' : ' pt-2')}>
          {!meu && <span aria-hidden className={'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-black ' + (junto ? 'invisible' : '')} style={{ background: COR_PAPEL[papel] ?? COR_PAPEL.jogador }}>{quem.slice(0, 1).toUpperCase()}</span>}
          <div className={'min-w-0 max-w-[85%] ' + (meu ? 'items-end text-right' : '')}>
            {!junto && <p className={'mb-0.5 text-[11px] text-(--a-b4aeca) ' + (meu ? 'text-right' : '')}>
              {!meu && <strong className={st.cor} title={st.nome}>{st.icone} {quem}</strong>}{!meu && ev.personagem && ev.autor?.apelido && <span> ({ev.autor.apelido})</span>}
              {meu && ev.personagem && <strong className="text-(--a-e4d3ff)">{ev.personagem} · </strong>}{(meu ? '' : ' · ') + hora(ev.criado_em)}</p>}
            <div className={'inline-block rounded-2xl px-3 py-2 text-left text-sm ' + (meu ? 'rounded-tr-md bg-(--a-5b4380) text-white' : 'rounded-tl-md bg-(--s-1e1a30)') + (ev.visibilidade !== 'publica' ? ' ring-1 ring-(--a-b99bff)/60' : '')}>
              {conteudo}{privado}
            </div>
          </div>
        </li>
      })}</ul>
    </div>

    {/* Escrever, rolar e mandar imagem */}
    <div className="shrink-0 space-y-2 border-t border-(--a-373251) bg-(--s-17142a) p-2.5">
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        <button type="button" onClick={() => setOpcoes(o => !o)} aria-expanded={opcoes} className="rounded-full border border-(--a-5e4b78) px-2.5 py-1 hover:bg-(--s-34294f)">{rotuloVis}{pers ? ' · como ' + pers : ''} ▾</button>
        {espectador && <span className="text-(--a-b4aeca)">Você está assistindo: pode conversar.</span>}
      </div>
      {opcoes && <div className="grid grid-cols-2 gap-2">
        <select aria-label="Quem vê" value={vis} onChange={x => setVis(x.target.value as typeof vis)} className="rounded-lg border border-(--a-5e4b78) bg-(--s-100f20) p-1.5 text-xs">
          <option value="publica">👀 Todos veem</option><option value="mestre">🔒 Só o mestre</option><option value="privada">✉️ Privado para…</option></select>
        {vis === 'privada' ? <select aria-label="Destinatário" value={dest} onChange={x => setDest(x.target.value)} className="rounded-lg border border-(--a-5e4b78) bg-(--s-100f20) p-1.5 text-xs"><option value="">Escolha…</option>
          {e.membros.filter(m => m.aventureiro_id !== e.eu).map(m => <option key={m.aventureiro_id} value={m.aventureiro_id}>{m.aventureiro?.apelido}{m.papel === 'mestre' || m.papel === 'comestre' ? ' (mestre)' : m.papel === 'espectador' ? ' (espectador)' : ''}</option>)}</select>
          : <select aria-label="Personagem" value={pers} onChange={x => setPers(x.target.value)} className="rounded-lg border border-(--a-5e4b78) bg-(--s-100f20) p-1.5 text-xs"><option value="">Como eu mesmo</option>{meus.map(f => <option key={f.id} value={f.nome || 'Personagem'}>{f.nome || 'Personagem sem nome'}</option>)}</select>}
      </div>}
      {!espectador && aba !== 'conversa' && <div className="space-y-1.5">
        <div className="grid grid-cols-7 gap-1">{DADOS.map(d => <button key={d} type="button" onClick={() => void rolar('1' + d)} className="rounded-lg border border-(--a-5e4b78) py-1.5 text-xs font-semibold hover:bg-(--s-34294f)">{d}</button>)}</div>
        <form onSubmit={x => { x.preventDefault(); void rolar(expr).then(() => setExpr('')) }} className="flex gap-2">
          <input aria-label="Expressão de dados" value={expr} onChange={x => setExpr(x.target.value)} maxLength={80} placeholder="2d6+3, 4d6kh3, 2d20kh1…" className="min-w-0 flex-1 rounded-xl border border-(--a-5e4b78) bg-(--s-100f20) px-3 py-2 text-sm text-white" />
          <button type="submit" aria-label="Rolar" className="rounded-xl bg-(--a-7654bb) px-3"><Dices size={18} /></button>
        </form>
      </div>}
      {aba === 'conversa' && <form onSubmit={x => { x.preventDefault(); void enviar() }} className="flex items-end gap-1.5">
        <label className={'flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-(--a-5e4b78) hover:bg-(--s-34294f) ' + (enviandoImagem ? 'animate-pulse' : '')} title="Enviar imagem (até 5 MB)" aria-label="Enviar imagem">
          <ImageIcon size={17} /><input type="file" accept="image/*" className="sr-only" disabled={enviandoImagem} onChange={ev => { const arq = ev.target.files?.[0]; ev.target.value = ''; void enviarFoto(arq) }} /></label>
        <textarea aria-label="Mensagem" value={texto} rows={1} onChange={x => setTexto(x.target.value)} maxLength={1000}
          onKeyDown={x => { if (x.key === 'Enter' && !x.shiftKey) { x.preventDefault(); void enviar() } }}
          placeholder={espectador ? 'Mensagem' : 'Mensagem (ou /r 1d20+2)'} className="max-h-28 min-h-10 min-w-0 flex-1 resize-none rounded-xl border border-(--a-5e4b78) bg-(--s-100f20) px-3 py-2 text-sm text-white" />
        <button type="submit" aria-label="Enviar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--a-7654bb)"><Send size={17} /></button>
      </form>}
      {aba !== 'conversa' && espectador && <p className="text-xs text-(--a-b4aeca)">Espectadores assistem às rolagens; para falar, use a Conversa.</p>}
    </div>
  </div>
}
