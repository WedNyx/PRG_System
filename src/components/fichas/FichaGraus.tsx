'use client'

import { useState } from 'react'
import { BookOpen, Dice5, Plus, Sparkles, Trash2 } from 'lucide-react'
import type { DadosFicha, Sistema } from '@/lib/sistemas/tipos'
import { dadoDoGrau, expressaoGraus, grauValido, linhaDaTabela, opcoesDeGrau, rotuloGrau } from '@/lib/sistemas/graus'
import { rolarExpressao } from '@/lib/dice'

/**
 * Partes da ficha para sistemas autorais mais livres (v0.35.6):
 * - graus de dado: atributos e perícias valem d4, d6, d8… e o teste soma o dado do atributo com o da perícia;
 * - perícias livres: o jogador cria as dele;
 * - regras escritas pelo autor e tabelas roláveis.
 */
type Mostrar = (expr: string, rotulo: string, nota?: (r: { resultados: number[]; total: number }) => string | null) => Promise<void>
const card = 'ficha-painel rounded-2xl border border-(--ficha-borda) bg-(--ficha-cartao) p-4 sm:p-5'
const sel = 'rounded-lg border border-(--a-5e4b78) bg-(--s-151123) px-2 py-1.5 text-sm font-bold text-white disabled:opacity-70'
const titulo = 'mb-2 flex items-center gap-2 font-bold text-(--ficha-acento) [font-family:var(--ficha-fonte)]'

/** Nome do atributo escolhido como destaque (campo de escolha cujas opções são nomes de atributos). */
function destaqueDe(s: Sistema, d: DadosFicha) {
  for (const c of s.campos) if (c.tipo === 'escolha' && c.opcoes?.some(o => s.atributos.some(a => a.nome.toLowerCase() === o.nome.toLowerCase()))) {
    const v = String(d.campos[c.id] ?? '').toLowerCase()
    const a = s.atributos.find(x => x.nome.toLowerCase() === v)
    if (a) return a.id
  }
  return null
}
/** Texto guardado pelo resultado de uma tabela (ex.: efeito do dado especial). */
const efeitoGuardado = (s: Sistema, d: DadosFicha) => s.tabelas?.map(t => t.campo ? String(d.campos[t.campo] ?? '').trim() : '').find(Boolean) ?? ''

export function AtributosGraus({ s, d, onChange, somenteLeitura, mostrar }: { s: Sistema; d: DadosFicha; onChange: (d: DadosFicha) => void; somenteLeitura: boolean; mostrar: Mostrar }) {
  const g = s.graus!, destaque = destaqueDe(s, d), efeito = efeitoGuardado(s, d)
  return <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
    {s.atributos.map(a => {
      const v = grauValido(d.atributos[a.id] ?? a.padrao, g), dado = dadoDoGrau(v, g), ops = opcoesDeGrau(g).filter(o => o >= a.min && o <= a.max)
      return <div key={a.id} className={'ficha-dado rounded-xl border p-3 text-center ' + (destaque === a.id ? 'border-(--ficha-acento) shadow-[0_0_16px_#a855f733]' : 'border-(--ficha-borda)') + ' bg-(--s-171325)'}>
        <div aria-hidden="true" className="ficha-dado-emblema mx-auto mb-2 flex h-12 w-12 items-center justify-center text-sm font-black text-(--ficha-acento)">{dado ? 'd' + dado : '—'}</div>
        <p className="font-semibold">{a.nome}{destaque === a.id && <span className="ml-1 text-xs text-amber-200" title="Atributo em destaque">✦</span>}</p>
        <select aria-label={'Grau de ' + a.nome} value={v} disabled={somenteLeitura} onChange={e => onChange({ ...d, atributos: { ...d.atributos, [a.id]: Number(e.target.value) } })} className={sel + ' mt-2 w-full text-center text-lg'}>
          {ops.map(o => <option key={o} value={o}>{rotuloGrau(o, g)}</option>)}</select>
        {dado && <button type="button" onClick={() => void mostrar('1d' + dado, a.nome + ' (d' + dado + ')', destaque === a.id && efeito ? () => '✦ Dado especial: ' + efeito : undefined)} aria-label={'Rolar ' + a.nome}
          className="mt-2 inline-flex items-center gap-1 rounded-lg bg-(--s-34294f) px-2.5 py-1 text-xs hover:bg-(--s-4b3a6e)"><Dice5 size={14} /> Rolar</button>}
        {a.dica && <p className="mt-2 text-left text-[11px] leading-snug text-(--a-a998bd)">{a.dica}</p>}
      </div>
    })}
  </div>
}

