'use client'

/** Seletor das 38 armas do SRD D&D 2024. Apenas adiciona itens ao inventário. */
import { useState } from 'react'
import { Search, Swords, X } from 'lucide-react'
import NaTela from '@/components/NaTela'
import { ARMAS_DND_2024, pesoEmKgArmaDnd, type ArmaDnd2024, type GrupoArmaDnd } from '@/lib/sistemas/dnd2024Armas'

type Props = { adicionar: (arma: ArmaDnd2024) => void; fechar: () => void }
const categorias: { id: GrupoArmaDnd | 'todas'; nome: string }[] = [
  { id: 'todas', nome: 'Todas (38)' },
  { id: 'simples-corpo', nome: 'Simples · corpo a corpo' },
  { id: 'simples-distancia', nome: 'Simples · distância' },
  { id: 'marcial-corpo', nome: 'Marciais · corpo a corpo' },
  { id: 'marcial-distancia', nome: 'Marciais · distância' },
]
const nomeGrupo = (g: GrupoArmaDnd) => categorias.find(c => c.id === g)?.nome ?? g
const limpar = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export default function CatalogoArmasDnd2024({ adicionar, fechar }: Props) {
  const [busca, setBusca] = useState('')
  const [grupo, setGrupo] = useState<GrupoArmaDnd | 'todas'>('todas')
  const visiveis = ARMAS_DND_2024.filter(a => (grupo === 'todas' || a.grupo === grupo) &&
    limpar([a.nome, a.tipo, a.maestria, ...a.propriedades].join(' ')).includes(limpar(busca.trim())))
  return <NaTela>
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/75 p-2 sm:p-4"
      onMouseDown={e => { if (e.target === e.currentTarget) fechar() }}>
      <section role="dialog" aria-modal="true" aria-label="Catálogo de armas D&D 2024"
        className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-(--a-62527e) bg-(--s-201a32) text-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-(--a-55456e) p-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold"><Swords size={20} /> Catálogo de Armas · D&D 2024</h2>
            <p className="mt-1 text-xs text-(--a-c4b6d4)">As 38 armas da tabela básica do SRD 5.2.1. Escolha uma para adicionar à ficha.</p>
          </div>
          <button type="button" onClick={fechar} aria-label="Fechar catálogo" className="rounded-lg p-2 hover:bg-(--s-34294f)"><X size={18} /></button>
        </header>
        <div className="space-y-3 border-b border-(--a-55456e) px-4 py-3">
          <label className="flex items-center gap-2 rounded-lg border border-(--a-5e4b78) bg-(--s-151123) px-3">
            <Search size={16} className="shrink-0 text-(--a-c4b6d4)" />
            <input autoFocus type="search" placeholder="Buscar por nome, tipo, propriedade ou maestria"
              value={busca} onChange={e => setBusca(e.target.value)} className="w-full bg-transparent py-2.5 text-sm outline-none" />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categorias.map(c => <button type="button" key={c.id} onClick={() => setGrupo(c.id)}
              aria-pressed={grupo === c.id} className={'shrink-0 rounded-full border px-3 py-1.5 text-xs ' +
                (grupo === c.id ? 'border-(--a-b99bff) bg-(--s-3a2c58)' : 'border-(--a-62527e) hover:bg-(--s-34294f)')}>
              {c.nome}
            </button>)}
          </div>
        </div>
        <div className="overflow-y-auto px-4 py-3">
          <p className="mb-3 text-xs text-(--a-c4b6d4)">{visiveis.length} arma(s) encontrada(s)</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {visiveis.map(a => <li key={a.id} className="rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <strong className="text-sm">{a.nome}</strong>
                  <p className="mt-0.5 text-[11px] text-(--a-c4b6d4)">{nomeGrupo(a.grupo)} · {a.preco} · {pesoEmKgArmaDnd(a).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} kg</p>
                </div>
                <span className="shrink-0 rounded-md border border-(--a-8b6cba) px-2 py-1 text-xs font-semibold">{a.dano} {a.tipo}</span>
              </div>
              <p className="mt-2 text-xs text-(--a-cfc0df)">{a.propriedades.join(' · ') || 'Sem propriedades'}
                {a.versatil ? ' · Versátil: ' + a.versatil : ''}
                {a.alcancePes ? ' · Alcance: ' + a.alcancePes.join('/') + ' pés' : ''}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-xs text-(--a-d3adf0)">Maestria: {a.maestria}</span>
                <button type="button" className="rounded-lg border border-(--a-b99bff) bg-(--s-2b2140) px-3 py-1.5 text-xs font-semibold hover:bg-(--s-34294f)"
                  onClick={() => adicionar(a)}>Adicionar à ficha</button>
              </div>
            </li>)}
          </ul>
          {visiveis.length === 0 && <p className="rounded-lg border border-dashed border-(--a-62527e) p-4 text-sm text-(--a-c4b6d4)">Nenhuma arma encontrada. Tente outro nome ou categoria.</p>}
        </div>
        <footer className="border-t border-(--a-55456e) px-4 py-3 text-[11px] text-(--a-c4b6d4)">
          Maestrias são exibidas para consulta; sua aplicação exige a característica de classe adequada. Efeitos especiais são resolvidos com o mestre.
        </footer>
      </section>
    </div>
  </NaTela>
}
