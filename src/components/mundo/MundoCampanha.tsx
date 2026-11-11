'use client'

/**
 * Mundo da campanha: mapa-múndi com alfinetes, páginas (lugares, NPCs, facções…) e teia de relações.
 * O mestre monta e edita; jogadores e espectadores só veem o que não é “só o mestre” (o servidor filtra).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Eye, EyeOff, ImagePlus, Link2, MapPin, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { TransformComponent, TransformWrapper, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import { api, enviarImagemNuvem, ErroNuvem } from '@/lib/nuvem/cliente'
import { ICONES, lerMundo, novoId, posicaoNaTeia, TIPOS_PAGINA, TIPOS_RELACAO, type Mundo, type Pagina, type Relacao } from '@/lib/mundo'
import { ligarZoomSuave } from '@/lib/zoomRoda'

const btn = 'inline-flex items-center gap-1.5 rounded-lg border border-(--a-5e4b78) px-2.5 py-1.5 text-xs hover:bg-(--s-34294f) disabled:opacity-50'
const input = 'w-full rounded-lg border border-(--a-5e4b78) bg-(--s-100f20) p-2 text-sm text-white'
const msg = (e: unknown) => e instanceof Error ? e.message : 'Falha de conexão.'
type Estado = { campanha: { id: string; nome: string }; admin: boolean; mundo: Mundo }
type Aba = 'mapa' | 'teia' | 'paginas'
const tipoDe = (p: Pagina) => TIPOS_PAGINA.find(t => t.id === p.tipo)!
const corRel = (r: Relacao) => TIPOS_RELACAO.find(t => t.id === r.tipo)!

export default function MundoCampanha({ campanhaId }: { campanhaId: string }) {
  const [e, setE] = useState<Estado | null>(null)
  const [erro, setErro] = useState('')
  const [aba, setAba] = useState<Aba>('mapa')
  const [aberta, setAberta] = useState<string | null>(null)
  const [editando, setEditando] = useState<Pagina | null>(null)
  const [ligando, setLigando] = useState<Partial<Relacao> | null>(null)
  const [posicionando, setPosicionando] = useState<string | null>(null)
  const [destaque, setDestaque] = useState<string | null>(null)
  const ocupado = useRef(false)

  const carregar = useCallback(async () => {
    try { const r = await api<Estado>(`campanhas/${campanhaId}/mundo`); setE({ ...r, mundo: lerMundo(r.mundo) }); setErro('') }
    catch (x) { setErro(msg(x)) }
  }, [campanhaId])
  useEffect(() => { void carregar() }, [carregar])
  // Jogadores veem as mudanças do mestre sem recarregar.
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden && !ocupado.current && !editando && !ligando) void carregar() }, 20000)
    return () => clearInterval(t)
  }, [carregar, editando, ligando])

  const salvar = useCallback(async (novo: Mundo, aviso?: string) => {
    if (!e) return
    const antes = e.mundo
    setE({ ...e, mundo: novo }); ocupado.current = true
    try {
      const r = await api<{ mundo: Mundo }>(`campanhas/${campanhaId}/mundo`, { method: 'PUT', body: { mundo: novo, versao: antes.versao } })
      setE(x => x && { ...x, mundo: lerMundo(r.mundo) })
      if (aviso) toast.success(aviso)
    } catch (x) {
      setE(v => v && { ...v, mundo: antes })
      toast.error(msg(x))
      if (x instanceof ErroNuvem && x.status === 409) void carregar()
    } finally { ocupado.current = false }
  }, [e, campanhaId, carregar])

  if (erro && !e) return <Tela><p className="text-center">{erro}</p><Link href="/central" className="mt-3 block text-center underline">Voltar</Link></Tela>
  if (!e) return <Tela><p className="text-center text-(--a-b4aeca)">Abrindo o mundo…</p></Tela>
  const { mundo, admin } = e
  const pagina = aberta ? mundo.paginas.find(p => p.id === aberta) ?? null : null
  const salvarPagina = (p: Pagina) => {
    const existe = mundo.paginas.some(x => x.id === p.id)
    void salvar({ ...mundo, paginas: existe ? mundo.paginas.map(x => x.id === p.id ? p : x) : [...mundo.paginas, p] }, existe ? 'Página salva.' : `“${p.nome}” entrou no mundo.`)
    setEditando(null); setAberta(p.id)
  }
  const removerPagina = (p: Pagina) => {
    if (!confirm(`Apagar a página “${p.nome}” e as ligações dela?`)) return
    void salvar({ ...mundo, paginas: mundo.paginas.filter(x => x.id !== p.id), relacoes: mundo.relacoes.filter(r => r.de !== p.id && r.para !== p.id) }, 'Página apagada.')
    setAberta(null)
  }
  const verNoMapa = (id: string) => { setAba('mapa'); setAberta(null); setDestaque(id); setTimeout(() => setDestaque(d => d === id ? null : d), 4000) }

  return <main className="fundo-tema flex min-h-screen flex-col text-(--a-f4f0ff)">
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b border-(--a-373251) bg-(--s-19172c)/95 px-3 py-2 backdrop-blur">
      <Link href={'/mesa?campanha=' + campanhaId} className="inline-flex items-center gap-1 text-sm text-(--a-b99bff) hover:underline"><ArrowLeft size={16} /> Mesa</Link>
      <h1 className="min-w-0 flex-1 truncate font-bold">🗺️ Mundo · {e.campanha.nome}</h1>
      {admin && <span className="rounded-full bg-(--s-34294f) px-2 py-1 text-[11px] text-(--a-d6c8e8)">👑 Você edita</span>}
    </header>
    <nav className="flex gap-1 border-b border-(--a-373251) bg-(--s-14111f) px-3 py-2">
      {([['mapa', '🗺️ Mapa'], ['teia', '🕸️ Relações'], ['paginas', '📖 Páginas']] as const).map(([id, nome]) =>
        <button key={id} type="button" onClick={() => setAba(id)} className={'rounded-full px-3 py-1.5 text-sm ' + (aba === id ? 'bg-(--a-5b4380) text-white' : 'text-(--a-c4b6d4) hover:bg-(--s-241e38)')}>{nome}</button>)}
      <span className="ml-auto self-center text-xs text-(--a-a998bd)">{mundo.paginas.length} página(s)</span>
    </nav>

    <div className="relative min-h-0 flex-1">
      {aba === 'mapa' && <AbaMapa mundo={mundo} admin={admin} campanhaId={campanhaId} destaque={destaque} posicionando={posicionando}
        abrir={id => setAberta(id)} salvar={salvar}
        criarEm={(x, y) => setEditando({ id: novoId(), nome: '', tipo: 'lugar', icone: '🏰', mapa: { x, y } })}
        posicionar={(x, y) => { const id = posicionando!; setPosicionando(null); void salvar({ ...mundo, paginas: mundo.paginas.map(p => p.id === id ? { ...p, mapa: { x, y } } : p) }, 'Alfinete colocado no mapa.') }}
        cancelarPosicao={() => setPosicionando(null)} />}
      {aba === 'teia' && <AbaTeia mundo={mundo} admin={admin} abrir={setAberta} salvar={salvar} novaLigacao={() => setLigando({ tipo: 'aliado' })} />}
      {aba === 'paginas' && <AbaPaginas mundo={mundo} admin={admin} abrir={setAberta} nova={() => setEditando({ id: novoId(), nome: '', tipo: 'lugar', icone: '🏰' })} />}
    </div>

    {pagina && <PainelPagina p={pagina} mundo={mundo} admin={admin} fechar={() => setAberta(null)} abrir={setAberta} verNoMapa={verNoMapa}
      editar={() => setEditando(pagina)} remover={() => removerPagina(pagina)}
      posicionar={() => { setPosicionando(pagina.id); setAberta(null); setAba('mapa'); toast('📍 Toque no mapa onde fica ' + pagina.nome) }}
      ligar={() => setLigando({ de: pagina.id, tipo: 'aliado' })}
      tirarLigacao={r => void salvar({ ...mundo, relacoes: mundo.relacoes.filter(x => x.id !== r.id) }, 'Ligação removida.')}
      alternarOculto={() => void salvar({ ...mundo, paginas: mundo.paginas.map(x => x.id === pagina.id ? { ...x, oculto: !x.oculto || undefined } : x) }, pagina.oculto ? 'Agora todos veem.' : 'Agora só o mestre vê.')} />}
    {editando && <EditorPagina inicial={editando} campanhaId={campanhaId} salvar={salvarPagina} fechar={() => setEditando(null)} />}
    {ligando && <EditorLigacao inicial={ligando} paginas={mundo.paginas} fechar={() => setLigando(null)}
      salvar={r => { setLigando(null); void salvar({ ...mundo, relacoes: [...mundo.relacoes, r] }, 'Ligação criada.') }} />}
  </main>
}

function Tela({ children }: { children: React.ReactNode }) {
  return <main className="fundo-tema flex min-h-screen items-center justify-center p-6 text-(--a-f4f0ff)"><div>{children}</div></main>
}

/* ---------------- Mapa ---------------- */
function AbaMapa({ mundo, admin, campanhaId, destaque, posicionando, abrir, salvar, criarEm, posicionar, cancelarPosicao }: {
  mundo: Mundo; admin: boolean; campanhaId: string; destaque: string | null; posicionando: string | null
  abrir: (id: string) => void; salvar: (m: Mundo, aviso?: string) => Promise<void>; criarEm: (x: number, y: number) => void; posicionar: (x: number, y: number) => void; cancelarPosicao: () => void
}) {
  const [escala, setEscala] = useState(1)
  const [criando, setCriando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [arrasto, setArrasto] = useState<{ id: string; x: number; y: number } | null>(null)
  const arrastou = useRef(false)
  const imgRef = useRef<HTMLDivElement>(null)
  const zoom = useRef<ReactZoomPanPinchRef>(null)
  const desligar = useRef<(() => void) | null>(null)
  useEffect(() => () => desligar.current?.(), [])
  const naImagem = (cx: number, cy: number) => {
    const r = imgRef.current?.getBoundingClientRect(); if (!r || !r.width) return null
    return { x: Math.max(0, Math.min(100, ((cx - r.left) / r.width) * 100)), y: Math.max(0, Math.min(100, ((cy - r.top) / r.height) * 100)) }
  }
  async function trocarMapa(f: File) {
    setEnviando(true)
    try { const url = await enviarImagemNuvem(`mesa/${campanhaId}/upload`, f, 2400); await salvar({ ...mundo, mapa: url }, 'Mapa do mundo atualizado!') }
    catch (x) { toast.error(msg(x)) } finally { setEnviando(false) }
  }
  const noMapa = mundo.paginas.filter(p => p.mapa)
  const enviar = <label className={btn + ' cursor-pointer'}><ImagePlus size={14} /> {enviando ? 'Enviando…' : mundo.mapa ? 'Trocar mapa' : 'Enviar o mapa'}
    <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={enviando} onChange={ev => { const f = ev.target.files?.[0]; ev.target.value = ''; if (f) void trocarMapa(f) }} /></label>

  if (!mundo.mapa) return <div className="mx-auto max-w-lg p-6 text-center">
    <p className="text-5xl">🗺️</p>
    <h2 className="mt-3 text-xl font-bold">{admin ? 'Comece pelo mapa do mundo' : 'O mestre ainda não mostrou o mapa'}</h2>
    <p className="mt-2 text-sm text-(--a-b4aeca)">{admin ? 'Envie uma imagem do mapa (desenhada à mão, de um gerador de mapas…). Depois é só tocar nele para marcar cidades, masmorras e segredos.' : 'Enquanto isso, veja as páginas e a teia de relações.'}</p>
    {admin && <div className="mt-4 flex justify-center">{enviar}</div>}
  </div>

  return <div className="absolute inset-0 overflow-hidden bg-(--s-0b0a14)">
    <TransformWrapper ref={zoom} minScale={0.4} maxScale={6} initialScale={1} centerOnInit limitToBounds={false} doubleClick={{ disabled: true }} wheel={{ disabled: true }}
      panning={{ disabled: !!arrasto, velocityDisabled: true }} onInit={ref => { desligar.current?.(); desligar.current = ligarZoomSuave(ref, 0.4, 6) }}
      onTransform={(_r, s) => setEscala(s.scale)}>
      <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: 'min(1400px, 100vw)' }}>
        <div ref={imgRef} className="relative w-full select-none"
          onPointerMove={ev => { if (!arrasto) return; arrastou.current = true; const q = naImagem(ev.clientX, ev.clientY); if (q) setArrasto({ ...arrasto, ...q }) }}
          onPointerUp={() => { if (arrasto && arrastou.current) void salvar({ ...mundo, paginas: mundo.paginas.map(p => p.id === arrasto.id ? { ...p, mapa: { x: arrasto.x, y: arrasto.y } } : p) }); setArrasto(null) }}
          onClick={ev => {
            if ((ev.target as HTMLElement).closest('[data-pino]')) return
            const q = naImagem(ev.clientX, ev.clientY); if (!q) return
            if (posicionando) posicionar(q.x, q.y)
            else if (criando) { setCriando(false); criarEm(q.x, q.y) }
          }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mundo.mapa} alt="Mapa do mundo" draggable={false} className="block w-full" />
          {noMapa.map(p => {
            const pos = arrasto?.id === p.id ? arrasto : p.mapa!
            const luz = destaque === p.id
            return <button key={p.id} type="button" data-pino title={p.nome}
              className={'group absolute flex flex-col items-center ' + (luz ? 'z-20' : 'z-10')}
              style={{ left: pos.x + '%', top: pos.y + '%', transform: `translate(-50%, -100%) scale(${1 / escala})`, transformOrigin: '50% 100%' }}
              onPointerDown={ev => { if (!admin) return; ev.stopPropagation(); arrastou.current = false; setArrasto({ id: p.id, ...p.mapa! }) }}
              onClick={ev => { ev.stopPropagation(); if (!arrastou.current) abrir(p.id); arrastou.current = false }}>
              <span className={'flex h-11 w-11 items-center justify-center rounded-full border-2 text-2xl shadow-[0_4px_10px_#000a] transition group-hover:scale-110 '
                + (p.oculto ? 'border-dashed border-(--a-a998bd) bg-(--s-19172c)/80 opacity-75' : 'border-[#fde68a] bg-(--s-2b2143)') + (luz ? ' prg-vez' : '')}>{p.icone}</span>
              <span className="-mt-0.5 h-3 w-0.5 bg-[#fde68a]" />
              <span className="mt-0.5 max-w-36 truncate rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-white">{p.oculto && '🙈 '}{p.nome}</span>
            </button>
          })}
        </div>
      </TransformComponent>
    </TransformWrapper>
    {(criando || posicionando) && <div className="pointer-events-none absolute inset-x-2 top-2 z-30 mx-auto flex max-w-md items-center gap-2 rounded-xl border border-amber-400/60 bg-[#2b2310]/90 p-2 text-sm text-amber-100">
      <MapPin size={18} /><span className="flex-1">{posicionando ? 'Toque no mapa onde fica este lugar.' : 'Toque no mapa onde fica o novo lugar.'}</span>
      <button type="button" className="pointer-events-auto rounded-lg border border-amber-300/60 px-2 py-1 text-xs" onClick={() => { setCriando(false); cancelarPosicao() }}>Cancelar</button></div>}
    {admin && <div className="absolute bottom-3 left-3 z-30 flex flex-wrap gap-2 rounded-xl border border-(--a-373251) bg-(--s-19172c)/95 p-2">
      <button type="button" className={btn + ' border-amber-300/60 font-semibold'} onClick={() => setCriando(true)}><Plus size={14} /> Marcar lugar</button>
      {enviar}
    </div>}
    {!noMapa.length && <p className="pointer-events-none absolute inset-x-0 bottom-20 z-20 text-center text-sm text-(--a-d6c8e8) [text-shadow:0_1px_3px_#000]">{admin ? 'Toque em “Marcar lugar” e depois no mapa.' : 'Nenhum lugar marcado ainda.'}</p>}
  </div>
}

