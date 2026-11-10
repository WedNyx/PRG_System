'use client'

import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Check, ChevronRight, GraduationCap, RotateCcw } from 'lucide-react'
import RolagemCentral, { type RolagemCentralHandle } from '@/components/dados/RolagemCentral'
import ArvoreHabilidades from '@/components/fichas/Arvore'
import EditorRolagem from '@/components/sistemas/EditorRolagem'
import { rolarExpressao } from '@/lib/dice'
import { sistemaPorId } from '@/lib/sistemas/catalogo'
import { fichaVazia } from '@/lib/sistemas/calculo'
import { lerArvore } from '@/lib/sistemas/arvore'
import { MODELOS_ROLAGEM } from '@/lib/sistemas/regrasRolagem'
import type { DadosFicha } from '@/lib/sistemas/tipos'

/**
 * Tutoriais práticos: cada lição tem missões que se marcam sozinhas quando a pessoa faz a coisa
 * num “campo de treino” (nada aqui é salvo na nuvem). O progresso fica só neste navegador.
 */
type Licao = { id: string; icone: string; titulo: string; resumo: string; minutos: number }
const LICOES: Licao[] = [
  { id: 'dados', icone: '🎲', titulo: 'Rolar dados', resumo: 'd20, vantagem, sucessos e dados Fate, com os dados 3D no meio da tela.', minutos: 3 },
  { id: 'arvore', icone: '🌠', titulo: 'Árvore de habilidades', resumo: 'Liberar hexágonos com pontos e montar a sua própria árvore.', minutos: 5 },
  { id: 'rolagem', icone: '🧪', titulo: 'Rolagem personalizada', resumo: 'Criar a regra de dados de um sistema autoral e testar.', minutos: 4 },
  { id: 'imagens', icone: '🖼️', titulo: 'Retrato e capa', resumo: 'Colocar imagem no personagem e capa na campanha.', minutos: 2 },
  { id: 'mesa', icone: '🗺️', titulo: 'Mesa virtual', resumo: 'Abrir a sessão, mover tokens, desenhar e rolar com o grupo.', minutos: 4 },
]
const CHAVE = 'prg-tutorial-v1'

function lerProgresso(): Record<string, string[]> {
  try { const v = JSON.parse(localStorage.getItem(CHAVE) || '{}'); return v && typeof v === 'object' ? v : {} } catch { return {} }
}
function useProgresso() {
  const [prog, setProg] = useState<Record<string, string[]>>({})
  useEffect(() => { const t = setTimeout(() => setProg(lerProgresso()), 0); return () => clearTimeout(t) }, [])
  const marcar = (licao: string, missao: string) => setProg(p => {
    if (p[licao]?.includes(missao)) return p
    const n = { ...p, [licao]: [...(p[licao] ?? []), missao] }
    try { localStorage.setItem(CHAVE, JSON.stringify(n)) } catch { /* sem armazenamento: só nesta visita */ }
    return n
  })
  const zerar = (licao: string) => setProg(p => {
    const n = { ...p, [licao]: [] }
    try { localStorage.setItem(CHAVE, JSON.stringify(n)) } catch { /* nada */ }
    return n
  })
  return { prog, marcar, zerar }
}

