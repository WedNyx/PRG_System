'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AudioLines, Map as MapaIcone, BrickWall, Grid3x3, Glasses, Flame, Trash, SquareDashed, Sun, ArrowDown, ArrowLeft, ArrowUp, BookOpen, CircleHelp, Crown, Globe, Library, MoreHorizontal, ScrollText, CloudFog, Dices, Eraser, Eye, EyeOff, Hand, History, Image as ImageIcon, Layers, Lock, LockOpen, MapPin, MessageSquare, Music2, Pencil, Plus, Ruler, Settings2, Square, Swords, Trash2, UserRound, Volume2, VolumeX, X } from 'lucide-react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { api, ErroNuvem } from '@/lib/nuvem/cliente'
import { condicoesDisponiveis, emojiCondicao, nomeCondicao } from '@/lib/condicoes'
import type { Camada } from '@/lib/nuvem/mesa'
import { podeMoverToken } from '@/lib/nuvem/mesa'
import MapaMesa, { type CursorRemoto, type ModoMesa, type Ping, type PreviaArea, type ReguaRemota, type TokenMapa } from './MapaMesa'
import { caminhoLivre, FORMAS_PAREDE, lerParedes, TIPOS_PAREDE, type FormaParede, type TipoParede } from '@/lib/mesa/paredes'
import { normalizarVisao, type VisaoToken } from '@/lib/mesa/visao'
import { CORES_AREA, FORMAS_AREA, lerAreasEfeito, tokensNaArea, type AreaEfeito, type FormaArea } from '@/lib/mesa/areasEfeito'
import RolagemCentral, { type RolagemCentralHandle } from '@/components/dados/RolagemCentral'
import PainelCampanha from './PainelCampanha'
import PainelMusica from './PainelMusica'
import { lerPreferencias, movimentoReduzido } from '@/lib/preferencias'
import { MotionConfig, motion } from 'motion/react'
import { useMesaDeSom } from './useMesaDeSom'
import PainelSom from './PainelSom'
import PainelTabelas from './PainelTabelas'
import PainelBiblioteca from './PainelBiblioteca'
import { sistemaDaCampanha } from '@/lib/sistemas/catalogo'
import HistoricoRolagens from './HistoricoRolagens'
import DicasMesa, { deveMostrarDicas } from './DicasMesa'
import Sino from '@/components/Sino'
import TocadorMesa from './TocadorMesa'
import type { EstadoMusica } from '@/lib/nuvem/musica'
import RecorteImagem from './RecorteImagem'
import ChatMesa from './ChatMesa'
import { enviarImagem } from './enviarImagem'
import { LUZES_PRONTAS, MAX_GRADE, type AreaNevoa, type LuzToken } from '@/lib/nuvem/mesa'
import { btn, input, msg } from './estilos'
import AnimacaoAssim from '@/components/fichas/AnimacaoAssim'
import { resultadoAssim, type DadoAssim } from '@/lib/sistemas/assimilacao'
import { marcaAssim } from '@/components/dados/RolagemAssim'
import { DecisoesMestre, ConfigCombate, DescansoGrupo, JanelaAtaque, PainelFichas, PainelMorte, chaveFonte, useFichasMesa, type DadosAtaque, type EstadoAtaque, type Morte } from './Combate'
import NaTela from '@/components/NaTela'
import FichaNaMesa from './FichaNaMesa'
import { DanoEmVarios, PainelIniciativa } from './Iniciativa'

