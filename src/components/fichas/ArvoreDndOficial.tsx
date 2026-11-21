'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { BookOpenCheck, CircleHelp, GitBranch, LockKeyhole, Sparkles, X } from 'lucide-react'
import type { DadosFicha } from '@/lib/sistemas/tipos'
import { hexagonosOficiaisDnd, RAMOS_HEX_DND, type RamoHexDnd, type EstadoHexDnd } from '@/lib/sistemas/arvoreDndOficial'
import type { LivroBaseDnd } from '@/lib/sistemas/dndLivros'
import { lerArvore } from '@/lib/sistemas/arvore'
import { ordenarNosVerticais } from '@/lib/sistemas/arvoreVisual'
import {conteudoDetalheDnd} from '@/lib/sistemas/dndArvoreConteudo'

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
  referencia: { texto: 'Ver detalhes', classe: 'border-violet-300/40 text-violet-200', icone: '📖' },
  futuro: { texto: 'Nível futuro', classe: 'border-(--a-62527e) text-(--a-c4b6d4)', icone: '◌' },
}

/**
 * Único painel de habilidades D&D (2014 e 2024).
 * Os três ramos oficiais são projeções somente de leitura de escolhas já salvas;
 * o quarto ramo é a árvore de poderes existente, sem converter ou duplicar bônus.
 */

function ConteudoCartaoArvore({d,no,edicao,fechar}:{
  d:DadosFicha; no:ReturnType<typeof hexagonosOficiaisDnd>[number];
  edicao:LivroBaseDnd;fechar:()=>void
}) {
  const info=conteudoDetalheDnd(d,no,edicao)
  return <>
    <div className="flex items-start justify-between gap-2">
      <h4 className="min-w-0 break-words font-semibold text-(--a-ed9cd8)">{info.titulo}</h4>
      <button type="button" aria-label="Fechar detalhes" onClick={fechar}
        className="min-h-10 min-w-10 shrink-0 rounded-lg border border-(--a-55456e) p-2"><X size={17}/></button>
    </div>
    <p className="mt-2 text-xs text-(--a-cfc0df)">Nível {no.nivel} · {estados[no.estado].texto}</p>
    <details className="mt-3 rounded-lg border border-violet-300/20 p-3" open><summary className="cursor-pointer text-sm font-semibold text-(--a-ed9cd8)">Descrição</summary><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-(--a-cfc0df)">{info.resumo}</p></details>
    {info.beneficios.length>0&&<div className="mt-3 space-y-2">
      <p className="text-sm font-semibold text-(--a-ed9cd8)">Como funciona</p>
      <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-(--a-cfc0df)">
        {info.beneficios.map((beneficio,i)=><li key={i}>{beneficio}</li>)}
      </ul>
    </div>}
    {info.registro&&<p className="mt-3 rounded-lg border border-sky-500/30 bg-sky-950/20 p-2 text-xs leading-relaxed text-sky-100">
      <strong className="block">Na sua ficha</strong>{info.registro}
    </p>}
    {no.escolha&&<p className="mt-3 text-xs text-emerald-200">Escolha registrada: {no.escolha}</p>}
    {no.estado==='futuro'&&<p className="mt-3 flex items-center gap-2 text-xs text-(--a-c4b6d4)"><LockKeyhole size={15}/> Disponível a partir do nível {no.nivel}.</p>}
    {no.estado==='pendente'&&<p className="mt-3 flex items-start gap-2 text-xs text-amber-200">
      <CircleHelp size={15} className="shrink-0"/> Complete a escolha no Guia/Progressão da ficha.
    </p>}
    {info.atencao&&<details className="mt-2 rounded-lg border border-violet-300/20 p-3"><summary className="cursor-pointer text-sm font-semibold">Requisitos e observações</summary><p className="mt-2 text-xs leading-relaxed text-(--a-a998bd)">{info.atencao}</p></details>}
    <p className="mt-3 flex items-start gap-2 text-xs text-(--a-c4b6d4)"><BookOpenCheck size={15} className="shrink-0"/>Fonte: {no.livro}</p>
  </>
}

