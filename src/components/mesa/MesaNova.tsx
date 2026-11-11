'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ArrowDown, ArrowLeft, ArrowUp, BookOpen, ScrollText, ChevronLeft, ChevronRight, CloudFog, Dices, Eraser, Eye, EyeOff, Hand, History, Image as ImageIcon, Layers, Lock, LockOpen, MapPin, MessageSquare, Music2, Pencil, Plus, Ruler, Send, Settings2, Square, Swords, Trash2, UserRound, Volume2, VolumeX, X } from 'lucide-react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { api, ErroNuvem } from '@/lib/nuvem/cliente'
import { estiloPapel, PAPEL_ESTILO } from './papeis'
import { condicoesDisponiveis, emojiCondicao, nomeCondicao } from '@/lib/condicoes'
import type { Camada } from '@/lib/nuvem/mesa'
import { podeMoverToken } from '@/lib/nuvem/mesa'
import MapaMesa, { type CursorRemoto, type ModoMesa, type Ping, type TokenMapa } from './MapaMesa'
import RolagemCentral, { type RolagemCentralHandle } from '@/components/dados/RolagemCentral'
import PainelCampanha from './PainelCampanha'
import PainelMusica from './PainelMusica'
import PainelTabelas from './PainelTabelas'
import Sino from '@/components/Sino'
import TocadorMesa from './TocadorMesa'
import type { EstadoMusica } from '@/lib/nuvem/musica'
import RecorteImagem from './RecorteImagem'
import { btn, input, msg } from './estilos'
import { CartaoAtaque, ConfigCombate, JanelaAtaque, PainelFichas, PainelMorte, PrepararCombate, chaveFonte, useFichasMesa, type DadosAtaque, type EstadoAtaque, type FichaMesa, type Morte } from './Combate'

type Cena = { id: string; nome: string; mapa_url: string | null; grid_cols: number; grid_rows: number; fog_ativo: boolean; fog_revelado: string[]; ativa: boolean; camadas: Camada[]; tokens_travados: boolean }
type Token = { id: string; nome: string; cor: string; imagem_url: string | null; x: number; y: number; visivel: boolean; npc: boolean; hp_atual: number | null; hp_max: number | null; condicoes: string[]; condicoes_rodadas?: Record<string, number> | null; condicoes_dano?: Record<string, string> | null; morte?: Morte | null; dono_id: string | null; ficha_id: string | null; movimento: 'dono' | 'todos' | 'mestre'; tamanho: number }
export type Evento = { id: number; tipo: 'chat' | 'rolagem' | 'sistema' | 'ataque'; dados?: DadosAtaque | null; visibilidade: 'publica' | 'mestre' | 'privada'; autor_id: string | null; destinatario_id: string | null; personagem: string | null; texto: string | null; expressao: string | null; resultados: number[] | null; total: number | null; criado_em: string; autor: { apelido: string } | null }
type Iniciativa = { id: string; nome: string; valor: number; tokenId?: string | null }
export type Estado = {
  campanha: { id: string; nome: string; sistema?: string; meuPapel: string }; mesa: { iniciativa: Iniciativa[]; turno: number; rodada: number }
  cenas: Cena[]; cenaAtiva: Cena | null; tokens: Token[]; desenhos: { id: string; cor: string; pontos: number[] }[]; eventos: Evento[]
  membros: { aventureiro_id: string; papel: string; aventureiro: { apelido: string } | null }[]; fichas: { id: string; nome: string; dono_id: string; npc: boolean }[]; eu: string
  musica?: EstadoMusica; agora?: string; sessao?: { aberta: boolean; aberta_em: string | null }; combate?: { acerto: 'automatico' | 'mestre'; morte?: 'desligado' | 'testes' | 'desesperadas' }
}
export type Acao = (b: Record<string, unknown>) => Promise<Record<string, unknown>>

