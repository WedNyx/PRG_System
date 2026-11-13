'use client'

/** Conferência da ficha (v0.33.6): o que falta e o que passou do limite. Não muda nada. D&D usa a própria. */
import { useMemo, useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import type { DadosFicha, Sistema } from '@/lib/sistemas/tipos'
import type { Calculo } from '@/lib/sistemas/calculo'
import { conferirFichaDnd } from '@/lib/sistemas/dnd2024Mestre'
import { conferirFichaGenerica } from '@/lib/sistemas/conferencia'
import { ListaConferencia } from '@/components/mestre/FerramentasDnd'

export default function ConferenciaFicha({ s, d, c, efeitos, ir }: { s: Sistema; d: DadosFicha; c: Calculo; efeitos: boolean; ir: (aba: string) => void }) {
  const itens = useMemo(() => s.id === 'dnd5e-srd' ? conferirFichaDnd(d, c, { efeitos }) : conferirFichaGenerica(s, d, c), [s, d, c, efeitos])
  const erros = itens.filter(x => x.tipo === 'erro').length, avisos = itens.filter(x => x.tipo === 'aviso').length
  const [aberta, setAberta] = useState(false)
  return <section aria-label="Conferência da ficha" className="rounded-2xl border border-(--a-55456e) bg-(--s-201a32) p-3 sm:p-4">
    <button type="button" aria-expanded={aberta} onClick={() => setAberta(a => !a)} className="flex w-full items-center gap-2 text-left">
      <ClipboardCheck size={18} className="shrink-0 text-(--a-ed9cd8)" aria-hidden />
      <span className="flex-1 font-semibold">Conferência da ficha</span>
      <span className={'rounded-full px-2 py-0.5 text-xs ' + (erros ? 'bg-red-950/70 text-red-200' : avisos ? 'bg-amber-950/70 text-amber-200' : 'bg-emerald-950/70 text-emerald-200')}>
        {erros ? `${erros} a corrigir` : avisos ? `${avisos} aviso${avisos === 1 ? '' : 's'}` : '✔ pronta'}</span>
      <span className="text-xs text-(--a-a998bd)">{aberta ? 'Fechar' : 'Ver'}</span>
    </button>
    {aberta && <ListaConferencia itens={itens} irPara={ir} />}
  </section>
}