/** Perícias em graus (as do sistema e, se o sistema deixar, as que o jogador cria) e o teste combinado. */
export function PericiasGraus({ s, d, onChange, somenteLeitura, mostrar }: { s: Sistema; d: DadosFicha; onChange: (d: DadosFicha) => void; somenteLeitura: boolean; mostrar: Mostrar }) {
  const g = s.graus!, p = s.pericias!, tituloPer = p.titulo?.trim() || 'Perícias'
  const extras = d.periciasExtras ?? []
  const lista = [...p.lista.map(x => ({ id: x.id, nome: x.nome, dica: x.dica, minha: false })), ...extras.map(x => ({ ...x, dica: undefined, minha: true }))]
  const ops = opcoesDeGrau(g, g.maxPericia)
  const valor = (id: string) => Number(d.pericias[id]) || 0
  const [nova, setNova] = useState('')
  const [atr, setAtr] = useState(s.atributos[0]?.id ?? '')
  const [per, setPer] = useState('')
  const [bonus, setBonus] = useState(0)
  const destaque = destaqueDe(s, d), efeito = efeitoGuardado(s, d)
  function criar() {
    const nome = nova.trim().slice(0, 60); if (!nome) return
    const id = 'x_' + Math.random().toString(36).slice(2, 10)
    onChange({ ...d, periciasExtras: [...extras, { id, nome }], pericias: { ...d.pericias, [id]: g.inicialPericia ?? g.lados[0] } }); setNova('')
  }
  function tirar(id: string) {
    if (!confirm('Tirar esta ' + tituloPer.toLowerCase().replace(/s$/, '') + '?')) return
    const { [id]: _f, ...resto } = d.pericias; void _f
    onChange({ ...d, periciasExtras: extras.filter(x => x.id !== id), pericias: resto })
  }
  function testar() {
    const a = s.atributos.find(x => x.id === atr), pe = lista.find(x => x.id === per)
    const va = a ? grauValido(d.atributos[a.id] ?? a.padrao, g) : null
    const expr = expressaoGraus(va, pe ? valor(pe.id) : null, bonus, g); if (!expr) return
    void mostrar(expr, [a?.nome, pe?.nome].filter(Boolean).join(' + ') || 'Teste', a && a.id === destaque && efeito ? () => '✦ Dado especial: ' + efeito : undefined)
  }
  return <>
    <section className={card}>
      <h2 className={titulo}><Dice5 size={18} /> Teste</h2>
      <p className="mb-3 text-xs text-(--a-a998bd)">Escolha o atributo e, se der, uma {tituloPer.toLowerCase().replace(/s$/, '')}: os dois dados rolam juntos e somam.</p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs">Atributo<select value={atr} onChange={e => setAtr(e.target.value)} className={sel + ' mt-1 block'}>
          {s.atributos.map(a => <option key={a.id} value={a.id}>{a.nome} ({rotuloGrau(grauValido(d.atributos[a.id] ?? a.padrao, g), g)})</option>)}</select></label>
        <label className="text-xs">{tituloPer.replace(/s$/, '')}<select value={per} onChange={e => setPer(e.target.value)} className={sel + ' mt-1 block max-w-[11rem]'}>
          <option value="">Nenhuma</option>{lista.filter(x => valor(x.id) > 0).map(x => <option key={x.id} value={x.id}>{x.nome} (d{valor(x.id)})</option>)}</select></label>
        <label className="text-xs">Bônus<input type="number" value={bonus} onChange={e => setBonus(Math.max(-99, Math.min(99, Number(e.target.value) || 0)))} className={sel + ' mt-1 block w-16 text-center'} /></label>
        <button type="button" onClick={testar} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-(--a-7654bb) px-3 py-1.5 text-sm font-semibold"><Dice5 size={15} /> Rolar</button>
      </div>
    </section>
    <section className={card}>
      <h2 className={titulo}>{tituloPer}</h2>
      <p className="mb-3 text-xs text-(--a-a998bd)">Escolha o grau de cada uma{p.livres ? ' e crie as suas' : ''}. Sem grau = o personagem não tem.</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {lista.map(x => { const v = valor(x.id)
          return <div key={x.id} className="rounded-lg bg-(--s-171325) px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm">{x.nome}</span>
              <select aria-label={'Grau de ' + x.nome} value={ops.includes(v) ? v : 0} disabled={somenteLeitura} onChange={e => onChange({ ...d, pericias: { ...d.pericias, [x.id]: Number(e.target.value) } })} className={sel}>
                {!ops.includes(0) && <option value={0}>—</option>}{ops.map(o => <option key={o} value={o}>{o ? 'd' + o : '—'}</option>)}</select>
              {v > 0 && <button type="button" onClick={() => void mostrar('1d' + v, x.nome + ' (d' + v + ')')} aria-label={'Rolar ' + x.nome} className="shrink-0 rounded-lg bg-(--s-34294f) px-2 py-1.5 hover:bg-(--s-4b3a6e)"><Dice5 size={16} aria-hidden /></button>}
              {x.minha && !somenteLeitura && <button type="button" onClick={() => tirar(x.id)} aria-label={'Tirar ' + x.nome} className="shrink-0 rounded-lg p-1.5 text-red-200 hover:bg-(--s-34294f)"><Trash2 size={14} /></button>}
            </div>
            {x.dica && <p className="mt-1 text-[11px] text-(--a-a998bd)">{x.dica}</p>}
          </div> })}
      </div>
      {p.livres && !somenteLeitura && <form onSubmit={e => { e.preventDefault(); criar() }} className="mt-3 flex gap-2">
        <input value={nova} maxLength={60} onChange={e => setNova(e.target.value)} aria-label={'Nova ' + tituloPer.toLowerCase()} placeholder="Ex.: Investigação, Medicina, Rua…" className="min-w-0 flex-1 rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-sm text-white" />
        <button type="submit" disabled={!nova.trim() || extras.length >= 40} className="inline-flex items-center gap-1 rounded-lg border border-(--a-5e4b78) px-3 text-sm hover:bg-(--s-34294f) disabled:opacity-40"><Plus size={14} /> Criar</button>
      </form>}
    </section>
  </>
}