/* ---------------- Teia de relações ---------------- */
function AbaTeia({ mundo, admin, abrir, salvar, novaLigacao }: { mundo: Mundo; admin: boolean; abrir: (id: string) => void; salvar: (m: Mundo, aviso?: string) => Promise<void>; novaLigacao: () => void }) {
  const svg = useRef<SVGSVGElement>(null)
  const [arrasto, setArrasto] = useState<{ id: string; x: number; y: number } | null>(null)
  const moveu = useRef(false)
  const ligados = new Set(mundo.relacoes.flatMap(r => [r.de, r.para]))
  const nos = mundo.paginas.filter(p => p.teia || ligados.has(p.id) || p.tipo === 'npc' || p.tipo === 'faccao')
  const base = useMemo(() => Object.fromEntries(nos.map((p, i) => [p.id, p.teia ?? posicaoNaTeia(i, nos.length)])), [nos])
  const pos: Record<string, { x: number; y: number }> = arrasto ? { ...base, [arrasto.id]: { x: arrasto.x, y: arrasto.y } } : base
  const ponto = (cx: number, cy: number) => {
    const m = svg.current?.getScreenCTM(); if (!m) return null
    const p = new DOMPoint(cx, cy).matrixTransform(m.inverse())
    return { x: Math.max(40, Math.min(960, p.x)), y: Math.max(40, Math.min(660, p.y)) }
  }
  if (!nos.length) return <div className="mx-auto max-w-lg p-6 text-center"><p className="text-5xl">🕸️</p>
    <h2 className="mt-3 text-xl font-bold">Ninguém na teia ainda</h2>
    <p className="mt-2 text-sm text-(--a-b4aeca)">{admin ? 'Crie páginas de Personagens e Facções (aba Páginas) e ligue quem é aliado, inimigo, família…' : 'O mestre ainda não mostrou as relações.'}</p></div>
  return <div className="flex h-full flex-col p-3">
    <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
      {TIPOS_RELACAO.map(t => <span key={t.id} className="inline-flex items-center gap-1"><span className="inline-block h-1 w-5 rounded" style={{ background: t.cor }} />{t.nome}</span>)}
      {admin && <button type="button" className={btn + ' ml-auto border-(--a-b99bff)'} onClick={novaLigacao}><Link2 size={14} /> Nova ligação</button>}
    </div>
    <svg ref={svg} viewBox="0 0 1000 700" className="w-full flex-1 touch-none rounded-2xl border border-(--a-3d3152) bg-[radial-gradient(circle_at_50%_40%,#241a3a,#0f0c1d)]" style={{ minHeight: 320 }}
      onPointerMove={ev => { if (!arrasto) return; moveu.current = true; const q = ponto(ev.clientX, ev.clientY); if (q) setArrasto({ ...arrasto, ...q }) }}
      onPointerUp={() => { if (arrasto && moveu.current) void salvar({ ...mundo, paginas: mundo.paginas.map(p => p.id === arrasto.id ? { ...p, teia: { x: Math.round(arrasto.x), y: Math.round(arrasto.y) } } : p) }); setArrasto(null) }}>
      <defs><marker id="seta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="context-stroke" /></marker></defs>
      {mundo.relacoes.map(r => {
        const a = pos[r.de], b = pos[r.para]; if (!a || !b) return null
        const t = corRel(r), dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1
        const fim = { x: b.x - (dx / d) * 40, y: b.y - (dy / d) * 40 }
        return <g key={r.id} opacity={r.oculto ? 0.55 : 1}>
          <line x1={a.x} y1={a.y} x2={fim.x} y2={fim.y} stroke={t.cor} strokeWidth={4} strokeDasharray={t.tracejado ? '10 7' : undefined} markerEnd={r.tipo === 'serve' ? 'url(#seta)' : undefined} />
          <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 8} textAnchor="middle" fontSize={17} fontWeight={700} fill={t.cor} stroke="#0f0c1d" strokeWidth={4} paintOrder="stroke">{r.oculto ? '🙈 ' : ''}{r.rotulo || t.nome}</text>
        </g>
      })}
      {nos.map(p => { const q = pos[p.id]
        return <g key={p.id} transform={`translate(${q.x} ${q.y})`} className="cursor-pointer" opacity={p.oculto ? 0.6 : 1}
          onPointerDown={ev => { if (!admin) return; ev.stopPropagation(); (ev.target as Element).setPointerCapture?.(ev.pointerId); moveu.current = false; setArrasto({ id: p.id, ...q }) }}
          onClick={() => { if (!moveu.current) abrir(p.id); moveu.current = false }}>
          <circle r={36} fill="#2b2143" stroke={p.tipo === 'faccao' ? '#fbbf24' : p.tipo === 'perigo' ? '#ef4444' : '#b99bff'} strokeWidth={3} strokeDasharray={p.oculto ? '6 5' : undefined} />
          <text textAnchor="middle" dy={12} fontSize={34}>{p.icone}</text>
          <text textAnchor="middle" y={58} fontSize={17} fontWeight={700} fill="#f4f0ff" stroke="#0f0c1d" strokeWidth={4} paintOrder="stroke">{p.nome.length > 18 ? p.nome.slice(0, 17) + '…' : p.nome}</text>
        </g> })}
    </svg>
    <p className="mt-2 text-center text-[11px] text-(--a-a998bd)">{admin ? 'Arraste para organizar · toque para abrir a página' : 'Toque em alguém para ver a página'}</p>
  </div>
}

