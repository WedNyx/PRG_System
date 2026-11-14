'use client'

/**
 * Mestre escolhe as obras autorizadas na campanha. Jogador marca os
 * suplementos do personagem dentro dessa lista; cada escolha fica na ficha.
 */
import { useState } from 'react'
import { BookOpenCheck, Search } from 'lucide-react'
import type { DadosFicha } from '@/lib/sistemas/tipos'
import { LIVROS_BASE_DND, SUPLEMENTOS_DND, compativelLivroDnd, lerLivrosDnd,
  type LivroBaseDnd } from '@/lib/sistemas/dndLivros'

type Props = {
  d: DadosFicha
  onChange: (v: DadosFicha) => void
  somenteLeitura: boolean
  baseCampanha?: LivroBaseDnd | null
  fontesCampanha?: Set<string> | null
}
const categorias = [
  { id: 'suplemento', nome: 'Regras e opções de personagens' },
  { id: 'cenario', nome: 'Cenários e ambientações' },
  { id: 'aventura', nome: 'Aventuras' },
  { id: 'mestre', nome: 'Livros do Mestre' },
  { id: 'referencia', nome: 'Referência' },
] as const
export default function LivrosPersonagemDnd({ d, onChange, somenteLeitura, baseCampanha = null, fontesCampanha = null }: Props) {
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(false)
  const selecao = lerLivrosDnd(d.dndLivros, baseCampanha ?? 'phb2024')
  const base = baseCampanha ?? selecao.base
  const suplementos = selecao.suplementos.filter(x => compativelLivroDnd(x, base))
  const avisoDiferente = !!baseCampanha && !!d.dndLivros && selecao.base !== baseCampanha
  const disponiveis = SUPLEMENTOS_DND.filter(l => compativelLivroDnd(l.id, base) &&
    (!fontesCampanha || fontesCampanha.has(l.id)))
  const escolhidos = disponiveis.filter(l => suplementos.includes(l.id))
  const listar = disponiveis.filter(l => !busca.trim() ||
    [l.titulo, l.versao, l.descricao, l.ano].join(' ').toLocaleLowerCase('pt-BR')
      .includes(busca.trim().toLocaleLowerCase('pt-BR')))
  const salvar = (novoBase: LivroBaseDnd, lista: string[]) =>
    onChange({ ...d, dndLivros: { base: novoBase, suplementos: [...new Set(lista.filter(x =>
      compativelLivroDnd(x, novoBase) && (!fontesCampanha || fontesCampanha.has(x))))] } })
  const marcar = (id: string, ativo: boolean) =>
    salvar(base, ativo ? [...suplementos, id] : suplementos.filter(x => x !== id))
  const baseMeta = LIVROS_BASE_DND.find(l => l.id === base)!

  return <section aria-label="Livros e edição de D&D usados nesta ficha"
    className="rounded-2xl border border-(--a-62527e) bg-(--s-201a32) p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold text-(--a-ed9cd8)"><BookOpenCheck size={18} /> Livros desta ficha</h2>
        <p className="mt-1 text-xs text-(--a-c4b6d4)">Escolham juntos a edição e os suplementos. Em campanhas, o mestre define quais livros são permitidos.</p>
      </div>
      <button type="button" className="rounded-lg border border-(--a-62527e) px-3 py-2 text-xs"
        onClick={() => setAberto(x => !x)} aria-expanded={aberto}>
        {aberto ? 'Fechar seleção' : 'Escolher suplementos'}
      </button>
    </div>
    <div className="mt-3 rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-(--a-c4b6d4)">Livro do Jogador / regras-base</p>
      <strong className="mt-1 block text-sm">{baseMeta.titulo}</strong>
      <p className="text-xs font-medium text-(--a-d3adf0)">{baseMeta.versao}</p>
      <p className="mt-1 text-xs text-(--a-c4b6d4)">{baseMeta.descricao}</p>
      {baseCampanha && <p className="mt-1 text-[11px] text-amber-200">Edição-base fixada pelo mestre nesta campanha.</p>}
      {!baseCampanha && !somenteLeitura && <label className="mt-2 block text-xs">Alterar a edição-base da ficha avulsa
        <select value={base} className="mt-1 w-full rounded-lg border border-(--a-62527e) bg-(--s-151123) p-2 text-white"
          onChange={e => salvar(e.target.value as LivroBaseDnd, suplementos)}>
          {LIVROS_BASE_DND.map(l => <option key={l.id} value={l.id}>{l.titulo} — {l.versao}</option>)}
        </select>
        <span className="mt-1 block text-[11px] text-amber-200">A troca altera as opções e recursos mostrados, mas não converte atributos ou magias antigas automaticamente.</span>
      </label>}
      {avisoDiferente && <div role="alert" className="mt-2 rounded-lg border border-amber-500/40 p-2 text-xs text-amber-200">
        O mestre alterou a edição-base da campanha. A ficha ainda registra a versão anterior.
        {!somenteLeitura && <button type="button" onClick={() => salvar(base, suplementos)}
          className="mt-1 block rounded-lg border border-amber-500/50 px-3 py-1.5 font-semibold">Atualizar seleção desta ficha</button>}
      </div>}
    </div>
    <p className="mt-3 text-xs text-(--a-c4b6d4)">Suplementos ativos ({escolhidos.length}): {escolhidos.length ?
      escolhidos.map(l => l.titulo + ' (' + l.ano + ')').join(' · ') : 'nenhum. Apenas o livro-base.'}</p>
    {aberto && <div className="mt-3 space-y-3 border-t border-(--a-55456e) pt-3">
      <p className="text-xs text-(--a-c4b6d4)">Todos os registros abaixo identificam exatamente a publicação e a edição. Livros pagos estão disponíveis somente como referência até que suas opções sejam implementadas e verificadas.</p>
      <label className="flex items-center gap-2 rounded-lg border border-(--a-62527e) bg-(--s-151123) px-3">
        <Search size={15} /><input type="search" value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar livro, versão ou ano" className="min-w-0 w-full bg-transparent py-2 text-sm outline-none" />
      </label>
      {base === 'phb2024' && (!fontesCampanha || fontesCampanha.has('phb2014')) && <label className="flex items-start gap-2 rounded-xl border border-(--a-55456e) p-3 text-xs">
        <input type="checkbox" disabled={somenteLeitura} checked={suplementos.includes('phb2014')}
          onChange={e => marcar('phb2014', e.target.checked)} className="mt-0.5" />
        <span><strong className="block">Player’s Handbook (2014) · 5e — conteúdo legado</strong>
          Permite consultar opções de 2014 com aprovação do mestre. Não altera as regras-base de 2024.</span>
      </label>}
      {categorias.map(grupo => {
        const obras = listar.filter(l => l.categoria === grupo.id)
        return obras.length ? <div key={grupo.id}>
          <h3 className="mb-2 text-xs font-bold text-(--a-d3adf0)">{grupo.nome}</h3>
          <div className="grid gap-2 lg:grid-cols-2">{obras.map(l => <label key={l.id}
            className={'flex min-w-0 items-start gap-2 rounded-xl border p-3 ' + (suplementos.includes(l.id) ?
              'border-(--a-b99bff) bg-(--s-34294f)' : 'border-(--a-55456e) bg-(--s-171325)')}>
            <input type="checkbox" disabled={somenteLeitura || avisoDiferente} checked={suplementos.includes(l.id)}
              className="mt-0.5" onChange={e => marcar(l.id, e.target.checked)} />
            <span className="min-w-0">
              <strong className="block text-xs">{l.titulo}</strong>
              <span className="block text-[11px] text-(--a-d3adf0)">{l.versao} · {l.ano}</span>
              <span className="block text-[11px] text-(--a-c4b6d4)">{l.descricao}</span>
              <span className="block text-[10px] text-amber-200">Referência bibliográfica — benefícios específicos não automáticos</span>
            </span>
          </label>)}</div>
        </div> : null
      })}
      {!disponiveis.length && <p className="text-xs text-amber-200">O mestre ainda não liberou suplementos para esta campanha.</p>}
      {disponiveis.length > 0 && !listar.length && <p className="text-xs">Nenhum livro corresponde à pesquisa.</p>}
    </div>}
  </section>
}
