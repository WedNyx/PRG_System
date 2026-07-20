'use client'

import { useRef, useState, useCallback } from 'react'
import { emojiCondicao } from '@/lib/condicoes'
import type { Campanha, Personagem } from '@/types/database'

export const CELULA = 44 // pixels por célula do grid
export const METROS_POR_CELULA = 1.5

export type ModoMapa = 'mover' | 'revelar' | 'esconder' | 'regua' | 'ping'

export type Ping = { id: string; x: number; y: number; autor: string }

export default function MapaGrid({
  campanha,
  personagens,
  souMestre,
  meuId,
  modo,
  pings,
  onMoverToken,
  onPintarFog,
  onPing,
  onTokenClick,
}: {
  campanha: Campanha
  personagens: Personagem[]
  souMestre: boolean
  meuId: string
  modo: ModoMapa
  pings: Ping[]
  onMoverToken: (id: string, x: number, y: number) => void
  onPintarFog: (celulas: string[], revelar: boolean) => void
  onPing: (x: number, y: number) => void
  onTokenClick: (p: Personagem) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [arrastando, setArrastando] = useState<string | null>(null)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const [regua, setRegua] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  const pintando = useRef(false)
  const celulasPintadas = useRef<Set<string>>(new Set())
  const dragInicio = useRef<{ px: number; py: number } | null>(null)
  const houveDrag = useRef(false)

  const cols = campanha.grid_cols
  const rows = campanha.grid_rows
  const largura = cols * CELULA
  const altura = rows * CELULA

  const reveladas = new Set(campanha.fog_revelado)

  const celulaDoEvento = useCallback(
    (e: React.PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return null
      const x = Math.floor((e.clientX - rect.left) / CELULA)
      const y = Math.floor((e.clientY - rect.top) / CELULA)
      if (x < 0 || y < 0 || x >= cols || y >= rows) return null
      return { x, y }
    },
    [cols, rows]
  )

  // ── Tokens: arrastar ou clicar ───────────────────────────────
  function onTokenPointerDown(e: React.PointerEvent, p: Personagem) {
    if (modo !== 'mover') return
    const podeMover = souMestre || p.player_id === meuId
    e.preventDefault()
    e.stopPropagation()
    dragInicio.current = { px: e.clientX, py: e.clientY }
    houveDrag.current = false
    if (podeMover) {
      setArrastando(p.id)
      setDragPos({ x: p.pos_x, y: p.pos_y })
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (dragInicio.current) {
      const dx = e.clientX - dragInicio.current.px
      const dy = e.clientY - dragInicio.current.py
      if (Math.abs(dx) + Math.abs(dy) > 6) houveDrag.current = true
    }
    if (arrastando) {
      const cel = celulaDoEvento(e)
      if (cel) setDragPos(cel)
      return
    }
    if (regua) {
      const cel = celulaDoEvento(e)
      if (cel) setRegua({ ...regua, x2: cel.x, y2: cel.y })
      return
    }
    if (pintando.current && souMestre && (modo === 'revelar' || modo === 'esconder')) {
      const cel = celulaDoEvento(e)
      if (cel) celulasPintadas.current.add(`${cel.x},${cel.y}`)
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    if (arrastando && dragPos) {
      if (houveDrag.current) {
        onMoverToken(arrastando, dragPos.x, dragPos.y)
      } else {
        const p = personagens.find((p) => p.id === arrastando)
        if (p) onTokenClick(p)
      }
    } else if (!arrastando && dragInicio.current && !houveDrag.current && modo === 'mover') {
      // Clique em token não-movível: abre a visualização mesmo assim
      const cel = celulaDoEvento(e)
      const p = cel && personagens.find((t) => t.pos_x === cel.x && t.pos_y === cel.y)
      if (p) onTokenClick(p)
    }
    setArrastando(null)
    setDragPos(null)
    dragInicio.current = null
    setRegua(null)

    if (pintando.current && celulasPintadas.current.size > 0) {
      onPintarFog([...celulasPintadas.current], modo === 'revelar')
    }
    pintando.current = false
    celulasPintadas.current = new Set()
  }

  function onFundoPointerDown(e: React.PointerEvent) {
    const cel = celulaDoEvento(e)
    if (!cel) return
    if (modo === 'ping') {
      onPing(cel.x, cel.y)
      return
    }
    if (modo === 'regua') {
      setRegua({ x1: cel.x, y1: cel.y, x2: cel.x, y2: cel.y })
      return
    }
    if (souMestre && (modo === 'revelar' || modo === 'esconder')) {
      pintando.current = true
      celulasPintadas.current.add(`${cel.x},${cel.y}`)
    }
  }

  // ── Fog ──────────────────────────────────────────────────────
  const celulasEscondidas: { x: number; y: number }[] = []
  if (campanha.fog_ativo) {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (!reveladas.has(`${x},${y}`)) celulasEscondidas.push({ x, y })
      }
    }
  }

  // ── Régua: distância ─────────────────────────────────────────
  let medida: { celulas: number; metros: number } | null = null
  if (regua) {
    const dx = Math.abs(regua.x2 - regua.x1)
    const dy = Math.abs(regua.y2 - regua.y1)
    const celulas = Math.max(dx, dy)
    medida = { celulas, metros: Math.round(celulas * METROS_POR_CELULA * 10) / 10 }
  }

  return (
    <div className="flex-1 overflow-auto bg-slate-950 p-6">
      <div
        ref={containerRef}
        className="relative rounded-lg overflow-hidden border border-slate-800 select-none touch-none"
        style={{
          width: largura,
          height: altura,
          backgroundColor: '#1a2332',
          backgroundImage: campanha.mapa_url ? `url(${campanha.mapa_url})` : undefined,
          backgroundSize: '100% 100%',
          cursor: modo === 'ping' ? 'pointer' : modo !== 'mover' ? 'crosshair' : undefined,
        }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerDown={onFundoPointerDown}
      >
        {/* Grid */}
        <svg width={largura} height={altura} className="absolute inset-0 pointer-events-none">
          {Array.from({ length: cols + 1 }, (_, i) => (
            <line key={`v${i}`} x1={i * CELULA} y1={0} x2={i * CELULA} y2={altura} stroke="rgba(148,163,184,0.15)" />
          ))}
          {Array.from({ length: rows + 1 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i * CELULA} x2={largura} y2={i * CELULA} stroke="rgba(148,163,184,0.15)" />
          ))}
        </svg>

        {/* Tokens */}
        {personagens.map((p) => {
          const emDrag = arrastando === p.id && dragPos
          const x = emDrag ? dragPos.x : p.pos_x
          const y = emDrag ? dragPos.y : p.pos_y
          const escondidoPeloFog = campanha.fog_ativo && !souMestre && !reveladas.has(`${x},${y}`)
          if (escondidoPeloFog) return null

          const pctHp = p.hp_max > 0 ? Math.max(0, Math.min(1, p.hp_atual / p.hp_max)) : 0
          const morto = p.hp_atual <= 0
          const podeMover = modo === 'mover' && (souMestre || p.player_id === meuId)

          return (
            <div
              key={p.id}
              className="absolute transition-all duration-150"
              style={{
                left: x * CELULA,
                top: y * CELULA,
                width: CELULA,
                height: CELULA,
                zIndex: emDrag ? 30 : 10,
                opacity: p.is_npc && !p.visivel ? 0.45 : 1,
              }}
              onPointerDown={(e) => onTokenPointerDown(e, p)}
            >
              <div
                className={`w-full h-full rounded-full border-2 flex items-center justify-center font-bold text-slate-950 text-sm shadow-lg overflow-hidden bg-cover bg-center ${
                  podeMover ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                } ${emDrag ? 'scale-110 border-white' : 'border-slate-950/50'} ${morto ? 'grayscale' : ''}`}
                style={{
                  backgroundColor: p.cor,
                  backgroundImage: p.token_url ? `url(${p.token_url})` : undefined,
                }}
                title={p.nome}
              >
                {morto ? '💀' : !p.token_url && p.nome[0]?.toUpperCase()}
              </div>

              {/* Condições */}
              {p.condicoes.length > 0 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-px text-[9px] bg-slate-950/70 px-1 rounded-full whitespace-nowrap pointer-events-none">
                  {p.condicoes.slice(0, 4).map((c) => (
                    <span key={c}>{emojiCondicao[c] ?? '❓'}</span>
                  ))}
                </div>
              )}

              {/* Barra de HP */}
              <div className="absolute -bottom-1.5 left-1 right-1 h-1.5 bg-slate-950/80 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pctHp * 100}%`,
                    backgroundColor: pctHp > 0.5 ? '#10b981' : pctHp > 0.25 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>

              {/* Nome */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-200 bg-slate-950/70 px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none">
                {p.nome}
                {p.is_npc && !p.visivel && ' 🙈'}
              </div>
            </div>
          )
        })}

        {/* Fog of War */}
        {campanha.fog_ativo && (
          <svg width={largura} height={altura} className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
            {celulasEscondidas.map(({ x, y }) => (
              <rect
                key={`${x},${y}`}
                x={x * CELULA}
                y={y * CELULA}
                width={CELULA}
                height={CELULA}
                fill={souMestre ? 'rgba(2,6,23,0.55)' : 'rgb(2,6,23)'}
              />
            ))}
          </svg>
        )}

        {/* Régua */}
        {regua && medida && (
          <svg width={largura} height={altura} className="absolute inset-0 pointer-events-none" style={{ zIndex: 40 }}>
            <line
              x1={regua.x1 * CELULA + CELULA / 2}
              y1={regua.y1 * CELULA + CELULA / 2}
              x2={regua.x2 * CELULA + CELULA / 2}
              y2={regua.y2 * CELULA + CELULA / 2}
              stroke="#fbbf24"
              strokeWidth={3}
              strokeDasharray="8 4"
              strokeLinecap="round"
            />
            <circle cx={regua.x1 * CELULA + CELULA / 2} cy={regua.y1 * CELULA + CELULA / 2} r={6} fill="#fbbf24" />
            <circle cx={regua.x2 * CELULA + CELULA / 2} cy={regua.y2 * CELULA + CELULA / 2} r={6} fill="#fbbf24" />
            <g transform={`translate(${regua.x2 * CELULA + CELULA / 2 + 12}, ${regua.y2 * CELULA + CELULA / 2 - 12})`}>
              <rect x={-4} y={-16} width={110} height={24} rx={6} fill="rgba(2,6,23,0.9)" />
              <text x={4} y={1} fill="#fbbf24" fontSize={13} fontWeight={700}>
                {medida.celulas} cél · {medida.metros}m
              </text>
            </g>
          </svg>
        )}

        {/* Pings */}
        {pings.map((ping) => (
          <div
            key={ping.id}
            className="absolute pointer-events-none"
            style={{ left: ping.x * CELULA, top: ping.y * CELULA, width: CELULA, height: CELULA, zIndex: 50 }}
          >
            <div className="absolute inset-0 rounded-full bg-amber-400/70 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-amber-400" />
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-amber-300 bg-slate-950/80 px-1.5 rounded whitespace-nowrap">
              {ping.autor}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
