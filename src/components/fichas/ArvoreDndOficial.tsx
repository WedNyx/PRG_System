'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { BookOpenCheck, CircleHelp, GitBranch, Sparkles, X } from 'lucide-react'
import type { DadosFicha } from '@/lib/sistemas/tipos'
import { hexagonosOficiaisDnd, RAMOS_HEX_DND, type RamoHexDnd, type EstadoHexDnd } from '@/lib/sistemas/arvoreDndOficial'
import type { LivroBaseDnd } from '@/lib/sistemas/dndLivros'
import { lerArvore } from '@/lib/sistemas/arvore'
import { ordenarNosVerticais } from '@/lib/sistemas/arvoreVisual'

type Props = {
  d: DadosFicha
  edicao: LivroBaseDnd
  fontes: Set<string> | null
  /** Editor existente dos poderes do mestre, mostrado somente no quarto ramo. */
  children?: ReactNode
}

const estados: Record<EstadoHexDnd, { texto: string; classe: string; icone: string }> = {
  recebido: { texto: 'Recebido', classe: 'border-emerald-400/40 text-emerald-200', icone: '✓' },
  pendente: { texto: 'Escolha pendente', classe: 'border-amber-300/40 text-amber-200', icone: '?' },
  referencia: { texto: 'Consultar livro', classe: 'border-violet-300/40 text-violet-200', icone: '📖' },
  futuro: { texto: 'Nível futuro', classe: 'border-(--a-62527e) text-(--a-c4b6d4)', icone: '◌' },
}

/**
 * Único painel de habilidades D&D (2014 e 2024).
 * Os três ramos oficiais são projeções somente de leitura de escolhas já salvas;
 * o quarto ramo é a árvore de poderes existente, sem converter ou duplicar bônus.
 */
