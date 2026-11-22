'use client'

import { useMemo } from 'react'
import { Background, BackgroundVariant, Controls, Handle, MiniMap, Position, ReactFlow, type Edge, type Node, type NodeProps } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { LockKeyhole } from 'lucide-react'
import type { EstadoMarco, Marco, RamoSistema } from '@/lib/sistemas/arvoreSistemas'
import type { TemaArvore } from './temasArvore'

/**
 * Mapa da árvore (v0.36.6, React Flow): todos os ramos do sistema de uma vez, como galhos que saem do personagem.
 * Dá para arrastar, aproximar (pinça ou rodinha) e ver o minimapa. É só outra forma de ver os mesmos marcos:
 * nada aqui muda a ficha — tocar num marco abre o mesmo detalhe da lista.
 */
const ICONE: Record<EstadoMarco, string> = { recebido: '✧', proximo: '➜', futuro: '', referencia: '◇' }
const TEXTO: Record<EstadoMarco, string> = { recebido: 'Já tem', proximo: 'Próximo', futuro: 'Mais tarde', referencia: 'Guia' }

type DadosMarco = { m: Marco; tema: TemaArvore; quando: string; aberto: boolean; anotado: string; abrir: (id: string) => void }
type DadosRamo = { r: RamoSistema; feitos: number }
type DadosRaiz = { nome: string; sub: string; cor: string }

