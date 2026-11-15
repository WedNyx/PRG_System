'use client'

import type { AtributoDef } from '@/lib/sistemas/tipos'
import { limiteSomaAtributosOrdem, POSICOES_HEXAGONOS_ORDEM, somaAtributosOrdem } from '@/lib/sistemas/ordemCriacao'

const HEXAGONO = 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)'

/**
 * Cinco hexágonos em uma disposição circular, exclusiva de Ordem Paranormal.
 * Inputs reais e rotulados: navegação por teclado, leitor de tela e edição móvel.
 */
export default function AtributosOrdem({ atributos, valores, nex, somenteLeitura, onChange }: {
  atributos: AtributoDef[]
  valores: Record<string, number>
  nex: number
  somenteLeitura: boolean
  onChange: (id: string, valor: number) => void
}) {
  const soma = somaAtributosOrdem(valores)
  const limite = limiteSomaAtributosOrdem(nex)

  return <div className="space-y-3">
    <div role="group" aria-label="Cinco atributos de Ordem Paranormal" className="mx-auto grid aspect-square w-full max-w-[380px] grid-cols-3 grid-rows-3 place-items-center gap-1 sm:gap-2">
      {atributos.map(a => <div key={a.id} className={`relative aspect-square w-full min-w-0 max-w-[120px] ${POSICOES_HEXAGONOS_ORDEM[a.id] ?? ''}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-violet-300 via-fuchsia-500 to-violet-800" style={{ clipPath: HEXAGONO }} aria-hidden="true" />
        <div className="absolute inset-[2px] flex flex-col items-center justify-center bg-[#21152f] px-2 text-white" style={{ clipPath: HEXAGONO }}>
          <label htmlFor={`ordem-atributo-${a.id}`} className="text-[10px] font-bold tracking-widest text-violet-200 sm:text-xs">{a.id}</label>
          <input id={`ordem-atributo-${a.id}`} type="number" inputMode="numeric"
            aria-label={`${a.nome} (${a.id})`} min={a.min} max={a.max} step={1}
            value={valores[a.id] ?? a.padrao} disabled={somenteLeitura}
            onChange={e => onChange(a.id, Math.max(a.min, Math.min(a.max, Math.trunc(Number(e.target.value) || 0))))}
            className="w-full max-w-14 bg-transparent text-center text-xl font-black text-white outline-offset-2 outline-violet-300 sm:text-2xl disabled:opacity-70"
          />
          <span className="max-w-full truncate text-[9px] text-violet-200 sm:text-[10px]" title={a.nome}>{a.nome}</span>
        </div>
      </div>)}
      <div className="col-start-2 row-start-2 flex h-full w-full flex-col items-center justify-center text-center" aria-hidden="true">
        <span className="text-[9px] font-bold uppercase tracking-widest text-violet-300 sm:text-xs">Atributos</span>
        <span className="text-xs text-violet-100">NEX {nex}%</span>
      </div>
    </div>
    <p role="status" aria-live="polite" className={`text-center text-xs ${soma > limite ? 'text-amber-300' : 'text-violet-200'}`}>
      Total de atributos: <strong>{soma}</strong> / {limite} (limite básico para este NEX).
      {soma > limite ? ' Revise a distribuição.' : ''}
    </p>
    <p className="text-center text-xs text-(--a-a998bd)">
      Os botões de rolagem e as perícias permanecem abaixo; alterar um hexágono atualiza a ficha normalmente.
    </p>
  </div>
}