const CORES = ['#fbbf24', '#38bdf8', '#4ade80', '#f87171', '#c084fc', '#f1f5f9']
const DADOS = ['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '1d100']
const MOVIMENTO = { dono: 'O dono move', todos: 'Todos movem', mestre: 'Só o mestre move' }
const hora = (d: string) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

/** Envia uma imagem do aparelho e devolve o link público + proporção (altura/largura). */
async function enviarImagem(campanhaId: string, eu: string, arq: File): Promise<{ url: string; ar: number }> {
  if (arq.size > 5 * 1024 * 1024) throw new Error('Imagem maior que 5 MB.')
  const ar = await new Promise<number>(res => { const img = new Image(); img.onload = () => res(img.naturalHeight / img.naturalWidth || 1); img.onerror = () => res(1); img.src = URL.createObjectURL(arq) })
  const r = await fetch('/api/prg/mesa/' + campanhaId + '/upload', { method: 'POST', body: arq, headers: { 'Content-Type': arq.type, 'x-prg-aventureiro': eu } })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(d.erro || 'Falha no envio')
  return { url: d.url, ar }
}

type Pendente = { ate: number }
/** Copia o objeto mantendo só as entradas aprovadas por `manter`. */
function limpar<T>(m: Record<string, T>, manter: (id: string, v: T) => boolean): Record<string, T> {
  const r: Record<string, T> = {}; let mudou = false
  for (const [k, v] of Object.entries(m)) { if (manter(k, v)) r[k] = v; else mudou = true }
  return mudou ? r : m
}

export default function MesaNova({ campanhaId }: { campanhaId: string }) {
  const [e, setE] = useState<Estado | null>(null)
  const [erro, setErro] = useState('')
  const [modo, setModo] = useState<ModoMesa>('mover')
  const [cor, setCor] = useState(CORES[0])
  const [pincel, setPincel] = useState(1)
  const [aba, setAba] = useState<'chat' | 'fichas' | 'tokens' | 'iniciativa' | 'musica' | 'campanha' | 'tabelas' | 'mestre'>('chat')
  const [painel, setPainel] = useState(true)
  const [pings, setPings] = useState<Ping[]>([])
  const [cursores, setCursores] = useState<CursorRemoto[]>([])
  const [online, setOnline] = useState<string[]>([])
  const [tempoReal, setTempoReal] = useState(false)
  const [tokenAberto, setTokenAberto] = useState<string | null>(null)
  const [ataque, setAtaque] = useState<EstadoAtaque | null>(null)
  const [avisoSessao, setAvisoSessao] = useState(true)
  const [camadaSel, setCamadaSel] = useState<string | null>(null)
  const [som, setSom] = useState(true)
  const [historico, setHistorico] = useState(false)
  const [desvio, setDesvio] = useState(0)
  const [fechada, setFechada] = useState(false)
  // Mudanças que aparecem na hora (antes do servidor confirmar): posições de tokens e traços de desenho.
  const [posicoes, setPosicoes] = useState<Record<string, Pendente & { x: number; y: number }>>({})
  const [tracos, setTracos] = useState<Record<string, Pendente & { id: string; cor: string; pontos: number[] }>>({})
  const ultimoEnvio = useRef<Record<string, number>>({})
  const canal = useRef<RealtimeChannel | null>(null)
  const dados = useRef<RolagemCentralHandle>(null)
  const ultimoEvento = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** Mostra a rolagem no meio da tela: dados 3D + cartão com o total e cada dado. */
  const destacar = useCallback((ev: Evento) => {
    if (!ev.expressao || !ev.resultados) return
    const a = ev.tipo === 'ataque' ? ev.dados : null
    dados.current?.mostrar({ rotulo: a ? `⚔️ ${a.arma} → ${a.alvo.nome}` : ev.texto, quem: ev.personagem || ev.autor?.apelido, expressao: ev.expressao, resultados: ev.resultados, total: ev.total ?? 0,
      privada: ev.visibilidade !== 'publica', nota: a ? (a.acerto ? `✅ Acertou!${a.comparar === 'maior_igual' ? ` (Defesa ${a.defesa})` : ''}` : `❌ Errou${a.comparar === 'maior_igual' ? ` (Defesa ${a.defesa})` : ''}`) : null })
    // Acertou: depois do cartão do ataque, rola o dano no meio da tela.
    if (a?.acerto && a.dano) setTimeout(() => dados.current?.mostrar({ rotulo: `💥 Dano em ${a.alvo.nome}`, quem: ev.personagem, expressao: a.dano!.expressao, resultados: a.dano!.resultados, total: a.dano!.total,
      nota: a.status === 'pendente' ? '⏳ O mestre vai confirmar' : a.vida?.depois !== null && a.vida?.depois !== undefined ? `❤️ ${a.alvo.nome}: ${a.vida.depois}${a.vida.max ? '/' + a.vida.max : ''}` : null }), 5200)
  }, [])

  const carregar = useCallback(async () => {
    try {
      const novo = await api<Estado>('mesa/' + campanhaId)
      const novos = novo.eventos.filter(x => x.id > ultimoEvento.current)
      const ult = novo.eventos.at(-1)
      // Destaca rolagens novas de outras pessoas (as minhas já foram destacadas ao rolar).
      const rol = [...novos].reverse().find(x => (x.tipo === 'rolagem' || x.tipo === 'ataque') && x.autor_id !== novo.eu)
      if (ultimoEvento.current && rol) destacar(rol)
      if (ult) ultimoEvento.current = Math.max(ultimoEvento.current, ult.id)
      if (novo.agora) setDesvio(Date.parse(novo.agora) - Date.now())
      setE(novo); setErro(''); setFechada(false)
      // O que o servidor já confirmou deixa de ser "pendente" (e o que ficou velho demais também).
      const agora = Date.now()
      setPosicoes(m => limpar(m, (id, v) => v.ate > agora && !novo.tokens.some(t => t.id === id && t.x === v.x && t.y === v.y)))
      setTracos(m => limpar(m, (id, v) => v.ate > agora && !novo.desenhos.some(d => d.id === id)))
    } catch (er) {
      // Sessão fechada pelo mestre: ninguém (além do mestre) fica na mesa.
      if (er instanceof ErroNuvem && er.status === 423) { setFechada(true); setE(null); ultimoEvento.current = 0; return }
      setErro(msg(er))
    }
  }, [campanhaId, destacar])
  const recarregarEmBreve = useCallback(() => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => void carregar(), 150) }, [carregar])

  useEffect(() => { void carregar() }, [carregar])
  useEffect(() => { const t = setInterval(() => void carregar(), tempoReal ? 30000 : 4000); return () => clearInterval(t) }, [carregar, tempoReal])
  useEffect(() => {
    if (!e?.eu || canal.current) return
    let supa: ReturnType<typeof createClient>
    try { supa = createClient() } catch { return }
    const ch = supa.channel('prg-mesa-' + campanhaId, { config: { broadcast: { self: false }, presence: { key: e.eu } } })
    ch.on('broadcast', { event: 'mudou' }, () => recarregarEmBreve())
      .on('broadcast', { event: 'ping' }, ({ payload }) => { const p = payload as Ping; setPings(x => [...x, p]); setTimeout(() => setPings(x => x.filter(y => y.id !== p.id)), 2500) })
      .on('broadcast', { event: 'cursor' }, ({ payload }) => { const c = payload as CursorRemoto; setCursores(x => [...x.filter(y => y.id !== c.id), c]) })
      // Ao vivo: token sendo arrastado/solto e traço sendo desenhado por outra pessoa.
      .on('broadcast', { event: 'token' }, ({ payload }) => {
        const t = payload as { id?: unknown; x?: unknown; y?: unknown }
        if (typeof t.id === 'string' && Number.isInteger(t.x) && Number.isInteger(t.y)) setPosicoes(m => ({ ...m, [t.id as string]: { x: t.x as number, y: t.y as number, ate: Date.now() + 6000 } }))
      })
      .on('broadcast', { event: 'traco' }, ({ payload }) => {
        const d = payload as { id?: unknown; cor?: unknown; pontos?: unknown }
        if (typeof d.id === 'string' && typeof d.cor === 'string' && Array.isArray(d.pontos) && d.pontos.length <= 2000 && d.pontos.every(n => typeof n === 'number'))
          setTracos(m => ({ ...m, [d.id as string]: { id: d.id as string, cor: d.cor as string, pontos: d.pontos as number[], ate: Date.now() + 10000 } }))
      })
      .on('broadcast', { event: 'limpar' }, () => setTracos({}))
      .on('presence', { event: 'sync' }, () => setOnline(Object.keys(ch.presenceState())))
      .subscribe(status => { setTempoReal(status === 'SUBSCRIBED'); if (status === 'SUBSCRIBED') void ch.track({ em: Date.now() }) })
    canal.current = ch
    return () => { void supa.removeChannel(ch); canal.current = null }
  }, [e?.eu, campanhaId, recarregarEmBreve])

  const acao: Acao = useCallback(async (body) => {
    try {
      const r = await api<Record<string, unknown>>('mesa/' + campanhaId, { method: 'POST', body })
      void canal.current?.send({ type: 'broadcast', event: 'mudou', payload: {} }); await carregar(); return r
    } catch (er) { toast.error(msg(er)); throw er }
  }, [campanhaId, carregar])

  /** Avisa os outros que algo mudou (ex.: música) e recarrega. */
  const avisarMudanca = useCallback(() => { void canal.current?.send({ type: 'broadcast', event: 'mudou', payload: {} }); void carregar() }, [carregar])

  /** Envia algo ao vivo para os outros, no máximo uma vez a cada `ms` por chave (o canal tem limite de mensagens). */
  const aoVivo = useCallback((chave: string, ms: number, evento: string, payload: Record<string, unknown>, forcar = false) => {
    const agora = Date.now()
    if (!forcar && agora - (ultimoEnvio.current[chave] ?? 0) < ms) return
    ultimoEnvio.current[chave] = agora
    void canal.current?.send({ type: 'broadcast', event: evento, payload })
  }, [])

  const desenhosMapa = useMemo(() => {
    if (!e) return []
    const extras = Object.values(tracos).filter(t => !e.desenhos.some(d => d.id === t.id)).map(({ id, cor, pontos }) => ({ id, cor, pontos }))
    return extras.length ? [...e.desenhos, ...extras] : e.desenhos
  }, [e, tracos])

  // Fichas da campanha (aba Fichas e ataques): recarrega quando a mesa muda de tokens/eventos.
  const { fichas: fichasMesa, carregar: carregarFichas } = useFichasMesa(campanhaId, e ? `${e.tokens.length}:${e.eventos.at(-1)?.id ?? 0}` : 0)

  // Quando chega a vez de um token meu, avisa (uma vez por turno).
  const avisoVez = useRef('')
  useEffect(() => {
    const v = e?.mesa?.iniciativa?.[e.mesa.turno]
    const chave = v ? `${v.id}:${e?.mesa?.rodada}` : ''
    if (!v?.tokenId || chave === avisoVez.current) return
    avisoVez.current = chave
    const t = e?.tokens.find(x => x.id === v.tokenId)
    if (t && t.dono_id === e?.eu && e?.campanha.meuPapel !== 'espectador') toast(`⚔️ É a sua vez, ${t.nome}!`, { description: 'Mova o token e use “Sua vez: atacar”.' })
  }, [e])

  const nomes = useMemo(() => Object.fromEntries((e?.membros ?? []).map(m => [m.aventureiro_id, m.aventureiro?.apelido ?? '?'])), [e?.membros])
  if (!e && fechada) return <main className="fundo-tema flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center text-[#e8dff7]">
    <p className="text-5xl" aria-hidden="true">🌙</p>
    <h1 className="text-2xl font-bold">A sessão está fechada</h1>
    <p className="max-w-sm text-[#cfc0df]">Só o mestre pode abrir a mesa. Deixe esta página aberta: assim que a sessão começar, você entra sozinho.</p>
    <Link href="/central" className="rounded-xl border border-[#8d70b6] px-4 py-2 text-[#e4d3ff]">← Voltar ao início</Link>
  </main>
  if (!e) return <main className="flex min-h-screen items-center justify-center bg-[#0d0c19] text-[#d6c8e8]">{erro || 'Abrindo a mesa...'}{erro && <Link href="/central" className="ml-3 underline">Voltar</Link>}</main>

  const admin = e.campanha.meuPapel === 'mestre' || e.campanha.meuPapel === 'comestre'
  const espectador = e.campanha.meuPapel === 'espectador'
  const papelDe: Record<string, string> = Object.fromEntries(e.membros.map(m => [m.aventureiro_id, m.papel]))
  const sessaoAberta = !!e.sessao?.aberta
  const cena = e.cenaAtiva
  const travada = !!cena?.tokens_travados
  const tokensMapa: TokenMapa[] = e.tokens.map(t => ({ ...t, ...(posicoes[t.id] ? { x: posicoes[t.id].x, y: posicoes[t.id].y } : {}), tamanho: t.tamanho ?? 1, rodadas: t.condicoes_rodadas ?? {}, morte: t.morte ?? null, meu: t.dono_id === e.eu, podeMover: !espectador && podeMoverToken({ movimento: t.movimento ?? 'dono', dono_id: t.dono_id }, e.eu, admin, travada) }))
  const token = e.tokens.find(t => t.id === tokenAberto)
  const fichaDoToken = (tokenId: string) => { const fid = e.tokens.find(t => t.id === tokenId)?.ficha_id; return fid ? fichasMesa?.find(f => f.id === fid) ?? null : null }
  /** Abre a janela de ataque já com a melhor arma/poder e o teste sugerido da ficha. */
  function iniciarAtaque(tokenId: string) {
    const c = fichaDoToken(tokenId)?.combate
    setAtaque({ atacante: tokenId, fonte: c?.ataques[0] ? chaveFonte(c.ataques[0]) : 'livre', teste: c?.testePadrao ?? '', dano: '', bonus: '', defesa: '', alvo: null, mirando: false })
  }
  const vez = e.mesa?.iniciativa?.[e.mesa.turno]
  const minhaVez = !espectador && vez?.tokenId ? e.tokens.find(t => t.id === vez.tokenId && t.dono_id === e.eu) ?? null : null
  const salvarCamadas = (camadas: Camada[]) => cena && acao({ acao: 'cena_editar', cenaId: cena.id, camadas }).catch(() => {})

  /** Solta o token: aparece na hora para mim e para os outros; o servidor confirma em seguida. */
  async function moverToken(id: string, x: number, y: number) {
    setPosicoes(m => ({ ...m, [id]: { x, y, ate: Date.now() + 8000 } }))
    aoVivo('token:' + id, 0, 'token', { id, x, y }, true)
    await acao({ acao: 'token_mover', tokenId: id, x, y }).catch(() => setPosicoes(m => limpar(m, k => k !== id)))
  }
  function desenhar(pontos: number[], id: string) {
    if (!cena) return
    setTracos(m => ({ ...m, [id]: { id, cor, pontos, ate: Date.now() + 15000 } }))
    aoVivo('traco:' + id, 0, 'traco', { id, cor, pontos }, true)
    void acao({ acao: 'desenho', cenaId: cena.id, id, cor, pontos }).catch(() => setTracos(m => limpar(m, k => k !== id)))
  }
  const ferramentas: { id: ModoMesa; icone: typeof Hand; nome: string; so?: boolean; fog?: boolean }[] = [
    { id: 'mover', icone: Hand, nome: 'Mover / arrastar' }, { id: 'regua', icone: Ruler, nome: 'Régua' }, { id: 'ping', icone: MapPin, nome: 'Marcar' }, { id: 'desenhar', icone: Pencil, nome: 'Desenhar' },
    { id: 'revelar', icone: Eye, nome: 'Revelar com pincel', so: true, fog: true }, { id: 'esconder', icone: CloudFog, nome: 'Esconder com pincel', so: true, fog: true },
    { id: 'area-revelar', icone: Square, nome: 'Revelar área (arraste um retângulo)', so: true, fog: true }, { id: 'area-esconder', icone: EyeOff, nome: 'Esconder área', so: true, fog: true },
    { id: 'editar-mapa', icone: Layers, nome: 'Montar mapa (mover/redimensionar imagens)', so: true },
  ]
  const abas = (espectador ? [['chat', MessageSquare, 'Chat'], ['iniciativa', Swords, 'Iniciativa'], ['musica', Music2, 'Música']]
    : [['chat', MessageSquare, 'Chat'], ['fichas', ScrollText, 'Fichas'], ['tokens', UserRound, 'Tokens'], ['iniciativa', Swords, 'Iniciativa'], ['musica', Music2, 'Música'], ['campanha', BookOpen, 'Diário'], ...(admin ? [['tabelas', Dices, 'Tabelas'], ['mestre', Settings2, 'Mestre']] : [])]) as [typeof aba, typeof Hand, string][]
  async function alternarSessao() {
    if (sessaoAberta && !confirm('Encerrar a sessão? Os jogadores e espectadores saem da mesa e a música para.')) return
    await acao({ acao: 'sessao', aberta: !sessaoAberta }).catch(() => {})
    toast.success(sessaoAberta ? 'Sessão encerrada.' : 'Sessão aberta! O grupo já pode entrar.')
  }

  return <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#0d0c19] text-[#f4f0ff]">
    <RolagemCentral ref={dados} som={som} />
    <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#373251] bg-[#19172c] px-3 py-2">
      <Link href="/central" className="inline-flex items-center gap-1 text-sm text-[#b99bff] hover:underline"><ArrowLeft size={16} /> Início</Link>
      <h1 className="min-w-0 flex-1 truncate font-bold">🗺️ {e.campanha.nome}{cena ? ' · ' + cena.nome : ''}</h1>
      {vez && <span className="hidden rounded-full bg-[#34294f] px-3 py-1 text-xs sm:inline">⚔️ Vez de <strong>{vez.nome}</strong> · rodada {e.mesa.rodada}</span>}
      {minhaVez && <button type="button" onClick={() => iniciarAtaque(minhaVez.id)} className="prg-sua-vez rounded-full bg-gradient-to-r from-[#b91c1c] to-[#7c3aed] px-3 py-1 text-xs font-bold">⚔️ Sua vez: atacar</button>}
      {travada && <span className="rounded-full bg-[#4b253a] px-2 py-1 text-xs" title="O mestre travou os tokens">🔒 Tokens travados</span>}
      {espectador && <span className="rounded-full bg-[#1f3a2c] px-2 py-1 text-xs text-emerald-200" title="Você está assistindo">👁️ Espectador</span>}
      {admin && <button type="button" onClick={() => void alternarSessao()} className={'rounded-full px-3 py-1 text-xs font-semibold ' + (sessaoAberta ? 'bg-[#4b253a] text-red-100 hover:bg-[#5e2d48]' : 'bg-emerald-700 text-white hover:bg-emerald-600')}>
        {sessaoAberta ? '⏹ Encerrar sessão' : '▶ Abrir sessão'}</button>}
      <Sino />
      <span title={tempoReal ? 'Tempo real ligado' : 'Atualizando a cada 4 s'} className={'h-2.5 w-2.5 rounded-full ' + (tempoReal ? 'bg-emerald-400' : 'bg-amber-400')} />
      <span className="text-xs text-[#b4aeca]">{online.length || 1} online</span>
      <button type="button" onClick={() => setSom(!som)} aria-label={som ? 'Desligar som' : 'Ligar som'} className="rounded-lg p-1.5 hover:bg-[#34294f]">{som ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
      <Link href={'/mundo?campanha=' + campanhaId} className={btn} title="Mapa do mundo, lugares, personagens e relações">🌍 Mundo</Link>
      <button type="button" onClick={() => setPainel(!painel)} className={btn}>{painel ? 'Só o mapa' : 'Painel'}</button>
    </header>

    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <section className="relative min-h-[45vh] flex-1 overflow-hidden">
        {admin && !sessaoAberta && !ataque && avisoSessao && <p role="status" className="pointer-events-none absolute inset-x-2 top-2 z-30 mx-auto flex max-w-md items-center gap-2 rounded-xl border border-amber-500/50 bg-[#2b2310]/85 p-2 text-xs text-amber-100"><span className="flex-1 text-center">🌙 Sessão fechada: só você vê a mesa. Toque em “▶ Abrir sessão” quando o grupo for jogar.</span><button type="button" aria-label="Esconder aviso" onClick={() => setAvisoSessao(false)} className="pointer-events-auto rounded p-1 hover:bg-white/10"><X size={14} /></button></p>}
        {!espectador && <div className="absolute bottom-2 left-2 z-20 flex max-w-[calc(100%-1rem)] flex-wrap items-center gap-1 rounded-xl border border-[#373251] bg-[#19172c]/95 p-1">
          {ferramentas.filter(f => !f.so || admin).filter(f => !f.fog || cena?.fog_ativo).map(f => <button key={f.id} type="button" title={f.nome} aria-label={f.nome} aria-pressed={modo === f.id} onClick={() => setModo(f.id)}
            className={'rounded-lg p-2 ' + (modo === f.id ? 'bg-[#7654bb]' : 'hover:bg-[#34294f]')}><f.icone size={18} /></button>)}
          {(modo === 'revelar' || modo === 'esconder') && [1, 3, 5].map(n => <button key={n} type="button" onClick={() => setPincel(n)} aria-label={'Pincel ' + n + '×' + n} className={'rounded-lg px-2 py-1.5 text-xs ' + (pincel === n ? 'bg-[#7654bb]' : 'hover:bg-[#34294f]')}>{n}×{n}</button>)}
          {modo === 'desenhar' && <>{CORES.map(c => <button key={c} type="button" aria-label={'Cor ' + c} onClick={() => setCor(c)} className={'h-8 w-8 rounded-lg border-2 ' + (cor === c ? 'border-white' : 'border-transparent')} style={{ background: c }} />)}
            {admin && cena && <button type="button" title="Apagar desenhos" aria-label="Apagar desenhos" onClick={() => { setTracos({}); aoVivo('limpar', 0, 'limpar', {}, true); void acao({ acao: 'desenhos_limpar', cenaId: cena.id }).catch(() => {}) }} className="rounded-lg p-2 hover:bg-[#34294f]"><Eraser size={18} /></button>}</>}
          {modo === 'editar-mapa' && camadaSel && cena && <>
            <button type="button" className={btn} onClick={() => { const l = cena.camadas; const i = l.findIndex(c => c.id === camadaSel); if (i < l.length - 1) { const n = [...l]; [n[i], n[i + 1]] = [n[i + 1], n[i]]; void salvarCamadas(n) } }}><ArrowUp size={14} /> Frente</button>
            <button type="button" className={btn} onClick={() => { const l = cena.camadas; const i = l.findIndex(c => c.id === camadaSel); if (i > 0) { const n = [...l]; [n[i], n[i - 1]] = [n[i - 1], n[i]]; void salvarCamadas(n) } }}><ArrowDown size={14} /> Trás</button>
            <button type="button" className={btn} onClick={() => { void salvarCamadas(cena.camadas.filter(c => c.id !== camadaSel)); setCamadaSel(null) }}><Trash2 size={14} /> Remover</button></>}
        </div>}
        {modo === 'editar-mapa' && <p className="absolute left-2 top-2 z-20 rounded-lg bg-[#19172c]/95 px-3 py-1.5 text-xs">Arraste as imagens para montar o mapa. Toque numa imagem e puxe a bolinha para mudar o tamanho.</p>}
        {cena ? <MapaMesa cols={cena.grid_cols} rows={cena.grid_rows} fundo={cena.mapa_url} camadas={cena.camadas ?? []} fogAtivo={cena.fog_ativo} fogRevelado={cena.fog_revelado}
          tokens={tokensMapa} desenhos={desenhosMapa} cursores={cursores} pings={pings} admin={admin} modo={modo} cor={cor} pincel={pincel}
          camadaSel={camadaSel} onSelecionarCamada={setCamadaSel}
          onAlterarCamada={c => { setE(s => s && s.cenaAtiva ? { ...s, cenaAtiva: { ...s.cenaAtiva, camadas: s.cenaAtiva.camadas.map(x => x.id === c.id ? c : x) } } : s); void salvarCamadas(cena.camadas.map(x => x.id === c.id ? c : x)) }}
          onMoverToken={moverToken}
          onNevoa={(celulas, revelar) => void acao({ acao: 'nevoa', cenaId: cena.id, celulas, revelar }).catch(() => {})}
          onPing={(x, y) => { const p = { id: crypto.randomUUID(), x, y, autor: nomes[e.eu] ?? '' }; setPings(s => [...s, p]); setTimeout(() => setPings(s => s.filter(q => q.id !== p.id)), 2500); void canal.current?.send({ type: 'broadcast', event: 'ping', payload: p }) }}
          onTokenClick={espectador ? () => {} : id => { if (ataque?.mirando) { if (id !== ataque.atacante) setAtaque({ ...ataque, alvo: id, mirando: false }) } else setTokenAberto(id) }}
          vez={vez?.tokenId ?? null}
          mirando={!!ataque?.mirando}
          alcance={ataque ? { tokenId: ataque.atacante, metros: fichaDoToken(ataque.atacante)?.combate?.ataques.find(a => chaveFonte(a) === ataque.fonte)?.alcance ?? null, alvo: ataque.alvo } : null}
          onDesenhar={desenhar}
          onArrastando={(id, x, y) => aoVivo('token:' + id, 60, 'token', { id, x, y })}
          onTracando={(id, pontos) => aoVivo('traco:' + id, 120, 'traco', { id, cor, pontos })}
          onCursor={(x, y) => aoVivo('cursor', 90, 'cursor', { id: e.eu, nome: nomes[e.eu] ?? '', x, y })} />
          : <div className="flex h-full items-center justify-center p-6 text-center text-[#b4aeca]">{admin ? 'Crie uma cena na aba "Mestre" para começar.' : 'O mestre ainda não abriu nenhuma cena.'}</div>}

        {ataque && <JanelaAtaque estado={ataque} mudar={setAtaque} tokens={e.tokens} ficha={fichaDoToken(ataque.atacante)} admin={admin} acao={acao}
          fechar={() => setAtaque(null)} aoAtacar={ev => destacar(ev as unknown as Evento)} />}
        <TocadorMesa estado={e.musica} desvio={desvio} aoTerminar={admin && e.musica?.por === e.eu ? () => { void api(`campanhas/${campanhaId}/musica`, { method: 'POST', body: { acao: 'proxima', auto: true } }).then(avisarMudanca).catch(() => {}) } : undefined} />

      </section>

      {painel && <aside className="flex max-h-[55vh] min-h-0 w-full flex-col border-t border-[#373251] bg-[#14121f] lg:max-h-none lg:w-[390px] lg:border-l lg:border-t-0">
        <nav className="flex shrink-0 overflow-x-auto border-b border-[#373251]" aria-label="Painel da mesa">
          {abas.map(([id, I, n]) => <button key={id} type="button" onClick={() => setAba(id)} aria-current={aba === id ? 'page' : undefined} className={'flex flex-1 items-center justify-center gap-1 whitespace-nowrap px-2 py-2.5 text-xs sm:text-sm ' + (aba === id ? 'border-b-2 border-[#b99bff] text-white' : 'text-[#b4aeca]')}><I size={15} /> {n}</button>)}
        </nav>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {aba === 'chat' && <Chat e={e} nomes={nomes} papelDe={papelDe} admin={admin} espectador={espectador} acao={acao} destacar={destacar} abrirHistorico={() => setHistorico(true)} />}
          {aba === 'fichas' && <PainelFichas fichas={fichasMesa} carregar={() => void carregarFichas()} tokens={e.tokens} admin={admin} cenaId={cena?.id ?? null} acao={acao} atacarCom={iniciarAtaque} />}
          {aba === 'tokens' && <PainelTokens e={e} admin={admin} acao={acao} campanhaId={campanhaId} abrir={setTokenAberto} />}
          {aba === 'iniciativa' && <PainelIniciativa e={e} admin={admin} acao={acao} fichas={fichasMesa} atacar={iniciarAtaque} />}
          {aba === 'musica' && <PainelMusica campanhaId={campanhaId} eu={e.eu} admin={admin} espectador={espectador} tocando={e.musica} aoMudar={avisarMudanca} />}
          {aba === 'campanha' && <PainelCampanha campanhaId={campanhaId} e={e} admin={admin} />}
          {aba === 'tabelas' && admin && <PainelTabelas campanhaId={campanhaId} acao={acao} />}
          {aba === 'mestre' && admin && <><ConfigCombate acerto={e.combate?.acerto ?? 'mestre'} morte={e.combate?.morte ?? 'testes'} acao={acao} /><div className="h-3" /><PainelMestre e={e} acao={acao} campanhaId={campanhaId} setModo={setModo} /></>}
        </div>
      </aside>}
    </div>

    {token && <TokenModal t={token} admin={admin} eu={e.eu} acao={acao} campanhaId={campanhaId} regraMorte={e.combate?.morte ?? 'testes'} fechar={() => setTokenAberto(null)}
      atacar={!espectador && (admin || token.dono_id === e.eu) ? () => { setTokenAberto(null); iniciarAtaque(token.id) } : undefined} />}
    {historico && <Historico campanhaId={campanhaId} membros={e.membros} fechar={() => setHistorico(false)} />}
  </div>
}

