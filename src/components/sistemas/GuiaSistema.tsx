import { CheckCircle2, Lightbulb, ListOrdered } from 'lucide-react'
import { GUIAS } from '@/lib/sistemas/guias'

/** “Guia do mestre”: como criar a ficha neste sistema e o que a plataforma calcula sozinha. */
export default function GuiaSistema({ sistemaId, compacto = false }: { sistemaId: string; compacto?: boolean }) {
  const g = GUIAS[sistemaId]
  if (!g) return <p className="text-sm text-[#bfb2cf]">Este sistema ainda não tem guia.</p>
  const titulo = compacto ? 'text-sm font-semibold' : 'font-bold text-[#ed9cd8]'
  return <div className={'space-y-4 text-sm leading-relaxed ' + (compacto ? '' : 'rounded-2xl border border-[#55456e] bg-[#201a32] p-4 sm:p-5')}>
    <section>
      <h3 className={'mb-2 flex items-center gap-2 ' + titulo}><ListOrdered size={16} aria-hidden="true" /> Como criar a ficha</h3>
      <ol className="list-decimal space-y-1.5 pl-5 text-[#ddd0ec]">{g.passos.map(p => <li key={p}>{p}</li>)}</ol>
    </section>
    <section>
      <h3 className={'mb-2 flex items-center gap-2 ' + titulo}><CheckCircle2 size={16} aria-hidden="true" /> A ficha calcula sozinha</h3>
      <ul className="space-y-1 text-[#c9bcd9]">{g.automatico.map(a => <li key={a} className="flex gap-2"><span aria-hidden="true">✓</span>{a}</li>)}</ul>
    </section>
    <section>
      <h3 className={'mb-2 flex items-center gap-2 ' + titulo}><Lightbulb size={16} aria-hidden="true" /> Dicas para o mestre</h3>
      <ul className="space-y-1 text-[#c9bcd9]">{g.dicas.map(a => <li key={a} className="flex gap-2"><span aria-hidden="true">•</span>{a}</li>)}</ul>
    </section>
  </div>
}
