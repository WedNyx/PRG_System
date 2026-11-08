'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, ChevronLeft, ChevronRight, CloudFog, Dices, Eraser, Eye, EyeOff, Hand, History, Image as ImageIcon, Lock, MapPin, MessageSquare, Pencil, Plus, Ruler, Send, Settings2, Swords, Trash2, Volume2, VolumeX, X } from 'lucide-react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { api, ErroNuvem } from '@/lib/nuvem/cliente'
import { condicoesDisponiveis, emojiCondicao } from '@/lib/condicoes'
import type { Campanha, Personagem } from '@/types/database'
import MapaGrid, { type CursorRemoto, type ModoMapa, type Ping } from './MapaGrid'
import Dados3D, { type Dados3DHandle } from './Dados3D'

type Cena = { id: string; nome: string; mapa_url: string | null; grid_cols: number; grid_rows: number; fog_ativo: boolean; fog_revelado: string[]; ativa: boolean }
type Token = { id: string; nome: string; cor: string; imagem_url: string | null; x: number; y: number; visivel: boolean; npc: boolean; hp_atual: number | null; hp_max: number | null; condicoes: string[]; dono_id: string | null; ficha_id: string | null }
type Evento = { id: number; tipo: 'chat' | 'rolagem' | 'sistema'; visibilidade: 'publica' | 'mestre' | 'privada'; autor_id: string | null; destinatario_id: string | null; personagem: string | null; texto: string | null; expressao: string | null; resultados: number[] | null; total: number | null; criado_em: string; autor: { apelido: string } | null }
type Iniciativa = { id: string; nome: string; valor: number; tokenId?: string | null }
type Estado = {
  campanha: { id: string; nome: string; meuPapel: string }; mesa: { iniciativa: Iniciativa[]; turno: number; rodada: number }
  cenas: Cena[]; cenaAtiva: Cena | null; tokens: Token[]; desenhos: { id: string; cor: string; pontos: number[] }[]; eventos: Evento[]
  membros: { aventureiro_id: string; papel: string; aventureiro: { apelido: string } | null }[]; fichas: { id: string; nome: string; dono_id: string; npc: boolean }[]; eu: string
}