function PainelMestre({ e, acao, campanhaId, setModo }: { e: Estado; acao: Acao; campanhaId: string; setModo: (m: ModoMesa) => void }) {
  const [nova, setNova] = useState({ nome: '', mapa_url: '', grid_cols: 20, grid_rows: 15, enviado: false })
  const [enviando, setEnviando] = useState('')
  const cena = e.cenaAtiva
  const [tam, setTam] = useState({ c: cena?.grid_cols ?? 20, r: cena?.grid_rows ?? 15 })
  const [recortar, setRecortar] = useState<Camada | null>(null)
  useEffect(() => { if (cena) setTam({ c: cena.grid_cols, r: cena.grid_rows }) }, [cena?.id, cena?.grid_cols, cena?.grid_rows])
  const camadas = cena?.camadas ?? []
  const salvar = (novas: Camada[]) => cena ? acao({ acao: 'cena_editar', cenaId: cena.id, camadas: novas }).catch(() => ({})) : Promise.resolve({})

  async function fundoNovaCena(arq: File) {
    setEnviando('nova')
    try { const { url, ar } = await enviarImagem(campanhaId, e.eu, arq); setNova(n => ({ ...n, mapa_url: url, enviado: true, grid_rows: Math.max(5, Math.min(100, Math.round(n.grid_cols * ar))) })); toast.success('Mapa enviado! Depois de criar a cena, use ✂️ Recortar para escolher a parte da imagem.') }
    catch (er) { toast.error(msg(er)) } finally { setEnviando('') }
  }
  async function adicionarCamadas(arqs: FileList) {
    if (!cena) return
    setEnviando('camada')
    try {
      const novas: Camada[] = []
      for (const arq of [...arqs].slice(0, 10)) {
        const { url, ar } = await enviarImagem(campanhaId, e.eu, arq)
        const w = Math.min(cena.grid_cols, 10), h = Math.max(1, Math.round(w * ar))
        novas.push({ id: crypto.randomUUID(), url, x: 0, y: 0, w, h })
      }
      await salvar([...camadas, ...novas])
      setModo('editar-mapa'); toast.success(`${novas.length} imagem(ns) adicionada(s). Arraste para montar o mapa.`)
    } catch (er) { toast.error(msg(er)) } finally { setEnviando('') }
  }
  function criarCena(x: React.FormEvent) {
    x.preventDefault()
    // Imagem enviada vira uma camada que ocupa o mapa todo (assim dá para recortar depois).
    const corpo = nova.enviado
      ? { acao: 'cena_criar', nome: nova.nome, grid_cols: nova.grid_cols, grid_rows: nova.grid_rows, camadas: [{ id: crypto.randomUUID(), url: nova.mapa_url, x: 0, y: 0, w: nova.grid_cols, h: nova.grid_rows }] }
      : { acao: 'cena_criar', nome: nova.nome, grid_cols: nova.grid_cols, grid_rows: nova.grid_rows, mapa_url: nova.mapa_url }
    void acao(corpo).then(() => setNova({ nome: '', mapa_url: '', grid_cols: 20, grid_rows: 15, enviado: false })).catch(() => {})
  }
  const PRESETS: [string, number, number][] = [['Pequeno', 15, 10], ['Médio', 25, 18], ['Grande', 40, 28], ['Enorme', 60, 40]]

  return <div className="space-y-5 text-sm">
    {cena && <section className="space-y-2">
      <h3 className="font-semibold">📐 Tamanho do mapa</h3>
      <div className="flex flex-wrap gap-1">{PRESETS.map(([n, c, r]) => <button key={n} type="button" onClick={() => setTam({ c, r })} className={btn + (tam.c === c && tam.r === r ? ' bg-[#5b4380]' : '')}>{n} {c}×{r}</button>)}</div>
      <div className="flex flex-wrap items-center gap-2">
        <input aria-label="Colunas do mapa" type="number" min={5} max={100} value={tam.c} onChange={x => setTam({ ...tam, c: Number(x.target.value) })} className={input + ' w-20'} />×
        <input aria-label="Linhas do mapa" type="number" min={5} max={100} value={tam.r} onChange={x => setTam({ ...tam, r: Number(x.target.value) })} className={input + ' w-20'} />
        <span className="text-xs text-[#b4aeca]">≈ {Math.round(tam.c * 1.5)} × {Math.round(tam.r * 1.5)} m</span>
        <button type="button" className={btn} disabled={tam.c === cena.grid_cols && tam.r === cena.grid_rows} onClick={() => acao({ acao: 'cena_editar', cenaId: cena.id, grid_cols: tam.c, grid_rows: tam.r }).catch(() => {})}>Aplicar</button>
      </div>
      <p className="text-xs text-[#b4aeca]">Cada quadrado vale 1,5 m. Diminuir o mapa não apaga tokens; eles ficam na borda.</p>
    </section>}

    {cena && <section className="space-y-2">
      <h3 className="font-semibold">🖼️ Imagens do mapa</h3>
      {cena.mapa_url && <div className="rounded-lg border border-[#5e4b78] p-2 text-xs">Esta cena usa um fundo antigo (não recortável).
        <button type="button" className={btn + ' ml-2'} onClick={() => acao({ acao: 'cena_editar', cenaId: cena.id, mapa_url: null, camadas: [{ id: crypto.randomUUID(), url: cena.mapa_url, x: 0, y: 0, w: cena.grid_cols, h: cena.grid_rows }, ...camadas] }).catch(() => {})}>Tornar editável</button></div>}
      <ul className="space-y-1">{camadas.map((c, i) => <li key={c.id} className="flex items-center gap-2 rounded-lg bg-[#1e1a30] p-2">
        <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded bg-[#100f20]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.url} alt="" className="absolute max-w-none" style={{ width: 100 / (c.cw ?? 1) + '%', height: 100 / (c.ch ?? 1) + '%', left: -((c.cx ?? 0) / (c.cw ?? 1)) * 100 + '%', top: -((c.cy ?? 0) / (c.ch ?? 1)) * 100 + '%' }} /></span>
        <span className="flex-1 text-xs text-[#c4b6d4]">Imagem {i + 1} · {c.w}×{c.h}{c.cw ? ' · recortada' : ''}</span>
        <button type="button" className={btn} onClick={() => setRecortar(c)} title="Escolher a parte da imagem">✂️</button>
        <button type="button" className={btn} title="Ocupar o mapa inteiro" onClick={() => salvar(camadas.map(x => x.id === c.id ? { ...x, x: 0, y: 0, w: cena.grid_cols, h: cena.grid_rows } : x))}>⛶</button>
        <button type="button" className={btn} aria-label="Remover imagem" onClick={() => salvar(camadas.filter(x => x.id !== c.id))}><Trash2 size={14} /></button>
      </li>)}</ul>
      <label className={btn + ' cursor-pointer'}><ImageIcon size={14} /> {enviando === 'camada' ? 'Enviando…' : 'Adicionar imagens (várias)'}
        <input type="file" multiple accept="image/png,image/jpeg,image/webp" className="hidden" onChange={x => { if (x.target.files?.length) void adicionarCamadas(x.target.files); x.target.value = '' }} /></label>
      <p className="text-xs text-[#b4aeca]">✂️ escolhe a parte da imagem · ⛶ estica a imagem no mapa todo · <Layers size={12} className="inline" /> “Montar mapa” (no canto do mapa) arrasta e redimensiona.</p>
    </section>}

    {cena && <section className="space-y-2">
      <h3 className="font-semibold">👁️ O que os jogadores veem</h3>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn} onClick={() => acao({ acao: 'cena_editar', cenaId: cena.id, fog_ativo: !cena.fog_ativo })}><CloudFog size={14} /> {cena.fog_ativo ? 'Desligar névoa' : 'Ligar névoa'}</button>
        {cena.fog_ativo && <>
          <button type="button" className={btn} onClick={() => acao({ acao: 'cena_editar', cenaId: cena.id, nevoa_tudo: true })}><Eye size={14} /> Revelar tudo</button>
          <button type="button" className={btn} onClick={() => acao({ acao: 'cena_editar', cenaId: cena.id, fog_limpar: true })}><EyeOff size={14} /> Esconder tudo</button></>}
      </div>
      {cena.fog_ativo && <p className="text-xs text-[#b4aeca]">No canto do mapa: <Eye size={12} className="inline" /> pincel (1×1, 3×3, 5×5) ou <Square size={12} className="inline" /> arraste um retângulo para revelar uma área inteira.</p>}
      <button type="button" className={btn} onClick={() => acao({ acao: 'cena_editar', cenaId: cena.id, tokens_travados: !cena.tokens_travados })}>{cena.tokens_travados ? <><LockOpen size={14} /> Destravar tokens dos jogadores</> : <><Lock size={14} /> Travar tokens dos jogadores</>}</button>
    </section>}

    <section className="space-y-2">
      <h3 className="font-semibold">🎬 Cenas</h3>
      <ul className="space-y-1">{e.cenas.map(c => <li key={c.id} className={'flex flex-wrap items-center gap-2 rounded-lg p-2 ' + (c.ativa ? 'bg-[#5b4380]' : 'bg-[#1e1a30]')}>
        <span className="flex-1 truncate">{c.nome}{c.ativa && ' · na mesa'}</span>
        {!c.ativa && <button type="button" className={btn} onClick={() => acao({ acao: 'cena_ativar', cenaId: c.id })}>Mostrar</button>}
        <button type="button" aria-label={'Excluir ' + c.nome} className={btn} onClick={() => { if (window.confirm(`Excluir a cena "${c.nome}" e seus tokens?`)) void acao({ acao: 'cena_excluir', cenaId: c.id }) }}><Trash2 size={14} /></button>
      </li>)}</ul>
      <form className="space-y-2 rounded-lg border border-[#373251] p-2" onSubmit={criarCena}>
        <input required aria-label="Nome da cena" value={nova.nome} onChange={x => setNova({ ...nova, nome: x.target.value })} placeholder="Nova cena (ex.: Saloon)" className={input} />
        <label className={btn + ' cursor-pointer'}><ImageIcon size={14} /> {enviando === 'nova' ? 'Enviando…' : nova.enviado ? 'Mapa escolhido ✓ (trocar)' : 'Mapa do aparelho (opcional)'}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={x => { const f = x.target.files?.[0]; if (f) void fundoNovaCena(f); x.target.value = '' }} /></label>
        {!nova.enviado && <input aria-label="Link da imagem do mapa" value={nova.mapa_url} onChange={x => setNova({ ...nova, mapa_url: x.target.value })} placeholder="ou cole um link https://…" className={input} />}
        <div className="flex items-center gap-2"><span>Tamanho</span><input aria-label="Colunas" type="number" min={5} max={100} value={nova.grid_cols} onChange={x => setNova({ ...nova, grid_cols: Number(x.target.value) })} className={input + ' w-20'} />×
          <input aria-label="Linhas" type="number" min={5} max={100} value={nova.grid_rows} onChange={x => setNova({ ...nova, grid_rows: Number(x.target.value) })} className={input + ' w-20'} /></div>
        <button type="submit" className={btn}><Plus size={14} /> Criar cena</button>
      </form>
    </section>

    {recortar && cena && <RecorteImagem url={recortar.url} inicial={recortar} onCancelar={() => setRecortar(null)} onSalvar={(r, arImg) => {
      // Mantém a largura no mapa e ajusta a altura à proporção da parte escolhida.
      const h = Math.max(1, Math.round(recortar.w * (r.ch * arImg) / r.cw))
      const inteira = r.cx === 0 && r.cy === 0 && r.cw === 1 && r.ch === 1
      void salvar(camadas.map(x => x.id === recortar.id ? { id: x.id, url: x.url, x: x.x, y: x.y, w: x.w, h, ...(inteira ? {} : r) } : x))
      setRecortar(null)
    }} />}
  </div>
}