type Cena = { id: string; nome: string; mapa_url: string | null; grid_cols: number; grid_rows: number; fog_ativo: boolean; fog_revelado: string[]; ativa: boolean; camadas: Camada[]; tokens_travados: boolean; fog_areas?: AreaNevoa[] | null; areas_efeito?: unknown; paredes?: unknown; visao_dinamica?: boolean | null; visao_alcance?: number | null; escuridao?: number | null; luz_revela_nevoa?: boolean | null }
type Token = { id: string; nome: string; cor: string; imagem_url: string | null; x: number; y: number; visivel: boolean; npc: boolean; hp_atual: number | null; hp_max: number | null; condicoes: string[]; condicoes_rodadas?: Record<string, number> | null; condicoes_dano?: Record<string, string> | null; morte?: Morte | null; dono_id: string | null; ficha_id: string | null; ficha_modelo?: string | null; movimento: 'dono' | 'todos' | 'mestre'; tamanho: number; luz?: LuzToken | null; visao?: VisaoToken | null }
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
const MOVIMENTO = { dono: 'O dono move', todos: 'Todos movem', mestre: 'Só o mestre move' }

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
  // Áreas de efeito e régua compartilhada (v0.34.9).
  const [formaArea, setFormaArea] = useState<FormaArea>('circulo')
  const [metrosArea, setMetrosArea] = useState(6)
  const [corArea, setCorArea] = useState(CORES_AREA[0])
  const [reguas, setReguas] = useState<Record<string, ReguaRemota & { ate: number }>>({})
  const [previas, setPrevias] = useState<Record<string, PreviaArea & { ate: number }>>({})
  const [danoArea, setDanoArea] = useState<AreaEfeito | null>(null)
  // Paredes e “ver como jogador” (v0.34.10).
  const [tipoParede, setTipoParede] = useState<TipoParede | 'apagar'>('parede')
  const [formaParede, setFormaParede] = useState<FormaParede>('linha')
  const [gradeParede, setGradeParede] = useState(true)
  /** Mestre: mover tokens atravessando paredes (para pôr um NPC em qualquer lugar). Desligado: as paredes valem para todos. */
  const [atravessar, setAtravessar] = useState(false)
  const [comoJogador, setComoJogador] = useState(false)
  const [dicas, setDicas] = useState<'auto' | 'aberto' | 'fechado'>('auto')
  const [aba, setAba] = useState<'fichas' | 'tokens' | 'iniciativa' | 'musica' | 'sons' | 'visao' | 'regras' | 'campanha' | 'tabelas' | 'biblioteca' | 'mestre'>('iniciativa')
  // Mesa organizada (v0.36.4): o mapa em destaque; chat e painel de ferramentas são abas laterais que recolhem.
  // No computador o chat começa aberto; no celular tudo começa recolhido (e só um abre por vez, por cima do mapa).
  const grande = () => typeof window !== 'undefined' && window.innerWidth >= 1024
  const [painel, setPainel] = useState(false)
  const [chatAberto, setChatAberto] = useState(() => grande() && lerPreferencias().chatAbertoPc)
  const [vistoChat, setVistoChat] = useState(0)
  const [mais, setMais] = useState(false)
  const ultimaParte = useRef<Record<string, string>>({})
  const [pings, setPings] = useState<Ping[]>([])
  const [cursores, setCursores] = useState<CursorRemoto[]>([])
  const [online, setOnline] = useState<string[]>([])
  const [tempoReal, setTempoReal] = useState(false)
  const [tokenAberto, setTokenAberto] = useState<string | null>(null)
  const [ataque, setAtaque] = useState<EstadoAtaque | null>(null)
  const [avisoSessao, setAvisoSessao] = useState(true)
  const [camadaSel, setCamadaSel] = useState<string | null>(null)
  const [som, setSom] = useState(() => lerPreferencias().somDados)
  const [historico, setHistorico] = useState(false)
  /** Ficha aberta dentro da mesa (v0.33.8). */
  const [fichaAberta, setFichaAberta] = useState<string | null>(null)
  const [desvio, setDesvio] = useState(0)
  const [fechada, setFechada] = useState(false)
  // Mudanças que aparecem na hora (antes do servidor confirmar): posições de tokens e traços de desenho.
  const [posicoes, setPosicoes] = useState<Record<string, Pendente & { x: number; y: number }>>({})
  const [tracos, setTracos] = useState<Record<string, Pendente & { id: string; cor: string; pontos: number[] }>>({})
  const ultimoEnvio = useRef<Record<string, number>>({})
  const canal = useRef<RealtimeChannel | null>(null)
  const dados = useRef<RolagemCentralHandle>(null)
  const [animacaoAssim, setAnimacaoAssim] = useState<DadoAssim[] | null>(null)
  const fecharAssim = useCallback(() => setAnimacaoAssim(null), [])
  const ultimoEvento = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** Mostra a rolagem no meio da tela: dados 3D + cartão com o total e cada dado. */
  const destacar = useCallback((ev: Evento) => {
    if (!ev.expressao || !ev.resultados) return
    const marca = marcaAssim(ev.dados)
    if (marca) {
      const r = resultadoAssim(ev.expressao, ev.resultados, marca.manter)
      if (r.dados.length) setAnimacaoAssim(r.dados)
      return
    }
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
      if (ult && !ultimoEvento.current) setVistoChat(ult.id)
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
  // Aba em segundo plano: não gasta rede/CPU; ao voltar, recarrega na hora para não ficar com estado velho.
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === 'visible') void carregar() }, tempoReal ? 30000 : 4000)
    const volta = () => { if (document.visibilityState === 'visible') void carregar() }
    document.addEventListener('visibilitychange', volta)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', volta) }
  }, [carregar, tempoReal])
  // Mesa de Som (v0.36.5): o estado mora aqui para o ambiente continuar com o painel fechado.
  const enviarSom = useCallback((evento: string, payload: Record<string, unknown>) => { void canal.current?.send({ type: 'broadcast', event: evento, payload }) }, [])
  const mesaSom = useMesaDeSom({ campanhaId, eu: e?.eu ?? '', admin: e?.campanha.meuPapel === 'mestre' || e?.campanha.meuPapel === 'comestre', enviar: enviarSom })
  const receptorSom = useRef(mesaSom)
  useEffect(() => { receptorSom.current = mesaSom }, [mesaSom])
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
      .on('broadcast', { event: 'regua' }, ({ payload }) => {
        const g = payload as { id?: unknown; nome?: unknown; r?: { x1?: unknown; y1?: unknown; x2?: unknown; y2?: unknown } | null }
        if (typeof g.id !== 'string') return
        const id = g.id, r = g.r
        if (!r) { setReguas(m => limpar(m, k => k !== id)); return }
        if (![r.x1, r.y1, r.x2, r.y2].every(n => Number.isInteger(n))) return
        setReguas(m => ({ ...m, [id]: { id, nome: typeof g.nome === 'string' ? g.nome.slice(0, 40) : '?', x1: r.x1 as number, y1: r.y1 as number, x2: r.x2 as number, y2: r.y2 as number, ate: Date.now() + 8000 } }))
      })
      .on('broadcast', { event: 'area' }, ({ payload }) => {
        const g = payload as { id?: unknown; quem?: unknown; a?: Record<string, unknown> | null }
        if (typeof g.id !== 'string') return
        const id = g.id, a = g.a
        if (!a) { setPrevias(m => limpar(m, k => k !== id)); return }
        if (!FORMAS_AREA.some(f => f.id === a.forma) || ![a.x, a.y, a.angulo, a.metros].every(n => typeof n === 'number' && Number.isFinite(n)) || typeof a.cor !== 'string' || !/^#[0-9a-f]{6}$/i.test(a.cor)) return
        setPrevias(m => ({ ...m, [id]: { id: 'previa-' + id, forma: a.forma as FormaArea, x: a.x as number, y: a.y as number, angulo: a.angulo as number, metros: Math.min(300, a.metros as number), cor: a.cor as string, nome: '', quem: typeof g.quem === 'string' ? g.quem.slice(0, 40) : '?', ate: Date.now() + 8000 } }))
      })
      .on('broadcast', { event: 'som' }, ({ payload }) => receptorSom.current.receberSom(payload))
      .on('broadcast', { event: 'ambiente' }, ({ payload }) => receptorSom.current.receberAmbiente(payload))
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

  // Régua e mira de quem saiu sem soltar: somem sozinhas.
  useEffect(() => {
    const t = setInterval(() => { const agora = Date.now(); setReguas(m => limpar(m, (_k, v) => v.ate > agora)); setPrevias(m => limpar(m, (_k, v) => v.ate > agora)) }, 3000)
    return () => clearInterval(t)
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

  // Ficha aberta na mesa: a rolagem dela aparece no meio da tela e avisa os outros; ao salvar, a mesa atualiza.
  const salvouEm = useRef(0)
  useEffect(() => {
    const ouvir = (ev: MessageEvent) => {
      const m = ev.data as { prg?: string; tipo?: string; evento?: Evento }
      if (ev.origin !== window.location.origin || m?.prg !== 'ficha') return
      if (m.tipo === 'rolagem' && m.evento) { destacar(m.evento); avisarMudanca() }
      if (m.tipo === 'salvo') { salvouEm.current = Date.now(); avisarMudanca(); void carregarFichas() }
    }
    window.addEventListener('message', ouvir)
    return () => window.removeEventListener('message', ouvir)
  }, [destacar, avisarMudanca, carregarFichas])
  // A vida da ficha aberta mudou na mesa (dano, cura, descanso): a ficha recarrega (se não foi ela mesma que salvou agora).
  const iframeFicha = useRef<HTMLIFrameElement>(null)
  const vidaAberta = e && fichaAberta ? e.tokens.filter(t => t.ficha_id === fichaAberta).map(t => `${t.hp_atual}/${t.hp_max}`).join() : ''
  const vidaAntes = useRef('')
  useEffect(() => {
    if (vidaAntes.current && vidaAberta && vidaAntes.current !== vidaAberta && Date.now() - salvouEm.current > 6000)
      iframeFicha.current?.contentWindow?.postMessage({ prg: 'mesa', tipo: 'recarregar' }, window.location.origin)
    vidaAntes.current = vidaAberta
  }, [vidaAberta])

  const nomes = useMemo(() => Object.fromEntries((e?.membros ?? []).map(m => [m.aventureiro_id, m.aventureiro?.apelido ?? '?'])), [e?.membros])
  // Mensagens novas enquanto o chat está recolhido (o que já estava na mesa ao entrar não conta).
  const ultimoId = e?.eventos.at(-1)?.id ?? 0
  const novosChat = chatAberto || !e ? 0 : e.eventos.filter(ev => ev.id > vistoChat && ev.autor_id !== e.eu && ev.tipo !== 'sistema').length
  /** Abre ou fecha o chat / o painel. No celular só um fica aberto por vez. */
  const fecharChat = () => { setChatAberto(false); setVistoChat(ultimoId) }
  const alternarChat = () => { if (chatAberto) { fecharChat(); return } setChatAberto(true); if (!grande()) setPainel(false) }
  if (!e && fechada) return <main className="fundo-tema flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center text-(--a-e8dff7)">
    <p className="text-5xl" aria-hidden="true">🌙</p>
    <h1 className="text-2xl font-bold">A sessão está fechada</h1>
    <p className="max-w-sm text-(--a-cfc0df)">Só o mestre pode abrir a mesa. Deixe esta página aberta: assim que a sessão começar, você entra sozinho.</p>
    <Link href="/central" className="rounded-xl border border-(--a-8d70b6) px-4 py-2 text-(--a-e4d3ff)">← Voltar ao início</Link>
  </main>
  if (!e) return <main className="flex min-h-screen items-center justify-center bg-(--s-0d0c19) text-(--a-d6c8e8)">{erro || 'Abrindo a mesa...'}{erro && <Link href="/central" className="ml-3 underline">Voltar</Link>}</main>

  const admin = e.campanha.meuPapel === 'mestre' || e.campanha.meuPapel === 'comestre'
  const espectador = e.campanha.meuPapel === 'espectador'
  const papelDe: Record<string, string> = Object.fromEntries(e.membros.map(m => [m.aventureiro_id, m.papel]))
  const sessaoAberta = !!e.sessao?.aberta
  const cena = e.cenaAtiva
  const travada = !!cena?.tokens_travados
  const tokensMapa: TokenMapa[] = e.tokens.map(t => ({ ...t, ...(posicoes[t.id] ? { x: posicoes[t.id].x, y: posicoes[t.id].y } : {}), tamanho: t.tamanho ?? 1, rodadas: t.condicoes_rodadas ?? {}, morte: t.morte ?? null, meu: t.dono_id === e.eu, jogador: !t.npc && !!t.dono_id, luz: t.luz ?? null, podeMover: !espectador && podeMoverToken({ movimento: t.movimento ?? 'dono', dono_id: t.dono_id }, e.eu, admin, travada) }))
  const token = e.tokens.find(t => t.id === tokenAberto)
  const fichaDoToken = (tokenId: string) => { const tk = e.tokens.find(t => t.id === tokenId); const fid = tk ? tk.ficha_id ?? tk.ficha_modelo : null; return fid ? fichasMesa?.find(f => f.id === fid) ?? null : null }
  /** Abre a janela de ataque já com a melhor arma/poder e o teste sugerido da ficha. */
  function iniciarAtaque(tokenId: string) {
    const c = fichaDoToken(tokenId)?.combate
    setAtaque({ atacante: tokenId, fonte: c?.ataques[0] ? chaveFonte(c.ataques[0]) : 'livre', teste: c?.testePadrao ?? '', dano: '', bonus: '', defesa: '', alvo: null, mirando: false })
  }
  const paredesCena = cena ? lerParedes(cena.paredes, cena.grid_cols, cena.grid_rows) : []
  const areasCena = cena ? lerAreasEfeito(cena.areas_efeito, cena.grid_cols, cena.grid_rows) : []
  const pendentes = admin ? e.eventos.filter(ev => ev.tipo === 'ataque' && ev.dados?.status === 'pendente').map(ev => ({ id: ev.id, d: ev.dados as DadosAtaque, total: ev.total })) : []
  const vez = e.mesa?.iniciativa?.[e.mesa.turno]
  const minhaVez = !espectador && vez?.tokenId ? e.tokens.find(t => t.id === vez.tokenId && t.dono_id === e.eu) ?? null : null
  const salvarCamadas = (camadas: Camada[]) => cena && acao({ acao: 'cena_editar', cenaId: cena.id, camadas }).catch(() => {})

  /** Solta o token: aparece na hora para mim e para os outros; o servidor confirma em seguida. */
  async function moverToken(id: string, x: number, y: number) {
    // Ninguém atravessa parede, janela nem porta fechada (o servidor confere de novo); o mestre só se ligar o 👻.
    const tk = e!.tokens.find(t => t.id === id)
    const livre = admin && atravessar
    if (!livre && cena && tk && !caminhoLivre(paredesCena, cena.grid_cols, cena.grid_rows, tk, { x, y }, tk.tamanho ?? 1)) {
      toast.error('🧱 Uma parede ou porta fechada bloqueia o caminho.', { description: admin ? 'Para contornar, mova em etapas. Para pôr o token do outro lado, ligue 👻 Atravessar paredes (ferramenta Paredes).' : 'Para contornar, mova em etapas.' }); return
    }
    setPosicoes(m => ({ ...m, [id]: { x, y, ate: Date.now() + 8000 } }))
    aoVivo('token:' + id, 0, 'token', { id, x, y }, true)
    await acao({ acao: 'token_mover', tokenId: id, x, y, ...(livre ? { atravessar: true } : {}) }).catch(() => setPosicoes(m => limpar(m, k => k !== id)))
  }
  function desenhar(pontos: number[], id: string) {
    if (!cena) return
    setTracos(m => ({ ...m, [id]: { id, cor, pontos, ate: Date.now() + 15000 } }))
    aoVivo('traco:' + id, 0, 'traco', { id, cor, pontos }, true)
    void acao({ acao: 'desenho', cenaId: cena.id, id, cor, pontos }).catch(() => setTracos(m => limpar(m, k => k !== id)))
  }
  const ferramentas: { id: ModoMesa; icone: typeof Hand; nome: string; so?: boolean; fog?: boolean }[] = [
    { id: 'mover', icone: Hand, nome: 'Mover / arrastar' }, { id: 'regua', icone: Ruler, nome: 'Régua: arraste para medir a distância' }, { id: 'ping', icone: MapPin, nome: 'Marcar: toque para chamar a atenção de todos' }, { id: 'desenhar', icone: Pencil, nome: 'Desenhar no mapa (todos veem)' },
    { id: 'area-efeito', icone: Flame, nome: 'Área de efeito: escolha a forma e o tamanho, toque no ponto e arraste para mirar' },
    { id: 'revelar', icone: Eye, nome: 'Revelar com pincel', so: true, fog: true }, { id: 'esconder', icone: CloudFog, nome: 'Esconder com pincel', so: true, fog: true },
    { id: 'nevoa-area', icone: SquareDashed, nome: 'Partes com névoa: arraste para criar uma; toque numa para revelar ou esconder', so: true, fog: true },
    { id: 'area-revelar', icone: Square, nome: 'Revelar área (arraste um retângulo)', so: true, fog: true }, { id: 'area-esconder', icone: EyeOff, nome: 'Esconder área', so: true, fog: true },
    { id: 'paredes', icone: BrickWall, nome: 'Paredes, portas e janelas: desenhe no mapa', so: true },
    { id: 'editar-mapa', icone: Layers, nome: 'Montar mapa (mover/redimensionar imagens)', so: true },
  ]
  // Painel em grupos (v0.32.6): poucas abas em cima e, dentro de cada grupo, as partes dele com uma linha explicando o que fazem.
  type Parte = { id: typeof aba; icone: typeof Hand; nome: string; ajuda: string }
  const grupos: { id: string; icone: typeof Hand; nome: string; partes: Parte[] }[] = ([
    { id: 'jogo', icone: Swords, nome: 'Jogo', partes: [
      ...(!espectador ? [{ id: 'fichas', icone: ScrollText, nome: 'Fichas', ajuda: admin ? 'Personagens e NPCs da campanha: coloque na mesa, veja a vida e ataque com as armas e poderes da ficha.' : 'Seu personagem: coloque na mesa e ataque com as armas e poderes da ficha.' } as Parte] : []),
      { id: 'iniciativa', icone: Swords, nome: 'Iniciativa', ajuda: admin ? 'Ordem dos turnos. “Preparar combate” rola a iniciativa de todos; “Próximo turno” passa a vez.' : 'Ordem dos turnos do combate. Quando for a sua vez, aparece “⚔️ Sua vez”.' },
      ...(!espectador ? [{ id: 'tokens', icone: UserRound, nome: 'Tokens', ajuda: 'Tudo que está no mapa: vida, condições e quem pode mover cada token.' } as Parte] : []),
    ] },
    { id: 'musica', icone: Music2, nome: 'Som', partes: [{ id: 'musica', icone: Music2, nome: 'Trilha', ajuda: admin ? 'A trilha da sessão: o que você tocar, todos ouvem juntos.' : 'A trilha da sessão, tocada pelo mestre (cada um ajusta o próprio volume).' },
      { id: 'sons', icone: AudioLines, nome: admin ? 'Mesa de som' : 'Sons', ajuda: admin ? 'Efeitos na hora, ambientes em camadas e cenas prontas. Todos ouvem; cada um escolhe o próprio volume.' : 'Efeitos e ambientes tocados pelo mestre. Ajuste o seu volume ou desligue os sons de susto.' }] },
    ...(!espectador ? [{ id: 'diario', icone: BookOpen, nome: 'Diário', partes: [{ id: 'campanha', icone: BookOpen, nome: 'Diário', ajuda: 'Sessões, anotações (privadas ou compartilhadas)' + (admin ? ' e recompensas (XP, moedas, pontos).' : '.') } as Parte] }] : []),
    ...(admin ? [{ id: 'mestre', icone: Crown, nome: 'Mestre', partes: [
      { id: 'mestre', icone: MapaIcone, nome: 'Cenas e mapa', ajuda: 'Troque a cena que está na mesa, crie cenas novas e monte o mapa (tamanho e imagens).' },
      { id: 'visao', icone: CloudFog, nome: 'Névoa e luz', ajuda: 'O que os jogadores veem: névoa, visão dos personagens, escuridão e travar os tokens.' },
      { id: 'regras', icone: Settings2, nome: 'Combate e descanso', ajuda: 'Como o dano entra, a regra de vida 0 e o descanso do grupo.' },
      { id: 'biblioteca', icone: Library, nome: 'Biblioteca', ajuda: 'Itens e poderes prontos para entregar com “🎁 Dar”.' },
      { id: 'tabelas', icone: Dices, nome: 'Tabelas', ajuda: 'Role na hora nomes, encontros, rumores e tesouros (para todos ou só para você).' },
    ] as Parte[] }] : []),
  ])
  const grupoAtual = grupos.find(g => g.partes.some(p => p.id === aba)) ?? grupos[0]
  const parteAtual = grupoAtual.partes.find(p => p.id === aba) ?? grupoAtual.partes[0]
  const abrirGrupo = (g: typeof grupos[number]) => {
    // Tocar no grupo que já está aberto recolhe o painel.
    if (painel && g.id === grupoAtual.id) { setPainel(false); return }
    setAba(ultimaParte.current[g.id] && g.partes.some(p => p.id === ultimaParte.current[g.id]) ? ultimaParte.current[g.id] as typeof aba : g.partes[0].id)
    setPainel(true); if (!grande() && chatAberto) fecharChat()
  }
  async function alternarSessao() {
    if (sessaoAberta && !confirm('Encerrar a sessão? Os jogadores e espectadores saem da mesa e a música para.')) return
    await acao({ acao: 'sessao', aberta: !sessaoAberta }).catch(() => {})
    toast.success(sessaoAberta ? 'Sessão encerrada.' : 'Sessão aberta! O grupo já pode entrar.')
  }

  return <MotionConfig reducedMotion={movimentoReduzido() ? 'always' : 'user'}><div className="fixed inset-0 flex flex-col overflow-hidden bg-(--s-0d0c19) text-(--a-f4f0ff)">
    <RolagemCentral ref={dados} som={som} />
    {animacaoAssim && <AnimacaoAssim dados={animacaoAssim} fechar={fecharAssim} />}
    <header className="relative z-40 flex shrink-0 items-center gap-1.5 border-b border-(--a-373251) bg-gradient-to-r from-(--s-1b1830) via-(--s-1d1733) to-(--s-1b1830) px-2 py-1.5 sm:gap-2 sm:px-3">
      <Link href="/central" aria-label="Voltar para a Central" title="Voltar para a Central" className="rounded-lg p-1.5 text-(--a-b99bff) hover:bg-(--s-34294f)"><ArrowLeft size={18} /></Link>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-bold sm:text-base">{e.campanha.nome}</h1>
        <p className="truncate text-[11px] text-(--a-b4aeca)">{cena ? '🗺️ ' + cena.nome : 'Sem cena'}{vez ? ` · ⚔️ vez de ${vez.nome} (rodada ${e.mesa.rodada})` : ''}{espectador ? ' · 👁️ assistindo' : ''}{travada ? ' · 🔒 tokens travados' : ''}</p>
      </div>
      {minhaVez && <button type="button" onClick={() => iniciarAtaque(minhaVez.id)} className="prg-sua-vez shrink-0 rounded-full bg-gradient-to-r from-[#b91c1c] to-(--a-7c3aed) px-3 py-1 text-xs font-bold">⚔️ Sua vez</button>}
      {admin && <button type="button" onClick={() => void alternarSessao()} aria-label={sessaoAberta ? 'Encerrar sessão' : 'Abrir sessão'} title={sessaoAberta ? 'Encerrar a sessão (todos saem da mesa)' : 'Abrir a sessão para o grupo entrar'}
        className={'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ' + (sessaoAberta ? 'bg-[#4b253a] text-red-100 hover:bg-[#5e2d48]' : 'bg-emerald-700 text-white hover:bg-emerald-600')}>
        {sessaoAberta ? <>⏹ Encerrar<span className="hidden sm:inline"> sessão</span></> : <>▶ Abrir<span className="hidden sm:inline"> sessão</span></>}</button>}
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-(--s-14121f) px-2 py-1 text-[11px] text-(--a-cfc0df)" title={(tempoReal ? 'Tempo real ligado' : 'Atualizando a cada 4 s') + ' · online: ' + (online.map(id => nomes[id]).filter(Boolean).join(', ') || 'você')}>
        <span className={'h-2 w-2 rounded-full ' + (tempoReal ? 'bg-emerald-400' : 'bg-amber-400')} />{online.length || 1}<span className="hidden sm:inline"> online</span></span>
      {!espectador && e.fichas.length > 0 && <button type="button" onClick={() => setFichaAberta(f => f ? null : (e.fichas.find(x => x.dono_id === e.eu && !x.npc) ?? e.fichas[0]).id)} aria-pressed={!!fichaAberta}
        aria-label={admin ? 'Abrir uma ficha aqui na mesa' : 'Abrir a minha ficha aqui na mesa'} title={admin ? 'Fichas aqui na mesa' : 'Minha ficha aqui na mesa'}
        className={'inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ' + (fichaAberta ? 'border-(--a-b99bff) bg-(--s-3a2c58)' : 'border-(--a-5e4b78) hover:bg-(--s-34294f)')}><ScrollText size={14} /><span className="hidden sm:inline">{admin ? 'Fichas' : 'Ficha'}</span></button>}
      <Sino />
      <div className="hidden items-center gap-1 md:flex">
        <button type="button" onClick={() => setSom(!som)} aria-label={som ? 'Desligar o som dos dados' : 'Ligar o som dos dados'} title={som ? 'Som dos dados ligado' : 'Som dos dados desligado'} className="rounded-lg p-1.5 hover:bg-(--s-34294f)">{som ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
        <Link href={'/mundo?campanha=' + campanhaId} className="rounded-lg p-1.5 hover:bg-(--s-34294f)" title="Mundo da campanha: mapa, lugares, personagens e relações" aria-label="Mundo da campanha"><Globe size={18} /></Link>
        <button type="button" onClick={() => setDicas('aberto')} className="rounded-lg p-1.5 hover:bg-(--s-34294f)" title="Dicas rápidas da mesa" aria-label="Dicas rápidas da mesa"><CircleHelp size={18} /></button>
      </div>
      <div className="relative md:hidden">
        <button type="button" onClick={() => setMais(m => !m)} aria-expanded={mais} aria-label="Mais opções" className="rounded-lg p-1.5 hover:bg-(--s-34294f)"><MoreHorizontal size={18} /></button>
        {mais && <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-(--a-55456e) bg-(--s-1d1730) p-1 shadow-2xl" onClick={() => setMais(false)}>
          <Link href={'/mundo?campanha=' + campanhaId} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-(--s-34294f)"><Globe size={16} /> Mundo da campanha</Link>
          <button type="button" onClick={() => setHistorico(true)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-(--s-34294f)"><History size={16} /> Histórico de rolagens</button>
          <button type="button" onClick={() => setSom(!som)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-(--s-34294f)">{som ? <VolumeX size={16} /> : <Volume2 size={16} />} {som ? 'Desligar o som dos dados' : 'Ligar o som dos dados'}</button>
          <button type="button" onClick={() => setDicas('aberto')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-(--s-34294f)"><CircleHelp size={16} /> Dicas da mesa</button>
        </div>}
      </div>
    </header>

    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <section aria-label="Mapa da mesa" className="relative min-h-0 flex-1 overflow-hidden">
        {admin && !sessaoAberta && !ataque && avisoSessao && <p role="status" className="pointer-events-none absolute inset-x-2 top-2 z-30 mx-auto flex max-w-md items-center gap-2 rounded-xl border border-amber-500/50 bg-[#2b2310]/85 p-2 text-xs text-amber-100"><span className="flex-1 text-center">🌙 Sessão fechada: só você vê a mesa. Toque em “▶ Abrir sessão” quando o grupo for jogar.</span><button type="button" aria-label="Esconder aviso" onClick={() => setAvisoSessao(false)} className="pointer-events-auto rounded p-1.5 hover:bg-white/10"><X size={14} /></button></p>}
        {!espectador && <div className="pointer-events-none absolute bottom-2 left-2 z-20 flex max-w-[calc(100%-1rem)] flex-col items-start gap-1">
        {cena && <p className="pointer-events-none rounded-md bg-(--s-19172c)/90 px-2 py-0.5 text-[11px] text-(--a-cfc0df)">{ferramentas.find(f => f.id === modo)?.nome}{modo === 'mover' ? ' · toque no token para ver vida e atacar' : ''}</p>}
        <div className="pointer-events-auto flex max-w-full flex-wrap items-center gap-1 rounded-xl border border-(--a-373251) bg-(--s-19172c)/95 p-1 shadow-lg">
          {ferramentas.filter(f => !f.so || admin).filter(f => !f.fog || cena?.fog_ativo).map(f => <button key={f.id} type="button" title={f.nome} aria-label={f.nome} aria-pressed={modo === f.id} onClick={() => setModo(f.id)}
            className={'rounded-lg p-2 ' + (modo === f.id ? 'bg-(--a-7654bb)' : 'hover:bg-(--s-34294f)')}><f.icone size={18} /></button>)}
          {(modo === 'revelar' || modo === 'esconder' || modo === 'area-revelar' || modo === 'area-esconder' || modo === 'nevoa-area') && cena && <>
            <button type="button" className={btn} onClick={() => void acao({ acao: 'cena_editar', cenaId: cena.id, nevoa_tudo: true }).catch(() => {})}><Eye size={14} /> Revelar tudo</button>
            <button type="button" className={btn} onClick={() => { if (confirm('Esconder o mapa todo com névoa?')) void acao({ acao: 'cena_editar', cenaId: cena.id, fog_limpar: true }).catch(() => {}) }}><EyeOff size={14} /> Esconder tudo</button></>}
          {modo === 'paredes' && cena && <>
            {TIPOS_PAREDE.map(t => <button key={t.id} type="button" onClick={() => setTipoParede(t.id)} aria-pressed={tipoParede === t.id} title={t.nome + ': ' + t.dica} aria-label={'Desenhar ' + t.nome}
              className={'h-9 min-w-9 rounded-lg px-2 text-base ' + (tipoParede === t.id ? 'bg-(--a-7654bb)' : 'hover:bg-(--s-34294f)')}>{t.icone}</button>)}
            <select aria-label="Forma da parede" title={FORMAS_PAREDE.find(f => f.id === formaParede)?.dica} value={formaParede} onChange={x => setFormaParede(x.target.value as FormaParede)} className="h-9 rounded-lg border border-(--a-5e4b78) bg-(--s-151123) px-1 text-xs">
              {FORMAS_PAREDE.map(f => <option key={f.id} value={f.id}>{f.icone} {f.nome}</option>)}</select>
            {formaParede !== 'livre' && <button type="button" onClick={() => setGradeParede(v => !v)} aria-pressed={gradeParede} title={gradeParede ? 'Encaixando nos cantos da grade (toque para desenhar livre)' : 'Desenho livre (toque para encaixar na grade)'} aria-label="Encaixar na grade"
              className={'rounded-lg p-2 ' + (gradeParede ? 'bg-(--a-7654bb)' : 'hover:bg-(--s-34294f)')}><Grid3x3 size={18} /></button>}
            <button type="button" onClick={() => setAtravessar(v => !v)} aria-pressed={atravessar} title={atravessar ? 'Você (mestre) move tokens atravessando paredes. Toque para desligar.' : 'Atravessar paredes: só o mestre, para pôr um token em qualquer lugar'} aria-label="Mestre atravessa paredes"
              className={'h-9 min-w-9 rounded-lg px-2 text-base ' + (atravessar ? 'bg-amber-600' : 'hover:bg-(--s-34294f)')}>👻</button>
            <button type="button" onClick={() => setTipoParede('apagar')} aria-pressed={tipoParede === 'apagar'} title="Apagar: toque numa parede, porta ou janela (a forma inteira sai)" aria-label="Apagar parede"
              className={'rounded-lg p-2 ' + (tipoParede === 'apagar' ? 'bg-(--a-7654bb)' : 'hover:bg-(--s-34294f)')}><Eraser size={18} /></button>
            {paredesCena.length > 0 && <button type="button" title="Apagar todas as paredes" aria-label="Apagar todas as paredes" onClick={() => { if (confirm('Apagar todas as paredes, portas e janelas desta cena?')) void acao({ acao: 'paredes_limpar', cenaId: cena.id }).catch(() => {}) }} className="rounded-lg p-2 hover:bg-(--s-34294f)"><Trash2 size={18} /></button>}
          </>}
          {admin && cena && <button type="button" onClick={() => setComoJogador(v => !v)} aria-pressed={comoJogador} title={comoJogador ? 'Voltar à visão do mestre' : 'Ver como jogador: névoa fechada, sem paredes nem tokens escondidos'} aria-label="Ver como jogador"
            className={'rounded-lg p-2 ' + (comoJogador ? 'bg-amber-600 text-black' : 'hover:bg-(--s-34294f)')}><Glasses size={18} /></button>}
          {(modo === 'revelar' || modo === 'esconder') && [1, 3, 5, 9].map(n => <button key={n} type="button" onClick={() => setPincel(n)} aria-label={'Pincel ' + n + '×' + n} className={'rounded-lg px-2 py-1.5 text-xs ' + (pincel === n ? 'bg-(--a-7654bb)' : 'hover:bg-(--s-34294f)')}>{n}×{n}</button>)}
          {modo === 'desenhar' && <>{CORES.map(c => <button key={c} type="button" aria-label={'Cor ' + c} onClick={() => setCor(c)} className={'h-8 w-8 rounded-lg border-2 ' + (cor === c ? 'border-white' : 'border-transparent')} style={{ background: c }} />)}
            {admin && cena && <button type="button" title="Apagar desenhos" aria-label="Apagar desenhos" onClick={() => { setTracos({}); aoVivo('limpar', 0, 'limpar', {}, true); void acao({ acao: 'desenhos_limpar', cenaId: cena.id }).catch(() => {}) }} className="rounded-lg p-2 hover:bg-(--s-34294f)"><Eraser size={18} /></button>}</>}
          {modo === 'area-efeito' && <>
            {FORMAS_AREA.map(f => <button key={f.id} type="button" onClick={() => setFormaArea(f.id)} aria-pressed={formaArea === f.id} title={f.nome + ': ' + f.dica} aria-label={'Forma: ' + f.nome}
              className={'h-9 min-w-9 rounded-lg px-2 text-base leading-none ' + (formaArea === f.id ? 'bg-(--a-7654bb)' : 'hover:bg-(--s-34294f)')}>{f.icone}</button>)}
            <select aria-label="Tamanho da área" value={metrosArea} onChange={x => setMetrosArea(Number(x.target.value))} className="h-9 rounded-lg border border-(--a-5e4b78) bg-(--s-151123) px-1 text-xs">
              {[1.5, 3, 4.5, 6, 9, 12, 15, 18, 24, 30].map(m => <option key={m} value={m}>{formaArea === 'circulo' ? 'raio ' : formaArea === 'quadrado' ? 'lado ' : ''}{m} m</option>)}</select>
            {CORES_AREA.map(c => <button key={c} type="button" aria-label={'Cor da área ' + c} aria-pressed={corArea === c} onClick={() => setCorArea(c)} className={'h-7 w-7 rounded-md border-2 ' + (corArea === c ? 'border-white' : 'border-transparent')} style={{ background: c }} />)}
          </>}
          {modo === 'editar-mapa' && camadaSel && cena && <>
            <button type="button" className={btn} onClick={() => { const l = cena.camadas; const i = l.findIndex(c => c.id === camadaSel); if (i < l.length - 1) { const n = [...l]; [n[i], n[i + 1]] = [n[i + 1], n[i]]; void salvarCamadas(n) } }}><ArrowUp size={14} /> Frente</button>
            <button type="button" className={btn} onClick={() => { const l = cena.camadas; const i = l.findIndex(c => c.id === camadaSel); if (i > 0) { const n = [...l]; [n[i], n[i - 1]] = [n[i - 1], n[i]]; void salvarCamadas(n) } }}><ArrowDown size={14} /> Trás</button>
            <button type="button" className={btn} onClick={() => { void salvarCamadas(cena.camadas.filter(c => c.id !== camadaSel)); setCamadaSel(null) }}><Trash2 size={14} /> Remover</button></>}
        </div></div>}
        {modo === 'editar-mapa' && <p className="absolute left-2 top-2 z-20 rounded-lg bg-(--s-19172c)/95 px-3 py-1.5 text-xs">Arraste as imagens para montar o mapa. Toque numa imagem e puxe a bolinha para mudar o tamanho.</p>}
        {cena ? <MapaMesa cols={cena.grid_cols} rows={cena.grid_rows} fundo={cena.mapa_url} camadas={cena.camadas ?? []} fogAtivo={cena.fog_ativo} fogRevelado={cena.fog_revelado}
          fogAreas={cena.fog_areas ?? []} escuridao={cena.escuridao ?? 0} luzRevela={cena.luz_revela_nevoa !== false}
          onCriarAreaNevoa={r => { const n = (cena.fog_areas ?? []).length + 1; void acao({ acao: 'cena_editar', cenaId: cena.id, fog_areas: [...(cena.fog_areas ?? []), { id: crypto.randomUUID(), nome: 'Área ' + n, ...r, revelada: false }] }).then(() => toast.success(`Área ${n} com névoa. Toque nela (nesta ferramenta) para revelar.`)).catch(() => {}) }}
          onTocarAreaNevoa={id => void acao({ acao: 'cena_editar', cenaId: cena.id, fog_areas: (cena.fog_areas ?? []).map(a => a.id === id ? { ...a, revelada: !a.revelada } : a) }).catch(() => {})}
          tokens={tokensMapa} desenhos={desenhosMapa} cursores={cursores} pings={pings} admin={admin} modo={modo} cor={cor} pincel={pincel}
          camadaSel={camadaSel} onSelecionarCamada={setCamadaSel}
          onAlterarCamada={c => { setE(s => s && s.cenaAtiva ? { ...s, cenaAtiva: { ...s.cenaAtiva, camadas: s.cenaAtiva.camadas.map(x => x.id === c.id ? c : x) } } : s); void salvarCamadas(cena.camadas.map(x => x.id === c.id ? c : x)) }}
          onMoverToken={moverToken}
          onNevoa={(celulas, revelar, retangulo) => void acao({ acao: 'nevoa', cenaId: cena.id, celulas, revelar, retangulo }).catch(() => {})}
          onPing={(x, y) => { const p = { id: crypto.randomUUID(), x, y, autor: nomes[e.eu] ?? '' }; setPings(s => [...s, p]); setTimeout(() => setPings(s => s.filter(q => q.id !== p.id)), 2500); void canal.current?.send({ type: 'broadcast', event: 'ping', payload: p }) }}
          onTokenClick={espectador ? () => {} : id => { if (ataque?.mirando) { if (id !== ataque.atacante) setAtaque({ ...ataque, alvo: id, mirando: false }) } else setTokenAberto(id) }}
          vez={vez?.tokenId ?? null}
          mirando={!!ataque?.mirando}
          alcance={ataque ? { tokenId: ataque.atacante, metros: fichaDoToken(ataque.atacante)?.combate?.ataques.find(a => chaveFonte(a) === ataque.fonte)?.alcance ?? null, alvo: ataque.alvo } : null}
          onDesenhar={desenhar}
          areas={areasCena} previas={Object.values(previas)} formaArea={formaArea} metrosArea={metrosArea} corArea={corArea}
          onCriarArea={a => { const n = tokensNaArea({ ...a, id: 'x' }, tokensMapa).length
            void acao({ acao: 'area_criar', cenaId: cena.id, area: { ...a, id: crypto.randomUUID() } }).then(() => toast.success(`Área no mapa: ${n} alvo${n === 1 ? '' : 's'} dentro.`, { description: 'Para tirar, use a lista “Áreas no mapa”.' })).catch(() => {}) }}
          onPreviaArea={a => aoVivo('area', a ? 90 : 0, 'area', { id: e.eu, quem: nomes[e.eu] ?? '', a }, !a)}
          reguas={Object.values(reguas)} onRegua={g => aoVivo('regua', g ? 90 : 0, 'regua', { id: e.eu, nome: nomes[e.eu] ?? '', r: g }, !g)}
          paredes={paredesCena} tipoParede={tipoParede} formaParede={formaParede} gradeParede={gradeParede} comoJogador={comoJogador}
          visaoDinamica={!!cena.visao_dinamica} visaoAlcance={cena.visao_alcance ?? 0}
          onCriarParedes={ws => void acao({ acao: 'parede_criar', cenaId: cena.id, paredes: ws }).catch(() => {})}
          onApagarParede={id => void acao({ acao: 'parede_excluir', cenaId: cena.id, id }).catch(() => {})}
          onPorta={espectador ? undefined : id => { const w = paredesCena.find(x => x.id === id); void acao({ acao: 'porta', cenaId: cena.id, id }).then(() => toast(w?.aberta ? '🚪 Porta fechada.' : '🚪 Porta aberta.')).catch(() => {}) }}
          onArrastando={(id, x, y) => aoVivo('token:' + id, 60, 'token', { id, x, y })}
          onTracando={(id, pontos) => aoVivo('traco:' + id, 120, 'traco', { id, cor, pontos })}
          onCursor={(x, y) => aoVivo('cursor', 90, 'cursor', { id: e.eu, nome: nomes[e.eu] ?? '', x, y })} />
          : <div className="flex h-full items-center justify-center p-6 text-center text-(--a-b4aeca)">{admin ? 'Crie uma cena em "Mestre → Cenas e mapa" para começar.' : 'O mestre ainda não abriu nenhuma cena.'}</div>}

        {(pendentes.length > 0 || areasCena.length > 0) && <div className="absolute right-2 top-2 z-30 flex max-h-[calc(100%-5rem)] flex-col items-end gap-2">
          {pendentes.length > 0 && <DecisoesMestre pendentes={pendentes} acao={acao} />}
          {areasCena.length > 0 && cena && <ListaAreas areas={areasCena} tokens={tokensMapa} eu={e.eu} admin={admin} espectador={espectador}
            tirar={id => void acao({ acao: 'area_excluir', cenaId: cena.id, id }).catch(() => {})}
            limpar={() => void acao({ acao: 'areas_limpar', cenaId: cena.id }).catch(() => {})} dano={setDanoArea} />}
        </div>}
        {danoArea && <DanoEmVarios tokens={e.tokens} naOrdem={(e.mesa?.iniciativa ?? []).map(x => x.tokenId).filter((x): x is string => !!x)} acao={acao} fechar={() => setDanoArea(null)}
          inicial={tokensNaArea(danoArea, tokensMapa).map(t => t.id)} rotuloInicial={danoArea.nome} />}
        {ataque && <JanelaAtaque estado={ataque} mudar={setAtaque} tokens={e.tokens} ficha={fichaDoToken(ataque.atacante)} admin={admin} acao={acao}
          fechar={() => setAtaque(null)} aoAtacar={ev => destacar(ev as unknown as Evento)} />}
        <TocadorMesa estado={e.musica} desvio={desvio} aoTerminar={admin && e.musica?.por === e.eu ? () => { void api(`campanhas/${campanhaId}/musica`, { method: 'POST', body: { acao: 'proxima', auto: true } }).then(avisarMudanca).catch(() => {}) } : undefined} />

      </section>

      {painel && <motion.aside initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }} aria-label="Painel da mesa" className="fixed inset-x-0 bottom-14 z-40 flex h-[72dvh] flex-col rounded-t-2xl border-t border-(--a-55456e) bg-(--s-14121f) shadow-[0_-12px_40px_#000a] lg:static lg:z-auto lg:h-auto lg:w-[380px] lg:shrink-0 lg:rounded-none lg:border-l lg:border-t-0 lg:shadow-none">
        <div className="flex shrink-0 items-center gap-2 border-b border-(--a-373251) bg-(--s-17142a) px-3 py-2">
          <grupoAtual.icone size={17} className="text-(--a-b99bff)" /><h2 className="flex-1 font-bold">{grupoAtual.nome}</h2>
          <button type="button" onClick={() => setPainel(false)} aria-label="Recolher o painel" title="Recolher o painel" className="rounded-lg p-1.5 hover:bg-(--s-34294f)"><X size={18} /></button>
        </div>
        {grupoAtual.partes.length > 1 && <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-(--a-2b2540) px-2 py-1.5" role="tablist" aria-label={grupoAtual.nome}>
          {grupoAtual.partes.map(p => <button key={p.id} type="button" role="tab" aria-selected={p.id === parteAtual.id} onClick={() => { ultimaParte.current[grupoAtual.id] = p.id; setAba(p.id) }}
            className={'inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs ' + (p.id === parteAtual.id ? 'border-(--a-b99bff) bg-(--s-2b2143) text-white' : 'border-transparent text-(--a-b4aeca) hover:bg-(--s-241d38)')}><p.icone size={13} /> {p.nome}</button>)}
        </div>}
        <p className="flex shrink-0 items-start gap-1.5 border-b border-(--a-2b2540) bg-(--s-15122a) px-3 py-1.5 text-[11px] leading-snug text-(--a-a99bbb)"><CircleHelp size={13} className="mt-px shrink-0" /> {parteAtual.ajuda}</p>
        <motion.div key={parteAtual.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="min-h-0 flex-1 overflow-y-auto p-3">
          {parteAtual.id === 'fichas' && <PainelFichas fichas={fichasMesa} carregar={() => void carregarFichas()} tokens={e.tokens} admin={admin} cenaId={cena?.id ?? null} acao={acao} atacarCom={iniciarAtaque} abrirFicha={setFichaAberta} />}
          {parteAtual.id === 'tokens' && <PainelTokens e={e} admin={admin} acao={acao} campanhaId={campanhaId} abrir={setTokenAberto} />}
          {parteAtual.id === 'iniciativa' && <PainelIniciativa e={e} admin={admin} acao={acao} fichas={fichasMesa} atacar={iniciarAtaque} />}
          {parteAtual.id === 'sons' && <PainelSom som={mesaSom} admin={admin} />}
          {parteAtual.id === 'musica' && <PainelMusica campanhaId={campanhaId} eu={e.eu} admin={admin} espectador={espectador} tocando={e.musica} aoMudar={avisarMudanca} />}
          {parteAtual.id === 'campanha' && <PainelCampanha campanhaId={campanhaId} e={e} admin={admin} />}
          {parteAtual.id === 'biblioteca' && admin && <PainelBiblioteca campanhaId={campanhaId} e={e} />}
          {parteAtual.id === 'tabelas' && admin && <PainelTabelas campanhaId={campanhaId} acao={acao} />}
          {parteAtual.id === 'regras' && admin && sistemaDaCampanha(e.campanha.sistema ?? '') === 'dnd5e-srd' && <a href={'/mestre/dnd?campanha=' + campanhaId} className="mb-3 flex items-center gap-3 rounded-xl border border-(--a-b99bff)/60 bg-(--s-2b2140) p-3 text-sm hover:brightness-110">
            <span className="text-2xl" aria-hidden>🧰</span><span className="min-w-0 flex-1"><strong className="block text-white">Ferramentas do mestre (D&D 2024)</strong><span className="text-xs text-(--a-cfc0df)">Encontro pelo XP do grupo, CDs, XP e níveis, condições e conferir fichas.</span></span><span aria-hidden>→</span></a>}
          {parteAtual.id === 'mestre' && admin && <PainelMestre parte="cenas" e={e} acao={acao} campanhaId={campanhaId} setModo={setModo} />}
          {parteAtual.id === 'visao' && admin && <PainelMestre parte="visao" e={e} acao={acao} campanhaId={campanhaId} setModo={setModo} />}
          {parteAtual.id === 'regras' && admin && <><ConfigCombate acerto={e.combate?.acerto ?? 'mestre'} morte={e.combate?.morte ?? 'testes'} acao={acao} /><div className="h-3" /><DescansoGrupo acao={acao} carregar={() => void carregarFichas()} /></>}
        </motion.div>
      </motion.aside>}

      {chatAberto && <motion.aside initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }} aria-label="Chat da mesa" className="fixed inset-x-0 bottom-14 top-12 z-40 flex flex-col border-t border-(--a-55456e) bg-(--s-14121f) shadow-[0_-12px_40px_#000a] lg:static lg:z-auto lg:w-[360px] lg:shrink-0 lg:border-l lg:border-t-0 lg:shadow-none">
        <ChatMesa campanhaId={campanhaId} e={e} nomes={nomes} papelDe={papelDe} admin={admin} espectador={espectador} acao={acao} destacar={destacar} abrirHistorico={() => setHistorico(true)} recolher={fecharChat} />
      </motion.aside>}

      {/* Barra da mesa: no celular fica embaixo; no computador, na lateral direita. */}
      <nav aria-label="Barra da mesa" className="flex h-14 shrink-0 border-t border-(--a-373251) bg-(--s-17142a) lg:h-auto lg:w-[68px] lg:flex-col lg:border-l lg:border-t-0 lg:py-2">
        <button type="button" onClick={alternarChat} aria-pressed={chatAberto} aria-label={'Chat' + (novosChat ? ` (${novosChat} nova${novosChat > 1 ? 's' : ''})` : '')}
          className={'relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] lg:flex-none lg:py-2.5 ' + (chatAberto ? 'text-white' : 'text-(--a-b4aeca) hover:text-white')}>
          <span className={'rounded-full px-3 py-0.5 ' + (chatAberto ? 'bg-(--a-5b4380)' : '')}><MessageSquare size={19} /></span>Chat
          {novosChat > 0 && <span className="absolute right-[calc(50%-1.4rem)] top-1 min-w-5 rounded-full bg-[#e5484d] px-1 text-center text-[11px] font-bold leading-5 text-white lg:right-2">{novosChat > 99 ? '99+' : novosChat}</span>}
        </button>
        {grupos.map(g => { const ativo = painel && g.id === grupoAtual.id
          return <button key={g.id} type="button" onClick={() => abrirGrupo(g)} aria-pressed={ativo} aria-label={g.nome}
            className={'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] lg:flex-none lg:py-2.5 ' + (ativo ? (g.id === 'mestre' ? 'text-amber-100' : 'text-white') : 'text-(--a-b4aeca) hover:text-white')}>
            <span className={'rounded-full px-3 py-0.5 ' + (ativo ? (g.id === 'mestre' ? 'bg-[#5a4320]' : 'bg-(--a-5b4380)') : '')}><g.icone size={19} /></span><span className="max-w-full truncate">{g.nome}</span></button> })}
      </nav>
    </div>

    {(() => { const papel = admin ? 'mestre' : espectador ? 'espectador' : 'jogador'
      return <DicasMesa papel={papel} aberto={dicas === 'aberto' || (dicas === 'auto' && deveMostrarDicas(papel))} fechar={() => setDicas('fechado')} /> })()}
    {token && <TokenModal t={token} admin={admin} eu={e.eu} acao={acao} campanhaId={campanhaId} regraMorte={e.combate?.morte ?? 'testes'} fechar={() => setTokenAberto(null)}
      atacar={!espectador && (admin || token.dono_id === e.eu) ? () => { setTokenAberto(null); iniciarAtaque(token.id) } : undefined}
      abrirFicha={!espectador && (token.ficha_id || token.ficha_modelo) && (admin || token.dono_id === e.eu) && e.fichas.some(f => f.id === (token.ficha_id ?? token.ficha_modelo)) ? () => { setTokenAberto(null); setFichaAberta(token.ficha_id ?? token.ficha_modelo ?? null) } : undefined} />}
    {fichaAberta && <FichaNaMesa ref={iframeFicha} fichas={e.fichas} aberta={fichaAberta} trocar={setFichaAberta} fechar={() => setFichaAberta(null)} />}
    {historico && <Historico campanhaId={campanhaId} membros={e.membros} fechar={() => setHistorico(false)} />}
  </div></MotionConfig>
}

function PainelMestre({ parte, e, acao, campanhaId, setModo }: { parte: 'cenas' | 'visao'; e: Estado; acao: Acao; campanhaId: string; setModo: (m: ModoMesa) => void }) {
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
    try { const { url, ar } = await enviarImagem(campanhaId, e.eu, arq); setNova(n => ({ ...n, mapa_url: url, enviado: true, grid_rows: Math.max(5, Math.min(MAX_GRADE, Math.round(n.grid_cols * ar))) })); toast.success('Mapa enviado! Depois de criar a cena, use ✂️ Recortar para escolher a parte da imagem.') }
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
  const PRESETS: [string, number, number][] = [['Pequeno', 15, 10], ['Médio', 25, 18], ['Grande', 40, 28], ['Enorme', 60, 40], ['Região', 100, 70], ['Mundo', 200, 140]]

  return <div className="space-y-5 text-sm">
    {parte === 'cenas' && <>
    <section className="space-y-2">
      <h3 className="font-semibold">🎬 Cenas</h3>
      <ul className="space-y-1">{e.cenas.map(c => <li key={c.id} className={'flex flex-wrap items-center gap-2 rounded-lg p-2 ' + (c.ativa ? 'bg-(--a-5b4380)' : 'bg-(--s-1e1a30)')}>
        <span className="flex-1 truncate">{c.nome}{c.ativa && ' · na mesa'}</span>
        {!c.ativa && <button type="button" className={btn} onClick={() => acao({ acao: 'cena_ativar', cenaId: c.id })}>Mostrar</button>}
        <button type="button" aria-label={'Excluir ' + c.nome} className={btn} onClick={() => { if (window.confirm(`Excluir a cena "${c.nome}" e seus tokens?`)) void acao({ acao: 'cena_excluir', cenaId: c.id }) }}><Trash2 size={14} /></button>
      </li>)}</ul>
      <form className="space-y-2 rounded-lg border border-(--a-373251) p-2" onSubmit={criarCena}>
        <input required aria-label="Nome da cena" value={nova.nome} onChange={x => setNova({ ...nova, nome: x.target.value })} placeholder="Nova cena (ex.: Saloon)" className={input} />
        <label className={btn + ' cursor-pointer'}><ImageIcon size={14} /> {enviando === 'nova' ? 'Enviando…' : nova.enviado ? 'Mapa escolhido ✓ (trocar)' : 'Mapa do aparelho (opcional)'}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={x => { const f = x.target.files?.[0]; if (f) void fundoNovaCena(f); x.target.value = '' }} /></label>
        {!nova.enviado && <input aria-label="Link da imagem do mapa" value={nova.mapa_url} onChange={x => setNova({ ...nova, mapa_url: x.target.value })} placeholder="ou cole um link https://…" className={input} />}
        <div className="flex items-center gap-2"><span>Tamanho</span><input aria-label="Colunas" type="number" min={5} max={MAX_GRADE} value={nova.grid_cols} onChange={x => setNova({ ...nova, grid_cols: Number(x.target.value) })} className={input + ' !w-20'} />×
          <input aria-label="Linhas" type="number" min={5} max={MAX_GRADE} value={nova.grid_rows} onChange={x => setNova({ ...nova, grid_rows: Number(x.target.value) })} className={input + ' !w-20'} /></div>
        <button type="submit" className={btn}><Plus size={14} /> Criar cena</button>
      </form>
    </section>

    {cena && <section className="space-y-2">
      <h3 className="font-semibold">📐 Tamanho do mapa</h3>
      <div className="flex flex-wrap gap-1">{PRESETS.map(([n, c, r]) => <button key={n} type="button" onClick={() => setTam({ c, r })} className={btn + (tam.c === c && tam.r === r ? ' bg-(--a-5b4380)' : '')}>{n} {c}×{r}</button>)}</div>
      <div className="flex flex-wrap items-center gap-2">
        <input aria-label="Colunas do mapa" type="number" min={5} max={MAX_GRADE} value={tam.c} onChange={x => setTam({ ...tam, c: Number(x.target.value) })} className={input + ' !w-20'} />×
        <input aria-label="Linhas do mapa" type="number" min={5} max={MAX_GRADE} value={tam.r} onChange={x => setTam({ ...tam, r: Number(x.target.value) })} className={input + ' !w-20'} />
        <span className="text-xs text-(--a-b4aeca)">≈ {Math.round(tam.c * 1.5)} × {Math.round(tam.r * 1.5)} m</span>
        <button type="button" className={btn} disabled={tam.c === cena.grid_cols && tam.r === cena.grid_rows} onClick={() => acao({ acao: 'cena_editar', cenaId: cena.id, grid_cols: tam.c, grid_rows: tam.r }).catch(() => {})}>Aplicar</button>
      </div>
      <p className="text-xs text-(--a-b4aeca)">Cada quadrado vale 1,5 m, até {MAX_GRADE} × {MAX_GRADE} ({MAX_GRADE * 1.5} m de lado). Diminuir o mapa não apaga tokens; eles ficam na borda.</p>
    </section>}

    {cena && <section className="space-y-2">
      <h3 className="font-semibold">🖼️ Imagens do mapa</h3>
      {cena.mapa_url && <div className="rounded-lg border border-(--a-5e4b78) p-2 text-xs">Esta cena usa um fundo antigo (não recortável).
        <button type="button" className={btn + ' ml-2'} onClick={() => acao({ acao: 'cena_editar', cenaId: cena.id, mapa_url: null, camadas: [{ id: crypto.randomUUID(), url: cena.mapa_url, x: 0, y: 0, w: cena.grid_cols, h: cena.grid_rows }, ...camadas] }).catch(() => {})}>Tornar editável</button></div>}
      <ul className="space-y-1">{camadas.map((c, i) => <li key={c.id} className="flex items-center gap-2 rounded-lg bg-(--s-1e1a30) p-2">
        <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded bg-(--s-100f20)">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.url} alt="" className="absolute max-w-none" style={{ width: 100 / (c.cw ?? 1) + '%', height: 100 / (c.ch ?? 1) + '%', left: -((c.cx ?? 0) / (c.cw ?? 1)) * 100 + '%', top: -((c.cy ?? 0) / (c.ch ?? 1)) * 100 + '%' }} /></span>
        <span className="flex-1 text-xs text-(--a-c4b6d4)">Imagem {i + 1} · {c.w}×{c.h}{c.cw ? ' · recortada' : ''}</span>
        <button type="button" className={btn} onClick={() => setRecortar(c)} title="Escolher a parte da imagem">✂️</button>
        <button type="button" className={btn} title="Ocupar o mapa inteiro" onClick={() => salvar(camadas.map(x => x.id === c.id ? { ...x, x: 0, y: 0, w: cena.grid_cols, h: cena.grid_rows } : x))}>⛶</button>
        <button type="button" className={btn} aria-label="Remover imagem" onClick={() => salvar(camadas.filter(x => x.id !== c.id))}><Trash2 size={14} /></button>
      </li>)}</ul>
      <label className={btn + ' cursor-pointer'}><ImageIcon size={14} /> {enviando === 'camada' ? 'Enviando…' : 'Adicionar imagens (várias)'}
        <input type="file" multiple accept="image/png,image/jpeg,image/webp" className="hidden" onChange={x => { if (x.target.files?.length) void adicionarCamadas(x.target.files); x.target.value = '' }} /></label>
      <p className="text-xs text-(--a-b4aeca)">✂️ escolhe a parte da imagem · ⛶ estica a imagem no mapa todo · <Layers size={12} className="inline" /> “Montar mapa” (no canto do mapa) arrasta e redimensiona.</p>
    </section>}

    </>}
    {parte === 'visao' && !cena && <p className="text-(--a-b4aeca)">Nenhuma cena na mesa ainda. Crie ou mostre uma em Cenas e mapa.</p>}
    {parte === 'visao' && <>
    {cena && <section className="space-y-2">
      <h3 className="font-semibold">👁️ O que os jogadores veem</h3>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn} onClick={() => acao({ acao: 'cena_editar', cenaId: cena.id, fog_ativo: !cena.fog_ativo })}><CloudFog size={14} /> {cena.fog_ativo ? 'Desligar névoa' : 'Ligar névoa'}</button>
        {cena.fog_ativo && <>
          <button type="button" className={btn} onClick={() => acao({ acao: 'cena_editar', cenaId: cena.id, nevoa_tudo: true })}><Eye size={14} /> Revelar tudo</button>
          <button type="button" className={btn} onClick={() => acao({ acao: 'cena_editar', cenaId: cena.id, fog_limpar: true })}><EyeOff size={14} /> Esconder tudo</button></>}
      </div>
      {cena.fog_ativo && <p className="text-xs text-(--a-b4aeca)">No canto do mapa: <SquareDashed size={12} className="inline" /> marca as partes que têm névoa (salas, cavernas…) e revela cada uma com um toque; <Eye size={12} className="inline" /> pincel (1×1, 3×3, 5×5) e <Square size={12} className="inline" /> retângulo revelam ou escondem pedaços.</p>}
      <VisaoPersonagens cena={cena} acao={acao} />
      {cena.fog_ativo && <AreasNevoa cena={cena} acao={acao} setModo={setModo} />}
      <Iluminacao key={cena.id + ':' + (cena.escuridao ?? 0)} cena={cena} acao={acao} />
      <button type="button" className={btn} onClick={() => acao({ acao: 'cena_editar', cenaId: cena.id, tokens_travados: !cena.tokens_travados })}>{cena.tokens_travados ? <><LockOpen size={14} /> Destravar tokens dos jogadores</> : <><Lock size={14} /> Travar tokens dos jogadores</>}</button>
    </section>}

    </>}
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
  if (!cena) return <p className="text-sm text-(--a-b4aeca)">Nenhuma cena aberta ainda.</p>
  const meus = e.tokens.filter(t => t.dono_id === e.eu)
  const lista = admin ? e.tokens : e.tokens.filter(t => t.visivel)
  const minhasFichas = e.fichas.filter(f => admin || f.dono_id === e.eu)
  async function foto(arq: File) {
    setEnviando(true)
    try { const { url } = await enviarImagem(campanhaId, e.eu, arq); setTk(t => ({ ...t, imagem_url: url })); toast.success('Imagem pronta!') } catch (er) { toast.error(msg(er)) } finally { setEnviando(false) }
  }
  return <div className="space-y-4 text-sm">
    <ul className="space-y-1">{lista.map(t => <li key={t.id}>
      <button type="button" onClick={() => abrir(t.id)} className="flex w-full items-center gap-2 rounded-lg bg-(--s-1e1a30) p-2 text-left hover:bg-(--s-2b2140)">
        <span className="h-6 w-6 shrink-0 rounded-full bg-cover bg-center" style={{ background: t.imagem_url ? `center/cover url(${t.imagem_url})` : t.cor }} />
        <span className="flex-1 truncate">{t.nome}{t.dono_id === e.eu && ' (meu)'}</span>
        <span className="text-[11px] text-(--a-b4aeca)">{t.movimento === 'mestre' ? '🔒' : t.movimento === 'todos' ? '👥' : ''}{!t.visivel && ' 🙈'}{t.hp_max ? ` ${t.hp_atual}/${t.hp_max}` : ''}</span>
      </button>
      {admin && <button type="button" className={btn + ' mt-1 !px-2 !py-1 text-xs'} title={'Duplicar ' + t.nome} onClick={() => {
        const fichaId = t.npc ? (t.ficha_modelo ?? t.ficha_id) : null
        void acao({ acao: 'token_criar', cenaId: cena.id, nome: t.nome + ' (cópia)',
          ...(fichaId ? { fichaId, copia: true } : {}),
          npc: t.npc, cor: t.cor, imagem_url: t.imagem_url, hp_max: t.hp_max,
          visivel: t.visivel, movimento: t.movimento, tamanho: t.tamanho, luz: t.luz,
          x: Math.min(cena.grid_cols - 1, t.x + 1), y: t.y
        }).then(() => toast.success('Token duplicado na cena.')).catch(err => toast.error(msg(err)))
      }}><Plus size={12} /> Duplicar token</button>}
      </li>)}</ul>
    {lista.length === 0 && <p className="text-(--a-b4aeca)">Nenhum token nesta cena.</p>}
    <form className="space-y-2 rounded-lg border border-(--a-373251) p-2" onSubmit={x => {
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
        <input aria-label="PV máximo" value={tk.hp_max} onChange={x => setTk({ ...tk, hp_max: x.target.value })} inputMode="numeric" placeholder="PV" className={input + ' !w-20'} />
        <input aria-label="Cor" type="color" value={tk.cor} onChange={x => setTk({ ...tk, cor: x.target.value })} className="h-9 w-12 rounded" />
        <label className={btn + ' cursor-pointer'}><ImageIcon size={14} /> {enviando ? 'Enviando…' : tk.imagem_url ? 'Imagem ✓' : 'Imagem'}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={x => { const f = x.target.files?.[0]; if (f) void foto(f); x.target.value = '' }} /></label>
      </div>
      {admin && <div className="grid grid-cols-2 gap-2">
        <select aria-label="Quem move" value={tk.movimento} onChange={x => setTk({ ...tk, movimento: x.target.value })} className={input}>{Object.entries(MOVIMENTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select aria-label="Tamanho" value={tk.tamanho} onChange={x => setTk({ ...tk, tamanho: Number(x.target.value) })} className={input}><option value={1}>Tamanho 1×1</option><option value={2}>Grande 2×2</option><option value={3}>Enorme 3×3</option><option value={4}>Colossal 4×4</option></select>
        <label className="col-span-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={!tk.visivel} onChange={x => setTk({ ...tk, visivel: !x.target.checked })} /> Escondido dos jogadores</label>
      </div>}
      <button type="submit" className={btn}><Plus size={14} /> Colocar na mesa</button>
      {!admin && <p className="text-xs text-(--a-b4aeca)">Até 3 tokens seus por cena. O mestre pode travar o movimento.</p>}
    </form>
  </div>
}

function TokenModal({ t, admin, eu, acao, campanhaId, fechar, atacar, abrirFicha, regraMorte }: { t: Token; admin: boolean; eu: string; acao: Acao; campanhaId: string; fechar: () => void; atacar?: () => void; abrirFicha?: () => void; regraMorte: 'desligado' | 'testes' | 'desesperadas' }) {
  const pode = admin || t.dono_id === eu
  const [dano, setDano] = useState('')
  const hp = t.hp_atual ?? 0
  return <NaTela><div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4" role="dialog" aria-modal="true" aria-label={'Token ' + t.nome} onClick={fechar}>
    <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-(--a-62527e) bg-(--s-19172c) p-4" onClick={x => x.stopPropagation()}>
      <div className="flex items-center gap-2"><span className="h-8 w-8 rounded-full" style={{ background: t.imagem_url ? `center/cover url(${t.imagem_url})` : t.cor }} /><h2 className="flex-1 font-bold">{t.nome}</h2>
        <button type="button" onClick={fechar} aria-label="Fechar" className="rounded p-1 hover:bg-(--s-34294f)"><X size={18} /></button></div>
      {atacar && <button type="button" onClick={atacar} className="mt-3 w-full rounded-xl bg-gradient-to-r from-[#b91c1c] to-(--a-7c3aed) p-2.5 font-bold shadow-[0_0_14px_#b91c1c55]">⚔️ Atacar</button>}
      {abrirFicha && <button type="button" onClick={abrirFicha} className={btn + ' mt-2 w-full justify-center'}><ScrollText size={14} /> Abrir a ficha (poderes, itens, testes)</button>}
      {t.ficha_id && <p className="mt-2 text-[11px] text-(--a-a99bbb)">📜 Ligado a uma ficha: a vida é a da ficha.</p>}
      {t.ficha_modelo && <p className="mt-2 text-[11px] text-(--a-a99bbb)">👥 Cópia de uma ficha de NPC: ataques, testes e imagem vêm dela; a vida é deste token.</p>}
      {t.ficha_id && !t.hp_max && !hp && <p className="mt-2 rounded-lg bg-[#3a2a14]/80 p-2 text-[11px] text-[#f6dca8]">⚠️ A ficha está com a vida zerada e sem máximo. Preencha a vida na ficha para o dano contar.</p>}
      {t.hp_max ? <div className="mt-3"><p className="text-sm">PV <strong>{hp} / {t.hp_max}</strong></p>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-(--s-2b2140)"><div className="h-full bg-(--a-b06ad8)" style={{ width: Math.max(0, Math.min(100, hp / t.hp_max * 100)) + '%' }} /></div>
        {pode && <div className="mt-2 flex gap-2"><input aria-label="Quantidade" value={dano} onChange={x => setDano(x.target.value)} inputMode="numeric" placeholder="Qtd." className={input + ' !w-20'} />
          <button type="button" className={btn} onClick={() => { void acao({ acao: 'token_editar', tokenId: t.id, hp_atual: hp - (Number(dano) || 0) }).catch(() => {}); setDano('') }}>− Dano</button>
          <button type="button" className={btn} onClick={() => { void acao({ acao: 'token_editar', tokenId: t.id, hp_atual: Math.min(t.hp_max ?? hp, hp + (Number(dano) || 0)) }).catch(() => {}); setDano('') }}>+ Cura</button></div>}
        {pode && hp < (t.hp_max ?? 0) && <button type="button" className={btn + ' mt-2'} onClick={() => void acao({ acao: 'token_editar', tokenId: t.id, hp_atual: t.hp_max }).catch(() => {})}>❤️ Vida cheia ({t.hp_max})</button>}
      </div> : null}
      {t.hp_max ? <PainelMorte nome={t.nome} m={t.morte ?? {}} regra={regraMorte} admin={admin} pode={pode} vida={t.hp_atual} acao={acao} tokenId={t.id} /> : null}
      <p className="mt-3 text-sm font-semibold">Condições</p>
      <div className="mt-1 flex flex-wrap gap-1">{condicoesDisponiveis.map(c => { const ativa = t.condicoes.includes(c.id)
        return <button key={c.id} type="button" disabled={!pode} aria-pressed={ativa} onClick={() => acao({ acao: 'token_editar', tokenId: t.id, condicoes: ativa ? t.condicoes.filter(x => x !== c.id) : [...t.condicoes, c.id] }).catch(() => {})}
          className={'rounded-full border px-2 py-1 text-xs ' + (ativa ? 'border-(--a-b99bff) bg-(--a-5b4380)' : 'border-(--a-5e4b78)')}>{c.emoji} {c.nome}</button> })}</div>
      {t.condicoes.length > 0 && <div className="mt-2 space-y-1 rounded-lg bg-(--s-1e1a30) p-2 text-xs">
        <p className="text-(--a-c4b6d4)">Quanto tempo dura? A contagem desce no fim de cada turno de {t.nome}.</p>
        {t.condicoes.map(c => { const n = t.condicoes_rodadas?.[c] ?? 0
          return <div key={c} className="flex flex-wrap items-center gap-2 border-t border-(--a-2b2140) pt-1.5 first-of-type:border-0"><span className="min-w-24 flex-1">{emojiCondicao[c]} {nomeCondicao(c)}</span>
            <select aria-label={'Duração de ' + nomeCondicao(c)} disabled={!pode} value={n} onChange={x => acao({ acao: 'token_editar', tokenId: t.id, rodadas: { ...(t.condicoes_rodadas ?? {}), [c]: Number(x.target.value) } }).catch(() => {})} className={input + ' !w-auto !py-1'}>
              <option value={0}>Sem limite</option>{[1, 2, 3, 4, 5, 6, 8, 10].map(k => <option key={k} value={k}>{k} {k === 1 ? 'rodada' : 'rodadas'}</option>)}
            </select>
            <DanoPorTurno key={c + (t.condicoes_dano?.[c] ?? '')} valor={t.condicoes_dano?.[c] ?? ''} nome={nomeCondicao(c)} pode={pode}
              salvar={v => acao({ acao: 'token_editar', tokenId: t.id, danos: { ...(t.condicoes_dano ?? {}), [c]: v } }).catch(() => {})} /></div> })}
        <p className="text-[11px] text-(--a-a998bd)">💥 Dano por turno: rolado no começo do turno de {t.nome} e tirado da vida dele. Deixe vazio para não causar dano.</p>
      </div>}
      {pode && <LuzDoToken key={JSON.stringify(t.luz ?? null)} t={t} acao={acao} />}
      {pode && <VisaoDoToken key={'v' + JSON.stringify(t.visao ?? null)} t={t} acao={acao} />}
      {pode && <label className={btn + ' mt-3 cursor-pointer'}><ImageIcon size={14} /> Trocar imagem do token<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={async x => {
        const f = x.target.files?.[0]; x.target.value = ''; if (!f) return
        try { const { url } = await enviarImagem(campanhaId, eu, f); await acao({ acao: 'token_editar', tokenId: t.id, imagem_url: url }) } catch (er) { toast.error(msg(er)) }
      }} /></label>}
      {admin && <div className="mt-3 space-y-2 border-t border-(--a-373251) pt-3">
        <p className="text-sm font-semibold">Controle do mestre</p>
        <select aria-label="Quem move este token" value={t.movimento ?? 'dono'} onChange={x => acao({ acao: 'token_editar', tokenId: t.id, movimento: x.target.value }).catch(() => {})} className={input}>{Object.entries(MOVIMENTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select aria-label="Tamanho do token" value={t.tamanho ?? 1} onChange={x => acao({ acao: 'token_editar', tokenId: t.id, tamanho: Number(x.target.value) }).catch(() => {})} className={input}><option value={1}>Tamanho 1×1</option><option value={2}>Grande 2×2</option><option value={3}>Enorme 3×3</option><option value={4}>Colossal 4×4</option></select>
        <div className="flex gap-2"><button type="button" className={btn} onClick={() => acao({ acao: 'token_editar', tokenId: t.id, visivel: !t.visivel }).catch(() => {})}>{t.visivel ? <><EyeOff size={14} /> Esconder</> : <><Eye size={14} /> Mostrar</>}</button>
          <button type="button" className={btn} onClick={() => { void acao({ acao: 'token_excluir', tokenId: t.id }).catch(() => {}); fechar() }}><Trash2 size={14} /> Remover</button></div>
      </div>}
      {!pode && <p className="mt-3 flex items-center gap-1 text-xs text-(--a-b4aeca)"><Lock size={12} /> Só o mestre ou o dono deste token altera.</p>}
    </div>
  </div></NaTela>
}

/** Áreas de efeito que estão no mapa (v0.34.9): quantos alvos cada uma pega, tirar e, para o mestre, dano nos atingidos. */
function ListaAreas({ areas, tokens, eu, admin, espectador, tirar, limpar, dano }: { areas: AreaEfeito[]; tokens: TokenMapa[]; eu: string; admin: boolean; espectador: boolean
  tirar: (id: string) => void; limpar: () => void; dano: (a: AreaEfeito) => void }) {
  const [aberto, setAberto] = useState(false)
  return <section aria-label="Áreas no mapa" className={(aberto ? 'w-[min(18rem,calc(100vw-1rem))] ' : 'w-auto ') + 'rounded-xl border border-(--a-55456e) bg-(--s-19172c)/95 text-sm shadow-xl'}>
    <button type="button" onClick={() => setAberto(a => !a)} aria-expanded={aberto} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-semibold">
      <Flame size={14} className="text-orange-300" /><span className="flex-1 whitespace-nowrap">Áreas no mapa ({areas.length})</span><span aria-hidden>{aberto ? '▲' : '▼'}</span></button>
    {aberto && <div className="space-y-1.5 px-2 pb-2">
      <ul className="max-h-[30vh] space-y-1 overflow-y-auto">{areas.map(a => { const f = FORMAS_AREA.find(x => x.id === a.forma), n = tokensNaArea(a, tokens).length
        return <li key={a.id} className="flex items-center gap-1.5 rounded-lg bg-(--s-151123) px-2 py-1">
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: a.cor }} aria-hidden />
          <span className="min-w-0 flex-1 truncate text-xs">{a.nome || f?.nome} · {a.metros} m · {n} alvo{n === 1 ? '' : 's'}</span>
          {admin && n > 0 && <button type="button" onClick={() => dano(a)} title="Dano ou cura nos atingidos" aria-label="Dano ou cura nos atingidos" className="rounded-md px-1.5 py-0.5 text-xs hover:bg-(--s-34294f)">💥</button>}
          {!espectador && (admin || a.autor_id === eu) && <button type="button" onClick={() => tirar(a.id)} title="Tirar a área" aria-label="Tirar a área" className="rounded-md p-1 hover:bg-(--s-34294f)"><Trash size={13} /></button>}
        </li> })}</ul>
      {admin && areas.length > 1 && <button type="button" onClick={limpar} className={btn + ' w-full justify-center'}>Tirar todas</button>}
    </div>}
  </section>
}

function Historico({ campanhaId, membros, fechar }: { campanhaId: string; membros: Estado['membros']; fechar: () => void }) {
  return <NaTela><div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4" role="dialog" aria-modal="true" aria-label="Histórico de rolagens">
    <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-(--a-62527e) bg-(--s-19172c) p-4">
      <div className="mb-2 flex items-center justify-between gap-2"><h2 className="font-bold">📜 Histórico de rolagens</h2>
        <a href={'/rolagens?campanha=' + campanhaId} className="ml-auto text-xs text-(--a-c7a8ff) underline">Abrir em tela cheia</a>
        <button type="button" onClick={fechar} aria-label="Fechar" className="rounded p-1 hover:bg-(--s-34294f)"><X size={18} /></button></div>
      <HistoricoRolagens campanhaId={campanhaId} membros={membros} />
    </div>
  </div></NaTela>
}

/** Campo do dano por turno de uma condição (salva ao sair do campo ou com Enter). */
function DanoPorTurno({ valor, nome, pode, salvar }: { valor: string; nome: string; pode: boolean; salvar: (v: string) => void }) {
  const [v, setV] = useState(valor)
  const enviar = () => { if (v.trim().toLowerCase() !== valor) salvar(v.trim().toLowerCase()) }
  return <label className="flex items-center gap-1 text-[11px]">💥<input aria-label={'Dano por turno de ' + nome} disabled={!pode} value={v} maxLength={20} placeholder="sem dano"
    onChange={x => setV(x.target.value)} onBlur={enviar} onKeyDown={x => { if (x.key === 'Enter') { x.preventDefault(); (x.target as HTMLInputElement).blur() } }} className={input + ' !w-20 !py-1 font-mono'} /></label>
}

/** Visão dos personagens (v0.35.0): a névoa se abre sozinha pelo que os tokens dos jogadores enxergam. */
function VisaoPersonagens({ cena, acao }: { cena: Cena; acao: Acao }) {
  const ligada = !!cena.visao_dinamica
  return <div className="space-y-2 rounded-xl border border-(--a-3d3152) p-3">
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={ligada}
      onChange={x => void acao({ acao: 'cena_editar', cenaId: cena.id, visao_dinamica: x.target.checked }).catch(() => {})} />
      <span><strong>👁️ Visão dos personagens</strong><span className="block text-xs text-(--a-b4aeca)">A névoa se abre sozinha pelo que os personagens dos jogadores enxergam. Paredes e portas fechadas bloqueiam; janelas deixam ver. O que já foi visto continua aparecendo, mais escuro, e os inimigos só aparecem quando estão à vista.</span></span></label>
    {ligada && <label className="flex flex-wrap items-center gap-2 text-xs">Até onde enxergam
      <select value={cena.visao_alcance ?? 0} onChange={x => void acao({ acao: 'cena_editar', cenaId: cena.id, visao_alcance: Number(x.target.value) }).catch(() => {})} className={input + ' !w-auto'}>
        {[[0, 'Sem limite (até as paredes)'], [9, '9 m'], [18, '18 m'], [27, '27 m'], [36, '36 m'], [60, '60 m']].map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></label>}
    {ligada && <p className="text-[11px] text-(--a-b4aeca)">🌑 Com a escuridão da cena em 50 ou mais, cada personagem só vê o que alguma luz ilumina ou o que está dentro da visão no escuro dele. A luz e a visão de cada um se ajustam tocando no token.</p>}
    {ligada && <p className="text-[11px] text-(--a-b4aeca)">Para começar uma área do zero, use “Esconder tudo”: a névoa volta e se abre de novo onde os personagens estão.</p>}
  </div>
}

/** Partes do mapa com névoa (v0.33.8): cada área revela/esconde com um toque. */
function AreasNevoa({ cena, acao, setModo }: { cena: Cena; acao: Acao; setModo: (m: ModoMesa) => void }) {
  const areas = cena.fog_areas ?? []
  const salvar = (novas: AreaNevoa[]) => acao({ acao: 'cena_editar', cenaId: cena.id, fog_areas: novas }).catch(() => {})
  return <div className="space-y-1.5 rounded-lg border border-(--a-373251) p-2">
    <div className="flex flex-wrap items-center gap-2">
      <p className="flex-1 text-xs font-semibold">Partes com névoa {areas.length ? `(${areas.length})` : ''}</p>
      <button type="button" className={btn} onClick={() => setModo('nevoa-area')}><SquareDashed size={14} /> Marcar no mapa</button>
    </div>
    {!areas.length && <p className="text-[11px] text-(--a-b4aeca)">Sem partes marcadas: a névoa cobre o mapa todo. Marque salas ou regiões para a névoa ficar só nelas.</p>}
    <ul className="space-y-1">{areas.map(a => <li key={a.id} className="flex flex-wrap items-center gap-1.5 rounded bg-(--s-1e1a30) p-1.5">
      <input aria-label="Nome da área" defaultValue={a.nome} maxLength={40} onBlur={x => { if (x.target.value !== a.nome) void salvar(areas.map(y => y.id === a.id ? { ...y, nome: x.target.value } : y)) }} className={input + ' !w-auto min-w-0 flex-1 !py-1'} />
      <span className="text-[11px] text-(--a-b4aeca)">{a.w}×{a.h}</span>
      <button type="button" className={btn} aria-pressed={a.revelada} onClick={() => void salvar(areas.map(y => y.id === a.id ? { ...y, revelada: !y.revelada } : y))}>{a.revelada ? <><Eye size={14} /> Revelada</> : <><CloudFog size={14} /> Com névoa</>}</button>
      <button type="button" className={btn} aria-label={'Apagar ' + (a.nome || 'área')} onClick={() => void salvar(areas.filter(y => y.id !== a.id))}><Trash2 size={14} /></button>
    </li>)}</ul>
  </div>
}

/** Escuridão da cena e a luz dos personagens (v0.33.8). */
function Iluminacao({ cena, acao }: { cena: Cena; acao: Acao }) {
  const [esc, setEsc] = useState(cena.escuridao ?? 0)
  return <div className="space-y-1.5 rounded-lg border border-(--a-373251) p-2">
    <label className="flex flex-wrap items-center gap-2 text-xs font-semibold"><Sun size={14} /> Escuridão da cena
      <input type="range" min={0} max={100} step={5} value={esc} onChange={x => setEsc(Number(x.target.value))} onPointerUp={() => void acao({ acao: 'cena_editar', cenaId: cena.id, escuridao: esc }).catch(() => {})}
        onKeyUp={() => void acao({ acao: 'cena_editar', cenaId: cena.id, escuridao: esc }).catch(() => {})} className="min-w-32 flex-1 accent-(--a-b99bff)" aria-valuetext={esc + '%'} />
      <span className="w-20 text-right font-normal text-(--a-c4b6d4)">{esc === 0 ? 'Dia claro' : esc < 40 ? 'Penumbra' : esc < 80 ? 'Noite' : 'Breu'} {esc}%</span></label>
    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={cena.luz_revela_nevoa !== false} onChange={x => void acao({ acao: 'cena_editar', cenaId: cena.id, luz_revela_nevoa: x.target.checked }).catch(() => {})} />
      A luz dos personagens dos jogadores tira a névoa por onde eles passam</label>
    <p className="text-[11px] text-(--a-b4aeca)">A luz de cada token (tocha, lanterna, magia) é definida no próprio token: toque nele no mapa. Você vê a escuridão mais clara para conseguir trabalhar.</p>
  </div>
}

/** Visão de cada personagem (v0.35.2): até onde enxerga e visão no escuro (elfo, anão, criaturas da noite…). */
const VISOES_PRONTAS: { nome: string; escuro: number }[] = [{ nome: 'Normal', escuro: 0 }, { nome: 'No escuro 9 m', escuro: 9 }, { nome: 'No escuro 18 m', escuro: 18 }, { nome: 'No escuro 36 m', escuro: 36 }]
function VisaoDoToken({ t, acao }: { t: Token; acao: Acao }) {
  const v = normalizarVisao(t.visao)
  const [alcance, setAlcance] = useState(v?.alcance ?? 0), [escuro, setEscuro] = useState(v?.escuro ?? 0)
  const salvar = (n: { alcance: number; escuro: number }) => acao({ acao: 'token_editar', tokenId: t.id, visao: n.alcance || n.escuro ? n : null }).catch(() => {})
  return <div className="mt-3 space-y-2 rounded-lg bg-(--s-1e1a30) p-2 text-xs">
    <p className="flex items-center gap-1 text-sm font-semibold"><Eye size={14} /> Visão do personagem <span className="font-normal text-(--a-c4b6d4)">· {v?.alcance ? `até ${v.alcance} m` : 'alcance da cena'}{v?.escuro ? ` · no escuro ${v.escuro} m` : ''}</span></p>
    <p className="text-[11px] text-(--a-b4aeca)">Vale quando o mestre liga a “Visão dos personagens”. Com a cena escura, cada um só vê o que a luz alcança, ou até onde a visão no escuro dele vai.</p>
    <div className="flex flex-wrap gap-1">{VISOES_PRONTAS.map(x => <button key={x.nome} type="button" aria-pressed={(v?.escuro ?? 0) === x.escuro} className={btn + ' !px-2 !py-1 text-xs' + ((v?.escuro ?? 0) === x.escuro ? ' !border-(--a-b99bff)' : '')}
      onClick={() => { setEscuro(x.escuro); void salvar({ alcance, escuro: x.escuro }) }}>{x.nome}</button>)}</div>
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1">Enxerga até <select value={alcance} onChange={x => setAlcance(Number(x.target.value))} className={input + ' !w-auto !py-1'}>
        {[[0, 'o da cena'], [9, '9 m'], [18, '18 m'], [27, '27 m'], [36, '36 m'], [60, '60 m']].map(([n, rot]) => <option key={n} value={n}>{rot}</option>)}</select></label>
      <label className="flex items-center gap-1">No escuro <input type="number" min={0} max={120} step={1.5} value={escuro} onChange={x => setEscuro(Number(x.target.value))} className={input + ' !w-16 !py-1'} /> m</label>
      <button type="button" className={btn + ' !py-1'} onClick={() => void salvar({ alcance, escuro })}>Aplicar</button>
    </div>
  </div>
}

/** Luz própria do token: luz plena e penumbra em metros, e a cor. */
function LuzDoToken({ t, acao }: { t: Token; acao: Acao }) {
  const luz = t.luz ?? null
  const [b, setB] = useState(luz?.brilho ?? 0), [pe, setPe] = useState(luz?.penumbra ?? 0), [cor, setCor] = useState(luz?.cor ?? '#ffd27a')
  const salvar = (v: { brilho: number; penumbra: number; cor: string } | null) => acao({ acao: 'token_editar', tokenId: t.id, luz: v }).catch(() => {})
  return <div className="mt-3 space-y-2 rounded-lg bg-(--s-1e1a30) p-2 text-xs">
    <p className="flex items-center gap-1 text-sm font-semibold"><Sun size={14} /> Luz do token {luz ? <span className="font-normal text-(--a-c4b6d4)">· {luz.brilho} m + {luz.penumbra} m</span> : <span className="font-normal text-(--a-b4aeca)">· sem luz</span>}</p>
    <div className="flex flex-wrap gap-1">{LUZES_PRONTAS.map(l => <button key={l.nome} type="button" className={btn + ' !px-2 !py-1 text-xs'} onClick={() => void salvar(l)}>{l.nome}</button>)}
      {luz && <button type="button" className={btn + ' !px-2 !py-1 text-xs'} onClick={() => void salvar(null)}>Apagar</button>}</div>
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1">Luz plena <input type="number" min={0} max={60} step={1.5} value={b} onChange={x => setB(Number(x.target.value))} className={input + ' !w-16 !py-1'} /> m</label>
      <label className="flex items-center gap-1">Penumbra <input type="number" min={0} max={60} step={1.5} value={pe} onChange={x => setPe(Number(x.target.value))} className={input + ' !w-16 !py-1'} /> m</label>
      <label className="flex items-center gap-1">Cor <input type="color" value={cor} onChange={x => setCor(x.target.value)} className="h-8 w-10 rounded" /></label>
      <button type="button" className={btn + ' !py-1'} onClick={() => void salvar(b || pe ? { brilho: b, penumbra: pe, cor } : null)}>Aplicar</button>
    </div>
  </div>
}
