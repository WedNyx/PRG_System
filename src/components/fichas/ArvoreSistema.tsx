'use client'

import { useCallback, useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { toast } from 'sonner'
import { GitBranch, LockKeyhole, X } from 'lucide-react'
import { movimentoReduzido } from '@/lib/preferencias'
import type { DadosFicha, Sistema } from '@/lib/sistemas/tipos'
import { devolverNo, liberarNo, sincronizarPoderes, type Arvore } from '@/lib/sistemas/arvore'
import { lerPoderes } from '@/lib/sistemas/inventario'
import { identidadeVisual } from '@/lib/sistemas/visualIdentidade'
import { caminhoLigacao, temaArvore, type Lado } from './temasArvore'
import { arvoreDoSistema, chaveEscolha, rotuloMarco, type EstadoMarco, type Marco, type RamoSistema } from '@/lib/sistemas/arvoreSistemas'

/**
 * Árvore de cada sistema (v0.36.2): os ramos do jogo na mesma Yggdrasil do D&D. Mostra o que o personagem já tem,
 * o próximo marco e (se quiser) os futuros. O jogador anota o que escolheu em cada marco; nada é aplicado na ficha.
 * O ramo “Habilidades adicionais do mestre” é a árvore livre de sempre (children).
 */
const ESTADOS: Record<EstadoMarco, { texto: string; icone: string }> = {
  recebido: { texto: 'Já tem', icone: '✧' }, proximo: { texto: 'Próximo', icone: '➜' }, futuro: { texto: 'Mais tarde', icone: '🔒' }, referencia: { texto: 'Guia', icone: '◇' },
}
const MESTRE = 'mestre', MAPA = 'mapa'
// React Flow só carrega quando alguém abre o mapa (fica fora do pacote principal da ficha).
const ConstelacaoArvore = dynamic(() => import('./ConstelacaoArvore'), { ssr: false, loading: () => <p className="rounded-2xl border border-white/10 p-6 text-center text-sm text-(--a-cfc0df)">Abrindo a constelação…</p> })
const MapaArvore = dynamic(() => import('./MapaArvore'), { ssr: false, loading: () => <p className="rounded-2xl border border-(--a-55456e) p-6 text-center text-sm text-(--a-cfc0df)">Abrindo o mapa…</p> })

export default function ArvoreSistema({ s, d, onChange, somenteLeitura, children }: { s: Sistema; d: DadosFicha; onChange: (d: DadosFicha) => void; somenteLeitura: boolean; children?: ReactNode }) {
  const arvore = arvoreDoSistema(s, d)
  const identidade = s.visual?.arvore ?? identidadeVisual(s), tema = temaArvore(identidade)
  const ramos = arvore?.ramos ?? []
  const [ramoId, setRamoId] = useState(ramos.length > 1 ? MAPA : ramos[0]?.id ?? MESTRE)
  const [futuros, setFuturos] = useState(false)
  const [visao, setVisao] = useState<'yggdrasil' | 'lista' | 'constelacao'>('yggdrasil')
  const [aberto, setAberto] = useState<string | null>(null)
  const ramo = ramos.find(r => r.id === ramoId)
  // Árvore do autor (v0.36.7): abre em constelação, do centro para fora, como o autor montou.
  const doAutor = ramo?.id === 'autor'
  const visaoRamo = doAutor ? (visao === 'lista' ? 'lista' : 'constelacao') : visao === 'constelacao' ? 'yggdrasil' : visao
  const escolha = (m: Marco) => { const v = d.marcas?.[chaveEscolha(m.id)]; return typeof v === 'string' ? v : '' }
  const anotar = (m: Marco, v: string) => { const marcas = { ...(d.marcas ?? {}) }; if (v.trim()) marcas[chaveEscolha(m.id)] = v.slice(0, 200); else delete marcas[chaveEscolha(m.id)]; onChange({ ...d, marcas }) }
  const visiveis = (r: RamoSistema) => r.marcos.filter(m => futuros || m.estado !== 'futuro')
  const contar = (r: RamoSistema) => r.marcos.filter(m => m.estado === 'recebido').length
  const unidade = arvore?.medida?.unidade
  const quando = (m: Marco) => m.rotulo ?? (m.estado !== 'referencia' ? rotuloMarco(m.quando, unidade) : '')
  const abrirMarco = useCallback((id: string) => setAberto(a => a === id ? null : id), [])
  // Árvore do autor: liberar e devolver gastam/devolvem pontos e trazem a habilidade para os poderes.
  const aplicarNo = (r: { arvore?: Arvore; erro?: string }, ok: string) => {
    if (!r.arvore) { toast.error(r.erro ?? 'Não deu.'); return }
    onChange({ ...d, arvore: r.arvore, poderes: sincronizarPoderes(lerPoderes(d.poderes), r.arvore) }); toast.success(ok)
  }
  const autor = arvore?.autor

  const detalhe = (m: Marco) => <motion.div key={m.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="relative z-20 mt-3 rounded-xl border border-amber-300/35 bg-[#201a21] p-3 text-left">
    <div className="flex items-start justify-between gap-2"><p className="font-semibold text-white">{m.titulo}</p>
      <button type="button" aria-label="Fechar" onClick={() => setAberto(null)} className="min-h-9 min-w-9 rounded-lg border border-(--a-55456e) p-1.5"><X size={15} /></button></div>
    <p className="mt-1 text-xs text-(--a-c4b6d4)">{[quando(m), ESTADOS[m.estado].texto].filter(Boolean).join(' · ')}</p>
    {m.texto && <p className="mt-2 whitespace-pre-wrap text-sm text-(--a-cfc0df)">{m.texto}</p>}
    {m.estado === 'futuro' && <p className="mt-2 flex items-center gap-2 text-xs text-(--a-c4b6d4)"><LockKeyhole size={14} /> {m.no?.motivo ?? 'Ainda não chegou neste marco.'}</p>}
    {m.no && autor && !somenteLeitura && <div className="mt-3 flex flex-wrap gap-2">
      {!m.no.liberado && <button type="button" disabled={m.estado !== 'proximo'} onClick={() => aplicarNo(liberarNo(autor.arvore, m.no!.id, autor.extra, autor.nivel, d), m.titulo + ' liberado!')}
        className="min-h-10 rounded-lg bg-(--a-7654bb) px-3 text-xs font-semibold text-white disabled:opacity-40">Liberar (−{m.no.custo} {m.no.custo === 1 ? 'ponto' : 'pontos'})</button>}
      {m.no.liberado && !m.no.concedido && <button type="button" onClick={() => aplicarNo(devolverNo(autor.arvore, m.no!.id), 'Pontos devolvidos.')}
        className="min-h-10 rounded-lg border border-(--a-55456e) px-3 text-xs text-white">Devolver os pontos</button>}
    </div>}
    {m.escolha !== false && <label className="mt-3 block text-xs text-(--a-d3adf0)">O que você escolheu aqui
      <input value={escolha(m)} disabled={somenteLeitura} maxLength={200} onChange={e => anotar(m, e.target.value)} placeholder="Ex.: o nome do poder ou talento"
        className="mt-1 w-full rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-sm text-white" /></label>}
  </motion.div>

  return <MotionConfig reducedMotion={movimentoReduzido() ? 'always' : 'user'}><section className="space-y-4 rounded-2xl border border-(--ficha-borda) bg-(--ficha-cartao) p-4" aria-label="Árvore do sistema">
    <div>
      <h2 className="flex items-center gap-2 text-lg font-bold text-(--ficha-acento) [font-family:var(--ficha-fonte)]"><GitBranch size={20} /> Árvore de habilidades</h2>
      <p className="mt-1 text-sm text-(--a-cfc0df)">{arvore?.dica ?? 'Habilidades extras que o mestre cria para o personagem.'} Nada aqui muda a ficha sozinho.</p>
      {arvore?.medida && <div className="mt-3 rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3">
        <div className="flex justify-between text-xs"><span className="text-(--a-cfc0df)">{arvore.medida.nome}</span><strong className="text-white">{rotuloMarco(arvore.medida.atual, unidade).replace(/^Nível /, '')} de {rotuloMarco(arvore.medida.max, unidade).replace(/^Nível /, '')}</strong></div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-(--s-151123)"><div className="h-full rounded-full bg-(--ficha-acento)" style={{ width: Math.min(100, (arvore.medida.atual / arvore.medida.max) * 100) + '%' }} /></div>
      </div>}
    </div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="tablist" aria-label="Ramos da árvore">
      {[...(ramos.length > 1 ? [{ id: MAPA, titulo: 'Mapa completo', icone: '🗺️', cor: '#e9d9a8', marcos: [] as Marco[] }] : []), ...ramos, { id: MESTRE, titulo: autor ? 'Editar a árvore e extras' : 'Habilidades adicionais do mestre', icone: '🌠', cor: '#7edac0', marcos: [] as Marco[] }].map(r => <button key={r.id} type="button" role="tab" aria-selected={ramoId === r.id} onClick={() => { setRamoId(r.id); setAberto(null) }}
        className={'flex min-h-14 min-w-0 items-center gap-2 rounded-xl border p-2 text-left text-xs transition ' + (ramoId === r.id ? 'bg-(--s-34294f) text-white' : 'border-(--a-55456e) bg-(--s-171325) text-(--a-cfc0df)')} style={ramoId === r.id ? { borderColor: r.cor } : undefined}>
        <span aria-hidden className="text-lg">{r.icone}</span><span className="min-w-0"><strong className="block break-words leading-tight">{r.titulo}</strong>
          {r.id !== MESTRE && r.id !== MAPA && <span className="opacity-75">{r.marcos.some(m => m.estado !== 'referencia') ? `${contar(r)} de ${r.marcos.length}` : `${r.marcos.length} ${r.marcos.length === 1 ? 'marco' : 'marcos'}`}</span>}</span></button>)}
    </div>
    {ramoId === MAPA ? <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-(--a-cfc0df)">Todos os ramos de uma vez. Arraste para andar, use a pinça (ou a rodinha) para aproximar e toque num marco para ver e anotar.</p>
        {ramos.some(r => r.marcos.some(m => m.estado === 'futuro')) && <label className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-(--a-55456e) px-3 text-xs text-(--a-cfc0df)"><input type="checkbox" checked={futuros} onChange={e => setFuturos(e.target.checked)} /> Mostrar os futuros</label>}
      </div>
      <MapaArvore ramos={ramos} tema={tema} nome={d.nome || 'Personagem'} sub={arvore?.medida ? arvore.medida.nome + ' ' + rotuloMarco(arvore.medida.atual, unidade).replace(/^Nível /, '') : tema.nome.replace(/^\S+\s/, '')}
        quando={quando} aberto={aberto} abrir={abrirMarco} escolha={escolha} mostrarFuturos={futuros} />
      <AnimatePresence>{(() => { const m = ramos.flatMap(r => r.marcos).find(x => x.id === aberto); return m ? detalhe(m) : null })()}</AnimatePresence>
    </div> : ramoId === MESTRE || !ramo ? children : <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex flex-wrap items-center gap-2 font-semibold" style={{ color: ramo.cor }}><span aria-hidden>{ramo.icone}</span>{ramo.titulo}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Visualização da árvore" className="flex rounded-lg border border-(--a-55456e) p-1">
            {(doAutor ? ['constelacao', 'lista'] as const : ['yggdrasil', 'lista'] as const).map(v => <button key={v} type="button" aria-pressed={visaoRamo === v} onClick={() => setVisao(v)} className={'min-h-10 rounded-md px-3 text-xs ' + (visaoRamo === v ? 'bg-(--s-34294f) text-white' : 'text-(--a-cfc0df)')}>{v === 'yggdrasil' ? tema.nome : v === 'constelacao' ? '✦ Constelação' : '☷ Lista'}</button>)}
          </div>
          {!doAutor && ramo.marcos.some(m => m.estado === 'futuro') && <label className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-(--a-55456e) px-3 text-xs text-(--a-cfc0df)"><input type="checkbox" checked={futuros} onChange={e => setFuturos(e.target.checked)} /> Mostrar os futuros</label>}
        </div>
      </div>
      {doAutor && autor && <div className="mb-3 grid gap-2 sm:grid-cols-[auto_1fr]" data-pontos-arvore>
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] px-4 py-3">
          <span className="text-3xl font-black tabular-nums text-white">{autor.livres}</span>
          <span className="text-xs leading-tight text-(--a-cfc0df)">{autor.livres === 1 ? 'ponto' : 'pontos'}<br />para gastar</span>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 text-xs leading-relaxed text-(--a-cfc0df)">
          <p>{autor.arvore.pontos} da árvore{autor.extra ? ` + ${autor.extra} pela tabela de níveis${autor.nivel ? ' (nível ' + autor.nivel + ')' : ''}` : ''}{autor.arvore.liberados.length ? ` · ${autor.arvore.liberados.length} ${autor.arvore.liberados.length === 1 ? 'habilidade liberada' : 'habilidades liberadas'}` : ''}.</p>
          {autor.pendente ? <p className="mt-0.5 font-semibold text-amber-200">⚠ Escolha “{autor.pendente}” na aba Principal para ganhar os pontos de cada nível.</p>
            : autor.ganhoProximo > 0 && <p className="mt-0.5 text-white">⬆ Ao subir para o nível {(autor.nivel ?? 0) + 1}: +{autor.ganhoProximo} {autor.ganhoProximo === 1 ? 'ponto' : 'pontos'} na árvore.</p>}
        </div>
      </div>}
      {doAutor && autor && visaoRamo === 'constelacao' ? <div className="space-y-3">
        <p className="text-xs text-(--a-cfc0df)">A árvore cresce do centro para fora. Arraste para andar, use a pinça (ou a rodinha) para aproximar e toque numa habilidade para ver e liberar.</p>
        <ConstelacaoArvore arvore={autor.arvore} marcos={ramo.marcos} aberto={aberto} abrir={abrirMarco} ligacao={s.visual?.arvoreLigacao} fundo={s.visual?.arvoreFundo} mostrarFuturos />
        <div className="flex flex-wrap gap-3 text-[11px] text-(--a-cfc0df)" aria-label="Legenda"><span>◆ Liberada</span><span className="text-(--ficha-acento)">◇ Pode liberar</span><span className="opacity-70">🔒 Bloqueada</span><span>NV = nível mínimo · número = custo</span></div>
        <AnimatePresence>{(() => { const m = ramo.marcos.find(x => x.id === aberto); return m ? detalhe(m) : null })()}</AnimatePresence>
      </div>
      : !visiveis(ramo).length ? <p className="rounded-xl border border-dashed border-(--a-55456e) p-4 text-sm text-(--a-cfc0df)">{ramo.vazio ?? (ramo.marcos.length ? 'Nada recebido ainda. Ligue “Mostrar os futuros” para ver o caminho.' : 'Nada neste ramo ainda.')}</p>
        : visaoRamo === 'yggdrasil' ? <div className={'relative overflow-hidden rounded-2xl border px-2 py-6 ' + tema.fundo} data-tema-arvore={identidade}>
          {tema.decoracao}
          <ol className="relative mx-auto max-w-lg" aria-label={tema.nome.replace(/^\S+\s/, '') + ' de ' + ramo.titulo}>
            {visiveis(ramo).map((m, i, lista) => {
              const ladoDe = (k: number): Lado => k === 0 ? 'center' : k % 2 ? 'left' : 'right'
              const lado = ladoDe(i), on = aberto === m.id, anotado = escolha(m), ultimo = i === lista.length - 1
              return <li key={m.id} className="relative min-h-36 pb-6">
                <svg aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-full w-full overflow-visible" viewBox="0 0 300 160" preserveAspectRatio="none">
                  {tema.ligacao === 'raiz' ? <>
                    <path d="M150 0 C147 55 153 105 150 160" fill="none" stroke="#4a332b" strokeWidth="15" strokeLinecap="round" />
                    <path d="M150 0 C147 55 153 105 150 160" fill="none" stroke="#a7835c" strokeWidth="5" strokeOpacity=".85" strokeLinecap="round" />
                    {lado !== 'center' && <path d={lado === 'left' ? 'M150 54 C120 52 112 45 75 45' : 'M150 54 C180 52 188 45 225 45'} fill="none" stroke="#b99564" strokeWidth="5" strokeLinecap="round" />}
                  </> : !ultimo && caminhoLigacao(tema, lado, ladoDe(i + 1))}
                </svg>
                <div className={'relative flex ' + (lado === 'left' ? 'justify-start' : lado === 'right' ? 'justify-end' : 'justify-center')}>
                  <button type="button" aria-pressed={on} aria-label={`${m.titulo}, ${quando(m)} ${ESTADOS[m.estado].texto}`} onClick={() => setAberto(on ? null : m.id)}
                    className={'relative z-10 flex min-h-24 w-[47%] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border px-3 py-3 text-center shadow-[0_4px_22px_#0008] transition sm:w-[43%] ' + (on ? tema.noAtivo : tema.no) + (m.estado === 'futuro' ? ' opacity-55 grayscale-[.4]' : '') + (m.estado === 'proximo' ? ' outline outline-2 outline-offset-4 outline-white/50' : '')}
                    style={{ ...(tema.forma ? { clipPath: tema.forma, paddingInline: '1.1rem' } : {}), ...(tema.torto ? { transform: `rotate(${i % 2 ? 1.6 : -1.4}deg)` } : {}) }}>
                    {tema.ligacao === 'fio' && <span aria-hidden className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-[#c3151f] shadow-[0_1px_2px_#0009]" />}
                    <span aria-hidden className={'flex h-9 w-9 items-center justify-center rounded-full border text-lg ' + tema.selo}>{m.estado === 'futuro' ? <LockKeyhole size={16} /> : ESTADOS[m.estado].icone}</span>
                    <strong className={'w-full break-words text-xs leading-snug ' + tema.titulo}>{m.titulo}</strong>
                    <span className={'text-[10px] ' + tema.sub}>{[quando(m), ESTADOS[m.estado].texto].filter(Boolean).join(' · ')}</span>
                    {anotado && <span className="w-full truncate text-[10px] font-semibold text-emerald-400">✎ {anotado}</span>}
                  </button>
                </div>
                {on && detalhe(m)}
              </li>
            })}
          </ol>
          {tema.ligacao === 'raiz' && <svg aria-hidden className="pointer-events-none relative mx-auto h-16 w-48" viewBox="0 0 192 64"><path d="M96 0 V18 Q70 32 10 57 M96 18 Q122 32 182 57 M96 18 Q96 39 96 61 M96 22 Q55 37 40 62 M96 22 Q137 37 152 62" stroke="#a7835c" strokeWidth="5" fill="none" strokeLinecap="round" /></svg>}
        </div>
        : <ol className="space-y-2" aria-label={'Lista de ' + ramo.titulo}>{visiveis(ramo).map(m => <li key={m.id}>
          <button type="button" onClick={() => setAberto(aberto === m.id ? null : m.id)} aria-pressed={aberto === m.id} className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-(--a-55456e) border-l-4 bg-(--s-201a32) p-3 text-left" style={{ borderLeftColor: ramo.cor, opacity: m.estado === 'futuro' ? .7 : 1 }}>
            <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--s-34294f)" style={{ color: ramo.cor }}>{ESTADOS[m.estado].icone}</span>
            <span className="min-w-0 flex-1"><strong className="block break-words text-sm text-white">{m.titulo}</strong><span className="text-xs text-(--a-c4b6d4)">{[quando(m), ESTADOS[m.estado].texto, escolha(m) && '✎ ' + escolha(m)].filter(Boolean).join(' · ')}</span></span>
          </button>
          {aberto === m.id && detalhe(m)}
        </li>)}</ol>}
    </div>}
  </section></MotionConfig>
}
