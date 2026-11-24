'use client'

import { useMemo } from 'react'
import { Background, BackgroundVariant, Controls, Handle, MiniMap, Position, ReactFlow, type Edge, type Node, type NodeProps } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Gift, LockKeyhole } from 'lucide-react'
import type { Arvore, NoArvore } from '@/lib/sistemas/arvore'
import { aneisDaArvore, type Marco } from '@/lib/sistemas/arvoreSistemas'
import type { VisualAutor } from '@/lib/sistemas/tipos'
import { FormaSvg, raioDoNo, simboloDoNo } from './formaNo'

/**
 * Árvore do autor em constelação (v0.36.7): cada habilidade fica onde o autor colocou no construtor, e a árvore cresce
 * do centro para fora — não é um caminho. Anéis discretos mostram a distância do centro; as ligações seguem os requisitos.
 * Visual moderno (tempo atual): vidro escuro, linhas finas e a cor de destaque do sistema. Nada aqui muda a ficha.
 */
const BASE = 36, ESCALA = 1.45, MARGEM = 14
type Estado = 'recebido' | 'proximo' | 'futuro'
type DadosNo = { n: NoArvore; titulo: string; estado: Estado; concedido: boolean; aberto: boolean; abrir: (id: string) => void; marco: string }
type DadosAneis = { raios: number[] }

const centroHandle = (r: number) => ({ left: '50%', top: r + MARGEM, transform: 'translate(-50%,-50%)', opacity: 0, width: 2, height: 2, minWidth: 0, minHeight: 0, border: 0, pointerEvents: 'none' as const })

function NoHabilidade({ data }: NodeProps<Node<DadosNo>>) {
  const { n, titulo, estado, concedido, aberto, abrir, marco } = data
  const r = raioDoNo(n.tamanho, BASE), lado = r * 2 + MARGEM * 2
  const texto = estado === 'recebido' ? 'liberada' : estado === 'proximo' ? 'pode liberar' : 'bloqueada'
  return <div className="flex flex-col items-center" style={{ width: Math.max(lado, 150) }}>
    <Handle type="target" position={Position.Top} style={centroHandle(r)} isConnectable={false} />
    <Handle type="source" position={Position.Bottom} style={centroHandle(r)} isConnectable={false} />
    <button type="button" onClick={() => abrir(marco)} aria-pressed={aberto} aria-label={`${titulo}, ${texto}, ${n.custo ? 'custo ' + n.custo : 'sem custo'}${n.nivel ? ', a partir do nível ' + n.nivel : ''}`}
      className={'nodrag constelacao-no relative rounded-full outline-offset-4 ' + (estado === 'proximo' ? 'constelacao-pronto' : '')} data-estado={estado} style={{ width: lado, height: lado }}>
      <svg viewBox={`${-lado / 2} ${-lado / 2} ${lado} ${lado}`} width={lado} height={lado} aria-hidden className="overflow-visible">
        {aberto && <FormaSvg forma={n.forma} r={r + 9} fill="none" style={{ stroke: '#fff', strokeWidth: 1.5, opacity: 0.85 }} />}
        {concedido && <FormaSvg forma={n.forma} r={r + 5} fill="none" style={{ stroke: '#fde68a', strokeWidth: 1.2, strokeDasharray: '3 3' }} />}
        <FormaSvg forma={n.forma} r={r} className="constelacao-forma"
          style={estado === 'recebido' ? { fill: 'color-mix(in oklab, var(--ficha-acento) 78%, #ffffff)', stroke: '#fff', strokeWidth: 1.5 }
            : estado === 'proximo' ? { fill: '#10131a', stroke: 'var(--ficha-acento)', strokeWidth: 2.5 } : { fill: '#151922', stroke: '#4a5263', strokeWidth: 1.5 }} />
        {estado === 'recebido' && <FormaSvg forma={n.forma} r={r - 5} fill="none" style={{ stroke: '#ffffff66', strokeWidth: 1 }} />}
        <text y={Math.round(r * 0.2)} textAnchor="middle" fontWeight={800} style={{ fontSize: Math.round(r * 0.55), fontFamily: 'var(--font-inter), system-ui, sans-serif',
          fill: estado === 'recebido' ? '#0b0d12' : estado === 'proximo' ? 'var(--ficha-acento)' : '#7c8597' }}>{simboloDoNo(n)}</text>
      </svg>
      {!!n.nivel && <span className="absolute rounded-md border border-white/20 bg-[#0b0d12] px-1 text-[9px] font-bold leading-4 text-[#c9d2e3]" style={{ left: MARGEM + r * 0.08, top: MARGEM + r * 0.12 }}>NV{n.nivel}</span>}
      {n.custo > 0 && <span className="absolute grid size-5 place-items-center rounded-full border bg-[#0b0d12] text-[10px] font-bold text-white" style={{ right: MARGEM + r * 0.08, top: MARGEM + r * 0.12, borderColor: estado === 'futuro' ? '#4a5263' : 'var(--ficha-acento)' }}>{n.custo}</span>}
      {estado === 'futuro' && <span className="absolute grid size-5 place-items-center rounded-full bg-[#0b0d12] text-[#8a93a6]" style={{ left: '50%', bottom: MARGEM - 6, transform: 'translateX(-50%)' }}><LockKeyhole size={11} /></span>}
      {concedido && <span className="absolute text-amber-200" style={{ left: MARGEM - 4, bottom: MARGEM }}><Gift size={12} /></span>}
    </button>
    <span className={'mt-0.5 line-clamp-2 max-w-[150px] text-center text-[10.5px] font-semibold uppercase leading-tight tracking-[.12em] [font-family:var(--font-inter),system-ui,sans-serif] ' + (estado === 'recebido' ? 'text-white' : estado === 'proximo' ? 'text-[#d7deea]' : 'text-[#8a93a6]')}
      style={{ textShadow: '0 1px 4px #000' }}>{titulo}</span>
  </div>
}
function Aneis({ data }: NodeProps<Node<DadosAneis>>) {
  const max = Math.max(...data.raios, 1)
  return <svg width={max * 2 + 8} height={max * 2 + 8} viewBox={`${-max - 4} ${-max - 4} ${max * 2 + 8} ${max * 2 + 8}`} aria-hidden className="pointer-events-none overflow-visible">
    {data.raios.map((r, i) => <circle key={i} r={r} fill="none" style={{ stroke: 'color-mix(in oklab, var(--ficha-acento) 30%, #ffffff)', strokeOpacity: 0.12, strokeWidth: 1, strokeDasharray: '2 6' }} />)}
    <circle r={4} style={{ fill: 'var(--ficha-acento)', opacity: 0.25 }} />
  </svg>
}
const TIPOS = { hab: NoHabilidade, aneis: Aneis }
const TIPO_LIGACAO: Record<NonNullable<VisualAutor['arvoreLigacao']>, Edge['type']> = { reta: 'straight', tracejada: 'straight', curva: 'simplebezier', circuito: 'smoothstep' }

