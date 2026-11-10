'use client'

import { useState } from 'react'
import { BookOpen, Loader2, X } from 'lucide-react'
import { GRUPOS_SISTEMA, criarEAbrirFicha } from '@/lib/sistemas/criar'
import { useOpcoesSistema } from '@/lib/sistemas/cliente'

/** Janela para escolher o sistema antes de criar uma ficha. */
export default function EscolherSistema({ aventureiroId, onFechar }: { aventureiroId: string; onFechar: () => void }) {
  const [criando, setCriando] = useState('')
  const [erro, setErro] = useState('')
  const { opcoes } = useOpcoesSistema()
  async function criar(id: string) {
    setCriando(id); setErro('')
    try { await criarEAbrirFicha(id, aventureiroId) } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível criar a ficha.'); setCriando('') }
  }
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center" role="dialog" aria-modal="true" aria-label="Escolha o sistema da ficha">
    <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#6d5690] bg-[#1b1529] p-5">
      <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Qual sistema?</h2>
        <button type="button" onClick={onFechar} aria-label="Fechar" className="rounded-lg p-2 hover:bg-[#38294d]"><X size={20} /></button></div>
      <p className="mt-1 text-sm text-[#c4b6d4]">Escolha o sistema de RPG do novo personagem.</p>
      {erro && <p role="alert" className="mt-3 text-sm text-red-200">{erro}</p>}
      {GRUPOS_SISTEMA.map(g => <section key={g.id} className="mt-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#d3adf0]">{g.nome}</h3>
        <ul className="mt-2 space-y-2">{opcoes.filter(o => o.grupo === g.id).map(o => <li key={o.id}>
          <button type="button" disabled={!!criando} onClick={() => criar(o.id)} className="flex w-full items-center gap-3 rounded-xl border border-[#55456e] bg-[#201a32] p-3 text-left hover:border-[#b79aff] disabled:opacity-60">
            {criando === o.id ? <Loader2 className="animate-spin text-[#c5a7ff]" size={20} /> : <BookOpen className="text-[#c5a7ff]" size={20} />}
            <span className="text-sm font-semibold">{o.nome}</span>
          </button></li>)}</ul>
      </section>)}
    </div>
  </div>
}