/** Regras escritas pelo autor (capítulos que abrem e fecham). */
export function RegrasDoSistema({ s }: { s: Sistema }) {
  if (!s.regras?.length) return null
  return <section className={card}>
    <h2 className={titulo}><BookOpen size={18} /> Regras de {s.nome}</h2>
    <div className="space-y-2">{s.regras.map((r, i) => <details key={i} className="group rounded-xl bg-(--s-171325) px-3 py-2">
      <summary className="cursor-pointer list-none text-sm font-semibold"><span className="mr-1 inline-block transition group-open:rotate-90" aria-hidden>›</span>{r.titulo}</summary>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-(--a-d6c9e4)">{r.texto.split(/\n{2,}/).map((par, k) => <p key={k} className="whitespace-pre-line">{par}</p>)}</div>
    </details>)}</div>
  </section>
}

/** Tabelas roláveis do sistema; o resultado pode ser guardado num campo da ficha. */
export function TabelasDoSistema({ s, d, onChange, somenteLeitura, rolarNaCampanha }: { s: Sistema; d: DadosFicha; onChange: (d: DadosFicha) => void; somenteLeitura: boolean
  rolarNaCampanha?: (expressao: string, rotulo: string) => Promise<{ resultados: number[]; total: number } | null> }) {
  const [res, setRes] = useState<Record<string, { total: number; texto: string } | null>>({})
  if (!s.tabelas?.length) return null
  async function rolar(id: string) {
    const t = s.tabelas!.find(x => x.id === id)!
    const r = rolarNaCampanha ? await rolarNaCampanha(t.dado, t.nome) : rolarExpressao(t.dado)
    if (!r) return
    setRes(m => ({ ...m, [id]: { total: r.total, texto: linhaDaTabela(t, r.total)?.texto ?? 'Sem linha para esse número.' } }))
  }
  return <section className={card}>
    <h2 className={titulo}><Sparkles size={18} /> Tabelas</h2>
    <div className="space-y-3">{s.tabelas.map(t => { const r = res[t.id], campo = t.campo ? s.campos.find(c => c.id === t.campo) : null
      return <div key={t.id} className="rounded-xl bg-(--s-171325) p-3">
        <div className="flex flex-wrap items-center gap-2"><p className="flex-1 font-semibold">{t.nome}</p>
          <button type="button" onClick={() => void rolar(t.id)} className="inline-flex items-center gap-1 rounded-lg bg-(--a-7654bb) px-3 py-1.5 text-sm font-semibold"><Dice5 size={14} /> Rolar {t.dado}</button></div>
        {r && <div className="mt-2 rounded-lg border border-(--ficha-acento)/50 p-2 text-sm"><strong className="text-lg text-(--a-ed9cd8)">{r.total}</strong> — {r.texto}
          {campo && !somenteLeitura && <button type="button" onClick={() => onChange({ ...d, campos: { ...d.campos, [campo.id]: r.texto } })} className="ml-2 rounded-lg border border-(--a-5e4b78) px-2 py-0.5 text-xs hover:bg-(--s-34294f)">Guardar em “{campo.nome}”</button>}</div>}
        <details className="mt-2"><summary className="cursor-pointer text-xs text-(--a-c4b6d4)">Ver a tabela</summary>
          <ul className="mt-1 space-y-0.5 text-xs text-(--a-d6c9e4)">{t.linhas.map(l => <li key={l.de}><strong>{l.de === l.ate ? l.de : `${l.de}–${l.ate}`}</strong> — {l.texto}</li>)}</ul></details>
      </div> })}</div>
  </section>
}