const CORES = ['#fbbf24', '#38bdf8', '#4ade80', '#f87171', '#c084fc', '#f1f5f9']
const DADOS = ['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '1d100']
const btn = 'inline-flex items-center gap-1 rounded-lg border border-[#5e4b78] px-2.5 py-1.5 text-xs hover:bg-[#34294f] disabled:opacity-50'
const input = 'w-full rounded-lg border border-[#5e4b78] bg-[#100f20] p-2 text-sm text-white'
const msg = (e: unknown) => e instanceof ErroNuvem ? e.message : 'Falha de conexão.'
const hora = (d: string) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

export default function MesaNova({ campanhaId }: { campanhaId: string }) {
  const [e, setE] = useState<Estado | null>(null)
  const [erro, setErro] = useState('')
  const [modo, setModo] = useState<ModoMapa>('mover')
  const [cor, setCor] = useState(CORES[0])
  const [aba, setAba] = useState<'chat' | 'iniciativa' | 'mestre'>('chat')
  const [painel, setPainel] = useState(true)
  const [pings, setPings] = useState<Ping[]>([])
  const [cursores, setCursores] = useState<CursorRemoto[]>([])
  const [online, setOnline] = useState<string[]>([])
  const [tempoReal, setTempoReal] = useState(false)
  const [tokenAberto, setTokenAberto] = useState<string | null>(null)
  const [som, setSom] = useState(true)
  const [historico, setHistorico] = useState(false)
  const canal = useRef<RealtimeChannel | null>(null)
  const dados = useRef<Dados3DHandle>(null)
  const ultimoEvento = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const carregar = useCallback(async () => {
    try {
      const novo = await api<Estado>('mesa/' + campanhaId)
      // Anima rolagens novas de outras pessoas (as minhas já animaram ao rolar).
      const ult = novo.eventos.at(-1)
      if (ultimoEvento.current && ult && ult.id > ultimoEvento.current && ult.tipo === 'rolagem' && ult.autor_id !== novo.eu && ult.expressao && ult.resultados) dados.current?.animar(ult.expressao, ult.resultados)
      if (ult) ultimoEvento.current = ult.id
      setE(novo)
      setErro('')
    } catch (er) { setErro(msg(er)) }
  }, [campanhaId])
  const recarregarEmBreve = useCallback(() => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => void carregar(), 150) }, [carregar])

  useEffect(() => { void carregar() }, [carregar])
  // Atualização: tempo real (Supabase Realtime, só como aviso) + consulta periódica de segurança.
  useEffect(() => {
    const t = setInterval(() => void carregar(), tempoReal ? 30000 : 4000)
    return () => clearInterval(t)
  }, [carregar, tempoReal])
  useEffect(() => {
    if (!e?.eu || canal.current) return
    let supa: ReturnType<typeof createClient>
    try { supa = createClient() } catch { return }
    const ch = supa.channel('prg-mesa-' + campanhaId, { config: { broadcast: { self: false }, presence: { key: e.eu } } })
    ch.on('broadcast', { event: 'mudou' }, () => recarregarEmBreve())
      .on('broadcast', { event: 'ping' }, ({ payload }) => {
        const p = payload as Ping; setPings(x => [...x, p]); setTimeout(() => setPings(x => x.filter(y => y.id !== p.id)), 2500)
      })
      .on('broadcast', { event: 'cursor' }, ({ payload }) => {
        const c = payload as CursorRemoto; setCursores(x => [...x.filter(y => y.id !== c.id), c])
      })
      .on('presence', { event: 'sync' }, () => setOnline(Object.keys(ch.presenceState())))
      .subscribe(status => { setTempoReal(status === 'SUBSCRIBED'); if (status === 'SUBSCRIBED') void ch.track({ em: Date.now() }) })
    canal.current = ch
    return () => { void supa.removeChannel(ch); canal.current = null }
  }, [e?.eu, campanhaId, recarregarEmBreve])

  const avisar = () => void canal.current?.send({ type: 'broadcast', event: 'mudou', payload: {} })
  const acao = useCallback(async (body: Record<string, unknown>, silencioso = false) => {
    try { const r = await api<Record<string, unknown>>('mesa/' + campanhaId, { method: 'POST', body }); avisar(); await carregar(); return r }
    catch (er) { if (!silencioso) toast.error(msg(er)); throw er }
  }, [campanhaId, carregar])

  const nomes = useMemo(() => Object.fromEntries((e?.membros ?? []).map(m => [m.aventureiro_id, m.aventureiro?.apelido ?? '?'])), [e?.membros])
  if (!e) return <main className="flex min-h-screen items-center justify-center bg-[#0d0c19] text-[#d6c8e8]">{erro || 'Abrindo a mesa...'}{erro && <Link href="/central" className="ml-3 underline">Voltar</Link>}</main>

  const admin = e.campanha.meuPapel !== 'jogador'
  const cena = e.cenaAtiva
  const campanhaAdapt = cena ? { fog_ativo: cena.fog_ativo, fog_revelado: cena.fog_revelado, grid_cols: cena.grid_cols, grid_rows: cena.grid_rows, mapa_url: cena.mapa_url } as unknown as Campanha : null
  const personagensAdapt = e.tokens.map(t => ({ id: t.id, nome: t.nome, cor: t.cor, token_url: t.imagem_url, pos_x: t.x, pos_y: t.y, hp_atual: t.hp_atual ?? 0, hp_max: t.hp_max ?? 0, condicoes: t.condicoes, is_npc: t.npc || !t.visivel, player_id: t.dono_id ?? '', visivel: t.visivel }) as unknown as Personagem)
  const token = e.tokens.find(t => t.id === tokenAberto)
  const vez = e.mesa?.iniciativa?.[e.mesa.turno]

  async function moverToken(id: string, x: number, y: number) {
    setE(s => s && { ...s, tokens: s.tokens.map(t => t.id === id ? { ...t, x, y } : t) })
    await acao({ acao: 'token_mover', tokenId: id, x, y }).catch(() => {})
  }

  const ferramentas: { id: ModoMapa; icone: typeof Hand; nome: string; so?: boolean }[] = [
    { id: 'mover', icone: Hand, nome: 'Mover' }, { id: 'regua', icone: Ruler, nome: 'Régua' }, { id: 'ping', icone: MapPin, nome: 'Marcar' },
    { id: 'desenhar', icone: Pencil, nome: 'Desenhar' }, { id: 'revelar', icone: Eye, nome: 'Revelar', so: true }, { id: 'esconder', icone: CloudFog, nome: 'Esconder', so: true },
  ]

  return <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#0d0c19] text-[#f4f0ff]">
    <Dados3D ref={dados} somAtivo={som} />
    <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#373251] bg-[#19172c] px-3 py-2">
      <Link href="/central" className="inline-flex items-center gap-1 text-sm text-[#b99bff] hover:underline"><ArrowLeft size={16} /> Início</Link>
      <h1 className="min-w-0 flex-1 truncate font-bold">🗺️ {e.campanha.nome}{cena ? ' · ' + cena.nome : ''}</h1>
      {vez && <span className="hidden rounded-full bg-[#34294f] px-3 py-1 text-xs sm:inline">⚔️ Vez de <strong>{vez.nome}</strong> · rodada {e.mesa.rodada}</span>}
      <span title={tempoReal ? 'Tempo real ligado' : 'Atualizando a cada 4 s'} className={'h-2.5 w-2.5 rounded-full ' + (tempoReal ? 'bg-emerald-400' : 'bg-amber-400')} />
      <span className="text-xs text-[#b4aeca]">{online.length || 1} online</span>
      <button type="button" onClick={() => setSom(!som)} aria-label={som ? 'Desligar som' : 'Ligar som'} className="rounded-lg p-1.5 hover:bg-[#34294f]">{som ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
      <button type="button" onClick={() => setPainel(!painel)} className={btn}>{painel ? 'Só o mapa' : 'Painel'}</button>
    </header>

    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <section className="relative min-h-[45vh] flex-1 overflow-hidden">
        <div className="absolute bottom-2 left-2 z-20 flex max-w-[calc(100%-1rem)] flex-wrap gap-1 rounded-xl border border-[#373251] bg-[#19172c]/95 p-1">
          {ferramentas.filter(f => !f.so || (admin && cena?.fog_ativo)).map(f => <button key={f.id} type="button" title={f.nome} aria-label={f.nome} aria-pressed={modo === f.id} onClick={() => setModo(f.id)}
            className={'rounded-lg p-2 ' + (modo === f.id ? 'bg-[#7654bb]' : 'hover:bg-[#34294f]')}><f.icone size={18} /></button>)}
          {modo === 'desenhar' && <>{CORES.map(c => <button key={c} type="button" aria-label={'Cor ' + c} onClick={() => setCor(c)} className={'h-8 w-8 rounded-lg border-2 ' + (cor === c ? 'border-white' : 'border-transparent')} style={{ background: c }} />)}
            {admin && cena && <button type="button" title="Apagar desenhos" aria-label="Apagar desenhos" onClick={() => acao({ acao: 'desenhos_limpar', cenaId: cena.id })} className="rounded-lg p-2 hover:bg-[#34294f]"><Eraser size={18} /></button>}</>}
        </div>
        {cena && campanhaAdapt ? <MapaGrid campanha={campanhaAdapt} personagens={personagensAdapt} desenhos={e.desenhos.map(d => ({ ...d }) as never)} cursores={cursores} souMestre={admin} meuId={e.eu}
          modo={modo} corDesenho={cor} pings={pings}
          onMoverToken={moverToken}
          onPintarFog={(celulas, revelar) => void acao({ acao: 'nevoa', cenaId: cena.id, celulas, revelar })}
          onPing={(x, y) => { const p = { id: crypto.randomUUID(), x, y, autor: nomes[e.eu] ?? '' }; setPings(s => [...s, p]); setTimeout(() => setPings(s => s.filter(q => q.id !== p.id)), 2500); void canal.current?.send({ type: 'broadcast', event: 'ping', payload: p }) }}
          onTokenClick={p => setTokenAberto(p.id)}
          onDesenhar={pontos => void acao({ acao: 'desenho', cenaId: cena.id, cor, pontos })}
          onCursor={(x, y) => void canal.current?.send({ type: 'broadcast', event: 'cursor', payload: { id: e.eu, nome: nomes[e.eu] ?? '', x, y } })} />
          : <div className="flex h-full items-center justify-center p-6 text-center text-[#b4aeca]">{admin ? 'Crie uma cena na aba "Mestre" para começar.' : 'O mestre ainda não abriu nenhuma cena.'}</div>}
      </section>

      {painel && <aside className="flex max-h-[55vh] min-h-0 w-full flex-col border-t border-[#373251] bg-[#14121f] lg:max-h-none lg:w-[380px] lg:border-l lg:border-t-0">
        <nav className="flex shrink-0 border-b border-[#373251]" aria-label="Painel da mesa">
          {([['chat', MessageSquare, 'Chat e dados'], ['iniciativa', Swords, 'Iniciativa'], ...(admin ? [['mestre', Settings2, 'Mestre']] : [])] as [typeof aba, typeof Hand, string][]).map(([id, I, n]) =>
            <button key={id} type="button" onClick={() => setAba(id)} aria-current={aba === id ? 'page' : undefined} className={'flex flex-1 items-center justify-center gap-1 px-2 py-2.5 text-sm ' + (aba === id ? 'border-b-2 border-[#b99bff] text-white' : 'text-[#b4aeca]')}><I size={16} /> {n}</button>)}
        </nav>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {aba === 'chat' && <Chat e={e} nomes={nomes} admin={admin} acao={acao} dados={dados} abrirHistorico={() => setHistorico(true)} />}
          {aba === 'iniciativa' && <PainelIniciativa e={e} admin={admin} acao={acao} />}
          {aba === 'mestre' && admin && <PainelMestre e={e} acao={acao} campanhaId={campanhaId} />}
        </div>
      </aside>}
    </div>

    {token && <TokenModal t={token} admin={admin} eu={e.eu} acao={acao} fechar={() => setTokenAberto(null)} />}
    {historico && <Historico campanhaId={campanhaId} membros={e.membros} fechar={() => setHistorico(false)} />}
  </div>
}

