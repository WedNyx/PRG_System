'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Dice5 } from 'lucide-react'
import { rolarExpressao } from '@/lib/dice'
import type { Calculo } from '@/lib/sistemas/calculo'
import type { DadosFicha, Sistema } from '@/lib/sistemas/tipos'
import { FundoDado, IconeDado, Simbolo } from './IconesAssimilacao'
import { lerResultados, montarTeste, montarTesteAssimilacao, nivelDeSaude, penalidadeSaude, somar, sugerirMantidos, type DadoAssim, type Face, type LadoAssim } from '@/lib/sistemas/assimilacao'

const card = 'rounded-2xl border border-(--a-55456e) bg-(--s-201a32) p-4 sm:p-5'
const sel = 'w-full rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-sm text-white disabled:opacity-60'
type Rolar = (expressao: string, rotulo: string, extra?: { estilo: 'assimilacao'; manter?: number; todos?: boolean }) => Promise<{ resultados: number[] } | null>

/** Símbolos de uma face: Sucesso, Adaptação e Pressão. */
export function Simbolos({ face, tamanho = 16 }: { face: Face; tamanho?: number }) {
  if (!face.a && !face.b && !face.c) return <span className="text-xs text-white/70">vazio</span>
  return <span className="inline-flex flex-wrap items-center justify-center gap-0.5">
    {Array.from({ length: face.a }, (_, i) => <Simbolo key={'a' + i} tipo="a" tamanho={tamanho} />)}
    {Array.from({ length: face.b }, (_, i) => <Simbolo key={'b' + i} tipo="b" tamanho={tamanho} />)}
    {Array.from({ length: face.c }, (_, i) => <Simbolo key={'c' + i} tipo="c" tamanho={tamanho} />)}
  </span>
}
export const Legenda = () => <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-(--a-c4b6d4)">
  <span className="inline-flex items-center gap-1"><Simbolo tipo="a" tamanho={14} /> Sucesso</span>
  <span className="inline-flex items-center gap-1"><Simbolo tipo="b" tamanho={14} /> Adaptação</span>
  <span className="inline-flex items-center gap-1"><Simbolo tipo="c" tamanho={14} /> Pressão</span>
  <span className="inline-flex items-center gap-1"><IconeDado lados={6} tamanho={16} /> Instinto</span>
  <span className="inline-flex items-center gap-1"><IconeDado lados={10} tamanho={16} /> Aptidão</span>
  <span className="inline-flex items-center gap-1"><IconeDado lados={12} tamanho={16} /> Assimilado</span>
</p>

function Dado({ d, mantido, onClick }: { d: DadoAssim; mantido?: boolean; onClick?: () => void }) {
  return <button type="button" onClick={onClick} disabled={!onClick} aria-pressed={mantido} aria-label={`d${d.lados}: ${d.face.a} sucesso, ${d.face.b} adaptação, ${d.face.c} pressão`}
    className={'relative flex h-[4.5rem] w-[4.5rem] flex-col items-center justify-center transition ' + (mantido ? 'scale-105 drop-shadow-[0_0_10px_rgba(255,255,255,.45)]' : 'opacity-55 saturate-50') + (onClick ? ' hover:opacity-100' : '')}>
    <FundoDado lados={d.lados} />
    <span className="relative z-10 mt-1"><Simbolos face={d.face} tamanho={d.face.a + d.face.b + d.face.c > 2 ? 15 : 19} /></span>
    <span className="relative z-10 text-[9px] font-semibold text-white/80">d{d.lados}·{d.valor}</span>
    {mantido && onClick && <span className="absolute -right-1 -top-1 z-10 rounded-full bg-white px-1 text-[10px] font-bold text-(--s-151123)">✓</span>}
  </button>
}

