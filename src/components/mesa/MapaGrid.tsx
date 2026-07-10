'use client'

import { useRef, useState, useCallback } from 'react'
import type { Campanha, Personagem } from '@/types/database'

export const CELULA = 44 // pixels por célula do grid

export type ModoMapa = 'mover' | 'revelar' | 'esconder'

export default function MapaGrid({
  campanha,
  personagens,
  souMestre,
  meuId,
  modo,
  onMoverToken,
  onPintarFog,
}: {
  campanha: Campanha
  personagens: Personagem[]
  souMestre: boolean
  meuId: string
  modo: ModoMapa
  onMoverToken: (id: string, x: number, y: number) => void
  onPintarFog: (celulas: string[], revelar: boolean) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [arrastando, setArrastando] = useState<string | null>(null)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const pintando = useRef(false)
  const celulasPintadas = useRef<Set<string>>(new Set())

  const cols = campanha.grid_cols
  const rows = campanha.grid_rows
  const largura = cols * CELULA
  const altura = rows * CELULA

  const reveladas = new Set(campanha.fog_revelado)

  const celulaDoEvento = useCallback((e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return null
    const x = Math.floor((e.clientX - rect.left) / CELULA)
    const y = Math.floor((e.clientY - rect.top) / CELULA)
    if (x < 0 || y < 0 || x >= cols || y >= rows) return null
    return { x, y }
  }, [cols, rows])

  // ── Arrastar tokens ──────────────────────────────────────────
  function onTokenPointerDown(e: React.PointerEvent, p: Personagem) {
    if (modo !== 'mover') return
    const podeMover = souMestre || p.player_id === meuId
    if (!podeMover) return
    e.preventDefault()
    e.stopPropagation()
    setArrastando(p.id)
    setDragPos({ x: p.pos_x, y: p.pos_y })
  }

  function onPointerMove(e: React.PointerEvent) {
    if (arrastando) {
      const cel = celulaDoEvento(e)
      if (cel) setDragPos(cel)
      return
    }
    if (pintando.current && souMestre && modo !== 'mover') {
      const cel = celulaDoEvento(e)
      if (cel) celulasPintadas.current.add(`${cel.x},${cel.y}`)
    }
  }

  function onPointerUp() {
    if (arrastando && dragPos) {
      onMoverToken(arrastando, dragPos.x, dragPos.y)
    }
    setArrastando(null)
    setDragPos(null)

    if (pintando.current && celulasPintadas.current.size > 0) {
      onPintarFog([...celulasPintadas.current], modo === 'revelar')
    }
    pintando.current = false
    celulasPintadas.current = new Set()
  }

  function onFundoPointerDown(e: React.PointerEvent) {
    if (!souMestre || modo === 'mover') return
    pintando.current = true
    const cel = celulaDoEvento(e)
    if (cel) celulasPintadas.current.add(`${cel.x},${cel.y}`)
  }

  // ── Células escondidas pelo fog ──────────────────────────────
  const celulasEscondidas: { x: number; y: number }[] = []
  if (campanha.fog_ativo) {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (!reveladas.has(`${x},${y}`)) celulasEscondidas.push({ x, y })
      }
    }
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
          cursor: modo !== 'mover' ? 'crosshair' : undefined,
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
          const escondidoPeloFog =
            campanha.fog_ativo && !souMestre && !reveladas.has(`${x},${y}`)
          if (escondidoPeloFog) return null

          const pctHp = p.hp_max > 0 ? Math.max(0, Math.min(1, p.hp_atual / p.hp_max)) : 0
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
                className={`w-full h-full rounded-full border-2 flex items-center justify-center font-bold text-slate-950 text-sm shadow-lg ${
                  podeMover ? 'cursor-grab active:cursor-grabbing' : ''
                } ${emDrag ? 'scale-110 border-white' : 'border-slate-950/50'}`}
                style={{ backgroundColor: p.cor }}
                title={p.nome}
              >
                {p.nome[0]?.toUpperCase()}
              </div>
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
      </div>
    </div>
  )
}
