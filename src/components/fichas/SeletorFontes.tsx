'use client'

/** Mestre: quais livros a campanha de D&D usa (v0.33.6). Livros comerciais entram só como nome. */
import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { FONTES_DND, FONTE_SRD } from '@/lib/sistemas/dnd2024Fontes'

type Props = { fontes: string[]; extras: string[]; onChange: (fontes: string[], extras: string[]) => void }

export default function SeletorFontes({ fontes, extras, onChange }: Props) {
  const [novo, setNovo] = useState('')
  const marcar = (id: string, on: boolean) => onChange(on ? [...new Set([...fontes, id])] : fontes.filter(x => x !== id), extras)
  const adicionar = () => { const n = novo.trim().slice(0, 60); if (n && extras.length < 10 && !extras.includes(n)) onChange(fontes, [...extras, n]); setNovo('') }
  return <fieldset className="space-y-2 rounded-2xl border border-(--a-55456e) p-4">
    <legend className="px-1 font-semibold text-white">Livros e fontes da campanha</legend>
    <p className="text-xs text-(--a-c4b6d4)">O SRD vem com as regras na plataforma. Livros comerciais aparecem só pelo nome: a ficha registra a escolha (subclasse, espécie, antecedente) e cada jogador consulta o livro.</p>
    {FONTES_DND.map(f => { const sempre = f.id === FONTE_SRD; const on = sempre || fontes.includes(f.id)
      return <label key={f.id} className={'flex items-start gap-3 rounded-xl border p-3 ' + (on ? 'border-(--a-b79aff) bg-(--s-2b2140)' : 'border-(--a-55456e)')}>
        <input type="checkbox" className="mt-1" checked={on} disabled={sempre} onChange={e => marcar(f.id, e.target.checked)} />
        <span><strong className="block text-sm text-white">{f.nome} {f.tipo === 'comercial' ? '📕' : '📗'}</strong>
          <span className="block text-[11px] text-(--a-a998bd)">{f.original}{sempre ? ' · sempre liberado' : ''}</span>
          <span className="text-xs text-(--a-c4b6d4)">{f.traz}</span></span>
      </label> })}
    <div className="space-y-2 pt-1">
      <p className="text-sm font-medium">Outros suplementos (só o nome, para o grupo saber)</p>
      {extras.length > 0 && <ul className="flex flex-wrap gap-1.5">{extras.map(x => <li key={x} className="inline-flex items-center gap-1 rounded-full border border-(--a-5e4b78) px-2.5 py-1 text-xs">{x}
        <button type="button" aria-label={'Tirar ' + x} onClick={() => onChange(fontes, extras.filter(y => y !== x))} className="rounded-full p-0.5 hover:bg-(--s-2b2140)"><X size={12} /></button></li>)}</ul>}
      {extras.length < 10 && <div className="flex gap-2">
        <input value={novo} maxLength={60} onChange={e => setNovo(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); adicionar() } }} placeholder="Ex.: Aventura do grupo, suplemento caseiro…"
          className="min-w-0 flex-1 rounded-xl border border-(--a-70588c) bg-(--s-151123) p-2 text-sm text-white" />
        <button type="button" onClick={adicionar} disabled={!novo.trim()} className="inline-flex items-center gap-1 rounded-xl border border-(--a-70588c) px-3 text-sm disabled:opacity-40"><Plus size={14} /> Pôr</button>
      </div>}
    </div>
  </fieldset>
}
