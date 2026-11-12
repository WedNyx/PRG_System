'use client'

import type { ModoProgressao } from '@/lib/sistemas/modoProgressao'

const opcoes: { valor: ModoProgressao; titulo: string; descricao: string }[] = [
  { valor: 'hibrido', titulo: 'Híbrido', descricao: 'Progressão oficial com personalizações autorizadas pelo mestre.' },
  { valor: 'automatico', titulo: 'Automático', descricao: 'Somente a progressão oficial do sistema.' },
  { valor: 'manual', titulo: 'Manual', descricao: 'O mestre gerencia os nós e habilidades manualmente.' },
]
type Props = {
  valor: ModoProgressao
  onChange: (valor: ModoProgressao) => void
  /** A aplicação deve verificar a permissão de mestre no servidor antes de persistir. */
  podeEditar: boolean
}
export default function SeletorModoProgressao({ valor, onChange, podeEditar }: Props) {
  return <fieldset className="space-y-2 rounded-2xl border border-white/15 p-4" disabled={!podeEditar}>
    <legend className="px-1 font-semibold text-white">Modo de progressão da campanha</legend>
    {opcoes.map(op => <label key={op.valor} className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/15 p-3">
      <input type="radio" name="modo-progressao" className="mt-1" checked={valor === op.valor}
        onChange={() => onChange(op.valor)} />
      <span><strong className="block text-sm text-white">{op.titulo}</strong><span className="text-xs text-white/70">{op.descricao}</span></span>
    </label>)}
    {!podeEditar && <p className="text-xs text-white/60">Somente o mestre pode alterar esta configuração.</p>}
  </fieldset>
}