const Totais = ({ f }: { f: Face }) => <div className="flex flex-wrap gap-3 text-sm">
  <span className="inline-flex items-center gap-1 text-emerald-300"><Simbolo tipo="a" /> {f.a} Sucesso{f.a === 1 ? '' : 's'}</span>
  <span className="inline-flex items-center gap-1 text-sky-300"><Simbolo tipo="b" /> {f.b} Adaptaç{f.b === 1 ? 'ão' : 'ões'}</span>
  <span className="inline-flex items-center gap-1 text-rose-300"><Simbolo tipo="c" /> {f.c} Press{f.c === 1 ? 'ão' : 'ões'}</span>
</div>

/** Testes de Assimilação RPG na ficha: montar a pilha, rolar, escolher os dados mantidos; Teste de Assimilação e dano. */
export default function TesteAssimilacao({ s, d, c, onChange, somenteLeitura, rolarNaCampanha }: {
  s: Sistema; d: DadosFicha; c: Calculo; onChange: (d: DadosFicha) => void; somenteLeitura: boolean; rolarNaCampanha?: Rolar
}) {
  const [inst, setInst] = useState(s.atributos[0]?.id ?? '')
  const [apt, setApt] = useState('')
  const [assimilada, setAssimilada] = useState(false)
  const [inst2, setInst2] = useState(s.atributos[0]?.id ?? '')
  const [det, setDet] = useState(false)
  const [evento, setEvento] = useState(false)
  const [ocupacao, setOcupacao] = useState(false)
  const [teste, setTeste] = useState<{ rotulo: string; dados: DadoAssim[]; manter: number; mantidos: number[] } | null>(null)
  const [assim, setAssim] = useState<{ dados: DadoAssim[]; anotado: boolean } | null>(null)
  const [qtdDano, setQtdDano] = useState(1)
  const [dano, setDano] = useState<DadoAssim[] | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const v = (id: string) => Number(c.vars[id]) || 0
  const atual = (id: string) => Number(d.recursos[id]?.atual) || 0
  const lista = s.pericias?.lista ?? []
  const valorApt = apt ? Number(d.pericias[apt]) || 0 : 0
  const m = montarTeste({ instinto: v(inst), aptidao: valorApt, segundoInstinto: assimilada ? v(inst2) : null, determinacao: det ? 1 : 0, origens: (evento ? 1 : 0) + (ocupacao ? 1 : 0) })
  const custoAssim = assimilada ? (atual('assimilacao') > 0 ? { assimilacao: 1, determinacao: 0 } : { assimilacao: 0, determinacao: 2 }) : { assimilacao: 0, determinacao: 0 }
  const gastoDet = (det ? 1 : 0) + custoAssim.determinacao
  const faltaPonto = gastoDet > atual('determinacao')
  const nivel = nivelDeSaude(d.recursos), pena = penalidadeSaude(nivel || 1)
  const nome = (id: string) => s.atributos.find(a => a.id === id)?.nome ?? id

  async function jogar(expressao: string, rotulo: string, extra: { manter?: number; todos?: boolean } = {}) {
    if (rolarNaCampanha) return (await rolarNaCampanha(expressao, rotulo, { estilo: 'assimilacao', ...extra }))?.resultados ?? null
    return rolarExpressao(expressao)?.resultados ?? null
  }

  async function rolarTeste() {
    if (!m.total) { toast.error('Escolha um Instinto com pelo menos 1 ponto.'); return }
    if (faltaPonto) { toast.error('Pontos de Determinação insuficientes.'); return }
    const rotulo = `${nome(inst)} + ${assimilada ? nome(inst2) + ' (Agir por Instinto)' : apt ? lista.find(p => p.id === apt)?.nome : 'sem aptidão'} · mantém ${m.manter}`
    setOcupado(true)
    try {
      const r = await jogar(m.expressao, rotulo, { manter: m.manter })
      if (!r) { toast.error('Não deu para rolar agora.'); return }
      const dados = lerResultados(m.grupos, r)
      setTeste({ rotulo, dados, manter: m.manter, mantidos: sugerirMantidos(dados, m.manter) })
      // Gasta os pontos usados (Determinação para manter dado; Assimilação, ou 2 de Determinação, para Agir por Instinto).
      if (!somenteLeitura && (gastoDet || custoAssim.assimilacao)) {
        const rec = { ...d.recursos }
        if (gastoDet) rec.determinacao = { ...rec.determinacao, atual: Math.max(0, atual('determinacao') - gastoDet) }
        if (custoAssim.assimilacao) rec.assimilacao = { ...rec.assimilacao, atual: Math.max(0, atual('assimilacao') - 1) }
        onChange({ ...d, recursos: rec })
        toast.info(`Gastou ${[gastoDet ? gastoDet + ' de Determinação' : '', custoAssim.assimilacao ? '1 de Assimilação' : ''].filter(Boolean).join(' e ')}.`)
        if (gastoDet && atual('determinacao') - gastoDet <= 0) toast.warning('Sem Determinação: o Infectado está Suscetível.')
      }
      setDet(false); setEvento(false); setOcupacao(false)
    } finally { setOcupado(false) }
  }

  function alternar(i: number) {
    if (!teste) return
    const tem = teste.mantidos.includes(i)
    if (!tem && teste.mantidos.length >= teste.manter) { setTeste({ ...teste, mantidos: [...teste.mantidos.slice(1), i].sort((a, b) => a - b) }); return }
    setTeste({ ...teste, mantidos: tem ? teste.mantidos.filter(x => x !== i) : [...teste.mantidos, i].sort((a, b) => a - b) })
  }

  async function rolarAssimilacao() {
    const t = montarTesteAssimilacao(v('nivel_assimilacao'))
    setOcupado(true)
    try {
      const r = await jogar(t.expressao, 'Teste de Assimilação', { todos: true })
      if (r) setAssim({ dados: lerResultados(t.grupos, r), anotado: false })
    } finally { setOcupado(false) }
  }
  function anotarPressoes(n: number) {
    const total = atual('pressoes') + n
    onChange({ ...d, recursos: { ...d.recursos, pressoes: { ...d.recursos.pressoes, atual: Math.min(10, total) } } })
    setAssim(a => a && { ...a, anotado: true })
    if (total >= 10) toast.error('10 Pressões: a Assimilação toma o Infectado. Ele passa para o Assimilador.')
    else toast.success(`${n} ${n === 1 ? 'Pressão anotada' : 'Pressões anotadas'} (${total} de 10).`)
  }

  async function rolarDano() {
    const n = Math.max(1, Math.min(20, qtdDano))
    const grupos = [{ lados: 10 as LadoAssim, qtd: n }]
    setOcupado(true)
    try { const r = await jogar(`${n}d10`, 'Dano', { todos: true }); if (r) setDano(lerResultados(grupos, r)) } finally { setOcupado(false) }
  }

  const mantidos = teste ? teste.mantidos.map(i => teste.dados[i].face) : []
  const tot = somar(mantidos)
  const totAssim = assim ? somar(assim.dados.map(x => x.face)) : null
  const totDano = dano ? somar(dano.map(x => x.face)) : null

  return <>
    <section className={card} aria-label="Teste com os dados de Assimilação">
      <h2 className="mb-1 flex items-center gap-2 font-bold text-(--a-ed9cd8)"><Dice5 size={18} /> Teste</h2>
      <p className="mb-3 text-xs text-(--a-a998bd)">Um d6 por ponto do Instinto e um d10 por ponto do Conhecimento ou Prática. Role todos e mantenha o melhor (ou mais, gastando recursos).</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-(--a-c4b6d4)"><span className="inline-flex items-center gap-1"><IconeDado lados={6} tamanho={16} /> Instinto (d6)</span>
          <select value={inst} onChange={e => setInst(e.target.value)} className={sel + ' mt-1'}>{s.atributos.map(a => <option key={a.id} value={a.id}>{a.nome} ({v(a.id)})</option>)}</select></label>
        <label className="text-xs text-(--a-c4b6d4)"><span className="inline-flex items-center gap-1"><IconeDado lados={10} tamanho={16} /> Conhecimento ou Prática (d10)</span>
          <select value={apt} disabled={assimilada} onChange={e => setApt(e.target.value)} className={sel + ' mt-1'}>
            <option value="">Nenhum (0)</option>
            {['Conhecimentos', 'Práticas'].map(g => <optgroup key={g} label={g}>{lista.filter(p => p.grupo === g).map(p => <option key={p.id} value={p.id}>{p.nome} ({Number(d.pericias[p.id]) || 0})</option>)}</optgroup>)}
          </select></label>
      </div>
      <div className="mt-3 space-y-2 text-sm">
        <label className="flex items-start gap-2"><input type="checkbox" checked={assimilada} onChange={e => setAssimilada(e.target.checked)} className="mt-1 accent-fuchsia-400" />
          <span>Agir por Instinto (Rolagem Assimilada) <span className="block text-xs text-(--a-a998bd)">Troca a aptidão por um segundo Instinto; todos os dados viram d12 e mantém +1. Gasta 1 de Assimilação (sem pontos: 2 de Determinação).</span></span></label>
        {assimilada && <label className="ml-6 block text-xs text-(--a-c4b6d4)">Segundo Instinto
          <select value={inst2} onChange={e => setInst2(e.target.value)} className={sel + ' mt-1'}>{s.atributos.map(a => <option key={a.id} value={a.id}>{a.nome} ({v(a.id)})</option>)}</select></label>}
        <label className="flex items-start gap-2"><input type="checkbox" checked={det} onChange={e => setDet(e.target.checked)} className="mt-1" /><span>Gastar 1 de Determinação: mantém +1 dado <span className="text-xs text-(--a-a998bd)">(uma vez por rodada)</span></span></label>
        <label className="flex items-start gap-2"><input type="checkbox" checked={evento} onChange={e => setEvento(e.target.checked)} className="mt-1" /><span>Ativar o Evento Marcante: mantém +1 <span className="text-xs text-(--a-a998bd)">(uma vez por sessão)</span></span></label>
        <label className="flex items-start gap-2"><input type="checkbox" checked={ocupacao} onChange={e => setOcupacao(e.target.checked)} className="mt-1" /><span>Ativar a Ocupação: mantém +1 <span className="text-xs text-(--a-a998bd)">(uma vez por sessão)</span></span></label>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-(--s-171325) px-3 py-2 text-sm">
        <span className="inline-flex flex-wrap items-center gap-1.5">Rola {m.grupos.length ? m.grupos.map((g, i) => <span key={g.lados} className="inline-flex items-center gap-1">{i > 0 && '+'} <b>{g.qtd}</b> <IconeDado lados={g.lados} tamanho={22} /> <span className="text-xs text-(--a-c4b6d4)">d{g.lados}</span></span>) : <b>nada</b>} · mantém <b>{m.manter}</b></span><span>{m.manter === 4 && <span className="text-xs text-(--a-a998bd)"> (máximo)</span>}</span>
        <button type="button" disabled={ocupado || !m.total || faltaPonto} onClick={() => void rolarTeste()} className="rounded-lg bg-(--a-7652ac) px-4 py-2 font-semibold hover:bg-(--a-8b68c4) disabled:opacity-50">🎲 Rolar</button>
      </div>
      {faltaPonto && <p className="mt-1 text-xs text-amber-200">Pontos de Determinação insuficientes ({atual('determinacao')}).</p>}
      {nivel > 0 && pena.sucessos > 0 && <p className="mt-2 rounded-lg border border-amber-700/60 bg-amber-950/40 p-2 text-xs text-amber-100">Saúde no nível {nivel}: {nivel >= 3 ? '−1 Sucesso nos testes. Anule com 1 Adaptação ou 1 de Determinação.' : nivel === 2 ? '−2 Sucessos e 1 de Determinação para agir. Anule a penalidade com 1 Adaptação.' : '1 de Determinação por rodada para ficar consciente; para agir, o teste precisa de 2 Adaptações.'}</p>}

      {teste && <div className="mt-4 border-t border-(--a-55456e) pt-3">
        <p className="text-sm font-semibold">{teste.rotulo}</p>
        <p className="mb-2 text-xs text-(--a-a998bd)">Toque para escolher {teste.manter === 1 ? 'o dado mantido' : `os ${teste.manter} dados mantidos`}. Já deixamos marcada uma sugestão.</p>
        <div className="flex flex-wrap gap-2">{teste.dados.map((x, i) => <Dado key={i} d={x} mantido={teste.mantidos.includes(i)} onClick={() => alternar(i)} />)}</div>
        <div className="mt-3 rounded-xl bg-(--s-171325) p-3"><p className="mb-1 text-xs uppercase tracking-wider text-(--a-c4b6d4)">Mantidos ({teste.mantidos.length} de {teste.manter})</p><Totais f={tot} />
          {tot.c > 0 && <p className="mt-1 text-xs text-(--a-a998bd)">As Pressões ficam com o Assimilador: consequências na cena ou −1 de Determinação cada. Numa Ação Simples, cada Adaptação evita uma Pressão.</p>}</div>
        <div className="mt-2"><Legenda /></div>
      </div>}
    </section>

    <section className={card} aria-label="Teste de Assimilação">
      <h2 className="mb-1 flex items-center gap-2 font-bold text-(--a-ed9cd8)">🧬 Teste de Assimilação</h2>
      <p className="mb-3 text-xs text-(--a-a998bd)">Quando perder um nível de Determinação: 1d10 + 1d12 por nível de Assimilação ({v('nivel_assimilacao')}). Todos os símbolos contam; as Pressões vão para a ficha (10 = a Assimilação toma o Infectado).</p>
      <button type="button" disabled={ocupado} onClick={() => void rolarAssimilacao()} className="rounded-lg border border-fuchsia-400/60 px-3 py-2 text-sm hover:bg-(--s-34294f) disabled:opacity-50">Rolar {montarTesteAssimilacao(v('nivel_assimilacao')).expressao.replace('+', ' + ')}</button>
      {assim && totAssim && <div className="mt-3 space-y-2">
        <div className="flex flex-wrap gap-2">{assim.dados.map((x, i) => <Dado key={i} d={x} mantido />)}</div>
        <Totais f={totAssim} />
        {!somenteLeitura && totAssim.c > 0 && <button type="button" disabled={assim.anotado} onClick={() => anotarPressoes(totAssim.c)} className="rounded-lg bg-rose-900/70 px-3 py-1.5 text-sm hover:bg-rose-800 disabled:opacity-50">{assim.anotado ? 'Anotado ✔' : `Anotar ${totAssim.c} ${totAssim.c === 1 ? 'Pressão' : 'Pressões'} na ficha (${atual('pressoes')} → ${Math.min(10, atual('pressoes') + totAssim.c)})`}</button>}
      </div>}
    </section>

    <section className={card} aria-label="Rolar dano">
      <h2 className="mb-1 flex items-center gap-2 font-bold text-(--a-ed9cd8)">🩸 Dano</h2>
      <p className="mb-3 text-xs text-(--a-a998bd)">Rola d10: cada símbolo, qualquer que seja, é 1 ponto de dano.</p>
      <div className="flex items-center gap-2">
        <input type="number" min={1} max={20} value={qtdDano} onChange={e => setQtdDano(Number(e.target.value) || 1)} aria-label="Quantos d10" className={sel + ' !w-20 text-center'} />
        <button type="button" disabled={ocupado} onClick={() => void rolarDano()} className="rounded-lg border border-(--a-5e4b78) px-3 py-2 text-sm hover:bg-(--s-34294f) disabled:opacity-50">Rolar {Math.max(1, Math.min(20, qtdDano))}d10</button>
      </div>
      {dano && totDano && <div className="mt-3 space-y-2"><div className="flex flex-wrap gap-2">{dano.map((x, i) => <Dado key={i} d={x} mantido />)}</div>
        <p className="font-semibold">Dano: {totDano.a + totDano.b + totDano.c}</p></div>}
    </section>
  </>
}
