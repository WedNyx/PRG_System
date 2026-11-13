'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TransformComponent, TransformWrapper, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import { ligarZoomSuave } from '@/lib/zoomRoda'
import { emojiCondicao } from '@/lib/condicoes'
import { Bolinhas } from './Combate'
import { celulasPincel, expandirNevoa, mapaDeNevoa, METROS_POR_CELULA_MESA, type AreaNevoa, type Camada, type LuzToken } from '@/lib/nuvem/mesa'

export const CELULA = 44
export const METROS_POR_CELULA = METROS_POR_CELULA_MESA
export type ModoMesa = 'mover' | 'regua' | 'ping' | 'desenhar' | 'revelar' | 'esconder' | 'area-revelar' | 'area-esconder' | 'nevoa-area' | 'editar-mapa'
export type Ping = { id: string; x: number; y: number; autor: string }
export type CursorRemoto = { id: string; nome: string; x: number; y: number }
export type TokenMapa = {
  id: string; nome: string; cor: string; imagem_url: string | null; x: number; y: number; tamanho: number
  visivel: boolean; hp_atual: number | null; hp_max: number | null; condicoes: string[]; rodadas?: Record<string, number>; morte?: { estado?: 'caido' | 'estavel' | 'morto'; sucessos?: number; falhas?: number; futuras?: number } | null; podeMover: boolean; meu: boolean
  /** Luz própria (v0.33.8) e se é personagem de jogador (a luz dele tira a névoa). */
  luz?: LuzToken | null; jogador?: boolean
}

type Props = {
  cols: number; rows: number; fundo: string | null; camadas: Camada[]
  fogAtivo: boolean; fogRevelado: string[]; tokens: TokenMapa[]
  /** v0.33.8: partes com névoa (vazio = mapa todo), escuridão da cena (0–100) e se a luz dos personagens tira a névoa. */
  fogAreas?: AreaNevoa[]; escuridao?: number; luzRevela?: boolean
  onCriarAreaNevoa?: (r: { x: number; y: number; w: number; h: number }) => void; onTocarAreaNevoa?: (id: string) => void
  desenhos: { id: string; cor: string; pontos: number[] }[]
  cursores: CursorRemoto[]; pings: Ping[]; admin: boolean; modo: ModoMesa; cor: string; pincel: number
  camadaSel: string | null; onSelecionarCamada: (id: string | null) => void; onAlterarCamada: (c: Camada) => void
  onMoverToken: (id: string, x: number, y: number) => void; onNevoa: (celulas: string[], revelar: boolean, retangulo?: { x: number; y: number; w: number; h: number }) => void
  onPing: (x: number, y: number) => void; onTokenClick: (id: string) => void; onDesenhar: (pontos: number[], id: string) => void; onCursor: (x: number, y: number) => void
  /** Ao vivo (para os outros verem): token sendo arrastado e traço sendo desenhado. */
  onArrastando?: (id: string, x: number, y: number) => void; onTracando?: (id: string, pontos: number[]) => void
  /** Ataque: círculo de alcance em volta do atacante e alvo marcado. */
  alcance?: { tokenId: string; metros: number | null; alvo: string | null } | null
  /** Escolhendo o alvo de um ataque: tocar num token só escolhe (não arrasta), em qualquer ferramenta. */
  mirando?: boolean
  /** Token da vez no combate (ganha um anel dourado). */
  vez?: string | null
}

const pts = (a: number[]) => { const r: string[] = []; for (let i = 0; i + 1 < a.length; i += 2) r.push(`${a[i]},${a[i + 1]}`); return r.join(' ') }