type Missao = { id: string; texto: ReactNode }
const MISSOES: Record<string, Missao[]> = {
  dados: [
    { id: 'd20', texto: 'Role um d20 (toque em “d20”).' },
    { id: 'vantagem', texto: <>Role com vantagem: <code>2d20kh1</code> (rola dois d20 e fica com o maior).</> },
    { id: 'sucessos', texto: <>Conte sucessos: <code>6d6s5</code> (cada 5 ou 6 vale 1 sucesso).</> },
    { id: 'fate', texto: <>Role dados Fate: <code>4dF</code> (cada dado dá −1, 0 ou +1).</> },
    { id: 'livre', texto: <>Escreva a sua própria expressão com um bônus, por exemplo <code>1d20+5</code> ou <code>2d6+3</code>.</> },
  ],
  arvore: [
    { id: 'exemplo', texto: 'Toque em “Começar com um exemplo”.' },
    { id: 'primeiro', texto: 'Saia do modo montar (“Concluir”), toque em “Despertar” e em “Liberar”.' },
    { id: 'habilidade', texto: 'Libere “Centelha” ou “Toque Gélido”: a habilidade aparece com o botão “Rolar”.' },
    { id: 'ponto', texto: 'Em “Montar árvore”, use o + para ganhar mais um ponto.' },
    { id: 'criar', texto: 'Escolha um hexágono e toque em “Hexágono ligado a este” para criar um novo, com um efeito.' },
  ],
  rolagem: [
    { id: 'modelo', texto: 'Escolha um modelo diferente do d20 (ex.: “Vantagem” ou “Contar sucessos”).' },
    { id: 'testar', texto: 'Mude o VALOR de teste e toque em “🎲 Rolar teste”.' },
    { id: 'propria', texto: <>Monte uma fórmula sua usando os botões, com <code>VALOR</code> (ex.: <code>VALORd6s5</code> ou <code>2d6+VALOR</code>), e teste.</> },
  ],
  imagens: [
    { id: 'retrato', texto: 'Abra uma ficha sua e toque no quadro ao lado do nome para escolher a imagem do personagem.' },
    { id: 'capa', texto: 'Se você é mestre: abra a campanha e toque em “🖼️ Colocar capa”.' },
    { id: 'ver', texto: 'Volte para “Fichas” e “Campanhas”: os cartões agora mostram as imagens.' },
  ],
  mesa: [
    { id: 'abrir', texto: 'Mestre: na campanha, toque em “▶ Abrir sessão” e depois em “🗺️ Abrir mesa virtual”.' },
    { id: 'cena', texto: 'Mestre: na aba “Mestre”, crie uma cena com um mapa; na aba “Tokens”, coloque os personagens.' },
    { id: 'mover', texto: 'Com a mãozinha ✋, arraste o seu token. Com o lápis ✏️, desenhe no mapa.' },
    { id: 'rolar', texto: 'Na aba “Chat”, toque em um dado (d20, d6…): todos veem os dados no meio da tela.' },
    { id: 'fechar', texto: 'Mestre: no fim, toque em “Encerrar sessão”.' },
  ],
}

function Conteudo() {
  const params = useSearchParams()
  const router = useRouter()
  const licao = LICOES.find(l => l.id === params.get('licao'))
  const { prog, marcar, zerar } = useProgresso()
  const ir = (id: string | null) => router.push(id ? '/tutorial?licao=' + id : '/tutorial', { scroll: true })

  return <main className="fundo-tema min-h-screen px-4 py-6 text-[#f2ebff] sm:py-10">
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {licao ? <button type="button" onClick={() => ir(null)} className="inline-flex items-center gap-1 text-[#c7a8ff] hover:underline"><ArrowLeft size={16} /> Todas as lições</button>
          : <Link href="/guia" className="inline-flex items-center gap-1 text-[#c7a8ff] hover:underline"><ArrowLeft size={16} /> Guia da plataforma</Link>}
        <Link href="/central" className="ml-auto text-[#b4aeca] hover:underline">Central</Link>
      </div>
      {!licao ? <Inicio prog={prog} ir={ir} /> : <LicaoView licao={licao} feitas={prog[licao.id] ?? []} marcar={m => marcar(licao.id, m)} zerar={() => zerar(licao.id)}
        proxima={LICOES[LICOES.indexOf(licao) + 1]} ir={ir} />}
    </div>
  </main>
}