/* ---------------- Lista de páginas ---------------- */
function AbaPaginas({ mundo, admin, abrir, nova }: { mundo: Mundo; admin: boolean; abrir: (id: string) => void; nova: () => void }) {
  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState<string>('')
  const lista = mundo.paginas.filter(p => (!tipo || p.tipo === tipo) && (!busca || (p.nome + ' ' + (p.texto ?? '')).toLowerCase().includes(busca.toLowerCase())))
  return <div className="mx-auto max-w-3xl p-3">
    <div className="flex gap-2">
      <label className="relative flex-1"><Search size={15} className="absolute left-2.5 top-2.5 text-(--a-a998bd)" />
        <input value={busca} onChange={x => setBusca(x.target.value)} placeholder="Procurar…" className={input + ' pl-8'} /></label>
      {admin && <button type="button" onClick={nova} className="inline-flex items-center gap-1 rounded-lg bg-(--a-7654bb) px-3 text-sm font-semibold"><Plus size={15} /> Nova página</button>}
    </div>
    <div className="mt-2 flex flex-wrap gap-1.5">
      <button type="button" onClick={() => setTipo('')} className={'rounded-full px-3 py-1 text-xs ' + (!tipo ? 'bg-(--a-5b4380)' : 'bg-(--s-1e1a30) text-(--a-c4b6d4)')}>Tudo</button>
      {TIPOS_PAGINA.map(t => <button key={t.id} type="button" onClick={() => setTipo(t.id)} className={'rounded-full px-3 py-1 text-xs ' + (tipo === t.id ? 'bg-(--a-5b4380)' : 'bg-(--s-1e1a30) text-(--a-c4b6d4)')}>{t.icone} {t.nome}</button>)}
    </div>
    <ul className="mt-3 grid gap-2 sm:grid-cols-2">{lista.map(p => <li key={p.id}>
      <button type="button" onClick={() => abrir(p.id)} className="flex w-full gap-3 rounded-xl border border-(--a-3d3152) bg-(--s-1e1a30) p-2 text-left hover:border-(--a-8b6cba)">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-(--s-2b2143) bg-cover bg-center text-3xl" style={p.imagem ? { backgroundImage: `url("${p.imagem}")` } : undefined}>{p.imagem ? '' : p.icone}</span>
        <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{p.icone} {p.nome}</span>
          <span className="text-[11px] text-(--a-c4b6d4)">{tipoDe(p).nome}{p.mapa ? ' · 📍 no mapa' : ''}{p.oculto ? ' · 🙈 só o mestre' : ''}</span>
          {p.texto && <span className="mt-0.5 line-clamp-2 block text-xs text-(--a-a998bd)">{p.texto}</span>}</span>
      </button></li>)}</ul>
    {!lista.length && <p className="mt-6 text-center text-sm text-(--a-b4aeca)">{mundo.paginas.length ? 'Nada encontrado.' : admin ? 'Nenhuma página ainda. Crie lugares, personagens e facções.' : 'O mestre ainda não revelou nada do mundo.'}</p>}
  </div>
}