/** Mapa da mesa: imagens em camadas, grade, névoa com pincel/área, tokens com tamanho e permissão de mover. */
export default function MapaMesa(p: Props) {
  const { cols, rows, admin, modo } = p
  const ref = useRef<HTMLDivElement>(null)
  const largura = cols * CELULA, altura = rows * CELULA
  const reveladas = useMemo(() => expandirNevoa(p.fogRevelado), [p.fogRevelado])
  const [arrastando, setArrastando] = useState<string | null>(null)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const [regua, setRegua] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  const [area, setArea] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  const [traco, setTraco] = useState<number[] | null>(null)
  const [pintura, setPintura] = useState<Set<string>>(new Set())
  const [camadaEdit, setCamadaEdit] = useState<{ c: Camada; tipo: 'mover' | 'tamanho'; ox: number; oy: number; ar: number } | null>(null)
  const inicio = useRef<{ px: number; py: number } | null>(null)
  const tracoId = useRef('')
  const houveDrag = useRef(false)
  const zoom = useRef<ReactZoomPanPinchRef>(null)
  useEffect(() => ligarZoomSuave(zoom.current, 0.05, 4), [])
  // Toque/clique num token: só vale no evento “click”. Abrir a janela no “pointerup” fazia o clique-fantasma
  // do celular (que vem depois do toque) cair na janela recém-aberta e fechá-la na hora.
  const tokenTocado = useRef<string | null>(null)
  const pintando = useRef(false)
  const editandoMapa = modo === 'editar-mapa'

  const ponto = useCallback((e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r || !r.width) return null
    const esc = r.width / largura
    return { px: (e.clientX - r.left) / esc, py: (e.clientY - r.top) / esc }
  }, [largura])
  const celula = useCallback((e: React.PointerEvent, livre = false) => {
    const q = ponto(e); if (!q) return null
    const x = Math.floor(q.px / CELULA), y = Math.floor(q.py / CELULA)
    if (!livre && (x < 0 || y < 0 || x >= cols || y >= rows)) return null
    return { x, y }
  }, [ponto, cols, rows])

  useEffect(() => { if (!editandoMapa) setCamadaEdit(null) }, [editandoMapa])

  function tokenDown(e: React.PointerEvent, t: TokenMapa) {
    if (modo !== 'mover' && !p.mirando) return
    e.preventDefault(); e.stopPropagation()
    inicio.current = { px: e.clientX, py: e.clientY }; houveDrag.current = false
    setArrastando(t.id); setDragPos({ x: t.x, y: t.y })
  }
  function camadaDown(e: React.PointerEvent, c: Camada, tipo: 'mover' | 'tamanho') {
    if (!editandoMapa || !admin) return
    e.preventDefault(); e.stopPropagation()
    p.onSelecionarCamada(c.id)
    const cel = celula(e, true); if (!cel) return
    setCamadaEdit({ c, tipo, ox: cel.x - c.x, oy: cel.y - c.y, ar: c.h / c.w })
  }

  function move(e: React.PointerEvent) {
    const q = ponto(e)
    if (q && q.px >= 0 && q.py >= 0 && q.px < largura && q.py < altura) p.onCursor(q.px, q.py)
    if (inicio.current && Math.abs(e.clientX - inicio.current.px) + Math.abs(e.clientY - inicio.current.py) > 6) houveDrag.current = true
    if (camadaEdit) {
      const cel = celula(e, true); if (!cel) return
      const c = camadaEdit.c
      if (camadaEdit.tipo === 'mover') setCamadaEdit({ ...camadaEdit, c: { ...c, x: cel.x - camadaEdit.ox, y: cel.y - camadaEdit.oy } })
      else { const w = Math.max(1, cel.x - c.x + 1); setCamadaEdit({ ...camadaEdit, c: { ...c, w, h: Math.max(1, Math.round(w * camadaEdit.ar)) } }) }
      return
    }
    if (arrastando) {
      if (p.mirando) return
      const cel = celula(e)
      if (cel && (cel.x !== dragPos?.x || cel.y !== dragPos?.y)) {
        setDragPos(cel)
        if (houveDrag.current && p.tokens.find(t => t.id === arrastando)?.podeMover) p.onArrastando?.(arrastando, cel.x, cel.y)
      }
      return
    }
    if (regua) { const cel = celula(e); if (cel) setRegua({ ...regua, x2: cel.x, y2: cel.y }); return }
    if (area) { const cel = celula(e); if (cel) setArea({ ...area, x2: cel.x, y2: cel.y }); return }
    if (traco && q) {
      if (Math.abs(q.px - traco[traco.length - 2]) + Math.abs(q.py - traco[traco.length - 1]) < 4) return
      const novo = [...traco, Math.round(q.px), Math.round(q.py)]
      setTraco(novo); p.onTracando?.(tracoId.current, novo)
      return
    }
    if (pintando.current) { const cel = celula(e); if (cel) setPintura(s => { const n = new Set(s); celulasPincel(cel.x, cel.y, p.pincel).forEach(k => n.add(k)); return n }) }
  }

  function up(e: React.PointerEvent) {
    if (camadaEdit) { p.onAlterarCamada(camadaEdit.c); setCamadaEdit(null) }
    if (arrastando && dragPos) {
      const t = p.tokens.find(x => x.id === arrastando)
      if (houveDrag.current && t?.podeMover && !p.mirando) p.onMoverToken(arrastando, dragPos.x, dragPos.y)
      else if (!houveDrag.current || p.mirando) tokenTocado.current = arrastando
    }
    setArrastando(null); setDragPos(null); inicio.current = null; setRegua(null)
    if (traco && traco.length >= 4) p.onDesenhar(traco, tracoId.current)
    setTraco(null)
    if (area) {
      const r = { x: Math.min(area.x1, area.x2), y: Math.min(area.y1, area.y2), w: Math.abs(area.x2 - area.x1) + 1, h: Math.abs(area.y2 - area.y1) + 1 }
      if (modo === 'nevoa-area') {
        // Toque rápido dentro de uma área: revela/esconde ela. Arrastar: cria uma área nova.
        const tocada = r.w === 1 && r.h === 1 ? [...(p.fogAreas ?? [])].reverse().find(a => r.x >= a.x && r.x < a.x + a.w && r.y >= a.y && r.y < a.y + a.h) : undefined
        if (tocada) p.onTocarAreaNevoa?.(tocada.id); else if (r.w * r.h >= 2) p.onCriarAreaNevoa?.(r)
      } else p.onNevoa([], modo === 'area-revelar', r)
      setArea(null)
    }
    if (pintando.current && pintura.size) p.onNevoa([...pintura], modo === 'revelar')
    pintando.current = false; setPintura(new Set())
    void e
  }

  function down(e: React.PointerEvent) {
    if (editandoMapa) { p.onSelecionarCamada(null); return }
    const cel = celula(e)
    if (modo === 'ping') { if (cel) p.onPing(cel.x, cel.y); return }
    if (modo === 'regua') { if (cel) setRegua({ x1: cel.x, y1: cel.y, x2: cel.x, y2: cel.y }); return }
    if (modo === 'desenhar') { const q = ponto(e); if (q) { tracoId.current = crypto.randomUUID(); setTraco([Math.round(q.px), Math.round(q.py)]) } return }
    if (admin && (modo === 'area-revelar' || modo === 'area-esconder' || modo === 'nevoa-area')) { if (cel) setArea({ x1: cel.x, y1: cel.y, x2: cel.x, y2: cel.y }); return }
    if (admin && (modo === 'revelar' || modo === 'esconder')) { pintando.current = true; if (cel) setPintura(new Set(celulasPincel(cel.x, cel.y, p.pincel))) }
  }

  // Névoa (v0.33.8): desenhada num canvas pequeno (uma célula = 4 px) com borda suave, em vez de milhares de quadrados.
  // O mestre vê a prévia do que está pintando; a luz dos personagens tira a névoa por onde passa (se a cena deixar).
  const areasNevoa = useMemo(() => p.fogAreas ?? [], [p.fogAreas])
  const luzesQueRevelam = useMemo(() => p.luzRevela === false ? [] : p.tokens.filter(t => t.jogador && t.luz && t.visivel).map(t => ({
    x: t.x + t.tamanho / 2, y: t.y + t.tamanho / 2, raio: (t.luz!.brilho + t.luz!.penumbra) / METROS_POR_CELULA + t.tamanho / 2 })), [p.tokens, p.luzRevela])
  const nevoa = useMemo(() => {
    if (!p.fogAtivo) return null
    const vis = new Set(reveladas)
    if (pintura.size) for (const k of pintura) { if (modo === 'revelar') vis.add(k); else vis.delete(k) }
    const m = mapaDeNevoa({ cols, rows, areas: areasNevoa, reveladas: vis, luzes: luzesQueRevelam })
    if (area && (modo === 'area-revelar' || modo === 'area-esconder'))
      for (let y = Math.min(area.y1, area.y2); y <= Math.max(area.y1, area.y2); y++) for (let x = Math.min(area.x1, area.x2); x <= Math.max(area.x1, area.x2); x++) m[y * cols + x] = modo === 'area-revelar' ? 0 : 1
    return m
  }, [p.fogAtivo, cols, rows, areasNevoa, reveladas, pintura, area, modo, luzesQueRevelam])
  const comNevoa = (x: number, y: number) => !!nevoa && x >= 0 && y >= 0 && x < cols && y < rows && nevoa[y * cols + x] === 1
  const camadaNevoa = nevoa ? <CanvasNevoa cols={cols} rows={rows} mapa={nevoa} admin={admin} largura={largura} altura={altura} /> : null
  const luzes = useMemo(() => p.tokens.filter(t => t.luz && (t.visivel || admin)).map(t => ({ x: t.x + t.tamanho / 2, y: t.y + t.tamanho / 2, luz: t.luz!, tam: t.tamanho })), [p.tokens, admin])
  const camadaEscuro = (p.escuridao ?? 0) > 0 ? <CanvasLuz cols={cols} rows={rows} largura={largura} altura={altura} escuridao={p.escuridao ?? 0} admin={admin} luzes={luzes} /> : null
  const camadaGrade = useMemo(() => <svg width={largura} height={altura} className="pointer-events-none absolute inset-0" style={{ zIndex: 2 }}>
    {Array.from({ length: cols + 1 }, (_, i) => <line key={'v' + i} x1={i * CELULA} y1={0} x2={i * CELULA} y2={altura} stroke="rgba(148,163,184,0.18)" />)}
    {Array.from({ length: rows + 1 }, (_, i) => <line key={'h' + i} x1={0} y1={i * CELULA} x2={largura} y2={i * CELULA} stroke="rgba(148,163,184,0.18)" />)}
  </svg>, [cols, rows, largura, altura])
  const linhasDesenhos = useMemo(() => p.desenhos.map(d => <polyline key={d.id} points={pts(d.pontos)} fill="none" stroke={d.cor} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />), [p.desenhos])
  const camadas = p.camadas.map(c => camadaEdit?.c.id === c.id ? camadaEdit.c : c)
  const medida = regua ? (() => { const n = Math.max(Math.abs(regua.x2 - regua.x1), Math.abs(regua.y2 - regua.y1)); return { n, m: Math.round(n * METROS_POR_CELULA * 10) / 10 } })() : null

  return <div className="h-full w-full overflow-hidden bg-(--s-0b0a14)">
    <TransformWrapper ref={zoom} minScale={0.05} maxScale={4} centerOnInit doubleClick={{ disabled: true }} wheel={{ disabled: true }}
      panning={{ disabled: modo !== 'mover' || !!arrastando, velocityDisabled: true }}>
      <TransformComponent wrapperClass="!w-full !h-full" contentClass="p-6">
        <div ref={ref} className="relative select-none touch-none overflow-hidden rounded-lg border border-(--a-2c2840)"
          style={{ width: largura, height: altura, backgroundColor: '#1a2332', backgroundImage: p.fundo ? `url(${p.fundo})` : undefined, backgroundSize: '100% 100%',
            cursor: modo === 'mover' ? undefined : 'crosshair' }}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}>
          {/* Camadas de imagem do mapa */}
          {camadas.map(c => <div key={c.id} className={'absolute ' + (editandoMapa ? 'cursor-move' : 'pointer-events-none')}
            style={{ left: c.x * CELULA, top: c.y * CELULA, width: c.w * CELULA, height: c.h * CELULA, zIndex: 1, outline: editandoMapa && p.camadaSel === c.id ? '2px solid #b99bff' : editandoMapa ? '1px dashed #6d5690' : undefined }}
            onPointerDown={e => camadaDown(e, c, 'mover')}>
            <div className="absolute inset-0 overflow-hidden">
              {/* Recorte: mostra só a parte escolhida da imagem, esticada para caber no espaço da camada. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.url} alt="" draggable={false} className="absolute max-w-none" style={{
                width: 100 / (c.cw ?? 1) + '%', height: 100 / (c.ch ?? 1) + '%',
                left: -((c.cx ?? 0) / (c.cw ?? 1)) * 100 + '%', top: -((c.cy ?? 0) / (c.ch ?? 1)) * 100 + '%' }} />
            </div>
            {editandoMapa && p.camadaSel === c.id && <div role="button" aria-label="Redimensionar imagem" onPointerDown={e => camadaDown(e, c, 'tamanho')}
              className="absolute -bottom-2 -right-2 h-6 w-6 cursor-nwse-resize rounded-full border-2 border-white bg-(--a-7654bb)" />}
          </div>)}
          {camadaGrade}
          <svg width={largura} height={altura} className="pointer-events-none absolute inset-0" style={{ zIndex: 5 }}>
            {linhasDesenhos}
            {traco && <polyline points={pts(traco)} fill="none" stroke={p.cor} strokeWidth={3} strokeLinecap="round" />}
          </svg>

          {p.tokens.map(t => {
            const emDrag = arrastando === t.id && dragPos && t.podeMover
            const x = emDrag ? dragPos.x : t.x, y = emDrag ? dragPos.y : t.y
            if (p.fogAtivo && !admin && !t.meu && comNevoa(x, y)) return null
            const lado = t.tamanho * CELULA
            const pct = t.hp_max ? Math.max(0, Math.min(1, (t.hp_atual ?? 0) / t.hp_max)) : null
            const morto = t.hp_max ? (t.hp_atual ?? 0) <= 0 : false
            return <div key={t.id} className={'absolute ' + (emDrag ? '' : 'transition-[left,top] duration-100')} onPointerDown={e => tokenDown(e, t)}
              onClick={e => { e.stopPropagation(); if (tokenTocado.current === t.id) { tokenTocado.current = null; p.onTokenClick(t.id) } }}
              style={{ left: x * CELULA, top: y * CELULA, width: lado, height: lado, zIndex: emDrag ? 30 : 10, opacity: t.visivel ? 1 : 0.45, pointerEvents: editandoMapa ? 'none' : undefined }}>
              <div title={t.nome} className={'flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 bg-cover bg-center text-sm font-bold text-(--a-0b0a14) shadow-lg '
                + (t.podeMover && modo === 'mover' ? 'cursor-grab ' : 'cursor-pointer ') + (emDrag ? 'scale-110 border-white ' : t.meu ? 'border-(--a-b99bff) ' : 'border-black/50 ') + (morto ? 'grayscale' : '')}
                style={{ backgroundColor: t.cor, backgroundImage: t.imagem_url ? `url(${t.imagem_url})` : undefined }}>
                {t.morte?.estado === 'morto' ? '⚰️' : morto ? '💀' : !t.imagem_url && t.nome[0]?.toUpperCase()}
              </div>
              {p.vez === t.id && <><span aria-hidden className="prg-vez pointer-events-none absolute -inset-1.5 rounded-full border-[3px] border-amber-300" />
                <span className="pointer-events-none absolute -left-2 -top-2 rounded-full bg-amber-400 px-1 text-[10px] font-bold text-(--a-1a1230) shadow" title="Vez deste token">⚔️</span></>}
              {!t.podeMover && <span className="pointer-events-none absolute -right-1 -top-1 text-[10px]" title="Travado">🔒</span>}
              {t.condicoes.length > 0 && <div className="pointer-events-none absolute -top-3 left-1/2 flex -translate-x-1/2 gap-px whitespace-nowrap rounded-full bg-black/70 px-1 text-[9px]">{t.condicoes.slice(0, 4).map(c => <span key={c}>{emojiCondicao[c] ?? '❓'}{t.rodadas?.[c] ? <sub className="font-bold text-amber-200">{t.rodadas[c]}</sub> : null}</span>)}{t.condicoes.length > 4 && <span>+{t.condicoes.length - 4}</span>}</div>}
              {t.morte?.estado === 'caido' && <div className="pointer-events-none absolute -bottom-[38px] left-1/2 flex -translate-x-1/2 rounded-full bg-black/80 px-1.5 py-1" title="Testes contra a morte"><Bolinhas m={t.morte} pequeno /></div>}
              {t.morte?.estado === 'estavel' && <span className="pointer-events-none absolute -bottom-1 -right-1 text-xs" title="Estável">🩹</span>}
              {!t.morte?.estado && !!t.morte?.futuras && <span className="pointer-events-none absolute -left-1 bottom-0 rounded-full bg-amber-500 px-1 text-[9px] font-bold text-black" title="Falhas futuras (medidas desesperadas)">⚠️{t.morte.futuras}</span>}
              {pct !== null && <div className="absolute -bottom-1.5 left-1 right-1 h-1.5 overflow-hidden rounded-full bg-black/80"><div className="h-full rounded-full" style={{ width: pct * 100 + '%', background: pct > 0.5 ? '#10b981' : pct > 0.25 ? '#f59e0b' : '#ef4444' }} /></div>}
              <div className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-slate-200">{t.nome}{!t.visivel && ' 🙈'}</div>
            </div>
          })}

          {p.alcance && (() => {
            const t = p.tokens.find(x => x.id === p.alcance!.tokenId); if (!t) return null
            const cx = (t.x + t.tamanho / 2) * CELULA, cy = (t.y + t.tamanho / 2) * CELULA
            const r = p.alcance.metros !== null ? (p.alcance.metros / METROS_POR_CELULA + t.tamanho / 2) * CELULA : null
            const alvo = p.tokens.find(x => x.id === p.alcance!.alvo)
            return <svg width={largura} height={altura} className="pointer-events-none absolute inset-0" style={{ zIndex: 9 }}>
              {r !== null && <circle cx={cx} cy={cy} r={r} fill="rgba(239,68,68,0.10)" stroke="#f87171" strokeWidth={2} strokeDasharray="8 6" />}
              {alvo && <><line x1={cx} y1={cy} x2={(alvo.x + alvo.tamanho / 2) * CELULA} y2={(alvo.y + alvo.tamanho / 2) * CELULA} stroke="#fbbf24" strokeWidth={2.5} strokeDasharray="6 4" />
                <circle cx={(alvo.x + alvo.tamanho / 2) * CELULA} cy={(alvo.y + alvo.tamanho / 2) * CELULA} r={alvo.tamanho * CELULA * 0.62} fill="none" stroke="#fbbf24" strokeWidth={3} /></>}
            </svg>
          })()}
          {camadaEscuro}
          {camadaNevoa}
          {admin && p.fogAtivo && (modo === 'nevoa-area' || modo === 'revelar' || modo === 'esconder' || modo === 'area-revelar' || modo === 'area-esconder') && areasNevoa.map(a => <div key={a.id}
            className={'pointer-events-none absolute border-2 ' + (a.revelada ? 'border-dashed border-emerald-300/70' : 'border-sky-300/80')} style={{ zIndex: 24, left: a.x * CELULA, top: a.y * CELULA, width: a.w * CELULA, height: a.h * CELULA }}>
            <span className="absolute left-1 top-1 rounded bg-black/75 px-1.5 py-0.5 text-[11px] text-white">{a.revelada ? '👁️' : '🌫️'} {a.nome || 'Área'}</span></div>)}
          {area && <div className={'pointer-events-none absolute border-2 border-dashed ' + (modo === 'nevoa-area' ? 'border-sky-300 bg-sky-300/15' : 'border-amber-300 bg-amber-300/10')} style={{ zIndex: 25, left: Math.min(area.x1, area.x2) * CELULA, top: Math.min(area.y1, area.y2) * CELULA, width: (Math.abs(area.x2 - area.x1) + 1) * CELULA, height: (Math.abs(area.y2 - area.y1) + 1) * CELULA }} />}

          {regua && medida && <svg width={largura} height={altura} className="pointer-events-none absolute inset-0" style={{ zIndex: 40 }}>
            <line x1={regua.x1 * CELULA + CELULA / 2} y1={regua.y1 * CELULA + CELULA / 2} x2={regua.x2 * CELULA + CELULA / 2} y2={regua.y2 * CELULA + CELULA / 2} stroke="#fbbf24" strokeWidth={3} strokeDasharray="8 4" />
            <g transform={`translate(${regua.x2 * CELULA + CELULA}, ${regua.y2 * CELULA})`}><rect x={-4} y={-16} width={110} height={24} rx={6} fill="rgba(2,6,23,0.9)" /><text x={4} y={1} fill="#fbbf24" fontSize={13} fontWeight={700}>{medida.n} cél · {medida.m}m</text></g>
          </svg>}
          {p.cursores.map(c => <div key={c.id} className="pointer-events-none absolute transition-all duration-100" style={{ left: c.x, top: c.y, zIndex: 45 }}>
            <svg width="16" height="16" viewBox="0 0 16 16"><path d="M1 1 L15 7 L8 8.5 L6 15 Z" fill="#38bdf8" stroke="#0c4a6e" /></svg>
            <span className="ml-1 whitespace-nowrap rounded bg-black/80 px-1 text-[9px] text-sky-300">{c.nome}</span></div>)}
          {p.pings.map(g => <div key={g.id} className="pointer-events-none absolute" style={{ left: g.x * CELULA, top: g.y * CELULA, width: CELULA, height: CELULA, zIndex: 50 }}>
            <div className="absolute inset-0 animate-ping rounded-full bg-amber-400/70" /><div className="absolute inset-2 rounded-full bg-amber-400" />
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-1.5 text-[10px] text-amber-300">{g.autor}</div></div>)}
        </div>
      </TransformComponent>
    </TransformWrapper>
  </div>
}

const PX = 4
/** Névoa num canvas: 4 px por célula, desfocada de leve para a borda ficar suave; o mestre vê transparente. */
function CanvasNevoa({ cols, rows, mapa, admin, largura, altura }: { cols: number; rows: number; mapa: Uint8Array; admin: boolean; largura: number; altura: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; const ctx = c?.getContext('2d'); if (!c || !ctx) return
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.filter = 'blur(2px)'
    ctx.fillStyle = '#07060e'
    for (let y = 0; y < rows; y++) {
      let ini = -1
      for (let x = 0; x <= cols; x++) {
        const tem = x < cols && mapa[y * cols + x] === 1
        if (tem && ini < 0) ini = x
        // Sangra 1 px para fora (a borda do mapa não fica clara com o desfoque).
        if (!tem && ini >= 0) { ctx.fillRect(ini * PX - (ini === 0 ? 4 : 0), y * PX - (y === 0 ? 4 : 0), (x - ini) * PX + (ini === 0 ? 4 : 0) + (x === cols ? 4 : 0), PX + (y === 0 ? 4 : 0) + (y === rows - 1 ? 4 : 0)); ini = -1 }
      }
    }
    ctx.filter = 'none'
  }, [cols, rows, mapa])
  return <canvas ref={ref} width={cols * PX} height={rows * PX} aria-hidden className="pointer-events-none absolute inset-0"
    style={{ width: largura, height: altura, zIndex: 20, opacity: admin ? 0.55 : 1 }} />
}

/** Escuridão da cena com a luz dos tokens: luz plena no raio de brilho, meia-luz na penumbra e a cor da luz por cima. */
function CanvasLuz({ cols, rows, largura, altura, escuridao, admin, luzes }: {
  cols: number; rows: number; largura: number; altura: number; escuridao: number; admin: boolean; luzes: { x: number; y: number; luz: LuzToken; tam: number }[]
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const R = 6
  useEffect(() => {
    const c = ref.current; const ctx = c?.getContext('2d'); if (!c || !ctx) return
    ctx.globalCompositeOperation = 'source-over'
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.fillStyle = `rgba(3,3,12,${Math.min(1, escuridao / 100) * 0.94})`
    ctx.fillRect(0, 0, c.width, c.height)
    for (const l of luzes) {
      const cx = l.x * R, cy = l.y * R
      const b = (l.luz.brilho / METROS_POR_CELULA + l.tam / 2) * R, total = ((l.luz.brilho + l.luz.penumbra) / METROS_POR_CELULA + l.tam / 2) * R
      if (total <= 0) continue
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, total)
      const f = Math.max(0.001, Math.min(0.999, b / total))
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(f, 'rgba(0,0,0,0.97)'); g.addColorStop(f + (1 - f) * 0.5, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, total, 0, Math.PI * 2); ctx.fill()
    }
    // Brilho colorido das luzes (bem leve).
    ctx.globalCompositeOperation = 'source-over'
    for (const l of luzes) {
      const cx = l.x * R, cy = l.y * R, total = ((l.luz.brilho + l.luz.penumbra) / METROS_POR_CELULA + l.tam / 2) * R
      if (total <= 0) continue
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, total)
      g.addColorStop(0, l.luz.cor + '1c'); g.addColorStop(1, l.luz.cor + '00')
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, total, 0, Math.PI * 2); ctx.fill()
    }
  }, [cols, rows, escuridao, luzes])
  return <canvas ref={ref} width={cols * R} height={rows * R} aria-hidden className="pointer-events-none absolute inset-0"
    style={{ width: largura, height: altura, zIndex: 15, opacity: admin ? 0.5 : 1 }} />
}