function Inicio({ prog, ir }: { prog: Record<string, string[]>; ir: (id: string) => void }) {
  const total = LICOES.reduce((t, l) => t + MISSOES[l.id].length, 0)
  const feitas = LICOES.reduce((t, l) => t + (prog[l.id]?.filter(m => MISSOES[l.id].some(x => x.id === m)).length ?? 0), 0)
  return <>
    <header className="mt-4 rounded-3xl border border-[#655079] bg-[#1d1733]/90 p-6 shadow-xl sm:p-8">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.22em] text-[#ed9cd8]"><GraduationCap size={16} /> Tutoriais práticos</p>
      <h1 className="mt-3 text-2xl font-bold sm:text-4xl">Aprenda fazendo</h1>
      <p className="mt-3 text-sm leading-relaxed text-[#cfc0df]">Cada lição tem missões curtas. Faça no campo de treino e elas se marcam sozinhas. Nada do treino é salvo nas suas fichas.</p>
      <div className="mt-5"><div className="h-2 overflow-hidden rounded-full bg-[#2b2140]"><div className="h-full rounded-full bg-gradient-to-r from-[#7652ac] to-[#ed9cd8] transition-all" style={{ width: `${total ? feitas / total * 100 : 0}%` }} /></div>
        <p className="mt-1 text-xs text-[#b4aeca]">{feitas} de {total} missões feitas</p></div>
    </header>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">{LICOES.map(l => {
      const n = MISSOES[l.id].length, f = prog[l.id]?.filter(m => MISSOES[l.id].some(x => x.id === m)).length ?? 0
      return <button key={l.id} type="button" onClick={() => ir(l.id)} className="group rounded-2xl border border-[#55456e] bg-[#1d1733]/92 p-5 text-left shadow-lg transition hover:border-[#9b7ccc] hover:shadow-[0_0_28px_#7654bb44]">
        <div className="flex items-start gap-3"><span className="text-3xl" aria-hidden>{l.icone}</span>
          <div className="min-w-0 flex-1"><h2 className="text-lg font-bold">{l.titulo}</h2><p className="mt-1 text-sm text-[#cfc0df]">{l.resumo}</p>
            <p className="mt-2 text-xs text-[#a99bbb]">~{l.minutos} min · {f === n ? '✅ Concluída' : `${f}/${n} missões`}</p></div>
          <ChevronRight className="mt-1 shrink-0 text-[#b99bff] transition group-hover:translate-x-1" /></div>
      </button>
    })}</div>
  </>
}