/* ---------------- Página aberta ---------------- */
function PainelPagina({ p, mundo, admin, fechar, abrir, verNoMapa, editar, remover, posicionar, ligar, tirarLigacao, alternarOculto }: {
  p: Pagina; mundo: Mundo; admin: boolean; fechar: () => void; abrir: (id: string) => void; verNoMapa: (id: string) => void
  editar: () => void; remover: () => void; posicionar: () => void; ligar: () => void; tirarLigacao: (r: Relacao) => void; alternarOculto: () => void
}) {
  const rels = mundo.relacoes.filter(r => r.de === p.id || r.para === p.id)
  const nome = (id: string) => mundo.paginas.find(x => x.id === id)
  return <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/55 sm:items-stretch sm:justify-end" onClick={fechar}>
    <article role="dialog" aria-modal="true" aria-label={p.nome} onClick={x => x.stopPropagation()}
      className="max-h-[88vh] w-full overflow-y-auto rounded-t-3xl border border-(--a-62527e) bg-(--s-19172c) sm:max-h-none sm:max-w-md sm:rounded-none sm:rounded-l-3xl">
      {p.imagem && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.imagem} alt="" className="h-48 w-full object-cover" />}
      <div className="p-4">
        <div className="flex items-start gap-2">
          <span className="text-4xl">{p.icone}</span>
          <div className="min-w-0 flex-1"><h2 className="text-xl font-bold">{p.nome}</h2>
            <p className="text-xs text-(--a-c4b6d4)">{tipoDe(p).icone} {tipoDe(p).nome}{p.oculto && <span className="ml-2 rounded-full bg-[#4b253a] px-2 py-0.5 text-red-100">🙈 Só o mestre vê</span>}</p></div>
          <button type="button" onClick={fechar} aria-label="Fechar" className="rounded-lg p-1.5 hover:bg-(--s-34294f)"><X size={18} /></button>
        </div>
        {p.texto ? <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-(--a-e4dcf3)">{p.texto}</p> : <p className="mt-3 text-sm italic text-(--a-a998bd)">Sem descrição ainda.</p>}
        {rels.length > 0 && <div className="mt-4"><p className="text-xs font-bold uppercase tracking-widest text-(--a-ed9cd8)">Relações</p>
          <ul className="mt-1.5 space-y-1">{rels.map(r => { const outro = nome(r.de === p.id ? r.para : r.de), t = corRel(r)
            return <li key={r.id} className="flex items-center gap-2 rounded-lg bg-(--s-1e1a30) px-2 py-1.5 text-sm">
              <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: t.cor + '33', color: t.cor }}>{r.rotulo || t.nome}{r.oculto ? ' 🙈' : ''}</span>
              <button type="button" className="min-w-0 flex-1 truncate text-left hover:underline" onClick={() => outro && abrir(outro.id)}>{r.tipo === 'serve' ? (r.de === p.id ? 'serve a ' : 'é servido por ') : ''}{outro?.icone} {outro?.nome}</button>
              {admin && <button type="button" aria-label="Tirar ligação" onClick={() => tirarLigacao(r)} className="rounded p-1 text-[#f2a9c3] hover:bg-(--s-2b2140)"><Trash2 size={13} /></button>}
            </li> })}</ul></div>}
        <div className="mt-4 flex flex-wrap gap-2">
          {p.mapa && <button type="button" className={btn} onClick={() => verNoMapa(p.id)}><MapPin size={14} /> Ver no mapa</button>}
          {admin && <>
            <button type="button" className={btn} onClick={editar}><Pencil size={14} /> Editar</button>
            {mundo.mapa && <button type="button" className={btn} onClick={posicionar}><MapPin size={14} /> {p.mapa ? 'Mudar no mapa' : 'Colocar no mapa'}</button>}
            <button type="button" className={btn} onClick={ligar}><Link2 size={14} /> Ligar a…</button>
            <button type="button" className={btn} onClick={alternarOculto}>{p.oculto ? <><Eye size={14} /> Mostrar a todos</> : <><EyeOff size={14} /> Só o mestre</>}</button>
            <button type="button" className={btn + ' text-red-200'} onClick={remover}><Trash2 size={14} /> Apagar</button>
          </>}
        </div>
      </div>
    </article>
  </div>
}

