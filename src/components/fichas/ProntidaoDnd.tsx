'use client'

import { AlertCircle, BookOpenCheck, CheckCircle2, ChevronRight, ShieldAlert } from 'lucide-react'
import { useMemo } from 'react'
import type { DadosFicha } from '@/lib/sistemas/tipos'
import type { LivroBaseDnd } from '@/lib/sistemas/dndLivros'
import { avaliarProntidaoDnd } from '@/lib/sistemas/dndProntidao'

/** Checklist de preparação para jogar. Não bloqueia salvamento nem concede efeitos. */
export default function ProntidaoDnd({ d, edicao, irPara }: {
  d: DadosFicha; edicao: LivroBaseDnd; irPara: (secao: string) => void
}) {
  const resultado = useMemo(() => avaliarProntidaoDnd(d, edicao), [d, edicao])
  const obrigatorias = resultado.pendencias.filter(x => x.tipo === 'pendente')
  const revisoes = resultado.pendencias.filter(x => x.tipo === 'conferir')
  return <section aria-label="Preparação da ficha para jogar D&D"
    className="rounded-2xl border border-(--a-62527e) bg-(--s-201a32) p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 font-semibold text-(--a-ed9cd8)">
        <BookOpenCheck size={19}/> Pronto para jogar? · {edicao === 'phb2014' ? 'D&D 2014' : 'D&D 2024'}
      </h2>
      {resultado.prontoParaConferir
        ? <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 px-3 py-1 text-xs text-emerald-200">
            <CheckCircle2 size={14}/> Criação preenchida
          </span>
        : <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 px-3 py-1 text-xs text-amber-200">
            <AlertCircle size={14}/> {obrigatorias.length} escolha(s) pendente(s)
          </span>}
    </div>
    <p className="mt-2 text-xs text-(--a-c4b6d4)">
      Esta conferência ajuda jogador e mestre a completar a ficha sem apagar escolhas antigas.
      Você pode salvar um rascunho a qualquer momento. O indicador não substitui a validação das regras do livro.
    </p>
    {obrigatorias.length > 0 && <div className="mt-3 space-y-2">
      {obrigatorias.slice(0,8).map(x => <button key={x.id} type="button" onClick={() => irPara(x.secao)}
        className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-amber-500/35 bg-amber-950/10 p-3 text-left hover:bg-amber-950/25">
        <AlertCircle size={16} className="shrink-0 text-amber-200"/>
        <span className="min-w-0 flex-1">
          <strong className="block text-sm text-amber-100">{x.titulo}</strong>
          <span className="block text-xs text-(--a-c4b6d4)">{x.detalhe}</span>
        </span>
        <ChevronRight size={15} className="shrink-0 text-amber-200"/>
      </button>)}
      {obrigatorias.length > 8 && <details className="rounded-lg border border-(--a-55456e) p-3 text-xs">
        <summary className="cursor-pointer">Ver mais {obrigatorias.length-8} pendência(s)</summary>
        <ul className="mt-2 space-y-2">
          {obrigatorias.slice(8).map(x => <li key={x.id}>
            <button type="button" className="text-left text-amber-200 underline" onClick={() => irPara(x.secao)}>
              {x.titulo}: {x.detalhe}
            </button>
          </li>)}
        </ul>
      </details>}
    </div>}
    {revisoes.length > 0 && <details className="mt-3 rounded-lg border border-(--a-55456e) p-3">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-(--a-d3adf0)">
        <ShieldAlert size={16}/> {revisoes.length} assunto(s) para conferir com o mestre
      </summary>
      <ul className="mt-2 space-y-2 text-xs text-(--a-c4b6d4)">
        {revisoes.map(x => <li key={x.id}><strong>{x.titulo}:</strong> {x.detalhe}</li>)}
      </ul>
    </details>}
    {resultado.prontoParaConferir && <p className="mt-3 text-xs text-emerald-200">
      As escolhas básicas estão registradas. Confirme com o mestre os efeitos de livros e suplementos que ainda são manuais.
    </p>}
  </section>
}
