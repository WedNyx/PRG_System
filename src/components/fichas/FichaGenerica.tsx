'use client'

import { useMemo } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Dice5, Info } from 'lucide-react'
import { calcular } from '@/lib/sistemas/calculo'
import type { DadosFicha, Sistema } from '@/lib/sistemas/tipos'
import { rolarExpressao } from '@/lib/dice'

const card = 'rounded-2xl border border-[#55456e] bg-[#201a32] p-4 sm:p-5'
const input = 'w-full rounded-lg border border-[#5e4b78] bg-[#151123] p-2 text-white disabled:opacity-70'
const sinal = (n: number | null | undefined) => n === null || n === undefined ? '—' : n >= 0 ? '+' + n : String(n)

/** Ficha que se monta sozinha a partir do modelo do sistema. */
export default function FichaGenerica({ sistema: s, dados: d, onChange, somenteLeitura = false }: {
  sistema: Sistema; dados: DadosFicha; onChange: (d: DadosFicha) => void; somenteLeitura?: boolean
}) {
  const c = useMemo(() => calcular(s, d), [s, d])
  const d20 = s.dados.startsWith('d20')
  const set = <K extends keyof DadosFicha>(k: K, v: DadosFicha[K]) => onChange({ ...d, [k]: v })

  function rolar(nome: string, bonus: number | null) {
    if (s.id === 'brp') {
      const r = rolarExpressao('1d100'); if (!r) return
      const alvo = bonus ?? 0
      toast(`${nome}: ${r.total} / ${alvo}%`, { description: r.total <= Math.floor(alvo / 5) ? 'Sucesso especial!' : r.total <= alvo ? 'Sucesso' : 'Falha' })
      return
    }
    const b = bonus ?? 0
    const r = rolarExpressao('1d20' + (b >= 0 ? '+' + b : String(b))); if (!r) return
    const nat = r.resultados[0]
    toast(`${nome}: ${r.total}`, { description: `d20 = ${nat} ${sinal(b)}${nat === 20 ? ' · 20 natural!' : nat === 1 ? ' · 1 natural' : ''}` })
  }
  const podeRolar = d20 || s.id === 'brp'

  const grupos = new Map<string, NonNullable<Sistema['pericias']>['lista']>()
  for (const p of s.pericias?.lista ?? []) grupos.set(p.grupo ?? '', [...(grupos.get(p.grupo ?? '') ?? []), p])

  return <div className="space-y-4">
    <section className={card}>
      <label className="block text-sm font-semibold">Nome do personagem
        <input value={d.nome} maxLength={90} disabled={somenteLeitura} onChange={e => set('nome', e.target.value)} className={input + ' mt-1 text-lg font-bold'} placeholder="Ex.: Lyra Nyx" /></label>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {s.campos.map(f => <label key={f.id} className={'block text-sm ' + (f.tipo === 'area' ? 'sm:col-span-2 lg:col-span-3' : '')}>{f.nome}
          {f.tipo === 'area'
            ? <textarea rows={3} value={String(d.campos[f.id] ?? '')} disabled={somenteLeitura} onChange={e => set('campos', { ...d.campos, [f.id]: e.target.value.slice(0, 4000) })} className={input + ' mt-1'} />
            : <input type={f.tipo === 'numero' ? 'number' : 'text'} value={d.campos[f.id] ?? ''} disabled={somenteLeitura} maxLength={120}
              onChange={e => set('campos', { ...d.campos, [f.id]: f.tipo === 'numero' ? Number(e.target.value) : e.target.value })} className={input + ' mt-1'} />}
        </label>)}
      </div>
    </section>

    {c.limites.some(l => l.excedido) && <section role="alert" className="rounded-2xl border border-[#c98b3a] bg-[#3a2a14] p-4 text-sm text-[#f6dca8]">
      <p className="flex items-center gap-2 font-semibold"><AlertTriangle size={18} /> Acima do limite das regras</p>
      <ul className="mt-2 list-disc pl-5">{c.limites.filter(l => l.excedido).map(l => <li key={l.nome}>{l.nome}: {l.uso} de {l.max}</li>)}</ul>
    </section>}

    {s.atributos.length > 0 && <section className={card}>
      <h2 className="mb-3 font-bold text-[#ed9cd8]">Atributos</h2>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-8">
        {s.atributos.map(a => <div key={a.id} className="rounded-xl border border-[#5e4b78] bg-[#171325] p-2 text-center sm:p-3">
          <p className="text-xs uppercase tracking-wider text-[#c4b6d4]" title={a.nome}>{a.id}</p>
          <input type="number" aria-label={a.nome} min={a.min} max={a.max} value={d.atributos[a.id] ?? a.padrao} disabled={somenteLeitura}
            onChange={e => set('atributos', { ...d.atributos, [a.id]: Math.max(a.min, Math.min(a.max, Number(e.target.value) || 0)) })}
            className="mt-1 w-full bg-transparent text-center text-2xl font-black text-white outline-none" />
          {s.formulaModificador && <p className="text-sm text-[#d4baff]">{sinal(c.mods[a.id])}</p>}
          <p className="mt-1 truncate text-[10px] text-[#a998bd]">{a.nome}</p>
        </div>)}
      </div>
    </section>}

    {(s.derivados.length > 0 || s.recursos.length > 0) && <section className={card}>
      <h2 className="mb-3 font-bold text-[#ed9cd8]">Valores e recursos</h2>
      {s.derivados.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {s.derivados.map(x => <div key={x.id} className="rounded-xl bg-[#171325] p-3" title={x.dica}>
          <p className="text-xs text-[#c4b6d4]">{x.nome}</p><p className="text-2xl font-black">{c.derivados[x.id] ?? '—'}</p>
          {x.dica && <p className="text-[10px] text-[#a998bd]">{x.dica}</p>}</div>)}
      </div>}
      {s.recursos.length > 0 && <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {s.recursos.map(r => {
          const max = c.recursosMax[r.id], atual = d.recursos[r.id]?.atual ?? 0
          const calc = !!r.formula || r.maxFixo !== undefined
          const pct = max ? Math.max(0, Math.min(100, (atual / max) * 100)) : 0
          return <div key={r.id} className="rounded-xl bg-[#171325] p-3">
            <p className="text-sm font-semibold">{r.nome}</p>
            <div className="mt-2 flex items-center gap-2">
              <input type="number" aria-label={r.nome + ' atual'} value={atual} disabled={somenteLeitura} onChange={e => set('recursos', { ...d.recursos, [r.id]: { ...d.recursos[r.id], atual: Number(e.target.value) || 0 } })} className={input + ' w-20 text-center'} />
              <span>/</span>
              {calc ? <span className="text-lg font-bold">{max ?? '—'}</span>
                : <input type="number" aria-label={r.nome + ' máximo'} value={d.recursos[r.id]?.max ?? ''} disabled={somenteLeitura} onChange={e => set('recursos', { ...d.recursos, [r.id]: { ...d.recursos[r.id], atual, max: Number(e.target.value) || 0 } })} className={input + ' w-20 text-center'} />}
            </div>
            {max ? <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#2b2140]"><div className="h-full bg-[#b06ad8] transition-all" style={{ width: pct + '%' }} /></div> : null}
          </div>
        })}
      </div>}
    </section>}

    {s.pericias && <section className={card}>
      <h2 className="mb-1 font-bold text-[#ed9cd8]">{s.pericias.titulo ?? 'Perícias'}</h2>
      {podeRolar && <p className="mb-3 text-xs text-[#a998bd]">Toque no valor para rolar.</p>}
      {[...grupos].map(([g, lista]) => <div key={g} className="mb-4">
        {g && <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#d3adf0]">{g}</h3>}
        <div className="grid gap-2 sm:grid-cols-2">
          {lista.map(p => <div key={p.id} className="flex items-center gap-2 rounded-lg bg-[#171325] px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-sm">{p.nome}{p.atributo && <span className="ml-1 text-[10px] text-[#a998bd]">({p.atributo})</span>}</span>
            {s.pericias!.modo === 'valor'
              ? <input type="number" aria-label={p.nome} min={0} max={200} value={d.pericias[p.id] ?? 0} disabled={somenteLeitura} onChange={e => set('pericias', { ...d.pericias, [p.id]: Number(e.target.value) || 0 })} className={input + ' w-16 text-center'} />
              : <select aria-label={'Treino em ' + p.nome} value={String(d.pericias[p.id] ?? '')} disabled={somenteLeitura} onChange={e => set('pericias', { ...d.pericias, [p.id]: e.target.value })} className="max-w-[9.5rem] rounded-lg border border-[#5e4b78] bg-[#151123] p-1 text-xs text-white">
                {s.pericias!.treinos!.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}</select>}
            <button type="button" disabled={!podeRolar} onClick={() => rolar(p.nome, c.pericias[p.id])} aria-label={'Rolar ' + p.nome}
              className="w-14 shrink-0 rounded-lg bg-[#34294f] py-1 text-center font-bold tabular-nums hover:bg-[#4b3a6e] disabled:cursor-default disabled:hover:bg-[#34294f]">
              {s.pericias!.modo === 'valor' ? (c.pericias[p.id] ?? 0) + '%' : sinal(c.pericias[p.id])}</button>
          </div>)}
        </div>
      </div>)}
    </section>}

    {d20 && s.atributos.length > 0 && <section className={card}>
      <h2 className="mb-2 flex items-center gap-2 font-bold text-[#ed9cd8]"><Dice5 size={18} /> Teste de atributo</h2>
      <div className="flex flex-wrap gap-2">{s.atributos.map(a => <button key={a.id} type="button" onClick={() => rolar(a.nome, s.formulaModificador ? c.mods[a.id] : c.vars[a.id])}
        className="rounded-lg border border-[#5e4b78] px-3 py-2 text-sm hover:bg-[#34294f]">{a.id} {sinal(s.formulaModificador ? c.mods[a.id] : c.vars[a.id])}</button>)}</div>
    </section>}

    <section className="grid gap-4 lg:grid-cols-2">
      {s.listas.map(l => <label key={l.id} className={card + ' block'}>
        <span className="font-bold text-[#ed9cd8]">{l.nome}</span>
        <textarea rows={6} value={d.listas[l.id] ?? ''} disabled={somenteLeitura} maxLength={20000} onChange={e => set('listas', { ...d.listas, [l.id]: e.target.value })} className={input + ' mt-2'} />
      </label>)}
    </section>

    {(s.observacoes?.length || s.creditos) && <section className={card + ' text-xs text-[#bfb2cf]'}>
      {s.observacoes?.map(o => <p key={o} className="mb-2 flex gap-2"><Info size={14} className="mt-0.5 shrink-0" /> {o}</p>)}
      {s.creditos && <p className="mt-2 border-t border-[#3d3152] pt-2 text-[11px] leading-relaxed text-[#9d8db0]">{s.creditos}</p>}
    </section>}
  </div>
}