function Chat({ e, nomes, admin, acao, dados, abrirHistorico }: { e: Estado; nomes: Record<string, string>; admin: boolean; acao: (b: Record<string, unknown>) => Promise<Record<string, unknown>>; dados: React.RefObject<Dados3DHandle | null>; abrirHistorico: () => void }) {
  const [texto, setTexto] = useState('')
  const [expr, setExpr] = useState('1d20')
  const [vis, setVis] = useState<'publica' | 'mestre' | 'privada'>('publica')
  const [dest, setDest] = useState('')
  const [pers, setPers] = useState('')
  const fim = useRef<HTMLDivElement>(null)
  useEffect(() => { fim.current?.scrollIntoView({ block: 'end' }) }, [e.eventos.length])
  const meus = e.fichas.filter(f => f.dono_id === e.eu || (admin && f.npc))
  async function rolar(x: string) {
    const r = await acao({ acao: 'evento', tipo: 'rolagem', expressao: x, visibilidade: vis, destinatarioId: dest, personagem: pers }).catch(() => null)
    const ev = r?.evento as Evento | undefined
    if (ev?.expressao && ev.resultados) dados.current?.animar(ev.expressao, ev.resultados)
  }
  async function enviar() {
    if (!texto.trim()) return
    if (/^\/r(oll)?\s+/i.test(texto)) { await rolar(texto.replace(/^\/r(oll)?\s+/i, '')); setTexto(''); return }
    await acao({ acao: 'evento', tipo: 'chat', texto, visibilidade: vis, destinatarioId: dest, personagem: pers }).then(() => setTexto('')).catch(() => {})
  }
  return <div className="flex min-h-full flex-col gap-3">
    <div className="flex items-center justify-between"><p className="text-xs text-[#b4aeca]">Os dados são rolados no servidor.</p>
      <button type="button" onClick={abrirHistorico} className={btn}><History size={14} /> Histórico</button></div>
    <ul className="space-y-2 text-sm">{e.eventos.map(ev => <li key={ev.id} className={'rounded-lg p-2 ' + (ev.visibilidade === 'publica' ? 'bg-[#1e1a30]' : 'border border-[#7a5a9a] bg-[#261c38]')}>
      <p className="text-[11px] text-[#b4aeca]">{hora(ev.criado_em)} · <strong className="text-[#e4d3ff]">{ev.personagem || ev.autor?.apelido || '?'}</strong>{ev.personagem && ev.autor ? ` (${ev.autor.apelido})` : ''}
        {ev.visibilidade === 'mestre' && ' · 🔒 só o mestre'}{ev.visibilidade === 'privada' && ` · 🔒 privado para ${nomes[ev.destinatario_id ?? ''] ?? '?'}`}</p>
      {ev.tipo === 'rolagem' ? <p><span className="text-[#b99bff]">🎲 {ev.expressao}</span> → [{ev.resultados?.join(', ')}] = <strong className="text-lg text-[#ed9cd8]">{ev.total}</strong>
        {ev.expressao?.includes('d20') && ev.resultados?.[0] === 20 && ' ✨ 20 natural!'}{ev.expressao?.includes('d20') && ev.resultados?.[0] === 1 && ' 💀 1 natural'}{ev.texto && <span className="block text-xs text-[#c4b6d4]">{ev.texto}</span>}</p>
        : <p className="whitespace-pre-wrap break-words">{ev.texto}</p>}
    </li>)}<div ref={fim} /></ul>
    {e.eventos.length === 0 && <p className="text-center text-sm text-[#b4aeca]">Nada por aqui ainda. Role um dado!</p>}
    <div className="mt-auto space-y-2 border-t border-[#373251] pt-3">
      <div className="grid grid-cols-2 gap-2">
        <select aria-label="Quem vê" value={vis} onChange={x => setVis(x.target.value as typeof vis)} className={input}>
          <option value="publica">👀 Todos veem</option><option value="mestre">🔒 Só o mestre</option><option value="privada">✉️ Privado para…</option></select>
        {vis === 'privada' ? <select aria-label="Destinatário" value={dest} onChange={x => setDest(x.target.value)} className={input}><option value="">Escolha…</option>
          {e.membros.filter(m => m.aventureiro_id !== e.eu).map(m => <option key={m.aventureiro_id} value={m.aventureiro_id}>{m.aventureiro?.apelido}{m.papel !== 'jogador' ? ' (mestre)' : ''}</option>)}</select>
          : <select aria-label="Personagem" value={pers} onChange={x => setPers(x.target.value)} className={input}><option value="">Como eu mesmo</option>{meus.map(f => <option key={f.id} value={f.nome || 'Personagem'}>{f.nome || 'Personagem sem nome'}</option>)}</select>}
      </div>
      <div className="flex flex-wrap gap-1">{DADOS.map(d => <button key={d} type="button" onClick={() => rolar(d)} className={btn}>{d.slice(1)}</button>)}</div>
      <form onSubmit={x => { x.preventDefault(); void rolar(expr) }} className="flex gap-2">
        <input aria-label="Expressão de dados" value={expr} onChange={x => setExpr(x.target.value)} maxLength={80} placeholder="2d6+3, 4d6kh3, 2d20kh1" className={input} />
        <button type="submit" className="rounded-lg bg-[#7654bb] px-3 text-sm font-semibold"><Dices size={18} /></button>
      </form>
      <form onSubmit={x => { x.preventDefault(); void enviar() }} className="flex gap-2">
        <input aria-label="Mensagem" value={texto} onChange={x => setTexto(x.target.value)} maxLength={1000} placeholder="Mensagem (ou /r 1d20+2)" className={input} />
        <button type="submit" aria-label="Enviar" className="rounded-lg bg-[#7654bb] px-3"><Send size={18} /></button>
      </form>
    </div>
  </div>
}