function LicaoView({ licao, feitas, marcar, zerar, proxima, ir }: { licao: Licao; feitas: string[]; marcar: (m: string) => void; zerar: () => void; proxima?: Licao; ir: (id: string) => void }) {
  const missoes = MISSOES[licao.id]
  const completa = missoes.every(m => feitas.includes(m.id))
  const manual = licao.id === 'imagens' || licao.id === 'mesa'
  return <>
    <header className="mt-4 rounded-3xl border border-[#655079] bg-[#1d1733]/90 p-5 shadow-xl sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#ed9cd8]">🎓 Lição {LICOES.indexOf(licao) + 1} de {LICOES.length}</p>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl"><span aria-hidden>{licao.icone}</span> {licao.titulo}</h1>
      <p className="mt-2 text-sm text-[#cfc0df]">{licao.resumo}</p>
      <ol className="mt-4 space-y-2">{missoes.map((m, i) => {
        const ok = feitas.includes(m.id)
        return <li key={m.id} className={'flex items-start gap-3 rounded-xl border p-3 text-sm transition ' + (ok ? 'border-emerald-700/60 bg-emerald-900/25' : 'border-[#3d3152] bg-[#171325]')}>
          <span className={'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ' + (ok ? 'bg-emerald-500 text-[#0b1a12]' : 'bg-[#2b2140] text-[#c4b6d4]')}>{ok ? <Check size={14} /> : i + 1}</span>
          <span className={'flex-1 [&_code]:rounded [&_code]:bg-[#2b2140] [&_code]:px-1 [&_code]:font-mono [&_code]:text-[#e4d3ff] ' + (ok ? 'text-[#c9f5dc]' : 'text-[#e6dbf2]')}>{m.texto}</span>
          {manual && !ok && <button type="button" onClick={() => marcar(m.id)} className="shrink-0 rounded-lg border border-[#70588c] px-2 py-1 text-xs hover:bg-[#38294d]">Fiz ✓</button>}
        </li>
      })}</ol>
      {completa && <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-sm">
        <span className="basis-full sm:basis-auto sm:flex-1">🏆 Lição concluída! {proxima ? 'Bora para a próxima?' : 'Você terminou todos os tutoriais.'}</span>
        {proxima ? <button type="button" onClick={() => ir(proxima.id)} className="rounded-lg bg-[#7652ac] px-3 py-2 font-semibold hover:bg-[#8b68c4]">{proxima.icone} {proxima.titulo} →</button>
          : <Link href="/central" className="rounded-lg bg-[#7652ac] px-3 py-2 font-semibold hover:bg-[#8b68c4]">Ir para a Central</Link>}
      </div>}
      <button type="button" onClick={zerar} className="mt-3 inline-flex items-center gap-1 text-xs text-[#a99bbb] hover:underline"><RotateCcw size={12} /> Recomeçar esta lição</button>
    </header>

    <section className="mt-5" aria-label="Campo de treino">
      {!manual && <p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-[#c7a8ff]">🧪 Campo de treino · nada aqui é salvo</p>}
      {licao.id === 'dados' && <TreinoDados marcar={marcar} />}
      {licao.id === 'arvore' && <TreinoArvore marcar={marcar} />}
      {licao.id === 'rolagem' && <TreinoRolagem marcar={marcar} />}
      {licao.id === 'imagens' && <Atalhos itens={[['📜 Abrir minhas fichas', '/central?secao=fichas'], ['🏰 Abrir minhas campanhas', '/central?secao=campanhas']]} dica="Use imagens PNG, JPG ou WEBP. A plataforma diminui a imagem antes de enviar, então pode usar foto do celular." />}
      {licao.id === 'mesa' && <Atalhos itens={[['🏰 Abrir minhas campanhas', '/central?secao=campanhas'], ['📖 Ver o guia da mesa', '/guia#mesa']]} dica="Sem sessão aberta, só o mestre entra na mesa. Jogadores entram sozinhos assim que ela começa." />}
    </section>
  </>
}

function Atalhos({ itens, dica }: { itens: [string, string][]; dica: string }) {
  return <div className="rounded-2xl border border-[#55456e] bg-[#1d1733]/92 p-5">
    <p className="text-sm text-[#cfc0df]">Esta lição é feita na plataforma de verdade. Abra pelo atalho, faça a missão e volte aqui para marcar “Fiz ✓”.</p>
    <div className="mt-3 flex flex-wrap gap-2">{itens.map(([t, h]) => <Link key={h} href={h} className="rounded-xl bg-[#3b2b57] px-4 py-2.5 text-sm font-semibold hover:bg-[#533b78]">{t}</Link>)}</div>
    <p className="mt-3 rounded-xl border border-[#6d5690] bg-[#2a2142] p-3 text-sm text-[#e4d3ff]">💡 {dica}</p>
  </div>
}

function TreinoDados({ marcar }: { marcar: (m: string) => void }) {
  const central = useRef<RolagemCentralHandle>(null)
  const [expr, setExpr] = useState('1d20+5')
  const [erro, setErro] = useState('')
  const [ultimas, setUltimas] = useState<{ expr: string; total: number; detalhes: string }[]>([])
  function rolar(x: string) {
    const e = x.trim().toLowerCase().replace(/\s+/g, '')
    const r = rolarExpressao(e)
    if (!r) { setErro('Não entendi essa rolagem. Exemplos: 1d20+5, 2d6, 2d20kh1, 6d6s5, 4dF.'); return }
    setErro('')
    central.current?.mostrar({ rotulo: 'Treino', expressao: r.expressao, resultados: r.resultados, total: r.total, nota: /s\d/.test(e) ? `${r.total} sucesso${r.total === 1 ? '' : 's'}` : null })
    setUltimas(u => [{ expr: r.expressao, total: r.total, detalhes: r.detalhes }, ...u].slice(0, 6))
    if (e === '1d20') marcar('d20')
    if (/^2d20kh1/.test(e)) marcar('vantagem')
    if (/d6s5/.test(e)) marcar('sucessos')
    if (/df/.test(e)) marcar('fate')
    if (/^\d*d\d+[+-]\d+$/.test(e)) marcar('livre')
  }
  return <div className="rounded-2xl border border-[#55456e] bg-[#1d1733]/92 p-5">
    <RolagemCentral ref={central} />
    <div className="flex flex-wrap gap-2">{['1d20', '2d20kh1', '6d6s5', '4dF', '2d6', '1d100'].map(d => <button key={d} type="button" onClick={() => rolar(d)}
      className="rounded-xl border border-[#70588c] bg-[#2a2142] px-3 py-2 font-mono text-sm hover:bg-[#3a2c58]">{d === '1d20' ? 'd20' : d}</button>)}</div>
    <form onSubmit={e => { e.preventDefault(); rolar(expr) }} className="mt-3 flex gap-2">
      <input value={expr} onChange={e => setExpr(e.target.value)} maxLength={40} aria-label="Expressão de dados" className="min-w-0 flex-1 rounded-xl border border-[#5e4b78] bg-[#151123] p-3 font-mono text-white" />
      <button type="submit" className="rounded-xl bg-[#7652ac] px-4 font-semibold hover:bg-[#8b68c4]">🎲 Rolar</button>
    </form>
    {erro && <p role="alert" className="mt-2 text-sm text-amber-200">{erro}</p>}
    <details className="mt-3 text-sm text-[#cfc0df]"><summary className="cursor-pointer text-[#c7a8ff]">Cola das expressões</summary>
      <ul className="mt-2 space-y-1 pl-4 [&_code]:font-mono [&_code]:text-[#e4d3ff]">
        <li><code>2d6+3</code>: rola 2d6 e soma 3.</li><li><code>2d20kh1</code> / <code>2d20kl1</code>: fica com o maior / menor.</li>
        <li><code>4d6kh3</code>: soma os 3 maiores.</li><li><code>1d6!</code>: tirou 6, rola de novo e soma.</li>
        <li><code>2d6r1</code>: rerrola quem tirar 1.</li><li><code>6d6s5</code>: conta os dados com 5 ou mais.</li><li><code>4dF</code>: dados Fate (−1, 0, +1).</li>
      </ul></details>
    {ultimas.length > 0 && <ul className="mt-3 space-y-1 text-sm">{ultimas.map((u, i) => <li key={i} className="rounded-lg bg-[#171325] px-3 py-1.5"><span className="font-mono text-[#c7a8ff]">{u.expr}</span> → <strong className="text-[#ed9cd8]">{u.total}</strong> <span className="text-xs text-[#a99bbb]">{u.detalhes}</span></li>)}</ul>}
  </div>
}

function TreinoArvore({ marcar }: { marcar: (m: string) => void }) {
  const s = useMemo(() => sistemaPorId('dnd5e-srd')!, [])
  const [d, setD] = useState<DadosFicha>(() => ({ ...fichaVazia(s, 'Aprendiz'), atributos: { FOR: 12, DES: 12, CON: 12, INT: 12, SAB: 12, CAR: 12 } }))
  const central = useRef<RolagemCentralHandle>(null)
  const exemplo = new Set(['raiz', 'fogo', 'gelo', 'fogo2', 'mestre'])
  function mudar(n: DadosFicha) {
    setD(n)
    const a = lerArvore(n.arvore)
    if (a.nos.some(x => x.id === 'raiz')) marcar('exemplo')
    if (a.liberados.length >= 1) marcar('primeiro')
    if (a.liberados.includes('fogo') || a.liberados.includes('gelo')) marcar('habilidade')
    if (a.pontos > 3) marcar('ponto')
    if (a.nos.some(x => !exemplo.has(x.id) && x.requer.length > 0 && x.efeitos.length > 0)) marcar('criar')
  }
  return <>
    <RolagemCentral ref={central} />
    <ArvoreHabilidades s={s} d={d} onChange={mudar} somenteLeitura={false} rolar={(x, rotulo) => { const r = rolarExpressao(x); if (r) central.current?.mostrar({ rotulo, expressao: r.expressao, resultados: r.resultados, total: r.total }) }} />
  </>
}

function TreinoRolagem({ marcar }: { marcar: (m: string) => void }) {
  const [regra, setRegra] = useState({ nome: 'd20 + valor', formula: '1d20+VALOR' })
  const prontas = useMemo(() => new Set(MODELOS_ROLAGEM.map(m => m.formula.toUpperCase())), [])
  return <div className="rounded-2xl border border-[#55456e] bg-[#1d1733]/92 p-4 text-sm">
    <p className="mb-3 text-[#cfc0df]">Este é o mesmo editor do construtor de sistemas (em “📘 Sobre o sistema” → “Como se rola” → 🎲 Rolagem personalizada).</p>
    <EditorRolagem regra={regra} mudar={r => { setRegra(r); if (r.formula !== '1d20+VALOR' && prontas.has(r.formula.toUpperCase())) marcar('modelo') }}
      aoTestar={() => {
        marcar('testar')
        const f = regra.formula.replace(/\s+/g, '').toUpperCase()
        if (f.includes('VALOR') && !prontas.has(f)) marcar('propria')
      }} />
  </div>
}

export default function TutorialPage() {
  return <Suspense fallback={<p className="p-6 text-violet-200">Carregando tutoriais...</p>}><Conteudo /></Suspense>
}