/* ---------------- Editores ---------------- */
function Janela({ titulo, fechar, children }: { titulo: string; fechar: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center" onMouseDown={x => { if (x.target === x.currentTarget) fechar() }}>
    <div role="dialog" aria-modal="true" aria-label={titulo} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-(--a-6d5690) bg-(--s-1b1529) p-5 text-sm">
      <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">{titulo}</h2><button type="button" onClick={fechar} aria-label="Fechar" className="rounded-lg p-1.5 hover:bg-(--s-38294d)"><X size={18} /></button></div>
      {children}
    </div>
  </div>
}

function EditorPagina({ inicial, campanhaId, salvar, fechar }: { inicial: Pagina; campanhaId: string; salvar: (p: Pagina) => void; fechar: () => void }) {
  const [p, setP] = useState<Pagina>(inicial)
  const [enviando, setEnviando] = useState(false)
  return <Janela titulo={inicial.nome ? 'Editar página' : 'Nova página do mundo'} fechar={fechar}>
    <form className="space-y-3" onSubmit={x => { x.preventDefault(); if (!p.nome.trim()) { toast.error('Dê um nome.'); return } salvar({ ...p, nome: p.nome.trim() }) }}>
      <label className="block">Nome<input autoFocus value={p.nome} maxLength={60} onChange={x => setP({ ...p, nome: x.target.value })} className={input + ' mt-1'} placeholder="Ex.: Castelo de Valmor" /></label>
      <div><p className="mb-1">Tipo</p><div className="flex flex-wrap gap-1.5">{TIPOS_PAGINA.map(t => <button key={t.id} type="button" onClick={() => setP({ ...p, tipo: t.id, icone: p.icone === TIPOS_PAGINA.find(x => x.id === p.tipo)?.icone ? t.icone : p.icone })}
        className={'rounded-full border px-3 py-1 text-xs ' + (p.tipo === t.id ? 'border-(--a-e4d3ff) bg-(--a-5b4380)' : 'border-(--a-4a3d63)')}>{t.icone} {t.nome}</button>)}</div></div>
      <div><p className="mb-1">Ícone no mapa e na teia</p><div className="grid grid-cols-8 gap-1">{ICONES.map(i => <button key={i} type="button" aria-label={'Ícone ' + i} onClick={() => setP({ ...p, icone: i })}
        className={'rounded-lg p-1 text-xl ' + (p.icone === i ? 'bg-(--a-5b4380) ring-1 ring-(--a-e4d3ff)' : 'hover:bg-(--s-2b2140)')}>{i}</button>)}</div></div>
      <label className="block">Descrição<textarea rows={6} value={p.texto ?? ''} maxLength={3000} onChange={x => setP({ ...p, texto: x.target.value })} className={input + ' mt-1'} placeholder="História, quem mora lá, o que os heróis sabem…" /></label>
      <div className="flex flex-wrap items-center gap-2">
        {p.imagem && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.imagem} alt="" className="h-16 w-24 rounded-lg object-cover" />}
        <label className={btn + ' cursor-pointer'}><ImagePlus size={14} /> {enviando ? 'Enviando…' : p.imagem ? 'Trocar imagem' : 'Imagem (opcional)'}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={enviando} onChange={async x => {
            const f = x.target.files?.[0]; x.target.value = ''; if (!f) return
            setEnviando(true); try { setP({ ...p, imagem: await enviarImagemNuvem(`mesa/${campanhaId}/upload`, f, 1400) }) } catch (er) { toast.error(msg(er)) } finally { setEnviando(false) }
          }} /></label>
        {p.imagem && <button type="button" className={btn} onClick={() => setP({ ...p, imagem: undefined })}>Tirar imagem</button>}
      </div>
      <label className="flex items-center gap-2 rounded-lg bg-(--s-241d38) p-2"><input type="checkbox" checked={!!p.oculto} onChange={x => setP({ ...p, oculto: x.target.checked || undefined })} className="accent-(--a-b99bff)" />
        <span>🙈 Só o mestre vê <span className="block text-[11px] text-(--a-a998bd)">Os jogadores só descobrem quando você mostrar.</span></span></label>
      <div className="flex gap-2"><button type="button" onClick={fechar} className="flex-1 rounded-lg border border-(--a-62527e) p-2.5">Cancelar</button>
        <button type="submit" disabled={enviando} className="flex-1 rounded-lg bg-(--a-7654bb) p-2.5 font-semibold disabled:opacity-50">Salvar</button></div>
    </form>
  </Janela>
}

