'use client'

import { resultadoAssim, somar } from '@/lib/sistemas/assimilacao'
import { FundoDado, Simbolo } from '@/components/fichas/IconesAssimilacao'

/** Rolagem de Assimilação no chat/histórico: cada dado com os símbolos e o total (dos melhores mantidos, ou de todos). */
export default function RolagemAssim({ expressao, resultados, manter = 1, todos = false, compacto = false }: {
  expressao: string; resultados: number[]; manter?: number; todos?: boolean; compacto?: boolean
}) {
  const r = resultadoAssim(expressao, resultados, manter)
  if (!r.dados.length) return null
  const t = todos ? somar(r.dados.map(d => d.face)) : r.total
  const tam = compacto ? 'h-9 w-9' : 'h-11 w-11'
  return <div className="mt-1 space-y-1">
    <div className="flex flex-wrap gap-1">{r.dados.map((d, i) => { const vale = todos || r.mantidos.includes(i)
      return <span key={i} title={`d${d.lados}: ${d.valor}`} className={'relative flex flex-col items-center justify-center ' + tam + (vale ? '' : ' opacity-45 saturate-50')}>
        <FundoDado lados={d.lados} />
        <span className="relative z-10 flex flex-wrap justify-center">{!d.face.a && !d.face.b && !d.face.c ? <span className="text-[9px] text-white/70">—</span>
          : <>{Array.from({ length: d.face.a }, (_, k) => <Simbolo key={'a' + k} tipo="a" tamanho={11} />)}{Array.from({ length: d.face.b }, (_, k) => <Simbolo key={'b' + k} tipo="b" tamanho={11} />)}{Array.from({ length: d.face.c }, (_, k) => <Simbolo key={'c' + k} tipo="c" tamanho={11} />)}</>}</span>
        <span className="relative z-10 text-[8px] text-white/75">d{d.lados}</span>
      </span> })}</div>
    <p className="flex flex-wrap items-center gap-x-2 text-xs">
      <span className="text-(--a-c4b6d4)">{todos ? 'Todos os dados:' : r.mantidos.length > 1 ? `Os ${r.mantidos.length} melhores:` : 'O melhor dado:'}</span>
      <span className="inline-flex items-center gap-0.5 text-emerald-300"><Simbolo tipo="a" tamanho={12} /> {t.a}</span>
      <span className="inline-flex items-center gap-0.5 text-sky-300"><Simbolo tipo="b" tamanho={12} /> {t.b}</span>
      <span className="inline-flex items-center gap-0.5 text-rose-300"><Simbolo tipo="c" tamanho={12} /> {t.c}</span>
    </p>
  </div>
}

/** Lê o marcador de rolagem de Assimilação guardado no evento. */
export const marcaAssim = (dados: unknown): { manter: number; todos?: boolean } | null => {
  const a = (dados as { assimilacao?: { manter?: unknown; todos?: unknown } } | null | undefined)?.assimilacao
  return a ? { manter: Math.max(1, Math.min(4, Number(a.manter) || 1)), ...(a.todos === true ? { todos: true } : {}) } : null
}
