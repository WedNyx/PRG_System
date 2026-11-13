import Link from 'next/link'
import { CheckCircle2, Lightbulb, ListOrdered, Wrench } from 'lucide-react'
import { GUIAS } from '@/lib/sistemas/guias'
import type { DadosFicha } from '@/lib/sistemas/tipos'
import GuiaCriacaoDnd2024 from './GuiaCriacaoDnd2024'

/** “Guia do mestre”: como criar a ficha neste sistema e o que a plataforma calcula sozinha. */
export default function GuiaSistema({ sistemaId, compacto = false, dados, irPara }: { sistemaId: string; compacto?: boolean; dados?: DadosFicha; irPara?: (aba: string) => void }) {
  const g = GUIAS[sistemaId]
  if (!g) return <p className="text-sm text-(--a-bfb2cf)">Este sistema ainda não tem guia.</p>
  const titulo = compacto ? 'text-sm font-semibold' : 'font-bold text-(--a-ed9cd8)'
  return <div className={'space-y-4 text-sm leading-relaxed ' + (compacto ? '' : 'rounded-2xl border border-(--a-55456e) bg-(--s-201a32) p-4 sm:p-5')}>
    {sistemaId === 'dnd5e-srd' && dados && <GuiaCriacaoDnd2024 dados={dados} irPara={irPara} />}
    {sistemaId === 'dnd5e-srd' && <Link href="/mestre/dnd" className="flex items-center gap-3 rounded-xl border border-(--a-b99bff)/60 bg-(--s-2b2140) p-3 hover:brightness-110">
      <Wrench size={20} className="shrink-0 text-amber-200" aria-hidden />
      <span className="min-w-0 flex-1"><strong className="block text-white">Ferramentas do mestre</strong><span className="text-xs text-(--a-cfc0df)">Montar encontros pelo XP, CDs, XP e níveis, condições e ações, conferir as fichas do grupo.</span></span>
      <span aria-hidden>→</span></Link>}
    <section>
      <h3 className={'mb-2 flex items-center gap-2 ' + titulo}><ListOrdered size={16} aria-hidden="true" /> Como criar a ficha</h3>
      <ol className="list-decimal space-y-1.5 pl-5 text-(--a-ddd0ec)">{g.passos.map(p => <li key={p}>{p}</li>)}</ol>
    </section>
    <section>
      <h3 className={'mb-2 flex items-center gap-2 ' + titulo}><CheckCircle2 size={16} aria-hidden="true" /> A ficha calcula sozinha</h3>
      <ul className="space-y-1 text-(--a-c9bcd9)">{g.automatico.map(a => <li key={a} className="flex gap-2"><span aria-hidden="true">✓</span>{a}</li>)}</ul>
    </section>
    <section>
      <h3 className={'mb-2 flex items-center gap-2 ' + titulo}><Lightbulb size={16} aria-hidden="true" /> Dicas para o mestre</h3>
      <ul className="space-y-1 text-(--a-c9bcd9)">{g.dicas.map(a => <li key={a} className="flex gap-2"><span aria-hidden="true">•</span>{a}</li>)}</ul>
    </section>
  </div>
}
