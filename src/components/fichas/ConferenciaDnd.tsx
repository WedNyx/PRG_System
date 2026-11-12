'use client'

/** Conferência da ficha de D&D 2024 (v0.33.6): o que falta e o que passou do limite. Não muda nada. */
import { useMemo, useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import type { DadosFicha } from '@/lib/sistemas/tipos'
import type { Calculo } from '@/lib/sistemas/calculo'
import { conferirFichaDnd } from '@/lib/sistemas/dnd2024Mestre'
import { ListaConferencia } from '@/components/mestre/FerramentasDnd'

export default function ConferenciaDnd({ d, c, efeitos, ir }: { d: DadosFicha; c: Calculo; efeitos: boolean; ir: (aba: string) => void }) {
  const itens = useMemo(() => conferirFichaDnd(d, c, { efeitos }), [d, c, efeitos])
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