function EditorLigacao({ inicial, paginas, salvar, fechar }: { inicial: Partial<Relacao>; paginas: Pagina[]; salvar: (r: Relacao) => void; fechar: () => void }) {
  const [r, setR] = useState<Partial<Relacao>>(inicial)
  const pode = r.de && r.para && r.de !== r.para
  const opcoes = (atual?: string) => <><option value="">Escolha…</option>{paginas.map(p => <option key={p.id} value={p.id} disabled={p.id === atual}>{p.icone} {p.nome}</option>)}</>
  return <Janela titulo="Nova ligação" fechar={fechar}>
    {paginas.length < 2 ? <p className="text-(--a-c4b6d4)">Crie pelo menos duas páginas para ligar.</p> :
    <form className="space-y-3" onSubmit={x => { x.preventDefault(); if (pode) salvar({ id: novoId(), de: r.de!, para: r.para!, tipo: r.tipo ?? 'aliado', ...(r.rotulo?.trim() ? { rotulo: r.rotulo.trim() } : {}), ...(r.oculto ? { oculto: true } : {}) }) }}>
      <label className="block">De<select value={r.de ?? ''} onChange={x => setR({ ...r, de: x.target.value })} className={input + ' mt-1'}>{opcoes(r.para)}</select></label>
      <div><p className="mb-1">Relação</p><div className="flex flex-wrap gap-1.5">{TIPOS_RELACAO.map(t => <button key={t.id} type="button" onClick={() => setR({ ...r, tipo: t.id })}
        className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ color: t.cor, borderColor: r.tipo === t.id ? t.cor : '#4a3d63', background: r.tipo === t.id ? t.cor + '22' : undefined }}>{t.nome}</button>)}</div></div>
      <label className="block">Para<select value={r.para ?? ''} onChange={x => setR({ ...r, para: x.target.value })} className={input + ' mt-1'}>{opcoes(r.de)}</select></label>
      <label className="block">Texto na linha (opcional)<input value={r.rotulo ?? ''} maxLength={40} onChange={x => setR({ ...r, rotulo: x.target.value })} className={input + ' mt-1'} placeholder="Ex.: quer o trono, deve dinheiro" /></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={!!r.oculto} onChange={x => setR({ ...r, oculto: x.target.checked })} className="accent-(--a-b99bff)" /> 🙈 Segredo: só o mestre vê</label>
      <div className="flex gap-2"><button type="button" onClick={fechar} className="flex-1 rounded-lg border border-(--a-62527e) p-2.5">Cancelar</button>
        <button type="submit" disabled={!pode} className="flex-1 rounded-lg bg-(--a-7654bb) p-2.5 font-semibold disabled:opacity-50">Ligar</button></div>
    </form>}
  </Janela>
}