export default function ArvoreDndOficial({ d, edicao, fontes, children }: Props) {
  const [ramoAtivo, setRamoAtivo] = useState<RamoHexDnd>('classe')
  const [futuros, setFuturos] = useState(false)
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const oficiais = useMemo(
    () => hexagonosOficiaisDnd(d, edicao, fontes, futuros),
    [d, edicao, fontes, futuros],
  )
  const extras = useMemo(() => lerArvore(d.arvore), [d.arvore])
  const ramo = RAMOS_HEX_DND.find(r => r.id === ramoAtivo)!
  const grupo = useMemo(
    () => ordenarNosVerticais(oficiais.filter(n => n.ramo === ramoAtivo)),
    [oficiais, ramoAtivo],
  )
  const detalhe = grupo.find(n => n.id === selecionado) ?? null
  const quantidade = (id: RamoHexDnd) => id === 'mestre'
    ? extras.nos.length : oficiais.filter(n => n.ramo === id).length
  const recebidos = oficiais.filter(n => n.estado === 'recebido').length
  const pendentes = oficiais.filter(n => n.estado === 'pendente').length

  return <section aria-label="Árvore de habilidades D&D por ramos"
    className="overflow-hidden rounded-2xl border border-(--a-62527e) bg-(--s-0c0a16)">
    <header className="border-b border-(--a-55456e) bg-(--s-171325) p-4 sm:p-5">
      <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-(--a-ed9cd8)">
        <GitBranch size={20} /> Árvores de habilidades
      </h2>
      <p className="mt-1 text-sm text-(--a-cfc0df)">
        Quatro ramos, uma árvore por vez. Os cartões seguem suas escolhas, nível e livro; basta abrir um para ver detalhes.
      </p>
      <p className="mt-2 text-xs text-(--a-d3adf0)">
        {edicao === 'phb2014' ? 'D&D 2014 · SRD 5.1 / Livro do Jogador (5e)' :
          'D&D 2024 · SRD 5.2.1 / Livro do Jogador (5.5e)'}
        {' · '}{recebidos} recebido(s){pendentes ? ' · ' + pendentes + ' pendente(s)' : ''}
      </p>
      <p className="mt-1 text-xs text-(--a-a998bd)">
        Consultar os ramos não concede poderes, não gasta pontos e não altera sua ficha. Conteúdos comerciais são apenas referências ao livro.
      </p>
    </header>

    <nav className="grid grid-cols-2 gap-2 border-b border-(--a-55456e) bg-(--s-14111f) p-3 sm:grid-cols-4" aria-label="Selecionar ramo da árvore">
      {RAMOS_HEX_DND.map(r => <button key={r.id} type="button"
        aria-current={ramoAtivo === r.id ? 'page' : undefined}
        aria-pressed={ramoAtivo === r.id}
        onClick={() => { setRamoAtivo(r.id); setSelecionado(null) }}
        className={'flex min-h-16 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--a-b99bff) ' +
          (ramoAtivo === r.id ? 'border-(--a-b99bff) bg-(--s-34294f) text-white' : 'border-(--a-55456e) bg-(--s-201a32) text-(--a-cfc0df) hover:bg-(--s-34294f)')}>
        <span aria-hidden className="text-xl">{r.icone}</span>
        <span className="min-w-0 flex-1">
          <strong className="block break-words text-xs leading-snug">{r.titulo}</strong>
          <span className="mt-1 block text-[11px] text-(--a-c4b6d4)">{quantidade(r.id)} característica(s)</span>
        </span>
      </button>)}
    </nav>

    <div className="bg-[radial-gradient(ellipse_at_50%_0%,#241840_0%,#0b0814_75%)] p-3 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-semibold" style={{ color: ramo.cor }}>
          <span aria-hidden>{ramo.icone}</span>{ramo.titulo}
        </h3>
        {ramoAtivo !== 'mestre' && <label className="inline-flex items-center gap-2 rounded-lg border border-(--a-55456e) px-3 py-2 text-xs text-(--a-cfc0df)">
          <input type="checkbox" checked={futuros} onChange={e => setFuturos(e.target.checked)} />
          Mostrar níveis futuros
        </label>}
      </div>

      {ramoAtivo === 'mestre'
        ? <div aria-label="Editor das habilidades adicionais do mestre" className="min-w-0">
          <p className="mb-3 text-xs text-(--a-cfc0df)">
            Aqui ficam as habilidades criadas pelo mestre, inclusive as que já existiam antes desta atualização. Concessões, pontos, requisitos e histórico continuam os mesmos.
          </p>
          {children ?? <p className="rounded-xl border border-(--a-55456e) p-4 text-sm">Não há editor de poderes nesta ficha.</p>}
        </div>
        : <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,19rem)]">
          <div>
            {grupo.length === 0
              ? <p className="rounded-xl border border-(--a-55456e) bg-(--s-171325) p-5 text-sm text-(--a-cfc0df)">
                {ramoAtivo === 'classe' ? 'Escolha uma classe e um nível na aba Principal para formar este ramo.' :
                  ramoAtivo === 'especie' ? 'Escolha sua espécie ou raça para mostrar os traços dela.' :
                    'Escolha seu antecedente ou origem na aba Principal para formar este ramo.'}
              </p>
              : <ol className="mx-auto max-w-3xl" aria-label={'Progressão vertical de ' + ramo.titulo}>
                {grupo.map((n, i) => {
                  const status = estados[n.estado]
                  const ativo = selecionado === n.id
                  return <li key={n.id}>
                    {i > 0 && <div aria-hidden className="mx-auto h-5 w-px bg-(--a-70588c)" />}
                    <button type="button" aria-pressed={ativo} onClick={() => setSelecionado(ativo ? null : n.id)}
                      className={'flex min-h-20 w-full items-center gap-3 rounded-xl border border-l-4 p-3 text-left transition hover:bg-(--s-34294f) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--a-b99bff) sm:p-4 ' +
                        (ativo ? 'border-(--a-b99bff) bg-(--s-34294f)' : 'border-(--a-55456e) bg-(--s-201a32)')}
                      style={{ borderLeftColor: ramo.cor, opacity: n.estado === 'futuro' ? 0.75 : 1 }}>
                      <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-(--s-34294f) text-lg" style={{ color: ramo.cor }}>
                        {status.icone}
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block break-words text-sm leading-snug text-(--a-f2ebff) sm:text-base">{n.titulo}</strong>
                        <span className="mt-1 block text-xs text-(--a-c4b6d4)">Nível {n.nivel}{n.escolha ? ' · ' + n.escolha : ''}</span>
                      </span>
                      <span className={'shrink-0 rounded-lg border px-2 py-1 text-center text-[11px] font-medium ' + status.classe}>{status.texto}</span>
                    </button>
                  </li>
                })}
              </ol>}
          </div>

          <aside aria-label="Detalhes da característica" className="min-w-0 rounded-xl border border-(--a-55456e) bg-(--s-171325) p-4 lg:self-start">
            {detalhe ? <>
              <div className="flex items-start justify-between gap-2">
                <h4 className="break-words font-semibold text-(--a-ed9cd8)">{detalhe.titulo}</h4>
                <button type="button" aria-label="Fechar detalhes" onClick={() => setSelecionado(null)} className="rounded-lg border border-(--a-55456e) p-2"><X size={15} /></button>
              </div>
              <p className="mt-2 text-xs text-(--a-cfc0df)">Nível {detalhe.nivel} · {estados[detalhe.estado].texto}</p>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm text-(--a-cfc0df)">{detalhe.descricao || 'Descrição conforme o livro e as escolhas da ficha.'}</p>
              {detalhe.escolha && <p className="mt-3 text-xs text-emerald-200">Escolha registrada: {detalhe.escolha}</p>}
              {detalhe.estado === 'pendente' && <p className="mt-3 flex items-start gap-2 text-xs text-amber-200"><CircleHelp size={15} className="shrink-0" />
                Complete esta escolha na seção Progressão / Origem da ficha.</p>}
              <p className="mt-3 flex items-start gap-2 text-xs text-(--a-c4b6d4)"><BookOpenCheck size={15} className="shrink-0"/>Fonte: {detalhe.livro}</p>
              {detalhe.estado === 'referencia' && <p className="mt-2 text-xs text-(--a-a998bd)">O efeito deste livro não é concedido automaticamente por este cartão.</p>}
            </> : <div className="flex flex-col items-center gap-2 py-5 text-center text-(--a-c4b6d4)">
              <Sparkles size={22}/><p className="text-sm">Selecione um cartão para ver a origem, os detalhes e o estado da característica.</p>
            </div>}
          </aside>
        </div>}
    </div>
  </section>
}