function PainelIniciativa({ e, admin, acao }: { e: Estado; admin: boolean; acao: (b: Record<string, unknown>) => Promise<Record<string, unknown>> }) {
  const lista = e.mesa?.iniciativa ?? [], turno = e.mesa?.turno ?? 0, rodada = e.mesa?.rodada ?? 1
  const [nome, setNome] = useState(''), [valor, setValor] = useState('')
  const salvar = (iniciativa: Iniciativa[], t = turno, r = rodada) => acao({ acao: 'iniciativa', iniciativa, turno: t, rodada: r }).catch(() => {})
  const proximo = () => { if (!lista.length) return; const n = turno + 1; void salvar(lista, n >= lista.length ? 0 : n, n >= lista.length ? rodada + 1 : rodada) }
  const anterior = () => { if (!lista.length) return; const n = turno - 1; void salvar(lista, n < 0 ? lista.length - 1 : n, n < 0 ? Math.max(1, rodada - 1) : rodada) }
  return <div className="space-y-3">
    <p className="text-sm">Rodada <strong>{rodada}</strong></p>
    <ol className="space-y-1">{lista.map((x, i) => <li key={x.id} className={'flex items-center gap-2 rounded-lg p-2 text-sm ' + (i === turno ? 'bg-[#5b4380] font-semibold' : 'bg-[#1e1a30]')}>
      <span className="w-8 text-center tabular-nums">{x.valor}</span><span className="flex-1 truncate">{x.nome}</span>{i === turno && '⚔️'}
      {admin && <button type="button" aria-label={'Remover ' + x.nome} onClick={() => salvar(lista.filter(y => y.id !== x.id))} className="rounded p-1 hover:bg-[#4b253a]"><X size={14} /></button>}
    </li>)}</ol>
    {lista.length === 0 && <p className="text-sm text-[#b4aeca]">Ninguém na iniciativa.</p>}
    {admin && <>
      <div className="flex gap-2"><button type="button" onClick={anterior} className={btn}><ChevronLeft size={14} /> Anterior</button><button type="button" onClick={proximo} className={btn}>Próximo <ChevronRight size={14} /></button>
        <button type="button" onClick={() => salvar([], 0, 1)} className={btn + ' ml-auto'}><Trash2 size={14} /> Limpar</button></div>
      <form onSubmit={x => { x.preventDefault(); if (!nome.trim()) return; void salvar([...lista, { id: crypto.randomUUID(), nome, valor: Number(valor) || 0 }]); setNome(''); setValor('') }} className="flex gap-2">
        <input aria-label="Nome" value={nome} onChange={x => setNome(x.target.value)} placeholder="Nome" className={input} />
        <input aria-label="Valor" value={valor} onChange={x => setValor(x.target.value)} inputMode="numeric" placeholder="Valor" className={input + ' w-20'} />
        <button type="submit" aria-label="Adicionar" className={btn}><Plus size={14} /></button></form>
      <button type="button" className={btn} onClick={() => salvar([...lista, ...e.tokens.filter(t => !lista.some(l => l.tokenId === t.id)).map(t => ({ id: crypto.randomUUID(), nome: t.nome, valor: 1 + Math.floor(Math.random() * 20), tokenId: t.id }))])}>
        <Dices size={14} /> Adicionar todos os tokens (rola 1d20)</button>
      <p className="text-xs text-[#b4aeca]">Some o bônus de iniciativa de cada um e ajuste o valor se precisar.</p>
    </>}
  </div>
}

