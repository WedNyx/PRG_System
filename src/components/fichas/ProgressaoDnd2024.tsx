'use client'

import { useMemo } from 'react'
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
    {!visiveis.length && <p className="text-sm text-(--a-b4aeca)">Nenhuma característica catalogada para as escolhas atuais.</p>}
    <ol className="space-y-2">
      {visiveis.map(m => <li key={m.id} className={'rounded-xl border' + (m.estado === 'futuro' ? ' opacity-60' : '') + ' border-(--a-55456e) bg-(--s-171325) p-3'}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <strong className="text-sm text-white">{m.nome}</strong>
          <span className={'rounded-full px-2 py-0.5 text-xs ' + (m.estado === 'adquirido' ? 'bg-emerald-950/70 text-emerald-200' : m.estado === 'escolher' ? 'bg-amber-950/70 text-amber-200' : m.estado === 'pendente' ? 'bg-red-950/70 text-red-200' : 'bg-(--s-2b2140) text-(--a-c4b6d4)')}>Nível {m.nivel} · {m.estado === 'adquirido' ? '✔ Adquirida' : m.estado === 'escolher' ? '✋ Escolha pendente' : m.estado === 'pendente' ? '⚠ Escolha inválida' : 'Futura'}</span>
        </div>
        {m.descricao && <p className="mt-1 text-sm text-(--a-d1c4df)">{m.descricao}</p>}
        <p className="mt-1 text-xs text-(--a-a998bd)">Fonte: {m.fonte}</p>
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
    </ol>
  </section>
}