function PainelTokens({ e, admin, acao, campanhaId, abrir }: { e: Estado; admin: boolean; acao: Acao; campanhaId: string; abrir: (id: string) => void }) {
  const cena = e.cenaAtiva
  const [tk, setTk] = useState({ fichaId: '', nome: '', hp_max: '', cor: '#a78bfa', visivel: true, movimento: 'dono', tamanho: 1, imagem_url: '' })
  const [enviando, setEnviando] = useState(false)
  if (!cena) return <p className="text-sm text-[#b4aeca]">Nenhuma cena aberta ainda.</p>
  const meus = e.tokens.filter(t => t.dono_id === e.eu)
  const lista = admin ? e.tokens : e.tokens.filter(t => t.visivel)
  const minhasFichas = e.fichas.filter(f => admin || f.dono_id === e.eu)
  async function foto(arq: File) {
    setEnviando(true)
    try { const { url } = await enviarImagem(campanhaId, e.eu, arq); setTk(t => ({ ...t, imagem_url: url })); toast.success('Imagem pronta!') } catch (er) { toast.error(msg(er)) } finally { setEnviando(false) }
  }
  return <div className="space-y-4 text-sm">
    <ul className="space-y-1">{lista.map(t => <li key={t.id}>
      <button type="button" onClick={() => abrir(t.id)} className="flex w-full items-center gap-2 rounded-lg bg-[#1e1a30] p-2 text-left hover:bg-[#2b2140]">
        <span className="h-6 w-6 shrink-0 rounded-full bg-cover bg-center" style={{ background: t.imagem_url ? `center/cover url(${t.imagem_url})` : t.cor }} />
        <span className="flex-1 truncate">{t.nome}{t.dono_id === e.eu && ' (meu)'}</span>
        <span className="text-[11px] text-[#b4aeca]">{t.movimento === 'mestre' ? '🔒' : t.movimento === 'todos' ? '👥' : ''}{!t.visivel && ' 🙈'}{t.hp_max ? ` ${t.hp_atual}/${t.hp_max}` : ''}</span>
      </button></li>)}</ul>
    {lista.length === 0 && <p className="text-[#b4aeca]">Nenhum token nesta cena.</p>}
    <form className="space-y-2 rounded-lg border border-[#373251] p-2" onSubmit={x => {
      x.preventDefault()
      const ficha = e.fichas.find(f => f.id === tk.fichaId)
      void acao({ acao: 'token_criar', cenaId: cena.id, fichaId: tk.fichaId || undefined, nome: tk.nome || ficha?.nome || (admin ? '' : e.membros.find(m => m.aventureiro_id === e.eu)?.aventureiro?.apelido), hp_max: tk.hp_max, cor: tk.cor,
        visivel: tk.visivel, npc: admin && (!tk.fichaId || !!ficha?.npc), movimento: tk.movimento, tamanho: tk.tamanho, imagem_url: tk.imagem_url || undefined })
        .then(() => setTk({ ...tk, fichaId: '', nome: '', hp_max: '', imagem_url: '' })).catch(() => {})
    }}>
      <p className="font-semibold">{admin ? 'Colocar token na mesa' : meus.length ? 'Adicionar outro token meu' : 'Colocar meu personagem na mesa'}</p>
      {minhasFichas.length > 0 && <select aria-label="Ficha" value={tk.fichaId} onChange={x => setTk({ ...tk, fichaId: x.target.value })} className={input}>
        <option value="">{admin ? 'Token avulso (monstro, objeto…)' : 'Sem ficha (só o token)'}</option>
        {minhasFichas.map(f => <option key={f.id} value={f.id}>{f.npc ? 'NPC: ' : ''}{f.nome || 'sem nome'}</option>)}</select>}
      <input aria-label="Nome do token" value={tk.nome} onChange={x => setTk({ ...tk, nome: x.target.value })} placeholder={tk.fichaId ? 'Nome (usa o da ficha)' : 'Nome'} className={input} />
      <div className="flex flex-wrap items-center gap-2">
        <input aria-label="PV máximo" value={tk.hp_max} onChange={x => setTk({ ...tk, hp_max: x.target.value })} inputMode="numeric" placeholder="PV" className={input + ' w-20'} />
        <input aria-label="Cor" type="color" value={tk.cor} onChange={x => setTk({ ...tk, cor: x.target.value })} className="h-9 w-12 rounded" />
        <label className={btn + ' cursor-pointer'}><ImageIcon size={14} /> {enviando ? 'Enviando…' : tk.imagem_url ? 'Imagem ✓' : 'Imagem'}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={x => { const f = x.target.files?.[0]; if (f) void foto(f); x.target.value = '' }} /></label>
      </div>
      {admin && <div className="grid grid-cols-2 gap-2">
        <select aria-label="Quem move" value={tk.movimento} onChange={x => setTk({ ...tk, movimento: x.target.value })} className={input}>{Object.entries(MOVIMENTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select aria-label="Tamanho" value={tk.tamanho} onChange={x => setTk({ ...tk, tamanho: Number(x.target.value) })} className={input}><option value={1}>Tamanho 1×1</option><option value={2}>Grande 2×2</option><option value={3}>Enorme 3×3</option><option value={4}>Colossal 4×4</option></select>
        <label className="col-span-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={!tk.visivel} onChange={x => setTk({ ...tk, visivel: !x.target.checked })} /> Escondido dos jogadores</label>
      </div>}
      <button type="submit" className={btn}><Plus size={14} /> Colocar na mesa</button>
      {!admin && <p className="text-xs text-[#b4aeca]">Até 3 tokens seus por cena. O mestre pode travar o movimento.</p>}
    </form>
  </div>
}

function TokenModal({ t, admin, eu, acao, campanhaId, fechar, atacar, regraMorte }: { t: Token; admin: boolean; eu: string; acao: Acao; campanhaId: string; fechar: () => void; atacar?: () => void; regraMorte: 'desligado' | 'testes' | 'desesperadas' }) {
  const pode = admin || t.dono_id === eu
  const [dano, setDano] = useState('')
  const hp = t.hp_atual ?? 0
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center" role="dialog" aria-modal="true" aria-label={'Token ' + t.nome} onClick={fechar}>
    <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-[#62527e] bg-[#19172c] p-4" onClick={x => x.stopPropagation()}>
      <div className="flex items-center gap-2"><span className="h-8 w-8 rounded-full" style={{ background: t.imagem_url ? `center/cover url(${t.imagem_url})` : t.cor }} /><h2 className="flex-1 font-bold">{t.nome}</h2>
        <button type="button" onClick={fechar} aria-label="Fechar" className="rounded p-1 hover:bg-[#34294f]"><X size={18} /></button></div>
      {atacar && <button type="button" onClick={atacar} className="mt-3 w-full rounded-xl bg-gradient-to-r from-[#b91c1c] to-[#7c3aed] p-2.5 font-bold shadow-[0_0_14px_#b91c1c55]">⚔️ Atacar</button>}
      {t.ficha_id && <p className="mt-2 text-[11px] text-[#a99bbb]">📜 Ligado a uma ficha: a vida é a da ficha.</p>}
      {t.ficha_id && !t.hp_max && !hp && <p className="mt-2 rounded-lg bg-[#3a2a14]/80 p-2 text-[11px] text-[#f6dca8]">⚠️ A ficha está com a vida zerada e sem máximo. Preencha a vida na ficha para o dano contar.</p>}
      {t.hp_max ? <div className="mt-3"><p className="text-sm">PV <strong>{hp} / {t.hp_max}</strong></p>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#2b2140]"><div className="h-full bg-[#b06ad8]" style={{ width: Math.max(0, Math.min(100, hp / t.hp_max * 100)) + '%' }} /></div>
        {pode && <div className="mt-2 flex gap-2"><input aria-label="Quantidade" value={dano} onChange={x => setDano(x.target.value)} inputMode="numeric" placeholder="Qtd." className={input + ' w-20'} />
          <button type="button" className={btn} onClick={() => { void acao({ acao: 'token_editar', tokenId: t.id, hp_atual: hp - (Number(dano) || 0) }).catch(() => {}); setDano('') }}>− Dano</button>
          <button type="button" className={btn} onClick={() => { void acao({ acao: 'token_editar', tokenId: t.id, hp_atual: Math.min(t.hp_max ?? hp, hp + (Number(dano) || 0)) }).catch(() => {}); setDano('') }}>+ Cura</button></div>}
        {pode && hp < (t.hp_max ?? 0) && <button type="button" className={btn + ' mt-2'} onClick={() => void acao({ acao: 'token_editar', tokenId: t.id, hp_atual: t.hp_max }).catch(() => {})}>❤️ Vida cheia ({t.hp_max})</button>}
      </div> : null}
      {t.hp_max ? <PainelMorte nome={t.nome} m={t.morte ?? {}} regra={regraMorte} admin={admin} pode={pode} vida={t.hp_atual} acao={acao} tokenId={t.id} /> : null}
      <p className="mt-3 text-sm font-semibold">Condições</p>
      <div className="mt-1 flex flex-wrap gap-1">{condicoesDisponiveis.map(c => { const ativa = t.condicoes.includes(c.id)
        return <button key={c.id} type="button" disabled={!pode} aria-pressed={ativa} onClick={() => acao({ acao: 'token_editar', tokenId: t.id, condicoes: ativa ? t.condicoes.filter(x => x !== c.id) : [...t.condicoes, c.id] }).catch(() => {})}
          className={'rounded-full border px-2 py-1 text-xs ' + (ativa ? 'border-[#b99bff] bg-[#5b4380]' : 'border-[#5e4b78]')}>{c.emoji} {c.nome}</button> })}</div>
      {t.condicoes.length > 0 && <div className="mt-2 space-y-1 rounded-lg bg-[#1e1a30] p-2 text-xs">
        <p className="text-[#c4b6d4]">Quanto tempo dura? A contagem desce no fim de cada turno de {t.nome}.</p>
        {t.condicoes.map(c => { const n = t.condicoes_rodadas?.[c] ?? 0
          return <div key={c} className="flex flex-wrap items-center gap-2 border-t border-[#2b2140] pt-1.5 first-of-type:border-0"><span className="min-w-24 flex-1">{emojiCondicao[c]} {nomeCondicao(c)}</span>
            <select aria-label={'Duração de ' + nomeCondicao(c)} disabled={!pode} value={n} onChange={x => acao({ acao: 'token_editar', tokenId: t.id, rodadas: { ...(t.condicoes_rodadas ?? {}), [c]: Number(x.target.value) } }).catch(() => {})} className={input + ' !w-auto !py-1'}>
              <option value={0}>Sem limite</option>{[1, 2, 3, 4, 5, 6, 8, 10].map(k => <option key={k} value={k}>{k} {k === 1 ? 'rodada' : 'rodadas'}</option>)}
            </select>
            <DanoPorTurno key={c + (t.condicoes_dano?.[c] ?? '')} valor={t.condicoes_dano?.[c] ?? ''} nome={nomeCondicao(c)} pode={pode}
              salvar={v => acao({ acao: 'token_editar', tokenId: t.id, danos: { ...(t.condicoes_dano ?? {}), [c]: v } }).catch(() => {})} /></div> })}
        <p className="text-[11px] text-[#a998bd]">💥 Dano por turno: rolado no começo do turno de {t.nome} e tirado da vida dele. Deixe vazio para não causar dano.</p>
      </div>}
      {pode && <label className={btn + ' mt-3 cursor-pointer'}><ImageIcon size={14} /> Trocar imagem do token<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={async x => {
        const f = x.target.files?.[0]; x.target.value = ''; if (!f) return
        try { const { url } = await enviarImagem(campanhaId, eu, f); await acao({ acao: 'token_editar', tokenId: t.id, imagem_url: url }) } catch (er) { toast.error(msg(er)) }
      }} /></label>}
      {admin && <div className="mt-3 space-y-2 border-t border-[#373251] pt-3">
        <p className="text-sm font-semibold">Controle do mestre</p>
        <select aria-label="Quem move este token" value={t.movimento ?? 'dono'} onChange={x => acao({ acao: 'token_editar', tokenId: t.id, movimento: x.target.value }).catch(() => {})} className={input}>{Object.entries(MOVIMENTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select aria-label="Tamanho do token" value={t.tamanho ?? 1} onChange={x => acao({ acao: 'token_editar', tokenId: t.id, tamanho: Number(x.target.value) }).catch(() => {})} className={input}><option value={1}>Tamanho 1×1</option><option value={2}>Grande 2×2</option><option value={3}>Enorme 3×3</option><option value={4}>Colossal 4×4</option></select>
        <div className="flex gap-2"><button type="button" className={btn} onClick={() => acao({ acao: 'token_editar', tokenId: t.id, visivel: !t.visivel }).catch(() => {})}>{t.visivel ? <><EyeOff size={14} /> Esconder</> : <><Eye size={14} /> Mostrar</>}</button>
          <button type="button" className={btn} onClick={() => { void acao({ acao: 'token_excluir', tokenId: t.id }).catch(() => {}); fechar() }}><Trash2 size={14} /> Remover</button></div>
      </div>}
      {!pode && <p className="mt-3 flex items-center gap-1 text-xs text-[#b4aeca]"><Lock size={12} /> Só o mestre ou o dono deste token altera.</p>}
    </div>
  </div>
}

function Chat({ e, nomes, papelDe, admin, espectador, acao, destacar, abrirHistorico }: { e: Estado; nomes: Record<string, string>; papelDe: Record<string, string>; admin: boolean; espectador: boolean; acao: Acao; destacar: (ev: Evento) => void; abrirHistorico: () => void }) {
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
    if (ev?.expressao && ev.resultados) destacar(ev)
  }
  async function enviar() {
    if (!texto.trim()) return
    if (/^\/r(oll)?\s+/i.test(texto)) { await rolar(texto.replace(/^\/r(oll)?\s+/i, '')); setTexto(''); return }
    await acao({ acao: 'evento', tipo: 'chat', texto, visibilidade: vis, destinatarioId: dest, personagem: pers }).then(() => setTexto('')).catch(() => {})
  }
  return <div className="flex min-h-full flex-col gap-3">
    <p className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]" aria-label="Legenda das cores">{(['mestre', 'jogador', 'espectador'] as const).map(p => <span key={p} className={PAPEL_ESTILO[p].cor}>{PAPEL_ESTILO[p].icone} {PAPEL_ESTILO[p].nome}</span>)}</p>
    <div className="flex items-center justify-between"><p className="text-xs text-[#b4aeca]">{espectador ? 'Você está assistindo: pode conversar no chat.' : 'Os dados são rolados no servidor.'}</p>
      <button type="button" onClick={abrirHistorico} className={btn}><History size={14} /> Histórico</button></div>
    <ul className="space-y-2 text-sm">{e.eventos.map(ev => <li key={ev.id} className={'rounded-lg p-2 ' + (ev.visibilidade === 'publica' ? 'bg-[#1e1a30]' : 'border border-[#7a5a9a] bg-[#261c38]')}>
      <p className="text-[11px] text-[#b4aeca]">{hora(ev.criado_em)} · {ev.tipo === 'sistema' ? <strong className="text-[#e4d3ff]">Mesa</strong> : (() => { const st = estiloPapel(papelDe[ev.autor_id ?? '']); return <strong className={st.cor} title={st.nome}>{st.icone} {ev.personagem || ev.autor?.apelido || '?'}</strong> })()}{ev.personagem && ev.autor ? ` (${ev.autor.apelido})` : ''}
        {ev.visibilidade === 'mestre' && ' · 🔒 só o mestre'}{ev.visibilidade === 'privada' && ` · 🔒 privado para ${nomes[ev.destinatario_id ?? ''] ?? '?'}`}</p>
      {ev.tipo === 'rolagem' ? <p><span className="text-[#b99bff]">🎲 {ev.expressao}</span> → [{ev.resultados?.join(', ')}] = <strong className="text-lg text-[#ed9cd8]">{ev.total}</strong>
        {ev.expressao?.includes('d20') && ev.resultados?.[0] === 20 && ' ✨ 20 natural!'}{ev.expressao?.includes('d20') && ev.resultados?.[0] === 1 && ' 💀 1 natural'}{ev.texto && <span className="block text-xs text-[#c4b6d4]">{ev.texto}</span>}</p>
        : ev.tipo === 'ataque' && ev.dados ? <CartaoAtaque d={ev.dados} eventoId={ev.id} admin={admin} acao={acao} />
        : <p className="whitespace-pre-wrap break-words">{ev.texto}</p>}
    </li>)}<div ref={fim} /></ul>
    {e.eventos.length === 0 && <p className="text-center text-sm text-[#b4aeca]">Nada por aqui ainda. Role um dado!</p>}
    <div className="mt-auto space-y-2 border-t border-[#373251] pt-3">
      <div className="grid grid-cols-2 gap-2">
        <select aria-label="Quem vê" value={vis} onChange={x => setVis(x.target.value as typeof vis)} className={input}>
          <option value="publica">👀 Todos veem</option><option value="mestre">🔒 Só o mestre</option><option value="privada">✉️ Privado para…</option></select>
        {vis === 'privada' ? <select aria-label="Destinatário" value={dest} onChange={x => setDest(x.target.value)} className={input}><option value="">Escolha…</option>
          {e.membros.filter(m => m.aventureiro_id !== e.eu).map(m => <option key={m.aventureiro_id} value={m.aventureiro_id}>{m.aventureiro?.apelido}{m.papel === 'mestre' || m.papel === 'comestre' ? ' (mestre)' : m.papel === 'espectador' ? ' (espectador)' : ''}</option>)}</select>
          : <select aria-label="Personagem" value={pers} onChange={x => setPers(x.target.value)} className={input}><option value="">Como eu mesmo</option>{meus.map(f => <option key={f.id} value={f.nome || 'Personagem'}>{f.nome || 'Personagem sem nome'}</option>)}</select>}
      </div>
      {!espectador && <><div className="flex flex-wrap gap-1">{DADOS.map(d => <button key={d} type="button" onClick={() => rolar(d)} className={btn}>{d.slice(1)}</button>)}</div>
      <form onSubmit={x => { x.preventDefault(); void rolar(expr) }} className="flex gap-2">
        <input aria-label="Expressão de dados" value={expr} onChange={x => setExpr(x.target.value)} maxLength={80} placeholder="2d6+3, 4d6kh3, 2d20kh1" className={input} />
        <button type="submit" className="rounded-lg bg-[#7654bb] px-3 text-sm font-semibold"><Dices size={18} /></button>
      </form></>}
      <form onSubmit={x => { x.preventDefault(); void enviar() }} className="flex gap-2">
        <input aria-label="Mensagem" value={texto} onChange={x => setTexto(x.target.value)} maxLength={1000} placeholder={espectador ? 'Mensagem' : 'Mensagem (ou /r 1d20+2)'} className={input} />
        <button type="submit" aria-label="Enviar" className="rounded-lg bg-[#7654bb] px-3"><Send size={18} /></button>
      </form>
    </div>
  </div>
}

function PainelIniciativa({ e, admin, acao, fichas, atacar }: { e: Estado; admin: boolean; acao: Acao; fichas: FichaMesa[] | null; atacar: (tokenId: string) => void }) {
  const lista = e.mesa?.iniciativa ?? [], turno = e.mesa?.turno ?? 0, rodada = e.mesa?.rodada ?? 1
  const [nome, setNome] = useState(''), [valor, setValor] = useState('')
  const [preparando, setPreparando] = useState(false)
  const salvar = (iniciativa: Iniciativa[], t = turno, r = rodada) => acao({ acao: 'iniciativa', iniciativa, turno: t, rodada: r }).catch(() => {})
  const passar = (direcao: 1 | -1) => { if (lista.length) void acao({ acao: 'turno', direcao }).catch(() => {}) }
  const tokenDe = (x: Iniciativa) => x.tokenId ? e.tokens.find(t => t.id === x.tokenId) : undefined
  return <div className="space-y-3">
    {admin && <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => setPreparando(true)} className="flex-1 rounded-xl bg-gradient-to-r from-[#b91c1c] to-[#7c3aed] px-3 py-2.5 font-bold shadow-[0_0_14px_#b91c1c44]">⚔️ {lista.length ? 'Preparar de novo' : 'Preparar combate'}</button>
      {lista.length > 0 && <button type="button" onClick={() => { if (confirm('Encerrar o combate e limpar a ordem de turnos?')) void acao({ acao: 'combate_encerrar' }).catch(() => {}) }} className={btn}>🏳️ Encerrar</button>}
    </div>}
    {lista.length > 0 && <p className="text-sm">Rodada <strong>{rodada}</strong> · vez de <strong className="text-amber-200">{lista[turno]?.nome}</strong></p>}
    <ol className="space-y-1">{lista.map((x, i) => { const t = tokenDe(x), minha = !!t && t.dono_id === e.eu
      return <li key={x.id} className={'flex items-center gap-2 rounded-lg p-2 text-sm ' + (i === turno ? 'bg-gradient-to-r from-[#5b4380] to-[#7c2d4a] font-semibold ring-1 ring-amber-300/60' : 'bg-[#1e1a30]')}>
        <span className="w-8 text-center tabular-nums">{x.valor}</span>
        {t && <span aria-hidden className="h-6 w-6 shrink-0 rounded-full border border-black/40 bg-cover bg-center" style={{ backgroundColor: t.cor, backgroundImage: t.imagem_url ? `url("${t.imagem_url}")` : undefined }} />}
        <span className="min-w-0 flex-1 truncate">{x.nome}{t?.hp_max ? <span className="ml-1 text-[11px] font-normal text-[#c4b6d4]">❤️ {t.hp_atual ?? 0}/{t.hp_max}</span> : null}
          {t?.condicoes?.length ? <span className="ml-1 text-[11px] font-normal" title={t.condicoes.map(nomeCondicao).join(', ')}>{t.condicoes.map(c => emojiCondicao[c] + (t.condicoes_rodadas?.[c] ? t.condicoes_rodadas[c] : '')).join(' ')}</span> : null}</span>
        {i === turno && <>⚔️{(admin || minha) && t && <button type="button" onClick={() => atacar(t.id)} className="rounded-md bg-[#b91c1c] px-2 py-0.5 text-[11px] font-semibold text-white">Atacar</button>}</>}
        {admin && <button type="button" aria-label={'Remover ' + x.nome} onClick={() => salvar(lista.filter(y => y.id !== x.id), Math.min(turno, Math.max(0, lista.length - 2)))} className="rounded p-1 hover:bg-[#4b253a]"><X size={14} /></button>}
      </li> })}</ol>
    {!admin && lista.length > 0 && (() => { const t = tokenDe(lista[turno]); return t && t.dono_id === e.eu
      ? <button type="button" onClick={() => void acao({ acao: 'turno', direcao: 1, turnoAtual: turno }).catch(() => {})} className="w-full rounded-lg bg-[#5b4380] px-3 py-2 text-sm font-semibold hover:bg-[#6b5190]">✅ Terminar meu turno</button> : null })()}
    {lista.length === 0 && <p className="text-sm text-[#b4aeca]">{admin ? 'Ninguém na iniciativa. Toque em “Preparar combate” para rolar a iniciativa de todos os tokens.' : 'Ainda não há combate.'}</p>}
    {admin && <>
      {lista.length > 0 && <div className="flex gap-2"><button type="button" onClick={() => passar(-1)} className={btn}><ChevronLeft size={14} /> Anterior</button>
        <button type="button" onClick={() => passar(1)} className={'flex-1 justify-center rounded-lg bg-[#5b4380] px-3 py-2 text-sm font-semibold hover:bg-[#6b5190] inline-flex items-center gap-1'}>Próximo turno <ChevronRight size={14} /></button></div>}
      <details className="text-sm"><summary className="cursor-pointer text-xs text-[#c7a8ff]">Adicionar alguém à mão</summary>
        <form onSubmit={x => { x.preventDefault(); if (!nome.trim()) return; void salvar([...lista, { id: crypto.randomUUID(), nome, valor: Number(valor) || 0 }]); setNome(''); setValor('') }} className="mt-2 flex gap-2">
          <input aria-label="Nome" value={nome} onChange={x => setNome(x.target.value)} placeholder="Nome" className={input} />
          <input aria-label="Valor" value={valor} onChange={x => setValor(x.target.value)} inputMode="numeric" placeholder="Valor" className={input + ' w-20'} />
          <button type="submit" aria-label="Adicionar" className={btn}><Plus size={14} /></button></form>
      </details>
    </>}
    {preparando && <PrepararCombate tokens={e.tokens} fichas={fichas} acao={acao} fechar={() => setPreparando(false)} />}
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

/** Campo do dano por turno de uma condição (salva ao sair do campo ou com Enter). */
function DanoPorTurno({ valor, nome, pode, salvar }: { valor: string; nome: string; pode: boolean; salvar: (v: string) => void }) {
  const [v, setV] = useState(valor)
  const enviar = () => { if (v.trim().toLowerCase() !== valor) salvar(v.trim().toLowerCase()) }
  return <label className="flex items-center gap-1 text-[11px]">💥<input aria-label={'Dano por turno de ' + nome} disabled={!pode} value={v} maxLength={20} placeholder="sem dano"
    onChange={x => setV(x.target.value)} onBlur={enviar} onKeyDown={x => { if (x.key === 'Enter') { x.preventDefault(); (x.target as HTMLInputElement).blur() } }} className={input + ' !w-20 !py-1 font-mono'} /></label>
}