export default function ArvoreDndOficial({ d, edicao, fontes, children }: Props) {
  const [ramoAtivo, setRamoAtivo] = useState<RamoHexDnd>('classe')
  const [futuros, setFuturos] = useState(false)
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const [visao, setVisao] = useState<'yggdrasil' | 'lista'>('yggdrasil')
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
        Quatro ramos de uma árvore de evolução. Toque em uma estrela para consultar os detalhes, sem alterar a ficha.
      </p>
      <p className="mt-2 text-xs text-(--a-d3adf0)">
        {edicao === 'phb2014' ? 'D&D 2014 · SRD 5.1 / Livro do Jogador (5e)' :
          'D&D 2024 · SRD 5.2.1 / Livro do Jogador (5.5e)'}
        {' · '}{recebidos} recebido(s){pendentes ? ' · ' + pendentes + ' pendente(s)' : ''}
      </p>
      <p className="mt-1 text-xs text-(--a-a998bd)">
        Consultar os ramos não concede poderes, não gasta pontos e não altera sua ficha. A ficha apresenta resumos das regras e as escolhas disponíveis; efeitos situacionais ainda exigem confirmação do mestre.
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
        {ramoAtivo !== 'mestre' && <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Visualização da árvore" className="flex rounded-lg border border-(--a-55456e) p-1">
            <button type="button" aria-pressed={visao==='yggdrasil'} onClick={()=>setVisao('yggdrasil')} className={'min-h-10 rounded-md px-3 text-xs ' + (visao==='yggdrasil'?'bg-(--s-34294f) text-white':'text-(--a-cfc0df)')}>🌳 Yggdrasil</button>
            <button type="button" aria-pressed={visao==='lista'} onClick={()=>setVisao('lista')} className={'min-h-10 rounded-md px-3 text-xs ' + (visao==='lista'?'bg-(--s-34294f) text-white':'text-(--a-cfc0df)')}>☷ Lista</button>
          </div>
        </div>}
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
              : visao === 'yggdrasil' ? <div className="mx-auto max-w-3xl">
                <p className="mb-3 text-center text-xs text-(--a-c4b6d4)">Árvore do Mundo · Toque nos galhos para conhecer suas habilidades.</p>
                <div className="relative overflow-hidden rounded-2xl border border-amber-300/25 bg-[radial-gradient(ellipse_at_50%_65%,#30251f_0%,#181321_70%,#0c0a13_100%)] px-2 py-6">
                  <div className="pointer-events-none absolute inset-0 opacity-20" aria-hidden style={{backgroundImage:'radial-gradient(#e3c899 1px, transparent 1px)',backgroundSize:'39px 41px'}} />
                  <ol className="relative mx-auto max-w-lg" aria-label={'Yggdrasil de ' + ramo.titulo}>
                    {grupo.map((n,i)=>{
                      const ativo=selecionado===n.id
                      const lado=i===0?'center':i%2===1?'left':'right'
                      return <li key={n.id} className="relative min-h-40 pb-8">
                        <svg aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-full w-full" viewBox="0 0 300 160" preserveAspectRatio="none">
                          <path d="M150 0 C147 55 153 105 150 160" fill="none" stroke="#4a332b" strokeWidth="15" strokeLinecap="round"/>
                          <path d="M150 0 C147 55 153 105 150 160" fill="none" stroke="#a7835c" strokeWidth="5" strokeOpacity=".85" strokeLinecap="round"/>
                          {lado!=='center'&&<path d={lado==='left'?'M150 54 C120 52 112 45 75 45':'M150 54 C180 52 188 45 225 45'} fill="none" stroke="#b99564" strokeWidth="5" strokeLinecap="round"/>}
                        </svg>
                        <div className={'relative flex ' + (lado==='left'?'justify-start':lado==='right'?'justify-end':'justify-center')}>
                          <button type="button" aria-pressed={ativo} aria-label={n.titulo+', nível '+n.nivel+', '+estados[n.estado].texto} onClick={()=>setSelecionado(ativo?null:n.id)}
                            className={'relative z-10 flex min-h-24 w-[47%] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-3 text-center shadow-[0_4px_22px_#0008] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 sm:w-[43%] '+
                              (ativo?'border-amber-200 bg-[#57402d] ring-2 ring-amber-200/40':'border-amber-300/55 bg-[#29201f] hover:bg-[#41302a]')+
                              (n.estado==='futuro'?' opacity-65':'')}
                            style={{borderColor:ativo?'#f5d58a':ramo.cor}}>
                            <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-300/60 bg-[#17121a] text-lg text-amber-100">{n.estado==='futuro'?<LockKeyhole size={17}/>:n.estado==='recebido'?'✧':estados[n.estado].icone}</span>
                            <strong className="w-full break-words text-xs leading-snug text-white">{n.titulo}</strong>
                            <span className="text-[10px] text-amber-100/80">Nv. {n.nivel} · {estados[n.estado].texto}</span>
                          </button>
                        </div>
                        {ativo&&<div className="relative z-20 mt-3 rounded-xl border border-amber-300/35 bg-[#201a21] p-3 lg:hidden">
                          <ConteudoCartaoArvore d={d} no={n} edicao={edicao} fechar={()=>setSelecionado(null)}/>
                        </div>}
                      </li>
                    })}
                  </ol>
                  <svg aria-hidden="true" className="pointer-events-none relative mx-auto h-16 w-48" viewBox="0 0 192 64">
                    <path d="M96 0 V18 Q70 32 10 57 M96 18 Q122 32 182 57 M96 18 Q96 39 96 61 M96 22 Q55 37 40 62 M96 22 Q137 37 152 62" stroke="#a7835c" strokeWidth="5" fill="none" strokeLinecap="round"/>
                  </svg>
                </div>
              </div> : <ol className="mx-auto max-w-3xl" aria-label={'Progressão vertical de ' + ramo.titulo}>
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
                        <span>{status.icone}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block break-words text-sm leading-snug text-(--a-f2ebff) sm:text-base">{n.titulo}</strong>
                        <span className="mt-1 block text-xs text-(--a-c4b6d4)">Nível {n.nivel}{n.escolha ? ' · ' + n.escolha : ''}</span>
                      </span>
                      <span className={'shrink-0 rounded-lg border px-2 py-1 text-center text-[11px] font-medium ' + status.classe}>{status.texto}</span>
                    </button>
                    {ativo&&<div className="mt-2 min-w-0 rounded-xl border border-(--a-62527e) bg-(--s-171325) p-4 lg:hidden">
                      <ConteudoCartaoArvore d={d} no={n} edicao={edicao} fechar={()=>setSelecionado(null)}/>
                    </div>}
                  </li>
                })}
              </ol>}
          </div>

          <aside aria-label="Detalhes da característica" className="hidden min-w-0 rounded-xl border border-(--a-55456e) bg-(--s-171325) p-4 lg:block lg:self-start">
            {detalhe
              ? <ConteudoCartaoArvore d={d} no={detalhe} edicao={edicao} fechar={()=>setSelecionado(null)}/>
              : <div className="flex flex-col items-center gap-2 py-5 text-center text-(--a-c4b6d4)">
                <Sparkles size={22}/><p className="text-sm">Selecione um cartão para ver sua explicação, benefícios e escolhas.</p>
              </div>}
          </aside>
        </div>}
    </div>
  </section>
}
