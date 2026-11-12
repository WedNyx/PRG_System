'use client'

/**
 * Classes e multiclasse de D&D 2024 (v0.33.6). “+” sobe um nível do personagem naquela classe;
 * o nível total (aba Principal) é a soma. Regras do SRD 5.2.1 (CC BY 4.0).
 */
import { useState } from 'react'
import { Minus, Plus, Users } from 'lucide-react'
import type { DadosFicha } from '@/lib/sistemas/tipos'
import { CLASSES_SRD } from '@/lib/sistemas/dnd2024Srd'
import { AO_ENTRAR, classesDaFicha, espacosDeMagia, requisitosMulticlasse } from '@/lib/sistemas/dnd2024Classes'

const btn = 'inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg border border-(--a-5e4b78) px-2 text-sm hover:bg-(--s-34294f) disabled:opacity-40'

export default function MulticlasseDnd2024({ d, onChange, somenteLeitura = false }: { d: DadosFicha; onChange: (d: DadosFicha) => void; somenteLeitura?: boolean }) {
  const { total, lista, outras } = classesDaFicha(d)
  const [nova, setNova] = useState('')
  const principal = lista.find(c => c.principal)
  if (!principal) return null
  const esp = espacosDeMagia(lista)
  const livres = CLASSES_SRD.filter(c => !lista.some(x => x.cls.id === c.id))
  const faltas = nova ? requisitosMulticlasse(d.atributos, [...lista.map(c => c.cls.id), nova]) : []
  const cheio = total >= 20

  function mudar(id: string | null, delta: 1 | -1) {
    const novas = { ...outras }
    if (id) { const n = (novas[id] ?? 0) + delta; if (n > 0) novas[id] = n; else delete novas[id] }
    onChange({ ...d, campos: { ...d.campos, nivel: total + delta }, dndMulticlasse: novas })
  }

  return <section aria-label="Classes e multiclasse" className="space-y-3 rounded-2xl border border-(--a-55456e) bg-(--s-201a32) p-4">
    <div>
      <h3 className="flex items-center gap-2 font-semibold text-white"><Users size={18} aria-hidden /> Classes · nível total {total}</h3>
      <p className="text-xs text-(--a-b4aeca)">“+” sobe um nível do personagem naquela classe. A proficiência usa o nível total; as características, o nível de cada classe.</p>
    </div>
    <ul className="space-y-2">
      {lista.map(c => <li key={c.cls.id} className="flex items-center gap-2 rounded-xl border border-(--a-3d3152) bg-(--s-171325)/70 px-3 py-2">
        <span className="min-w-0 flex-1"><strong className="text-white">{c.cls.nome}</strong> <span className="text-sm text-(--a-c4b6d4)">nível {c.nivel}</span>
          {c.principal && <span className="ml-1.5 rounded bg-(--s-2b2140) px-1.5 text-[11px] text-(--a-d3adf0)">inicial</span>}
          <span className="block text-[11px] text-(--a-a998bd)">d{c.cls.dv} de vida{c.principal ? ' · salvaguardas desta classe' : ''}</span></span>
        {!somenteLeitura && <>
          {!c.principal && <button type="button" onClick={() => mudar(c.cls.id, -1)} aria-label={'Tirar um nível de ' + c.cls.nome} className={btn}><Minus size={16} /></button>}
          <button type="button" disabled={cheio} onClick={() => mudar(c.principal ? null : c.cls.id, 1)} aria-label={'Subir um nível em ' + c.cls.nome} className={btn}><Plus size={16} /></button>
        </>}
      </li>)}
    </ul>
    {esp.multiclasse && <p className="text-xs text-(--a-c4b6d4)">Conjurador multiclasse nível {esp.nivelConjurador}: espaços {esp.espacos.slice(1).filter(Boolean).map((q, i) => `${q}×${i + 1}º`).join(', ')}. Cada classe prepara magias como se fosse única.</p>}
    {!somenteLeitura && !cheio && <div className="space-y-2 rounded-xl border border-dashed border-(--a-55456e) p-3">
      <label className="flex flex-wrap items-center gap-2 text-sm">Multiclasse: pegar o 1º nível em
        <select value={nova} onChange={e => setNova(e.target.value)} className="rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-white">
          <option value="">escolha a classe…</option>{livres.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
      {nova && <>
        <p className="text-xs text-(--a-c4b6d4)">Ao entrar ganha: {AO_ENTRAR[nova]} E as características de 1º nível da classe.</p>
        {faltas.length > 0 && <p className="text-xs text-amber-200">Faltam requisitos (13 no atributo principal): {faltas.join('; ')}. Só o mestre consegue liberar mesmo assim.</p>}
        <button type="button" onClick={() => { mudar(nova, 1); setNova('') }} className={btn + ' border-(--a-8b6cba) px-3 font-semibold text-white'}><Plus size={16} aria-hidden /> Subir de nível como {CLASSES_SRD.find(c => c.id === nova)?.nome}</button>
      </>}
    </div>}
    {lista.length > 1 && <p className="text-[11px] text-(--a-8f84a6)">PV: os níveis das outras classes usam a média do dado delas (já nos PV sugeridos). Ataque Extra de duas classes não soma, e só uma Defesa sem Armadura vale por vez.</p>}
  </section>
}
