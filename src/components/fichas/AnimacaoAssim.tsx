'use client'
import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { FundoDado, Simbolo } from './IconesAssimilacao'
import { FACES, type LadoAssim } from '@/lib/sistemas/assimilacao'

type Dado = { lados: LadoAssim; valor: number }
export default function AnimacaoAssim({ dados, fechar }: { dados: Dado[]; fechar: () => void }) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const inicio = performance.now()
    const timer = window.setInterval(() => setTick(Math.min(1, (performance.now()-inicio)/1400)), 40)
    const fim = window.setTimeout(fechar, 2100)
    return () => { clearInterval(timer); clearTimeout(fim) }
  }, [fechar])
  if (typeof document === 'undefined') return null
  return createPortal(<div role="dialog" aria-label="Rolagem de Assimilação" className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65" onClick={fechar}>
    <div className="flex max-w-[90vw] flex-wrap justify-center gap-4" style={{perspective: '650px'}}>
      {dados.slice(0,20).map((d,i) => {
        const face = FACES[d.lados][tick === 1 ? d.valor-1 : (Math.floor(tick*37)+i)%d.lados]
        const giro = (1-tick)*720
        return <div key={i} className="relative flex h-20 w-20 items-center justify-center" style={{transform: 'translateY('+(-Math.abs(Math.sin(tick*12+i))*55*(1-tick))+'px) rotateX('+giro+'deg) rotateY('+giro*1.5+'deg)',filter:'drop-shadow(0 8px 6px #0009)'}}>
          <FundoDado lados={d.lados}/>
          <span className="relative z-10 flex max-w-14 flex-wrap justify-center">{(['a','b','c'] as const).flatMap(tipo=>Array.from({length:face[tipo]},(_,k)=><Simbolo key={tipo+k} tipo={tipo} tamanho={19}/>))}</span>
        </div>
      })}
    </div>
    <button type="button" className="absolute bottom-12 rounded-lg bg-slate-800 px-4 py-2 text-white" onClick={fechar}>Fechar rolagem</button>
  </div>,document.body)
}
