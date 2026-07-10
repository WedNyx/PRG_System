'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { moverToken } from '@/app/actions/personagens'
import { atualizarFog, atualizarMapa } from '@/app/actions/campanhas'
import type { Campanha, Mensagem, Personagem, Rolagem } from '@/types/database'
import MapaGrid, { type ModoMapa } from './MapaGrid'
import PainelLateral, {
  mensagemParaItem,
  rolagemParaItem,
  type ItemFeed,
} from './PainelLateral'

export default function MesaClient({
  campanhaInicial,
  personagensIniciais,
  mensagensIniciais,
  rolagensIniciais,
  nomes,
  meuId,
  souMestre,
}: {
  campanhaInicial: Campanha
  personagensIniciais: Personagem[]
  mensagensIniciais: Mensagem[]
  rolagensIniciais: Rolagem[]
  nomes: Record<string, string>
  meuId: string
  souMestre: boolean
}) {
  const [campanha, setCampanha] = useState(campanhaInicial)
  const [personagens, setPersonagens] = useState(personagensIniciais)
  const [feed, setFeed] = useState<ItemFeed[]>(() =>
    [...mensagensIniciais.map(mensagemParaItem), ...rolagensIniciais.map(rolagemParaItem)].sort(
      (a, b) => a.createdAt.localeCompare(b.createdAt)
    )
  )
  const [modo, setModo] = useState<ModoMapa>('mover')
  const [configAberta, setConfigAberta] = useState(false)
  const supabase = useMemo(() => createClient(), [])
  const fogPendente = useRef(campanhaInicial.fog_revelado)

  // ── Tempo real ───────────────────────────────────────────────
  useEffect(() => {
    const canal = supabase
      .channel(`mesa-${campanha.id}`)
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
          const item = rolagemParaItem(payload.new as Rolagem)
          setFeed((f) => (f.some((i) => i.id === item.id) ? f : [...f, item]))
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'campanhas', filter: `id=eq.${campanha.id}` },
        (payload) => {
          setCampanha(payload.new as Campanha)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [supabase, campanha.id])

  // ── Ações do mapa ────────────────────────────────────────────
  function handleMoverToken(id: string, x: number, y: number) {
    // Atualização otimista: move na tela antes de confirmar no banco
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

  async function toggleFog() {
    const novoAtivo = !campanha.fog_ativo
    setCampanha((c) => ({ ...c, fog_ativo: novoAtivo }))
    await atualizarFog(campanha.id, { fog_ativo: novoAtivo })
    if (!novoAtivo) setModo('mover')
  }

  const personagensVisiveis = personagens.filter(
    (p) => souMestre || !p.is_npc || p.visivel
  )

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Barra superior */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center gap-4 shrink-0">
        <Link
          href={`/campanha/${campanha.id}`}
          className="text-sm text-slate-500 hover:text-slate-300 transition-colors shrink-0"
        >
          ← Sair da mesa
        </Link>
        <h1 className="font-semibold text-slate-100 truncate">{campanha.nome}</h1>

        {souMestre && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={toggleFog}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                campanha.fog_ativo
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              🌫️ Fog {campanha.fog_ativo ? 'ON' : 'OFF'}
            </button>

            {campanha.fog_ativo && (
              <div className="flex rounded-lg overflow-hidden border border-slate-700">
                {(['mover', 'revelar', 'esconder'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setModo(m)}
                    className={`text-xs px-3 py-1.5 transition-colors ${
                      modo === m ? 'bg-amber-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m === 'mover' ? '✋ Mover' : m === 'revelar' ? '🔦 Revelar' : '🌑 Esconder'}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setConfigAberta(!configAberta)}
              className="text-xs px-3 py-1.5 rounded-lg border bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              ⚙️ Mapa
            </button>
          </div>
        )}
      </header>

      {/* Config do mapa (mestre) */}
      {souMestre && configAberta && (
        <ConfigMapa campanha={campanha} onClose={() => setConfigAberta(false)} />
      )}

      {/* Corpo */}
      <div className="flex-1 flex min-h-0">
        <MapaGrid
          campanha={campanha}
          personagens={personagensVisiveis}
          souMestre={souMestre}
          meuId={meuId}
          modo={modo}
          onMoverToken={handleMoverToken}
          onPintarFog={handlePintarFog}
        />
        <PainelLateral
          campanhaId={campanha.id}
          feed={feed}
          iniciativa={campanha.iniciativa}
          nomes={nomes}
          meuId={meuId}
          souMestre={souMestre}
        />
      </div>
    </div>
  )
}

function ConfigMapa({ campanha, onClose }: { campanha: Campanha; onClose: () => void }) {
  const [url, setUrl] = useState(campanha.mapa_url ?? '')
  const [cols, setCols] = useState(String(campanha.grid_cols))
  const [rows, setRows] = useState(String(campanha.grid_rows))
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    await atualizarMapa(campanha.id, {
      mapa_url: url.trim() || null,
      grid_cols: Math.max(5, Math.min(100, parseInt(cols) || 30)),
      grid_rows: Math.max(5, Math.min(100, parseInt(rows) || 20)),
    })
    setSalvando(false)
    onClose()
  }

  const inputClass =
    'bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-amber-500 placeholder-slate-600'

  return (
    <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-3 flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-64">
        <label className="block text-xs text-slate-500 mb-1">URL da imagem do mapa</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://exemplo.com/mapa-da-taverna.jpg"
          className={`${inputClass} w-full`}
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Colunas</label>
        <input value={cols} onChange={(e) => setCols(e.target.value)} type="number" className={`${inputClass} w-20`} />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Linhas</label>
        <input value={rows} onChange={(e) => setRows(e.target.value)} type="number" className={`${inputClass} w-20`} />
      </div>
      <button
        onClick={salvar}
        disabled={salvando}
        className="bg-amber-500 hover:bg-amber-400 disabled:bg-amber-900 text-slate-950 font-semibold px-4 py-1.5 rounded-lg text-sm transition-colors"
      >
        {salvando ? 'Salvando...' : 'Aplicar'}
      </button>
    </div>
  )
}
