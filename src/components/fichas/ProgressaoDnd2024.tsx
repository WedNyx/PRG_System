'use client'

import { useMemo, useState } from 'react'
import { CLASSES_SRD } from '@/lib/sistemas/dnd2024Srd'
import { progressaoVisivel, type MarcoDnd, type ProgressoDnd } from '@/lib/sistemas/dnd2024Progressao'
import { permissoesDoModo, type ModoProgressao } from '@/lib/sistemas/modoProgressao'

type Props = {
  marcos: MarcoDnd[]
  ficha: ProgressoDnd
  modo: ModoProgressao
  somenteLeitura?: boolean
  /** Salvar no estado persistido da ficha; o componente nunca salva por conta própria. */
  onEscolha?: (marcoId: string, opcaoId: string) => void
}

/** Progressão oficial em leitura guiada. Não compra nós nem altera a árvore manual. */
export default function ProgressaoDnd2024({ marcos, ficha, modo, somenteLeitura = false, onEscolha }: Props) {
  const regras = permissoesDoModo(modo)
  const visiveis = useMemo(() => progressaoVisivel(marcos, ficha), [marcos, ficha])
  const [verFuturas, setVerFuturas] = useState(false)
  const pendentes = visiveis.filter(m => m.estado === 'escolher' || m.estado === 'pendente').length
  const futuras = visiveis.filter(m => m.estado === 'futuro')
  const mostrar = verFuturas ? visiveis : visiveis.filter(m => m.estado !== 'futuro')
  // Linha da tabela da classe no nível atual (Fúrias, Truques, Espaços de magia…).
  const tabela = Object.entries(ficha.nivelPorClasse).flatMap(([id, nivel]) => {
    const c = CLASSES_SRD.find(x => x.id === id)
    return c ? [{ nome: c.nome, nivel, valores: Object.entries(c.colunas).map(([col, v]) => [col, v[Math.max(1, Math.min(20, nivel)) - 1]] as const).filter(([, v]) => v && v !== '—') }] : []
  })
  const grupos = mostrar.reduce<Map<number, typeof mostrar>>((g, m) => g.set(m.nivel, [...(g.get(m.nivel) ?? []), m]), new Map())
  if (!regras.mostrarProgressaoOficial) {
    return <p className="rounded-xl border border-(--a-55456e) p-4 text-sm text-(--a-c4b6d4)">
      Modo manual: o mestre administra a árvore personalizada. A progressão oficial não é aplicada automaticamente.
    </p>
  }
  return <section aria-label="Progressão oficial de D&D 2024" className="space-y-3 rounded-2xl border border-(--a-55456e) p-4">
    <div>
      <h3 className="font-semibold text-white">Progressão oficial · D&D 2024</h3>
      <p className="text-xs text-(--a-b4aeca)">
        {modo === 'hibrido' ? 'Modo híbrido: marcos oficiais e personalizações do mestre coexistem.' : 'Modo automático: progressão conforme a ficha.'}
      </p>
    </div>
    {pendentes > 0 && <p role="status" className="rounded-lg border border-amber-500/50 bg-amber-950/40 p-2 text-sm text-amber-100">✋ {pendentes} {pendentes === 1 ? 'escolha pendente' : 'escolhas pendentes'} até o seu nível.</p>}
    {tabela.map(t => t.valores.length > 0 && <div key={t.nome} className="rounded-xl border border-(--a-55456e) bg-(--s-151123) p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-(--a-d3adf0)">Tabela de {t.nome} · nível {t.nivel}</p>
      <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-sm sm:grid-cols-3">{t.valores.map(([k, v]) => <div key={k} className="flex justify-between gap-2"><dt className="text-(--a-c4b6d4)">{k}</dt><dd className="font-semibold tabular-nums">{v}</dd></div>)}</dl>
    </div>)}
    {!visiveis.length && <p className="text-sm text-(--a-b4aeca)">Escolha classe, espécie e antecedente na aba Principal para ver a progressão.</p>}
    {[...grupos].map(([nivel, lista]) => <div key={nivel}>
      <h4 className="mb-1.5 mt-3 text-xs font-semibold uppercase tracking-wider text-(--a-d3adf0)">Nível {nivel}</h4>
    <ol className="space-y-2">
      {lista.map(m => <li key={m.id} className={'rounded-xl border' + (m.estado === 'futuro' ? ' opacity-60' : '') + ' border-(--a-55456e) bg-(--s-171325) p-3'}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <strong className="text-sm text-white">{m.nome}</strong>
          <span className={'rounded-full px-2 py-0.5 text-xs ' + (m.estado === 'adquirido' ? 'bg-emerald-950/70 text-emerald-200' : m.estado === 'escolher' ? 'bg-amber-950/70 text-amber-200' : m.estado === 'pendente' ? 'bg-red-950/70 text-red-200' : 'bg-(--s-2b2140) text-(--a-c4b6d4)')}>{m.origem === 'especie' ? 'Espécie' : m.origem === 'antecedente' ? 'Antecedente' : m.origem === 'subclasse' ? 'Subclasse' : 'Classe'} · {m.estado === 'adquirido' ? '✔ Adquirida' : m.estado === 'escolher' ? '✋ Escolha pendente' : m.estado === 'pendente' ? '⚠ Escolha inválida' : 'Futura'}</span>
        </div>
        {m.descricao && <p className="mt-1 text-sm text-(--a-d1c4df)">{m.descricao}</p>}
        {m.modo === 'escolha' && m.estado !== 'futuro' && <label className="mt-2 block text-xs text-(--a-d6c8f0)">
          Opção
          <select className="mt-1 w-full rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-white"
            value={m.escolha ?? ''} disabled={somenteLeitura || !onEscolha}
            onChange={e => onEscolha?.(m.id, e.target.value)}>
            <option value="">Selecione...</option>
            {m.opcoes?.map(op => <option key={op.id} value={op.id}>{op.nome}</option>)}
          </select>
        </label>}
      </li>)}
    </ol></div>)}
    {futuras.length > 0 && <button type="button" onClick={() => setVerFuturas(v => !v)} className="w-full rounded-xl border border-dashed border-(--a-6d5690) p-2 text-sm text-(--a-d6c8f0) hover:bg-(--s-2b2140)">{verFuturas ? 'Esconder os próximos níveis' : `Ver os próximos níveis (${futuras.length})`}</button>}
    <p className="text-[11px] text-(--a-a998bd)">Fonte: SRD 5.2.1 (CC BY 4.0). Resumos próprios; o texto completo fica no SRD. Automático: salvaguardas da classe, perícias do antecedente e das escolhas, recursos da tabela (fúrias, foco, espaços de magia…), Defesa sem Armadura, Iniciativa com Alerta e deslocamento. À mão: aumentos de atributo, magias escolhidas e equipamento.</p>
  </section>
}
