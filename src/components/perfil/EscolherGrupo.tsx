'use client'

import { GRUPOS, type GrupoId } from '@/lib/grupos'

/** Dois cartões para escolher o grupo do perfil (Lunethernnyis ou De Fora). */
export default function EscolherGrupo({ valor, mudar }: { valor: GrupoId | null; mudar: (g: GrupoId) => void }) {
  // min-w-0: sem isso o fieldset cresce até o tamanho do conteúdo e a janela passa da tela do celular (v0.35.5).
  return <fieldset className="min-w-0">
    <legend className="mb-2 block text-sm text-(--a-b4aeca)">Grupo</legend>
    <div role="radiogroup" className="grid grid-cols-2 gap-2">
      {GRUPOS.map(g => <button key={g.id} type="button" role="radio" aria-checked={valor === g.id} onClick={() => mudar(g.id)}
        style={valor === g.id ? { borderColor: g.cor, boxShadow: `0 0 16px ${g.cor}55` } : undefined}
        className={'min-w-0 rounded-xl border-2 p-3 text-left transition ' + (valor === g.id ? 'bg-(--s-2b2143)' : 'border-(--a-4a4267) bg-(--s-100f20) hover:border-(--a-62527e)')}>
        <span className="block text-xl">{g.icone}</span>
        <span className="block break-words font-semibold">{g.nome}</span>
        <span className="block text-xs text-(--a-b4aeca)">{g.descricao}</span>
      </button>)}
    </div>
  </fieldset>
}
