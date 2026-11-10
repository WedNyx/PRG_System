'use client'

import { GRUPOS, type GrupoId } from '@/lib/grupos'

/** Dois cartões para escolher o grupo do perfil (Lunethernnyis ou De Fora). */
export default function EscolherGrupo({ valor, mudar }: { valor: GrupoId | null; mudar: (g: GrupoId) => void }) {
  return <fieldset>
    <legend className="mb-2 block text-sm text-[#b4aeca]">Grupo</legend>
    <div role="radiogroup" className="grid grid-cols-2 gap-2">
      {GRUPOS.map(g => <button key={g.id} type="button" role="radio" aria-checked={valor === g.id} onClick={() => mudar(g.id)}
        style={valor === g.id ? { borderColor: g.cor, boxShadow: `0 0 16px ${g.cor}55` } : undefined}
        className={'rounded-xl border-2 p-3 text-left transition ' + (valor === g.id ? 'bg-[#2b2143]' : 'border-[#4a4267] bg-[#100f20] hover:border-[#62527e]')}>
        <span className="block text-xl">{g.icone}</span>
        <span className="block font-semibold">{g.nome}</span>
        <span className="block text-xs text-[#b4aeca]">{g.descricao}</span>
      </button>)}
    </div>
  </fieldset>
}
