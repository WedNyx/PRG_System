'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { TransformComponent, TransformWrapper, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import { ligarZoomSuave } from '@/lib/zoomRoda'
import { Dice5, Link2, Minus, Pencil, Plus, Sparkles, Trash2, Undo2, X } from 'lucide-react'
import type { DadosFicha, Sistema } from '@/lib/sistemas/tipos'
import { alvosDeBonus, lerPoderes, TIPOS_PODER, type TipoPoder } from '@/lib/sistemas/inventario'
import {
  arvoreExemplo, CORES_NO, difereDoSistema, disponiveis, gastos, lerArvore, LIM_ARVORE, mesclarArvore, novoIdNo, podeDevolver, podeLiberar, sincronizarPoderes,
  type Arvore, type EfeitoNo, type NoArvore,
} from '@/lib/sistemas/arvore'

const R = 34 // raio do hexágono
const MARGEM = 170
const hex = (r: number) => Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 180 * (60 * i - 90); return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}` }).join(' ')
const input = 'w-full rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-white'
const btn = 'inline-flex items-center gap-1.5 rounded-lg border border-(--a-70588c) px-3 py-2 text-sm hover:bg-(--s-38294d) disabled:opacity-40'

type Props = {
  s: Sistema; d: DadosFicha; onChange: (d: DadosFicha) => void; somenteLeitura: boolean; rolar: (expressao: string, rotulo: string) => void
  /** Pontos que vêm da progressão por nível (somam aos ganhos). */
  extra?: number
  /** Construtor: edita a árvore padrão do sistema (sem liberar nada). */
  editorSistema?: boolean
}

/** Árvore de habilidades: hexágonos ligados, liberados com pontos. Modo “Montar” para criar/ligar/arrastar. */
export default function ArvoreHabilidades({ s, d, onChange, somenteLeitura, rolar, extra = 0, editorSistema = false }: Props) {
  const a = useMemo(() => lerArvore(d.arvore), [d.arvore])
  const alvos = useMemo(() => alvosDeBonus(s), [s])
  const [montando, setMontando] = useState(editorSistema)
  const desligarZoom = useRef<(() => void) | null>(null)
  useEffect(() => () => desligarZoom.current?.(), [])
  const [sel, setSel] = useState<string | null>(null)
  const [editor, setEditor] = useState<NoArvore | null>(null)
  const [ligando, setLigando] = useState<string | null>(null)
  const [arrasto, setArrasto] = useState<{ id: string; x: number; y: number; moveu: boolean } | null>(null)
  const svg = useRef<SVGSVGElement>(null)
  // Toque no fundo (sem arrastar o mapa) fecha a seleção.
  const fundo = useRef<{ x: number; y: number } | null>(null)
  function fundoSolto(e: React.PointerEvent) {
    const f = fundo.current; fundo.current = null
    if (f && Math.abs(e.clientX - f.x) + Math.abs(e.clientY - f.y) < 6) { setSel(null); setLigando(null) }
  }

  const salvar = (nova: Arvore) => onChange({ ...d, arvore: nova, poderes: sincronizarPoderes(lerPoderes(d.poderes), nova) })
  const no = a.nos.find(n => n.id === sel) ?? null
  const livres = disponiveis(a, extra)
  const doSistema = !editorSistema && s.arvore?.nos?.length ? s.arvore : null
  const sistemaMudou = !!doSistema && a.nos.length > 0 && difereDoSistema(a, doSistema)

  // Área do desenho: cabe todos os hexágonos com folga.
  const xs = a.nos.map(n => n.id === arrasto?.id ? arrasto.x : n.x), ys = a.nos.map(n => n.id === arrasto?.id ? arrasto.y : n.y)
  const minX = Math.min(0, ...xs) - MARGEM, maxX = Math.max(0, ...xs) + MARGEM, minY = Math.min(0, ...ys) - MARGEM, maxY = Math.max(0, ...ys) + MARGEM
  const W = Math.max(640, maxX - minX), H = Math.max(520, maxY - minY)
  const pos = (n: NoArvore) => n.id === arrasto?.id ? { x: arrasto.x - minX, y: arrasto.y - minY } : { x: n.x - minX, y: n.y - minY }
  const estrelas = useMemo(() => Array.from({ length: 90 }, (_, i) => ({ x: (i * 7919) % 1000 / 1000, y: (i * 104729) % 997 / 997, r: i % 7 === 0 ? 1.6 : 0.8, o: 0.25 + (i % 5) / 8 })), [])

  function pontoSvg(e: React.PointerEvent) {
    const m = svg.current?.getScreenCTM(); if (!m) return null
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    return { x: Math.round((p.x + minX) / 10) * 10, y: Math.round((p.y + minY) / 10) * 10 }
  }
  function tocarNo(e: React.PointerEvent, n: NoArvore) {
    e.stopPropagation(); fundo.current = null
    if (montando && ligando && ligando !== n.id) {
      // Liga: o nó tocado passa a exigir (ou deixa de exigir) o nó escolhido antes.
      const exige = n.requer.includes(ligando)
      if (!exige && criaCiclo(a, n.id, ligando)) { setLigando(null); return }
      salvar({ ...a, nos: a.nos.map(x => x.id === n.id ? { ...x, requer: exige ? x.requer.filter(r => r !== ligando) : [...x.requer, ligando].slice(0, LIM_ARVORE.requer) } : x) })
      setLigando(null); setSel(n.id); return
    }
    setSel(n.id)
    if (montando && !somenteLeitura) { (e.target as Element).setPointerCapture?.(e.pointerId); setArrasto({ id: n.id, x: n.x, y: n.y, moveu: false }) }
  }
  function mover(e: React.PointerEvent) {
    if (!arrasto) return
    const p = pontoSvg(e); if (!p || (p.x === arrasto.x && p.y === arrasto.y)) return
    setArrasto({ ...arrasto, ...p, moveu: true })
  }
  function soltar() {
    if (arrasto?.moveu) salvar({ ...a, nos: a.nos.map(n => n.id === arrasto.id ? { ...n, x: arrasto.x, y: arrasto.y } : n) })
    setArrasto(null)
  }

  function liberar(n: NoArvore) { if (podeLiberar(a, n.id, extra).ok) salvar({ ...a, liberados: [...a.liberados, n.id] }) }
  function devolver(n: NoArvore) { if (podeDevolver(a, n.id).ok) salvar({ ...a, liberados: a.liberados.filter(l => l !== n.id) }) }
  function novoNo() {
    if (a.nos.length >= LIM_ARVORE.nos) return
    const pai = no
    setEditor({ id: novoIdNo(), nome: '', custo: 1, cor: pai?.cor ?? CORES_NO[a.nos.length % CORES_NO.length], x: pai ? pai.x + (a.nos.filter(n => n.requer.includes(pai.id)).length % 2 ? 150 : -150) : 0, y: pai ? pai.y - 150 : (a.nos.length ? Math.min(...a.nos.map(n => n.y)) - 150 : 0), requer: pai ? [pai.id] : [], efeitos: [] })
  }
  function gravarNo(n: NoArvore) {
    const existe = a.nos.some(x => x.id === n.id)
    const nova = lerArvore({ ...a, nos: existe ? a.nos.map(x => x.id === n.id ? n : x) : [...a.nos, n] })
    salvar(nova); setEditor(null); setSel(n.id)
  }
  function excluirNo(n: NoArvore) {
    if (!confirm(`Excluir o hexágono “${n.nome}”? As ligações com ele também somem.`)) return
    salvar(lerArvore({ ...a, nos: a.nos.filter(x => x.id !== n.id), liberados: a.liberados.filter(l => l !== n.id) })); setSel(null)
  }

  const estado = (n: NoArvore) => a.liberados.includes(n.id) ? 'liberado' : !editorSistema && podeLiberar(a, n.id, extra).ok ? 'disponivel' : n.requer.every(r => a.liberados.includes(r)) ? 'sem-pontos' : 'bloqueado'

  return <section className="overflow-hidden rounded-2xl border border-(--a-55456e) bg-(--s-0c0a16)">
    <div className="flex flex-wrap items-center gap-3 border-b border-(--a-2b2140) bg-(--s-14111f) px-4 py-3">
      <h2 className="flex-1 bg-gradient-to-b from-[#fde68a] to-[#d4a23a] bg-clip-text font-serif text-lg font-bold uppercase tracking-[.18em] text-transparent sm:text-xl">{editorSistema ? 'Árvore padrão do sistema' : 'Árvore de habilidades'}</h2>
      {editorSistema ? <span className="rounded-full border border-(--a-62527e) bg-(--s-201a32) px-3 py-1 text-sm">🌠 Pontos iniciais: <strong>{a.pontos}</strong></span>
        : <span className="rounded-full border border-(--a-62527e) bg-(--s-201a32) px-3 py-1 text-sm" title={`${gastos(a)} gasto(s) · ${a.pontos} ganhos${extra ? ` + ${extra} do nível` : ''}`}>
        🌠 <strong className={livres > 0 ? 'text-amber-200' : ''}>{livres}</strong> livre{livres === 1 ? '' : 's'} <span className="text-xs text-(--a-b4aeca)">de {a.pontos + extra}{extra ? ` (${extra} do nível)` : ''}</span></span>}
      {sistemaMudou && !somenteLeitura && <button type="button" onClick={() => { if (confirm('Trazer as mudanças da árvore do sistema? Hexágonos novos entram e os iguais são atualizados; o que você liberou continua.')) salvar(mesclarArvore(a, doSistema!)) }}
        className={btn + ' !border-amber-300/60 !text-amber-200'}>🔄 Atualizar com a árvore do sistema</button>}
      {montando && !somenteLeitura && <span className="flex items-center gap-1" aria-label="Pontos ganhos">
        <button type="button" className={btn + ' !px-2'} aria-label="Menos um ponto" disabled={a.pontos <= gastos(a)} onClick={() => salvar({ ...a, pontos: a.pontos - 1 })}><Minus size={14} /></button>
        <button type="button" className={btn + ' !px-2'} aria-label="Mais um ponto" onClick={() => salvar({ ...a, pontos: Math.min(9999, a.pontos + 1) })}><Plus size={14} /></button></span>}
      {!somenteLeitura && !editorSistema && <button type="button" onClick={() => { setMontando(m => !m); setLigando(null) }} className={btn + (montando ? ' !border-(--a-b99bff) !bg-(--s-3b2b57)' : '')}>
        <Pencil size={14} /> {montando ? 'Concluir' : 'Montar árvore'}</button>}
    </div>

    {montando && <div className="flex flex-wrap items-center gap-2 border-b border-(--a-2b2140) bg-(--s-171325) px-4 py-2 text-sm">
      <button type="button" className={btn} onClick={novoNo} disabled={a.nos.length >= LIM_ARVORE.nos}><Plus size={14} /> {no ? 'Hexágono ligado a este' : 'Hexágono'}</button>
      {no && <>
        <button type="button" className={btn} onClick={() => setEditor(no)}><Pencil size={14} /> Editar</button>
        <button type="button" className={btn + (ligando ? ' !border-amber-300 !text-amber-200' : '')} onClick={() => setLigando(l => l ? null : no.id)}><Link2 size={14} /> {ligando ? 'Toque no hexágono que vai depender dele…' : 'Ligar'}</button>
        <button type="button" className={btn + ' text-[#f2a9c3]'} onClick={() => excluirNo(no)}><Trash2 size={14} /> Excluir</button></>}
      <span className="text-xs text-(--a-a998bd)">Arraste os hexágonos para organizar. “Ligar”: escolha um e toque no que depende dele.</span>
    </div>}

    <div className="relative h-[62vh] min-h-[380px] touch-none select-none" style={{ background: 'radial-gradient(ellipse at 50% 40%, #2a1d4a 0%, #120d22 55%, #07060d 100%)' }}>
      {a.nos.length === 0 ? <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-5xl" aria-hidden>🌌</p>
        <p className="max-w-sm text-(--a-d6c8e8)">{editorSistema ? 'Monte a árvore que toda ficha nova deste sistema vai receber. Os jogadores liberam os hexágonos com pontos.' : 'Esta ficha ainda não tem árvore. Monte os hexágonos com os poderes do personagem e libere com pontos.'}</p>
        {!somenteLeitura && <div className="flex flex-wrap justify-center gap-2">
          {doSistema && <button type="button" className="rounded-xl bg-gradient-to-r from-(--a-7652ac) to-[#b45309] px-4 py-2.5 font-semibold" onClick={() => salvar(mesclarArvore(a, doSistema))}>🌠 Usar a árvore do sistema</button>}
          <button type="button" className="rounded-xl bg-(--a-7652ac) px-4 py-2.5 font-semibold hover:bg-(--a-8b68c4)" onClick={() => { setMontando(true); novoNo() }}><Plus size={16} className="mr-1 inline" />Criar o primeiro hexágono</button>
          <button type="button" className={btn} onClick={() => { salvar(arvoreExemplo(alvos)); setMontando(true) }}><Sparkles size={14} /> Começar com um exemplo</button></div>}
      </div>
        : <TransformWrapper onInit={ref => { desligarZoom.current?.(); desligarZoom.current = ligarZoomSuave(ref, 0.3, 2.5) }} minScale={0.3} maxScale={2.5} initialScale={0.9} centerOnInit limitToBounds={false} doubleClick={{ disabled: true }} wheel={{ disabled: true }} panning={{ disabled: !!arrasto, velocityDisabled: true, excluded: ['arvore-no-arrastavel'] }}>
          <TransformComponent wrapperClass="!w-full !h-full" contentClass="">
            <svg ref={svg} width={W} height={H} viewBox={`0 0 ${W} ${H}`} onPointerMove={mover} onPointerUp={e => { soltar(); fundoSolto(e) }} onPointerLeave={soltar} onPointerDown={e => { fundo.current = { x: e.clientX, y: e.clientY } }}
              role="group" aria-label="Árvore de habilidades">
              <defs>
                <filter id="brilho" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                <radialGradient id="hexDentro" cx="50%" cy="35%" r="70%"><stop offset="0" stopColor="#fff" stopOpacity=".55" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
              </defs>
              {estrelas.map((e, i) => <circle key={i} cx={e.x * W} cy={e.y * H} r={e.r} fill="#fff" opacity={e.o} />)}
              {/* Ligações */}
              {a.nos.flatMap(n => n.requer.map(r => {
                const p = a.nos.find(x => x.id === r); if (!p) return null
                const de = pos(p), ate = pos(n), ok = a.liberados.includes(r)
                const acesa = ok && a.liberados.includes(n.id)
                return <line key={r + '>' + n.id} x1={de.x} y1={de.y} x2={ate.x} y2={ate.y} stroke={acesa ? n.cor : ok ? '#c4b6d4' : '#3d3152'} strokeWidth={acesa ? 3.5 : 2}
                  strokeDasharray={acesa ? undefined : ok ? '6 6' : '3 7'} opacity={acesa ? 0.95 : 0.8} filter={acesa ? 'url(#brilho)' : undefined} />
              }))}
              {/* Hexágonos */}
              {a.nos.map(n => {
                const { x, y } = pos(n), e = estado(n), escolhido = sel === n.id
                const aceso = e === 'liberado'
                return <g key={n.id} transform={`translate(${x},${y})`} onPointerDown={ev => tocarNo(ev, n)} className={montando ? 'arvore-no-arrastavel cursor-move' : 'cursor-pointer'}
                  role="button" aria-label={`${n.nome}, custo ${n.custo}, ${aceso ? 'liberado' : e === 'disponivel' ? 'pode liberar' : 'bloqueado'}`}>
                  {escolhido && <polygon points={hex(R + 9)} fill="none" stroke="#fff" strokeWidth={2} opacity={0.9} />}
                  {ligando === n.id && <polygon points={hex(R + 14)} fill="none" stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 4" />}
                  <polygon points={hex(R)} fill={aceso ? n.cor : '#1d1730'} stroke={aceso ? '#fff' : e === 'disponivel' ? n.cor : '#4a3d63'} strokeWidth={aceso ? 2 : e === 'disponivel' ? 3 : 2}
                    filter={aceso ? 'url(#brilho)' : undefined} className={e === 'disponivel' ? 'prg-hex-pronto' : undefined} />
                  {aceso && <polygon points={hex(R - 4)} fill="url(#hexDentro)" />}
                  <text y={6} textAnchor="middle" fontSize={18} fill={aceso ? '#1a1230' : e === 'disponivel' ? n.cor : '#6d5f86'} fontWeight={800}>{n.nome.trim()[0]?.toUpperCase()}</text>
                  <g transform={`translate(${R * 0.8},${-R * 0.75})`}><circle r={10} fill="#0c0a16" stroke={aceso ? n.cor : '#62527e'} /><text y={4} textAnchor="middle" fontSize={11} fill="#f2ebff" fontWeight={700}>{n.custo}</text></g>
                  <text y={R + 20} textAnchor="middle" fontSize={12} fontFamily="Georgia, serif" letterSpacing="1.2" fill={aceso ? '#f8f1ff' : e === 'disponivel' ? '#e4d3ff' : '#8c7fa3'}
                    stroke="#07060d" strokeWidth={3} paintOrder="stroke" style={{ textTransform: 'uppercase' }}>{n.nome.length > 22 ? n.nome.slice(0, 21) + '…' : n.nome}</text>
                </g>
              })}
            </svg>
          </TransformComponent>
        </TransformWrapper>}
    </div>

    {no && !editor && <DetalheNo no={no} a={a} extra={extra} alvos={alvos} recursos={s.recursos} somenteLeitura={somenteLeitura || montando || editorSistema}
      liberar={() => liberar(no)} devolver={() => devolver(no)} rolar={rolar} fechar={() => setSel(null)} />}
    {!no && a.nos.length > 0 && <p className="px-4 py-3 text-xs text-(--a-a998bd)">Toque num hexágono para ver o que ele faz. {somenteLeitura ? '' : 'Os que brilham na borda já podem ser liberados.'}</p>}
    {editor && <EditorNo inicial={editor} a={a} alvos={alvos} recursos={s.recursos} gravar={gravarNo} fechar={() => setEditor(null)} />}
  </section>
}

/** Não deixa ligar em círculo (A exige B que exige A). */
function criaCiclo(a: Arvore, filho: string, pai: string): boolean {
  const pilha = [pai], vistos = new Set<string>()
  while (pilha.length) {
    const atual = pilha.pop()!
    if (atual === filho) return true
    if (vistos.has(atual)) continue
    vistos.add(atual)
    pilha.push(...(a.nos.find(n => n.id === atual)?.requer ?? []))
  }
  return false
}

function textoEfeito(e: EfeitoNo, alvos: { id: string; nome: string }[], recursos: Sistema['recursos']) {
  if (e.tipo === 'bonus') return `${e.valor > 0 ? '+' : ''}${e.valor} em ${alvos.find(x => x.id === e.alvo)?.nome ?? e.alvo}`
  const p = e.poder, rec = p.recurso ? recursos.find(r => r.id === p.recurso)?.nome ?? p.recurso : ''
  return [`${TIPOS_PODER.find(t => t.id === p.tipo)?.icone ?? '🌀'} ${p.nome}`, p.expressao, rec && `${p.custo ?? 0} ${rec}`, p.usosMax && `${p.usosMax}× até descansar`].filter(Boolean).join(' · ')
}

function DetalheNo({ no, a, extra, alvos, recursos, somenteLeitura, liberar, devolver, rolar, fechar }: {
  no: NoArvore; a: Arvore; extra: number; alvos: { id: string; nome: string }[]; recursos: Sistema['recursos']; somenteLeitura: boolean
  liberar: () => void; devolver: () => void; rolar: (expressao: string, rotulo: string) => void; fechar: () => void
}) {
  const liberado = a.liberados.includes(no.id), pode = podeLiberar(a, no.id, extra), volta = podeDevolver(a, no.id)
  return <div className="border-t border-(--a-2b2140) bg-(--s-14111f) p-4">
    <div className="flex items-start gap-3">
      <span aria-hidden className="mt-0.5 h-5 w-5 shrink-0 rotate-90" style={{ background: no.cor, clipPath: 'polygon(25% 5%,75% 5%,100% 50%,75% 95%,25% 95%,0 50%)', opacity: liberado ? 1 : 0.5 }} />
      <div className="min-w-0 flex-1">
        <h3 className="font-serif text-lg font-bold uppercase tracking-wider text-(--a-f2ebff)">{no.nome}</h3>
        <p className="text-xs text-(--a-b4aeca)">Custo: {no.custo} ponto{no.custo === 1 ? '' : 's'}{liberado && ' · ✅ Liberado'}</p>
      </div>
      <button type="button" onClick={fechar} aria-label="Fechar" className="rounded-lg p-1 text-(--a-c4b6d4) hover:bg-(--s-2b2140)"><X size={18} /></button>
    </div>
    {no.descricao && <p className="mt-2 whitespace-pre-wrap text-sm text-(--a-d6c8e8)">{no.descricao}</p>}
    {no.requer.length > 0 && <p className="mt-2 text-xs text-(--a-c4b6d4)">Precisa de: {no.requer.map(r => { const n = a.nos.find(x => x.id === r); return n ? (a.liberados.includes(r) ? '✓ ' : '✗ ') + n.nome : '' }).join(' · ')}</p>}
    {no.efeitos.length > 0 && <ul className="mt-3 space-y-1.5">{no.efeitos.map((e, i) => <li key={i} className="flex items-center gap-2 rounded-lg bg-(--s-201a32) px-3 py-2 text-sm">
      <span className="flex-1">{textoEfeito(e, alvos, recursos)}</span>
      {e.tipo === 'poder' && e.poder.expressao && liberado && <button type="button" onClick={() => rolar(e.poder.expressao!, e.poder.nome)} className="inline-flex items-center gap-1 rounded-md bg-(--s-3b2b57) px-2 py-1 text-xs hover:bg-(--a-533b78)"><Dice5 size={13} /> Rolar</button>}
    </li>)}</ul>}
    {!somenteLeitura && <div className="mt-3 flex flex-wrap items-center gap-2">
      {!liberado && <button type="button" disabled={!pode.ok} onClick={liberar} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-(--a-7652ac) to-(--a-a855f7) px-4 py-2 font-semibold shadow-[0_0_18px_#a855f766] disabled:opacity-40 disabled:shadow-none"><Sparkles size={16} /> Liberar ({no.custo})</button>}
      {!liberado && !pode.ok && <span className="text-xs text-amber-200">{pode.motivo}</span>}
      {liberado && <button type="button" disabled={!volta.ok} onClick={devolver} className={btn}><Undo2 size={14} /> Devolver pontos</button>}
      {liberado && !volta.ok && <span className="text-xs text-(--a-b4aeca)">{volta.motivo}</span>}
    </div>}
  </div>
}

function EditorNo({ inicial, a, alvos, recursos, gravar, fechar }: {
  inicial: NoArvore; a: Arvore; alvos: { id: string; nome: string }[]; recursos: Sistema['recursos']; gravar: (n: NoArvore) => void; fechar: () => void
}) {
  const [n, setN] = useState<NoArvore>(inicial)
  const outros = a.nos.filter(x => x.id !== n.id)
  const mudarEfeito = (i: number, e: EfeitoNo) => setN({ ...n, efeitos: n.efeitos.map((x, k) => k === i ? e : x) })
  const podeAdd = n.efeitos.length < LIM_ARVORE.efeitos
  return <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" onMouseDown={e => { if (e.target === e.currentTarget) fechar() }}>
    <form role="dialog" aria-modal="true" aria-label="Hexágono" onSubmit={e => { e.preventDefault(); if (n.nome.trim()) gravar({ ...n, nome: n.nome.trim() }) }} onKeyDown={e => { if (e.key === 'Escape') fechar() }}
      className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-(--a-62527e) bg-(--s-19172c) p-5 text-(--a-f4f0ff) shadow-2xl sm:rounded-2xl">
      <div className="flex items-center gap-2"><h2 className="flex-1 text-lg font-bold">{a.nos.some(x => x.id === n.id) ? 'Editar hexágono' : 'Novo hexágono'}</h2>
        <button type="button" onClick={fechar} aria-label="Fechar" className="rounded-lg p-1 hover:bg-(--s-2b2140)"><X size={20} /></button></div>
      <label className="mt-3 block text-sm">Nome<input autoFocus required maxLength={LIM_ARVORE.nome} value={n.nome} onChange={e => setN({ ...n, nome: e.target.value })} className={input + ' mt-1'} placeholder="Ex.: Habilidade de Raio" /></label>
      <label className="mt-3 block text-sm">Descrição<textarea rows={3} maxLength={LIM_ARVORE.descricao} value={n.descricao ?? ''} onChange={e => setN({ ...n, descricao: e.target.value })} className={input + ' mt-1'} placeholder="O que ela faz na história e nas regras." /></label>
      <div className="mt-3 flex flex-wrap items-end gap-4">
        <div className="text-sm">Custo (pontos)<div className="mt-1 flex items-center gap-2">
          <button type="button" className={btn + ' !px-2'} aria-label="Diminuir custo" onClick={() => setN({ ...n, custo: Math.max(0, n.custo - 1) })}><Minus size={14} /></button>
          <span className="w-8 text-center text-lg font-bold tabular-nums">{n.custo}</span>
          <button type="button" className={btn + ' !px-2'} aria-label="Aumentar custo" onClick={() => setN({ ...n, custo: Math.min(99, n.custo + 1) })}><Plus size={14} /></button></div></div>
        <div className="text-sm">Cor<div className="mt-1 flex flex-wrap gap-1.5">{CORES_NO.map(c => <button key={c} type="button" aria-label={'Cor ' + c} onClick={() => setN({ ...n, cor: c })}
          className={'h-7 w-7 rounded-full border-2 ' + (n.cor === c ? 'border-white' : 'border-transparent')} style={{ background: c }} />)}</div></div>
      </div>
      {outros.length > 0 && <div className="mt-4 text-sm">Precisa liberar antes<div className="mt-1 flex flex-wrap gap-1.5">{outros.map(o => {
        const on = n.requer.includes(o.id), ciclo = !on && criaCiclo(a, n.id, o.id)
        return <button key={o.id} type="button" disabled={ciclo} onClick={() => setN({ ...n, requer: on ? n.requer.filter(r => r !== o.id) : [...n.requer, o.id].slice(0, LIM_ARVORE.requer) })}
          className={'rounded-full border px-2.5 py-1 text-xs disabled:opacity-30 ' + (on ? 'border-(--a-b99bff) bg-(--s-3b2b57)' : 'border-(--a-4a3d63)')}>{on ? '✓ ' : ''}{o.nome}</button>
      })}</div></div>}

      <h3 className="mt-5 text-sm font-semibold">✨ Efeitos automáticos <span className="font-normal text-(--a-a998bd)">(valem quando o hexágono é liberado)</span></h3>
      <div className="mt-2 space-y-2">{n.efeitos.map((e, i) => <div key={i} className="rounded-xl border border-(--a-3d3152) bg-(--s-151123) p-3">
        <div className="flex items-center gap-2"><span className="flex-1 text-xs font-semibold text-(--a-c7a8ff)">{e.tipo === 'bonus' ? '➕ Bônus' : '🌀 Habilidade nova'}</span>
          <button type="button" aria-label="Remover efeito" onClick={() => setN({ ...n, efeitos: n.efeitos.filter((_, k) => k !== i) })} className="rounded p-1 text-[#f2a9c3] hover:bg-(--s-2b2140)"><Trash2 size={14} /></button></div>
        {e.tipo === 'bonus' ? <div className="mt-2 grid grid-cols-[1fr_5rem] gap-2">
          <select aria-label="Onde soma" value={e.alvo} onChange={x => mudarEfeito(i, { ...e, alvo: x.target.value })} className={input}>{alvos.map(al => <option key={al.id} value={al.id}>{al.nome}</option>)}</select>
          <input aria-label="Valor do bônus" type="number" min={-99} max={99} value={e.valor} onChange={x => mudarEfeito(i, { ...e, valor: Number(x.target.value) || 0 })} className={input} />
        </div> : <div className="mt-2 grid grid-cols-2 gap-2">
          <input aria-label="Nome da habilidade" maxLength={120} value={e.poder.nome} onChange={x => mudarEfeito(i, { ...e, poder: { ...e.poder, nome: x.target.value } })} placeholder="Nome (ex.: Raio)" className={input + ' col-span-2'} />
          <select aria-label="Tipo" value={e.poder.tipo} onChange={x => mudarEfeito(i, { ...e, poder: { ...e.poder, tipo: x.target.value as TipoPoder } })} className={input}>{TIPOS_PODER.map(t => <option key={t.id} value={t.id}>{t.icone} {t.nome}</option>)}</select>
          <input aria-label="Rolagem" maxLength={40} value={e.poder.expressao ?? ''} onChange={x => mudarEfeito(i, { ...e, poder: { ...e.poder, expressao: x.target.value } })} placeholder="Dados (ex.: 11d6)" className={input} />
          <select aria-label="Gasta qual recurso" value={e.poder.recurso ?? ''} onChange={x => mudarEfeito(i, { ...e, poder: { ...e.poder, recurso: x.target.value || undefined } })} className={input}>
            <option value="">Sem custo de uso</option>{recursos.map(r => <option key={r.id} value={r.id}>Gasta {r.nome}</option>)}</select>
          <input aria-label="Custo de uso" type="number" min={0} max={999} disabled={!e.poder.recurso} value={e.poder.custo ?? 0} onChange={x => mudarEfeito(i, { ...e, poder: { ...e.poder, custo: Number(x.target.value) || 0 } })} placeholder="Custo" className={input} />
          <textarea aria-label="Descrição da habilidade" rows={2} maxLength={2000} value={e.poder.descricao ?? ''} onChange={x => mudarEfeito(i, { ...e, poder: { ...e.poder, descricao: x.target.value } })} placeholder="Descrição" className={input + ' col-span-2'} />
        </div>}
      </div>)}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" disabled={!podeAdd || !alvos.length} className={btn} onClick={() => setN({ ...n, efeitos: [...n.efeitos, { tipo: 'bonus', alvo: alvos[0]?.id ?? '', valor: 1 }] })}><Plus size={14} /> Bônus</button>
        <button type="button" disabled={!podeAdd} className={btn} onClick={() => setN({ ...n, efeitos: [...n.efeitos, { tipo: 'poder', poder: { id: '', nome: n.nome || 'Habilidade', tipo: 'habilidade' } }] })}><Plus size={14} /> Habilidade nova</button>
      </div>
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={fechar} className="flex-1 rounded-xl border border-(--a-62527e) p-2.5">Cancelar</button>
        <button type="submit" disabled={!n.nome.trim()} className="flex-1 rounded-xl bg-(--a-7652ac) p-2.5 font-semibold hover:bg-(--a-8b68c4) disabled:opacity-50">Salvar hexágono</button>
      </div>
    </form>
  </div>
}