function PainelMestre({ e, acao, campanhaId }: { e: Estado; acao: (b: Record<string, unknown>) => Promise<Record<string, unknown>>; campanhaId: string }) {
  const [nova, setNova] = useState({ nome: '', mapa_url: '', grid_cols: 20, grid_rows: 15 })
  const [enviando, setEnviando] = useState(false)
  const [tk, setTk] = useState({ fichaId: '', nome: '', hp_max: '', cor: '#a78bfa', visivel: true })
  const cena = e.cenaAtiva
  async function upload(arq: File) {
    setEnviando(true)
    try {
      const r = await fetch('/api/prg/mesa/' + campanhaId + '/upload', { method: 'POST', body: arq, headers: { 'Content-Type': arq.type, 'x-prg-aventureiro': e.eu } })
      const d = await r.json(); if (!r.ok) throw new Error(d.erro || 'Falha no envio')
      setNova(n => ({ ...n, mapa_url: d.url })); toast.success('Imagem enviada!')
    } catch (er) { toast.error(er instanceof Error ? er.message : 'Falha no envio') } finally { setEnviando(false) }
  }
  return <div className="space-y-5 text-sm">
    <section className="space-y-2">
      <h3 className="font-semibold">Cenas</h3>
      <ul className="space-y-1">{e.cenas.map(c => <li key={c.id} className={'flex flex-wrap items-center gap-2 rounded-lg p-2 ' + (c.ativa ? 'bg-[#5b4380]' : 'bg-[#1e1a30]')}>
        <span className="flex-1 truncate">{c.nome}{c.ativa && ' · na mesa'}</span>
        {!c.ativa && <button type="button" className={btn} onClick={() => acao({ acao: 'cena_ativar', cenaId: c.id })}>Mostrar</button>}
        <button type="button" aria-label={'Excluir ' + c.nome} className={btn} onClick={() => { if (window.confirm(`Excluir a cena "${c.nome}" e seus tokens?`)) void acao({ acao: 'cena_excluir', cenaId: c.id }) }}><Trash2 size={14} /></button>
      </li>)}</ul>
      {cena && <div className="flex flex-wrap gap-2">
        <button type="button" className={btn} onClick={() => acao({ acao: 'cena_editar', cenaId: cena.id, fog_ativo: !cena.fog_ativo })}><CloudFog size={14} /> {cena.fog_ativo ? 'Desligar névoa' : 'Ligar névoa'}</button>
        {cena.fog_ativo && <button type="button" className={btn} onClick={() => acao({ acao: 'cena_editar', cenaId: cena.id, fog_limpar: true })}>Cobrir tudo de novo</button>}
      </div>}
      <form className="space-y-2 rounded-lg border border-[#373251] p-2" onSubmit={x => { x.preventDefault(); void acao({ acao: 'cena_criar', ...nova }).then(() => setNova({ nome: '', mapa_url: '', grid_cols: 20, grid_rows: 15 })) }}>
        <input required aria-label="Nome da cena" value={nova.nome} onChange={x => setNova({ ...nova, nome: x.target.value })} placeholder="Nova cena (ex.: Saloon)" className={input} />
        <input aria-label="Link da imagem do mapa" value={nova.mapa_url} onChange={x => setNova({ ...nova, mapa_url: x.target.value })} placeholder="https://… (imagem do mapa)" className={input} />
        <label className={btn + ' cursor-pointer'}><ImageIcon size={14} /> {enviando ? 'Enviando…' : 'Enviar imagem do aparelho'}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={x => { const f = x.target.files?.[0]; if (f) void upload(f) }} /></label>
        <div className="flex items-center gap-2"><span>Grade</span><input aria-label="Colunas" type="number" min={5} max={100} value={nova.grid_cols} onChange={x => setNova({ ...nova, grid_cols: Number(x.target.value) })} className={input + ' w-20'} />×
          <input aria-label="Linhas" type="number" min={5} max={100} value={nova.grid_rows} onChange={x => setNova({ ...nova, grid_rows: Number(x.target.value) })} className={input + ' w-20'} /></div>
        <button type="submit" className={btn}><Plus size={14} /> Criar cena</button>
      </form>
    </section>
    {cena && <section className="space-y-2">
      <h3 className="font-semibold">Tokens nesta cena</h3>
      <ul className="space-y-1">{e.tokens.map(t => <li key={t.id} className="flex items-center gap-2 rounded-lg bg-[#1e1a30] p-2">
        <span className="h-4 w-4 shrink-0 rounded-full" style={{ background: t.cor }} /><span className="flex-1 truncate">{t.nome}</span>
        <button type="button" aria-label={t.visivel ? 'Ocultar' : 'Revelar'} className={btn} onClick={() => acao({ acao: 'token_editar', tokenId: t.id, visivel: !t.visivel })}>{t.visivel ? <Eye size={14} /> : <EyeOff size={14} />}</button>
        <button type="button" aria-label={'Remover ' + t.nome} className={btn} onClick={() => acao({ acao: 'token_excluir', tokenId: t.id })}><Trash2 size={14} /></button>
      </li>)}</ul>
      <form className="space-y-2 rounded-lg border border-[#373251] p-2" onSubmit={x => { x.preventDefault(); void acao({ acao: 'token_criar', cenaId: cena.id, fichaId: tk.fichaId || undefined, nome: tk.nome || e.fichas.find(f => f.id === tk.fichaId)?.nome, hp_max: tk.hp_max, cor: tk.cor, visivel: tk.visivel, npc: !tk.fichaId || !!e.fichas.find(f => f.id === tk.fichaId)?.npc }).then(() => setTk({ ...tk, fichaId: '', nome: '', hp_max: '' })) }}>
        <select aria-label="Ficha" value={tk.fichaId} onChange={x => setTk({ ...tk, fichaId: x.target.value })} className={input}><option value="">Token avulso (monstro, objeto…)</option>
          {e.fichas.map(f => <option key={f.id} value={f.id}>{f.npc ? 'NPC: ' : ''}{f.nome || 'sem nome'}</option>)}</select>
        <input aria-label="Nome do token" value={tk.nome} onChange={x => setTk({ ...tk, nome: x.target.value })} placeholder={tk.fichaId ? 'Nome (usa o da ficha)' : 'Nome'} className={input} />
        <div className="flex items-center gap-2"><input aria-label="PV máximo" value={tk.hp_max} onChange={x => setTk({ ...tk, hp_max: x.target.value })} inputMode="numeric" placeholder="PV" className={input + ' w-20'} />
          <input aria-label="Cor" type="color" value={tk.cor} onChange={x => setTk({ ...tk, cor: x.target.value })} className="h-9 w-12 rounded" />
          <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!tk.visivel} onChange={x => setTk({ ...tk, visivel: !x.target.checked })} /> Escondido</label></div>
        <button type="submit" className={btn}><Plus size={14} /> Colocar na mesa</button>
      </form>
      <p className="text-xs text-[#b4aeca]">Tokens ligados à ficha de um jogador podem ser movidos por ele.</p>
    </section>}
  </div>
}