export default function ConstelacaoArvore({ arvore, marcos, aberto, abrir, ligacao = 'tracejada', fundo = 'grade', mostrarFuturos }: {
  arvore: Arvore; marcos: Marco[]; aberto: string | null; abrir: (id: string) => void
  ligacao?: VisualAutor['arvoreLigacao']; fundo?: VisualAutor['arvoreFundo']; mostrarFuturos: boolean
}) {
  const { nodes, edges, foco } = useMemo(() => {
    const porId = new Map(marcos.flatMap(m => m.no ? [[m.no.id, m] as const] : []))
    const nos = arvore.nos.filter(n => porId.has(n.id) && (mostrarFuturos || porId.get(n.id)!.estado !== 'futuro'))
    const raizes = nos.filter(n => !n.requer.some(r => porId.has(r)))
    const centro = raizes.length ? { x: raizes.reduce((s, n) => s + n.x, 0) / raizes.length * ESCALA, y: raizes.reduce((s, n) => s + n.y, 0) / raizes.length * ESCALA } : { x: 0, y: 0 }
    const raios = aneisDaArvore(nos.map(n => ({ x: n.x * ESCALA, y: n.y * ESCALA })), centro)
    const max = Math.max(...raios, 1)
    const nodes: Node[] = [{ id: 'aneis', type: 'aneis', position: { x: centro.x - max - 4, y: centro.y - max - 4 }, data: { raios }, draggable: false, selectable: false, focusable: false, zIndex: -1 }]
    for (const n of nos) {
      const m = porId.get(n.id)!, r = raioDoNo(n.tamanho, BASE), largura = Math.max(r * 2 + MARGEM * 2, 150)
      nodes.push({ id: 'c:' + n.id, type: 'hab', position: { x: n.x * ESCALA - largura / 2, y: n.y * ESCALA - r - MARGEM }, draggable: false,
        data: { n, titulo: m.titulo, estado: (m.estado === 'referencia' ? 'futuro' : m.estado) as Estado, concedido: !!m.no?.concedido, aberto: aberto === m.id, abrir, marco: m.id } })
    }
    const vis = new Set(nos.map(n => n.id)), edges: Edge[] = []
    for (const n of nos) for (const r of n.requer) {
      if (!vis.has(r)) continue
      const paiOk = arvore.liberados.includes(r), filhoOk = arvore.liberados.includes(n.id), acesa = paiOk && filhoOk
      edges.push({ id: r + '>' + n.id, source: 'c:' + r, target: 'c:' + n.id, type: TIPO_LIGACAO[ligacao], animated: paiOk && !filhoOk, focusable: false,
        style: { stroke: acesa ? 'var(--ficha-acento)' : paiOk ? 'color-mix(in oklab, var(--ficha-acento) 70%, #ffffff)' : '#3a4150', strokeWidth: acesa ? 2.4 : 1.4,
          strokeDasharray: acesa || ligacao !== 'tracejada' ? undefined : '5 6', opacity: acesa ? 1 : 0.85,
          ...(acesa ? { filter: 'drop-shadow(0 0 4px var(--ficha-acento))' } : {}) } })
    }
    return { nodes, edges, foco: nos.map(n => ({ id: 'c:' + n.id })) }
  }, [arvore, marcos, aberto, abrir, ligacao, mostrarFuturos])

  return <div className="constelacao relative h-[62vh] min-h-[400px] overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d12]" data-constelacao data-fundo={fundo}>

    {fundo === 'estrelas' && <div aria-hidden className="pointer-events-none absolute inset-0 [background-image:radial-gradient(1px_1px_at_20%_30%,#fff8,transparent),radial-gradient(1px_1px_at_70%_60%,#fff6,transparent),radial-gradient(1.5px_1.5px_at_40%_80%,#fff5,transparent),radial-gradient(1px_1px_at_85%_20%,#fff7,transparent),radial-gradient(1px_1px_at_10%_75%,#fff5,transparent)] [background-size:220px_220px]" />}
    <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,color-mix(in_oklab,var(--ficha-acento)_16%,transparent),transparent_62%)]" />
    <ReactFlow nodes={nodes} edges={edges} nodeTypes={TIPOS} fitView fitViewOptions={{ nodes: foco, padding: 0.15, maxZoom: 1.1, minZoom: 0.5 }} minZoom={0.25} maxZoom={2}
      nodesConnectable={false} elementsSelectable={false} proOptions={{ hideAttribution: true }} colorMode="dark" aria-label="Constelação de habilidades">
      {(fundo === 'grade' || fundo === 'mapa') && <Background variant={BackgroundVariant.Lines} gap={32} color="#ffffff" style={{ opacity: 0.04 }} />}
      {foco.length > 8 && <MiniMap className="max-sm:!hidden" pannable zoomable ariaLabel="Minimapa da árvore" maskColor="#000a" style={{ background: fundo === 'mapa' ? '#0d2229' : '#11141b', border: '1px solid #ffffff1a' }} nodeStrokeWidth={2}
        nodeColor={n => n.type !== 'hab' ? 'transparent' : (n.data as DadosNo).estado === 'recebido' ? '#e2e8f0' : (n.data as DadosNo).estado === 'proximo' ? '#8fa3c7' : '#4a5263'} />}
      <Controls showInteractive={false} position="top-left" aria-label="Zoom da árvore" />
    </ReactFlow>
    {fundo === 'mapa' && <svg aria-hidden viewBox="-50 -50 100 100" className="pointer-events-none absolute bottom-3 left-3 z-[5] size-28 opacity-30 sm:size-36">
      <g fill="none" stroke="#e9b44c" strokeWidth="1.2"><circle r="30" /><circle r="22" strokeDasharray="2 3" /><path d="M0 -46 L6 -6 L46 0 L6 6 L0 46 L-6 6 L-46 0 L-6 -6 Z" fill="#e9b44c22" /><path d="M0 -46 L0 46 M-46 0 L46 0" /></g>
      <text y="-34" textAnchor="middle" fontSize="9" fill="#e9b44c" fontFamily="serif">N</text></svg>}
  </div>
}