function NoMarco({ data }: NodeProps<Node<DadosMarco>>) {
  const { m, tema, quando, aberto, anotado, abrir } = data
  return <div className="w-[200px]">
    <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-transparent" />
    <button type="button" onClick={() => abrir(m.id)} aria-pressed={aberto} aria-label={`${m.titulo}, ${quando} ${TEXTO[m.estado]}`}
      className={'nodrag relative flex min-h-24 w-full flex-col items-center justify-center gap-1 rounded-2xl border px-3 py-3 text-center shadow-[0_4px_22px_#0008] transition ' + (aberto ? tema.noAtivo : tema.no) + (m.estado === 'futuro' ? ' opacity-55 grayscale-[.4]' : '') + (m.estado === 'proximo' ? ' outline outline-2 outline-offset-4 outline-white/60' : '')}
      style={tema.forma ? { clipPath: tema.forma, paddingInline: '1.1rem' } : undefined}>
      <span aria-hidden className={'flex h-8 w-8 items-center justify-center rounded-full border text-base ' + tema.selo}>{m.estado === 'futuro' ? <LockKeyhole size={14} /> : ICONE[m.estado]}</span>
      <strong className={'w-full break-words text-xs leading-snug ' + tema.titulo}>{m.titulo}</strong>
      <span className={'text-[10px] ' + tema.sub}>{[quando, TEXTO[m.estado]].filter(Boolean).join(' · ')}</span>
      {anotado && <span className="w-full truncate text-[10px] font-semibold text-emerald-400">✎ {anotado}</span>}
    </button>
    <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-transparent" />
  </div>
}
function NoRamo({ data }: NodeProps<Node<DadosRamo>>) {
  const { r, feitos } = data
  return <div className="w-[200px] rounded-xl border-2 bg-[#0d0b14]/90 px-3 py-2 text-center shadow-[0_0_24px_#0009]" style={{ borderColor: r.cor }}>
    <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-transparent" />
    <p className="text-lg" aria-hidden>{r.icone}</p>
    <p className="text-sm font-bold" style={{ color: r.cor }}>{r.titulo}</p>
    <p className="text-[10px] text-white/70">{r.marcos.some(m => m.estado !== 'referencia') ? `${feitos} de ${r.marcos.length}` : `${r.marcos.length} ${r.marcos.length === 1 ? 'marco' : 'marcos'}`}</p>
    <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-transparent" />
  </div>
}
function NoRaiz({ data }: NodeProps<Node<DadosRaiz>>) {
  return <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-2 bg-[radial-gradient(circle,#ffffff22,#0d0b14_70%)] p-2 text-center shadow-[0_0_40px_#0009]" style={{ borderColor: data.cor }}>
    <p className="line-clamp-2 text-xs font-bold text-white">{data.nome}</p>
    <p className="text-[10px] text-white/70">{data.sub}</p>
    <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-transparent" />
  </div>
}
const TIPOS = { marco: NoMarco, ramo: NoRamo, raiz: NoRaiz }

/** Tipo e estilo da ligação conforme o jeito da árvore do sistema. */
function ligacao(t: TemaArvore): Pick<Edge, 'type' | 'style'> {
  const style = { stroke: t.cor, strokeWidth: Math.max(1.5, t.espessura) }
  switch (t.ligacao) {
    case 'circuito': return { type: 'step', style }
    case 'reta': case 'raio': case 'serrilha': return { type: 'straight', style }
    case 'trilha': return { type: 'default', style: { ...style, strokeDasharray: '10 8' } }
    case 'pegadas': return { type: 'default', style: { ...style, strokeDasharray: '1 12', strokeLinecap: 'round', strokeWidth: style.strokeWidth * 2.2 } }
    case 'raiz': return { type: 'default', style: { ...style, strokeWidth: 5 } }
    default: return { type: 'default', style }
  }
}

export default function MapaArvore({ ramos, tema, nome, sub, quando, aberto, abrir, escolha, mostrarFuturos }: {
  ramos: RamoSistema[]; tema: TemaArvore; nome: string; sub: string
  quando: (m: Marco) => string; aberto: string | null; abrir: (id: string) => void; escolha: (m: Marco) => string; mostrarFuturos: boolean
}) {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [], edges: Edge[] = []
    const larg = 240, base = ligacao(tema)
    const x0 = -((ramos.length - 1) * larg) / 2
    nodes.push({ id: 'raiz', type: 'raiz', position: { x: -56, y: 0 }, data: { nome, sub, cor: tema.cor }, draggable: false })
    ramos.forEach((r, i) => {
      const x = x0 + i * larg - 100, rid = 'ramo:' + r.id
      nodes.push({ id: rid, type: 'ramo', position: { x, y: 190 }, data: { r, feitos: r.marcos.filter(m => m.estado === 'recebido').length } })
      edges.push({ id: 'e:' + rid, source: 'raiz', target: rid, ...base, style: { ...base.style, stroke: r.cor } })
      let anterior = rid
      r.marcos.filter(m => mostrarFuturos || m.estado !== 'futuro').forEach((m, k) => {
        const id = 'm:' + r.id + ':' + m.id
        nodes.push({ id, type: 'marco', position: { x, y: 330 + k * 150 }, data: { m, tema, quando: quando(m), aberto: aberto === m.id, anotado: escolha(m), abrir } })
        edges.push({ id: 'e:' + id, source: anterior, target: id, ...base, animated: m.estado === 'proximo', style: { ...base.style, opacity: m.estado === 'futuro' ? 0.35 : 1 } })
        anterior = id
      })
    })
    return { nodes, edges }
  }, [ramos, tema, nome, sub, quando, aberto, abrir, escolha, mostrarFuturos])

  return <div className={'relative h-[62vh] min-h-[420px] overflow-hidden rounded-2xl border ' + tema.fundo} data-mapa-arvore>
    {tema.decoracao}
    <ReactFlow nodes={nodes} edges={edges} nodeTypes={TIPOS} fitView fitViewOptions={{ padding: 0.15, maxZoom: 1 }} minZoom={0.2} maxZoom={1.8}
      nodesConnectable={false} elementsSelectable={false} proOptions={{ hideAttribution: true }} colorMode="dark" aria-label="Mapa da árvore de habilidades">
      <Background variant={BackgroundVariant.Dots} gap={22} size={1} color={tema.cor} style={{ opacity: 0.25 }} />
      <MiniMap pannable zoomable nodeColor={n => n.type === 'marco' ? ((n.data as DadosMarco).m.estado === 'recebido' ? tema.cor : '#8a8299') : n.type === 'ramo' ? (n.data as DadosRamo).r.cor : '#fff'}
        maskColor="#000a" style={{ background: '#16131f', border: '1px solid ' + tema.cor + '55' }} nodeStrokeWidth={3} ariaLabel="Minimapa da árvore" />
      <Controls showInteractive={false} position="top-left" aria-label="Zoom da árvore" />
    </ReactFlow>
  </div>
}
