'use client'

import type { DadosFicha } from '@/lib/sistemas/tipos'
import { SUBRACAS_2014, RACAS_2014, ANTECEDENTES_2014 } from '@/lib/sistemas/dnd2014Criacao'

type Props = { d: DadosFicha; onChange: (d: DadosFicha) => void; somenteLeitura: boolean }
export default function GuiaCriacaoLegadaDnd({ d, onChange, somenteLeitura }: Props) {
  const raca = String(d.campos.especie ?? '')
  const antecedente = String(d.campos.antecedente ?? '')
  const subracas = SUBRACAS_2014[raca] ?? []
  const racaMeta = RACAS_2014.find(x => x.nome === raca)
  const antMeta = ANTECEDENTES_2014.find(x => x.nome === antecedente)
  const escolha = String(d.campos.subraca2014 ?? '')
  const sub = subracas.find(x => x.nome === escolha)
  return <section className="space-y-3 rounded-2xl border border-amber-500/35 bg-(--s-201a32) p-4 sm:p-5">
    <h3 className="text-base font-semibold text-amber-100">📜 Criação D&D 5e · Livro do Jogador 2014</h3>
    <p className="text-xs text-(--a-c4b6d4)">Este personagem usa as regras da edição de 2014, não as progressões revisadas de 2024. Os campos básicos e as rolagens permanecem; bônus raciais, características de classe, talentos, magias e equipamentos devem ser conferidos no livro de 2014 e registrados manualmente.</p>
    {racaMeta && <p className="rounded-lg bg-(--s-171325) p-2 text-xs"><strong>Raça:</strong> {racaMeta.descricao}</p>}
    {subracas.length > 0 && <label className="block text-sm">
      Sub-raça / variante (Livro do Jogador 2014)
      <select value={subracas.some(x => x.nome === escolha) ? escolha : ''} disabled={somenteLeitura}
        onChange={e => onChange({ ...d, campos: { ...d.campos, subraca2014: e.target.value } })}
        className="mt-1 w-full rounded-xl border border-(--a-62527e) bg-(--s-151123) p-2.5 text-white">
        <option value="">Escolha a sub-raça</option>
        {subracas.map(x => <option key={x.nome} value={x.nome}>{x.nome}</option>)}
      </select>
      {sub && <span className="mt-1 block rounded-lg bg-(--s-171325) p-2 text-xs text-(--a-d3adf0)">{sub.detalhe}</span>}
    </label>}
    {antMeta && <p className="rounded-lg bg-(--s-171325) p-2 text-xs"><strong>Antecedente:</strong> {antMeta.descricao}</p>}
    <p className="rounded-lg border border-amber-500/30 bg-amber-950/15 p-2 text-xs text-amber-200">
      <strong>Não automático:</strong> o PHB 2014 concede aumentos pela raça/sub-raça; o PHB 2024 concede aumentos pelo antecedente. Esta ficha nunca aplica os dois simultaneamente. Ajuste o valor de cada atributo uma única vez, com o mestre.
    </p>
  </section>
}
