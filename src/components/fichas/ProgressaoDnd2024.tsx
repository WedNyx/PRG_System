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
    return <p className="rounded-xl border border-white/15 p-4 text-sm text-white/70">
      Modo manual: o mestre administra a árvore personalizada. A progressão oficial não é aplicada automaticamente.
    </p>
  }
  return <section aria-label="Progressão oficial de D&D 2024" className="space-y-3 rounded-2xl border border-white/15 p-4">
    <div>
      <h3 className="font-semibold text-white">Progressão oficial · D&D 2024</h3>
      <p className="text-xs text-white/65">
        {modo === 'hibrido' ? 'Modo híbrido: marcos oficiais e personalizações do mestre coexistem.' : 'Modo automático: progressão conforme a ficha.'}
      </p>
    </div>
    {!visiveis.length && <p className="text-sm text-white/65">Nenhuma característica catalogada para as escolhas atuais.</p>}
    <ol className="space-y-2">
      {visiveis.map(m => <li key={m.id} className="rounded-xl border border-white/15 bg-white/5 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <strong className="text-sm text-white">{m.nome}</strong>
          <span className="text-xs text-white/70">Nível {m.nivel} · {m.estado === 'adquirido' ? 'Adquirida' : m.estado === 'escolher' ? 'Escolha pendente' : m.estado === 'pendente' ? 'Escolha inválida' : 'Futura'}</span>
        </div>
        {m.descricao && <p className="mt-1 text-sm text-white/75">{m.descricao}</p>}
        <p className="mt-1 text-xs text-white/55">Fonte: {m.fonte}</p>
        {m.modo === 'escolha' && m.estado !== 'futuro' && <label className="mt-2 block text-xs text-white/80">
          Opção
          <select className="mt-1 w-full rounded-lg border border-white/25 bg-[#171322] p-2 text-white"
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
