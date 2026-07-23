'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { toast } from 'sonner'
import {
  Hand,
  Ruler,
  MapPin,
  Pencil,
  CloudFog,
  Settings2,
  Dices,
  Volume2,
  VolumeX,
  Eraser,
  ArrowLeft,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { atualizarCondicoes, atualizarHp, moverToken } from '@/app/actions/personagens'
import {
  ativarCena,
  atualizarFog,
  atualizarIniciativa,
  atualizarMapa,
  atualizarTurno,
  deletarCena,
  salvarCena,
} from '@/app/actions/campanhas'
import { criarDesenho, limparDesenhos } from '@/app/actions/mesa'
import { uploadImagem } from '@/lib/upload'
import { condicoesDisponiveis } from '@/lib/condicoes'
import type { Campanha, Cena, Desenho, Mensagem, Personagem, Rolagem } from '@/types/database'
import MapaGrid, { type CursorRemoto, type ModoMapa, type Ping } from './MapaGrid'
import PainelLateral, { mensagemParaItem, rolagemParaItem, type ItemFeed } from './PainelLateral'
import Dados3D, { type Dados3DHandle } from './Dados3D'
import type { RealtimeChannel } from '@supabase/supabase-js'

type Membro = { id: string; username: string }

const CORES_DESENHO = ['#fbbf24', '#38bdf8', '#4ade80', '#f87171', '#c084fc', '#f1f5f9']

export default function MesaClient({
  campanhaInicial,
  personagensIniciais,
  mensagensIniciais,
  rolagensIniciais,
  cenasIniciais,
  desenhosIniciais,
  membros,
  meuId,
  souMestre,
}: {
  campanhaInicial: Campanha
  personagensIniciais: Personagem[]
  mensagensIniciais: Mensagem[]
  rolagensIniciais: Rolagem[]
  cenasIniciais: Cena[]
  desenhosIniciais: Desenho[]
  membros: Membro[]
  meuId: string
  souMestre: boolean
}) {
  const [campanha, setCampanha] = useState(campanhaInicial)
  const [personagens, setPersonagens] = useState(personagensIniciais)
  const [cenas, setCenas] = useState(cenasIniciais)
  const [desenhos, setDesenhos] = useState(desenhosIniciais)
  const [feed, setFeed] = useState<ItemFeed[]>(() =>
    [...mensagensIniciais.map(mensagemParaItem), ...rolagensIniciais.map(rolagemParaItem)].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    )
  )
  const [modo, setModo] = useState<ModoMapa>('mover')
  const [corDesenho, setCorDesenho] = useState(CORES_DESENHO[0])
  const [configAberta, setConfigAberta] = useState(false)
  const [pings, setPings] = useState<Ping[]>([])
  const [tokenAberto, setTokenAberto] = useState<string | null>(null)
  const [cursores, setCursores] = useState<CursorRemoto[]>([])
  const [online, setOnline] = useState<string[]>([])
  const [tresDAtivo, setTresDAtivo] = useState(true)
  const [somAtivo, setSomAtivo] = useState(true)
  const supabase = useMemo(() => createClient(), [])
  const fogPendente = useRef(campanhaInicial.fog_revelado)
  const canalRef = useRef<RealtimeChannel | null>(null)
  const dados3dRef = useRef<Dados3DHandle | null>(null)
  const ultimoCursor = useRef(0)
  const tresDRef = useRef(tresDAtivo)
  tresDRef.current = tresDAtivo

  const nomes = useMemo(() => Object.fromEntries(membros.map((m) => [m.id, m.username])), [membros])
  const nomesRef = useRef(nomes)
  nomesRef.current = nomes

  // Preferências locais
  useEffect(() => {
    setTresDAtivo(localStorage.getItem('prg-3d') !== 'off')
    setSomAtivo(localStorage.getItem('prg-som') !== 'off')
  }, [])

  // ── Tempo real ───────────────────────────────────────────────
  useEffect(() => {
    const canal = supabase
      .channel(`mesa-${campanha.id}`, { config: { presence: { key: meuId } } })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'personagens', filter: `campanha_id=eq.${campanha.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const novo = payload.new as Personagem
            setPersonagens((ps) => (ps.some((p) => p.id === novo.id) ? ps : [...ps, novo]))
          } else if (payload.eventType === 'UPDATE') {
            const upd = payload.new as Personagem
            setPersonagens((ps) => ps.map((p) => (p.id === upd.id ? upd : p)))
          } else if (payload.eventType === 'DELETE') {
            const del = payload.old as { id: string }
            setPersonagens((ps) => ps.filter((p) => p.id !== del.id))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensagens', filter: `campanha_id=eq.${campanha.id}` },
        (payload) => {
          const item = mensagemParaItem(payload.new as Mensagem)
          setFeed((f) => (f.some((i) => i.id === item.id) ? f : [...f, item]))
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rolagens', filter: `campanha_id=eq.${campanha.id}` },
        (payload) => {
          const r = payload.new as Rolagem
          const item = rolagemParaItem(r)
          setFeed((f) => {
            if (f.some((i) => i.id === item.id)) return f
            // Anima os dados 3D com o resultado que o servidor sorteou
            if (tresDRef.current) dados3dRef.current?.animar(r.expressao, r.resultados)
            return [...f, item]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'desenhos', filter: `campanha_id=eq.${campanha.id}` },
        (payload) => {
          const novo = payload.new as Desenho
          setDesenhos((ds) => (ds.some((d) => d.id === novo.id) ? ds : [...ds, novo]))
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'desenhos' },
        (payload) => {
          const del = payload.old as { id: string }
          setDesenhos((ds) => ds.filter((d) => d.id !== del.id))
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'campanhas', filter: `id=eq.${campanha.id}` },
        (payload) => {
          setCampanha(payload.new as Campanha)
        }
      )
      .on('broadcast', { event: 'ping' }, ({ payload }) => {
        const ping = payload as Ping
        setPings((ps) => [...ps, ping])
        setTimeout(() => setPings((ps) => ps.filter((p) => p.id !== ping.id)), 2500)
      })
      .on('presence', { event: 'sync' }, () => {
        const estado = canal.presenceState<{ nome: string; x?: number; y?: number }>()
        const ids = Object.keys(estado)
        setOnline(ids)
        setCursores(
          ids
            .filter((id) => id !== meuId)
            .flatMap((id) => {
              const p = estado[id]?.[0]
              return p && p.x !== undefined && p.y !== undefined
                ? [{ id, nome: p.nome, x: p.x, y: p.y! }]
                : []
            })
        )
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        if (key !== meuId) {
          toast(`⚔️ ${nomesRef.current[key] ?? 'Alguém'} entrou na mesa!`)
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await canal.track({ nome: nomesRef.current[meuId] ?? '?' })
        }
      })

    canalRef.current = canal
    return () => {
      canalRef.current = null
      supabase.removeChannel(canal)
    }
  }, [supabase, campanha.id, meuId])

  // ── Atalhos de teclado ───────────────────────────────────────
  useHotkeys('m', () => setModo('mover'))
  useHotkeys('r', () => setModo('regua'))
  useHotkeys('p', () => setModo('ping'))
  useHotkeys('d', () => setModo('desenhar'))
  useHotkeys(
    'space',
    (e) => {
      if (!souMestre || campanha.iniciativa.length === 0) return
      e.preventDefault()
      const total = campanha.iniciativa.length
      const novo = (campanha.iniciativa_turno + 1) % total
      setCampanha((c) => ({ ...c, iniciativa_turno: novo }))
      atualizarTurno(campanha.id, novo)
    },
    [souMestre, campanha.iniciativa, campanha.iniciativa_turno, campanha.id]
  )

  // ── Ações do mapa ────────────────────────────────────────────
  function handleMoverToken(id: string, x: number, y: number) {
    setPersonagens((ps) => ps.map((p) => (p.id === id ? { ...p, pos_x: x, pos_y: y } : p)))
    moverToken(id, x, y)
  }

  function handlePintarFog(celulas: string[], revelar: boolean) {
    const atual = new Set(fogPendente.current)
    for (const c of celulas) {
      if (revelar) atual.add(c)
      else atual.delete(c)
    }
    const novo = [...atual]
    fogPendente.current = novo
    setCampanha((c) => ({ ...c, fog_revelado: novo }))
    atualizarFog(campanha.id, { fog_revelado: novo })
  }

  useEffect(() => {
    fogPendente.current = campanha.fog_revelado
  }, [campanha.fog_revelado])

  function handlePing(x: number, y: number) {
    const ping: Ping = { id: crypto.randomUUID(), x, y, autor: nomes[meuId] ?? 'Alguém' }
    setPings((ps) => [...ps, ping])
    setTimeout(() => setPings((ps) => ps.filter((p) => p.id !== ping.id)), 2500)
    canalRef.current?.send({ type: 'broadcast', event: 'ping', payload: ping })
  }

  function handleDesenhar(pontos: number[]) {
    criarDesenho(campanha.id, corDesenho, pontos).then((r) => {
      if (r?.error) toast.error(r.error)
    })
  }

  function handleCursor(x: number, y: number) {
    const agora = Date.now()
    if (agora - ultimoCursor.current < 120) return
    ultimoCursor.current = agora
    canalRef.current?.track({ nome: nomes[meuId] ?? '?', x, y })
  }

  async function toggleFog() {
    const novoAtivo = !campanha.fog_ativo
    setCampanha((c) => ({ ...c, fog_ativo: novoAtivo }))
    await atualizarFog(campanha.id, { fog_ativo: novoAtivo })
    if (!novoAtivo && (modo === 'revelar' || modo === 'esconder')) setModo('mover')
  }

  function rolarIniciativaTodos() {
    const tokens = personagens.filter((p) => souMestre || !p.is_npc || p.visivel)
    const lista = tokens.map((p) => {
      const modIni = Number(p.dados?.iniciativa) || 0
      return { nome: p.nome, valor: Math.floor(Math.random() * 20) + 1 + modIni }
    })
    setCampanha((c) => ({ ...c, iniciativa: lista, iniciativa_turno: 0 }))
    atualizarIniciativa(campanha.id, lista)
    atualizarTurno(campanha.id, 0)
    toast('⚔️ Iniciativa rolada para todos!')
  }

  function alternar3d() {
    const novo = !tresDAtivo
    setTresDAtivo(novo)
    localStorage.setItem('prg-3d', novo ? 'on' : 'off')
  }

  function alternarSom() {
    const novo = !somAtivo
    setSomAtivo(novo)
    localStorage.setItem('prg-som', novo ? 'on' : 'off')
  }

  const personagensVisiveis = personagens.filter((p) => souMestre || !p.is_npc || p.visivel)
  const personagemAberto = personagens.find((p) => p.id === tokenAberto) ?? null
  const meusMacros = personagens.filter((p) => p.player_id === meuId && !p.is_npc).flatMap((p) => p.macros ?? [])

  const modosGerais: { id: ModoMapa; label: string; icone: React.ReactNode; tecla: string }[] = [
    { id: 'mover', label: 'Mover', icone: <Hand size={13} />, tecla: 'M' },
    { id: 'regua', label: 'Régua', icone: <Ruler size={13} />, tecla: 'R' },
    { id: 'ping', label: 'Ping', icone: <MapPin size={13} />, tecla: 'P' },
    { id: 'desenhar', label: 'Desenhar', icone: <Pencil size={13} />, tecla: 'D' },
  ]

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      <Dados3D ref={dados3dRef} somAtivo={somAtivo} />

      {/* Barra superior */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center gap-3 shrink-0 flex-wrap">
        <Link
          href={`/campanha/${campanha.id}`}
          className="text-sm text-slate-500 hover:text-slate-300 transition-colors shrink-0 flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Sair
        </Link>
        <h1 className="font-semibold text-slate-100 truncate">{campanha.nome}</h1>

        {/* Online */}
        <div className="flex -space-x-1.5">
          {online.map((id) => (
            <div
              key={id}
              title={nomes[id] ?? '?'}
              className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-950"
            >
              {(nomes[id] ?? '?')[0]?.toUpperCase()}
            </div>
          ))}
        </div>

        {/* Modos */}
        <div className="flex rounded-lg overflow-hidden border border-slate-700">
          {modosGerais.map((m) => (
            <button
              key={m.id}
              onClick={() => setModo(m.id)}
              title={`${m.label} (${m.tecla})`}
              className={`text-xs px-2.5 py-1.5 transition-colors flex items-center gap-1 ${
                modo === m.id ? 'bg-amber-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {m.icone} {m.label}
            </button>
          ))}
        </div>

        {/* Cores do desenho */}
        {modo === 'desenhar' && (
          <div className="flex items-center gap-1">
            {CORES_DESENHO.map((c) => (
              <button
                key={c}
                onClick={() => setCorDesenho(c)}
                className={`w-4 h-4 rounded-full transition-transform hover:scale-125 ${
                  corDesenho === c ? 'ring-2 ring-white' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            {souMestre && (
              <button
                onClick={() => {
                  limparDesenhos(campanha.id)
                  setDesenhos([])
                }}
                title="Apagar todos os desenhos"
                className="ml-1 text-slate-500 hover:text-red-400 transition-colors"
              >
                <Eraser size={14} />
              </button>
            )}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {/* Toggles 3D e som */}
          <button
            onClick={alternar3d}
            title={tresDAtivo ? 'Desativar dados 3D' : 'Ativar dados 3D'}
            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1 ${
              tresDAtivo
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            <Dices size={13} /> 3D
          </button>
          <button
            onClick={alternarSom}
            title={somAtivo ? 'Silenciar' : 'Ativar sons'}
            className={`text-xs px-2 py-1.5 rounded-lg border transition-colors ${
              somAtivo
                ? 'bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-slate-800 border-slate-700 text-slate-600'
            }`}
          >
            {somAtivo ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>

          {souMestre && (
            <>
              <button
                onClick={toggleFog}
                className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1 ${
                  campanha.fog_ativo
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CloudFog size={13} /> Fog {campanha.fog_ativo ? 'ON' : 'OFF'}
              </button>

              {campanha.fog_ativo && (
                <div className="flex rounded-lg overflow-hidden border border-slate-700">
                  {(['revelar', 'esconder'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setModo(m)}
                      className={`text-xs px-2.5 py-1.5 transition-colors ${
                        modo === m
                          ? 'bg-amber-500 text-slate-950 font-semibold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {m === 'revelar' ? '🔦 Revelar' : '🌑 Esconder'}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => setConfigAberta(!configAberta)}
                className="text-xs px-2.5 py-1.5 rounded-lg border bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
              >
                <Settings2 size={13} /> Mapa & Cenas
              </button>
            </>
          )}
        </div>
      </header>

      {souMestre && configAberta && (
        <ConfigMapa campanha={campanha} cenas={cenas} setCenas={setCenas} onClose={() => setConfigAberta(false)} />
      )}

      {/* Corpo */}
      <div className="flex-1 flex min-h-0 relative">
        <MapaGrid
          campanha={campanha}
          personagens={personagensVisiveis}
          desenhos={desenhos}
          cursores={cursores}
          souMestre={souMestre}
          meuId={meuId}
          modo={modo}
          corDesenho={corDesenho}
          pings={pings}
          onMoverToken={handleMoverToken}
          onPintarFog={handlePintarFog}
          onPing={handlePing}
          onTokenClick={(p) => setTokenAberto(p.id)}
          onDesenhar={handleDesenhar}
          onCursor={handleCursor}
        />

        {personagemAberto && (
          <TokenPopover
            personagem={personagemAberto}
            podeEditar={souMestre || personagemAberto.player_id === meuId}
            onAtualizar={(mudancas) =>
              setPersonagens((ps) => ps.map((p) => (p.id === personagemAberto.id ? { ...p, ...mudancas } : p)))
            }
            onClose={() => setTokenAberto(null)}
          />
        )}

        <PainelLateral
          campanhaId={campanha.id}
          feed={feed}
          iniciativa={campanha.iniciativa}
          turno={campanha.iniciativa_turno}
          nomes={nomes}
          membros={membros}
          meuId={meuId}
          souMestre={souMestre}
          macros={meusMacros}
          onRolarIniciativaTodos={rolarIniciativaTodos}
        />
      </div>
    </div>
  )
}

// ── Popover do token ───────────────────────────────────────────

function TokenPopover({
  personagem,
  podeEditar,
  onAtualizar,
  onClose,
}: {
  personagem: Personagem
  podeEditar: boolean
  onAtualizar: (mudancas: Partial<Personagem>) => void
  onClose: () => void
}) {
  function mudarHp(delta: number) {
    const novo = personagem.hp_atual + delta
    onAtualizar({ hp_atual: novo })
    atualizarHp(personagem.id, novo)
  }

  function toggleCondicao(id: string) {
    const atual = personagem.condicoes ?? []
    const novas = atual.includes(id) ? atual.filter((c) => c !== id) : [...atual, id]
    onAtualizar({ condicoes: novas })
    atualizarCondicoes(personagem.id, novas)
  }

  return (
    <div className="absolute bottom-4 left-4 z-40 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl p-4 w-72 shadow-2xl">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-950 font-bold shrink-0 overflow-hidden bg-cover bg-center"
          style={{
            backgroundColor: personagem.cor,
            backgroundImage: personagem.token_url ? `url(${personagem.token_url})` : undefined,
          }}
        >
          {!personagem.token_url && personagem.nome[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-100 truncate text-sm">
            {personagem.nome} {personagem.hp_atual <= 0 && '💀'}
          </p>
          <p className="text-xs text-slate-500">
            HP {personagem.hp_atual}/{personagem.hp_max}
          </p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white text-lg leading-none">
          ×
        </button>
      </div>

      {podeEditar && (
        <>
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {[-5, -1].map((d) => (
              <button
                key={d}
                onClick={() => mudarHp(d)}
                className="bg-red-950/60 hover:bg-red-900 border border-red-800/50 text-red-300 text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg transition-colors"
              >
                {d}
              </button>
            ))}
            <span className="font-mono font-bold text-slate-200 px-2 min-w-16 text-center">{personagem.hp_atual}</span>
            {[1, 5].map((d) => (
              <button
                key={d}
                onClick={() => mudarHp(d)}
                className="bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/50 text-emerald-300 text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg transition-colors"
              >
                +{d}
              </button>
            ))}
          </div>

          <p className="text-[10px] uppercase tracking-wider text-slate-600 font-bold mb-1.5">Condições</p>
          <div className="flex flex-wrap gap-1">
            {condicoesDisponiveis.map((c) => {
              const ativa = (personagem.condicoes ?? []).includes(c.id)
              return (
                <button
                  key={c.id}
                  onClick={() => toggleCondicao(c.id)}
                  title={c.nome}
                  className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                    ativa
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {c.emoji} {c.nome}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ── Config: mapa, upload e cenas ───────────────────────────────

function ConfigMapa({
  campanha,
  cenas,
  setCenas,
  onClose,
}: {
  campanha: Campanha
  cenas: Cena[]
  setCenas: React.Dispatch<React.SetStateAction<Cena[]>>
  onClose: () => void
}) {
  const [url, setUrl] = useState(campanha.mapa_url ?? '')
  const [cols, setCols] = useState(String(campanha.grid_cols))
  const [rows, setRows] = useState(String(campanha.grid_rows))
  const [salvando, setSalvando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function aplicar() {
    setSalvando(true)
    await atualizarMapa(campanha.id, {
      mapa_url: url.trim() || null,
      grid_cols: Math.max(5, Math.min(100, parseInt(cols) || 30)),
      grid_rows: Math.max(5, Math.min(100, parseInt(rows) || 20)),
    })
    setSalvando(false)
    toast.success('Mapa atualizado!')
    onClose()
  }

  async function enviarMapa(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setEnviando(true)
    const result = await uploadImagem(file, `mapas/${campanha.id}`)
    setEnviando(false)
    if (result.url) {
      setUrl(result.url)
      toast.success('Imagem enviada! Clique em Aplicar.')
    } else {
      toast.error(result.error ?? 'Erro no upload')
    }
  }

  async function salvarComoCena() {
    const nome = prompt('Nome da cena (ex: Taverna do Javali):')
    if (!nome?.trim()) return
    const result = await salvarCena(campanha.id, {
      nome: nome.trim(),
      mapa_url: url.trim() || null,
      grid_cols: parseInt(cols) || 30,
      grid_rows: parseInt(rows) || 20,
    })
    if (result.cena) {
      setCenas((cs) => [...cs, result.cena!])
      toast.success(`Cena "${nome}" salva!`)
    } else if (result.error) toast.error(result.error)
  }

  async function ativar(cena: Cena) {
    await ativarCena(campanha.id, cena.id)
    toast.success(`🎬 Cena "${cena.nome}" ativada!`)
    onClose()
  }

  async function excluir(cena: Cena) {
    if (!confirm(`Excluir a cena "${cena.nome}"?`)) return
    await deletarCena(cena.id)
    setCenas((cs) => cs.filter((c) => c.id !== cena.id))
  }

  const inputClass =
    'bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-amber-500 placeholder-slate-600'

  return (
    <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-3 space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-64">
          <label className="block text-xs text-slate-500 mb-1">URL da imagem do mapa</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://exemplo.com/mapa.jpg"
            className={`${inputClass} w-full`}
          />
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={enviando}
          className="bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {enviando ? 'Enviando...' : '📤 Upload'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={enviarMapa} className="hidden" />
        <div>
          <label className="block text-xs text-slate-500 mb-1">Colunas</label>
          <input value={cols} onChange={(e) => setCols(e.target.value)} type="number" className={`${inputClass} w-20`} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Linhas</label>
          <input value={rows} onChange={(e) => setRows(e.target.value)} type="number" className={`${inputClass} w-20`} />
        </div>
        <button
          onClick={aplicar}
          disabled={salvando}
          className="bg-amber-500 hover:bg-amber-400 disabled:bg-amber-900 text-slate-950 font-semibold px-4 py-1.5 rounded-lg text-sm transition-colors"
        >
          {salvando ? 'Salvando...' : 'Aplicar'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">🎬 Cenas:</span>
        {cenas.length === 0 && <span className="text-xs text-slate-600">nenhuma cena salva ainda</span>}
        {cenas.map((cena) => (
          <span key={cena.id} className="inline-flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <button
              onClick={() => ativar(cena)}
              title="Ativar esta cena (o fog é reiniciado)"
              className="px-3 py-1 text-xs text-slate-200 hover:bg-slate-700 transition-colors"
            >
              {cena.nome}
            </button>
            <button onClick={() => excluir(cena)} className="px-1.5 py-1 text-slate-600 hover:text-red-400 text-xs">
              ✕
            </button>
          </span>
        ))}
        <button
          onClick={salvarComoCena}
          className="text-xs bg-slate-800 border border-dashed border-slate-600 hover:border-amber-500 text-slate-400 hover:text-amber-300 px-3 py-1 rounded-lg transition-colors"
        >
          + Salvar cena atual
        </button>
      </div>
    </div>
  )
}