function TokenModal({ t, admin, eu, acao, fechar }: { t: Token; admin: boolean; eu: string; acao: (b: Record<string, unknown>) => Promise<Record<string, unknown>>; fechar: () => void }) {
  const pode = admin || t.dono_id === eu
  const [dano, setDano] = useState('')
  const hp = t.hp_atual ?? 0
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center" role="dialog" aria-modal="true" aria-label={'Token ' + t.nome} onClick={fechar}>
    <div className="w-full max-w-sm rounded-2xl border border-[#62527e] bg-[#19172c] p-4" onClick={x => x.stopPropagation()}>
      <div className="flex items-center gap-2"><span className="h-5 w-5 rounded-full" style={{ background: t.cor }} /><h2 className="flex-1 font-bold">{t.nome}</h2>
        <button type="button" onClick={fechar} aria-label="Fechar" className="rounded p-1 hover:bg-[#34294f]"><X size={18} /></button></div>
      {t.hp_max ? <div className="mt-3"><p className="text-sm">PV <strong>{hp} / {t.hp_max}</strong></p>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#2b2140]"><div className="h-full bg-[#b06ad8]" style={{ width: Math.max(0, Math.min(100, hp / t.hp_max * 100)) + '%' }} /></div>
        {pode && <div className="mt-2 flex gap-2"><input aria-label="Quantidade" value={dano} onChange={x => setDano(x.target.value)} inputMode="numeric" placeholder="Qtd." className={input + ' w-20'} />
          <button type="button" className={btn} onClick={() => { void acao({ acao: 'token_editar', tokenId: t.id, hp_atual: hp - (Number(dano) || 0) }); setDano('') }}>− Dano</button>
          <button type="button" className={btn} onClick={() => { void acao({ acao: 'token_editar', tokenId: t.id, hp_atual: Math.min(t.hp_max ?? hp, hp + (Number(dano) || 0)) }); setDano('') }}>+ Cura</button></div>}
      </div> : null}
      <p className="mt-3 text-sm font-semibold">Condições</p>
      <div className="mt-1 flex flex-wrap gap-1">{condicoesDisponiveis.map(c => { const ativa = t.condicoes.includes(c.id)
        return <button key={c.id} type="button" disabled={!pode} onClick={() => acao({ acao: 'token_editar', tokenId: t.id, condicoes: ativa ? t.condicoes.filter(x => x !== c.id) : [...t.condicoes, c.id] })}
          className={'rounded-full border px-2 py-1 text-xs ' + (ativa ? 'border-[#b99bff] bg-[#5b4380]' : 'border-[#5e4b78]')}>{c.emoji} {c.nome}</button> })}</div>
      {!pode && <p className="mt-3 flex items-center gap-1 text-xs text-[#b4aeca]"><Lock size={12} /> Só o mestre ou o dono deste token altera.</p>}
      {t.condicoes.length > 0 && <p className="mt-2 text-xs">{t.condicoes.map(c => emojiCondicao[c]).join(' ')}</p>}
    </div>
  </div>
}

