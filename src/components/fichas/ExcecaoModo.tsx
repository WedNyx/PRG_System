'use client'

/** Mestre: modo de progressão só desta ficha (exceção ao modo da campanha). v0.33.6 */
import { useState } from 'react'
import type { ModoProgressao } from '@/lib/sistemas/modoProgressao'

const NOME: Record<ModoProgressao, string> = { hibrido: 'Híbrido', automatico: 'Automático', manual: 'Manual' }
const DICA: Record<ModoProgressao, string> = {
  hibrido: 'progressão oficial + árvore do mestre',
  automatico: 'só a progressão oficial',
  manual: 'só a árvore do mestre, sem efeitos automáticos',
}

export default function ExcecaoModo({ campanha, atual, mudar }: { campanha: ModoProgressao; atual: ModoProgressao | null; mudar: (m: ModoProgressao | null) => void | Promise<void> }) {
  const [salvando, setSalvando] = useState(false)
  const valor = atual ?? ''
  return <section aria-label="Modo desta ficha" className="rounded-2xl border border-amber-300/30 bg-(--s-201a32) p-4">
    <label className="flex flex-wrap items-center gap-2 text-sm">
      <span className="font-semibold text-amber-100">👑 Modo desta ficha</span>
      <select value={valor} disabled={salvando} onChange={async e => { setSalvando(true); try { await mudar((e.target.value || null) as ModoProgressao | null) } finally { setSalvando(false) } }}
        className="rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-white">
        <option value="">Seguir a campanha ({NOME[campanha]})</option>
        {(Object.keys(NOME) as ModoProgressao[]).map(m => <option key={m} value={m}>Exceção: {NOME[m]}</option>)}
      </select>
    </label>
    <p className="mt-1 text-xs text-(--a-b4aeca)">{atual ? `Exceção ativa: ${NOME[atual]} (${DICA[atual]}). As outras fichas seguem o modo da campanha.` : `Esta ficha segue a campanha: ${NOME[campanha]} (${DICA[campanha]}). Só você, mestre, vê esta opção.`}</p>
  </section>
}