function Historico({ campanhaId, membros, fechar }: { campanhaId: string; membros: Estado['membros']; fechar: () => void }) {
  const [f, setF] = useState({ autor: '', tipo: 'rolagem', personagem: '' })
  const [lista, setLista] = useState<Evento[] | null>(null)
  const buscar = useCallback(async (antes?: number) => {
    const p = new URLSearchParams({ historico: '1', ...(f.autor && { autor: f.autor }), ...(f.tipo && { tipo: f.tipo }), ...(f.personagem && { personagem: f.personagem }), ...(antes && { antes: String(antes) }) })
    try { const r = await api<{ eventos: Evento[] }>(`mesa/${campanhaId}?${p}`); setLista(l => antes ? [...(l ?? []), ...r.eventos] : r.eventos) } catch (er) { toast.error(msg(er)) }
  }, [campanhaId, f])
  useEffect(() => { void buscar() }, [buscar])
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center" role="dialog" aria-modal="true" aria-label="Histórico de rolagens">
    <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-[#62527e] bg-[#19172c] p-4">
      <div className="flex items-center justify-between"><h2 className="font-bold">📜 Histórico da campanha</h2><button type="button" onClick={fechar} aria-label="Fechar" className="rounded p-1 hover:bg-[#34294f]"><X size={18} /></button></div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <select aria-label="Jogador" value={f.autor} onChange={x => setF({ ...f, autor: x.target.value })} className={input}><option value="">Todos</option>{membros.map(m => <option key={m.aventureiro_id} value={m.aventureiro_id}>{m.aventureiro?.apelido}</option>)}</select>
        <select aria-label="Tipo" value={f.tipo} onChange={x => setF({ ...f, tipo: x.target.value })} className={input}><option value="rolagem">Rolagens</option><option value="chat">Mensagens</option><option value="">Tudo</option></select>
        <input aria-label="Personagem" value={f.personagem} onChange={x => setF({ ...f, personagem: x.target.value })} placeholder="Personagem" className={input} />
      </div>
      <ul className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto text-sm">{lista?.map(ev => <li key={ev.id} className="rounded-lg bg-[#1e1a30] p-2">
        <span className="text-[11px] text-[#b4aeca]">{new Date(ev.criado_em).toLocaleString('pt-BR')} · {ev.personagem || ev.autor?.apelido}{ev.visibilidade !== 'publica' && ' · 🔒'}</span><br />
        {ev.tipo === 'rolagem' ? <>🎲 {ev.expressao} → [{ev.resultados?.join(', ')}] = <strong>{ev.total}</strong></> : ev.texto}</li>)}
        {lista?.length === 0 && <li className="text-[#b4aeca]">Nada encontrado.</li>}</ul>
      {lista && lista.length >= 100 && <button type="button" className={btn + ' mt-2 justify-center'} onClick={() => buscar(lista.at(-1)?.id)}>Carregar mais</button>}
    </div>
  </div>
}
