'use client'

import { useMemo, useState } from 'react'
import { BookOpenCheck, ChevronDown, CircleHelp, GitBranch, X } from 'lucide-react'
import type { DadosFicha } from '@/lib/sistemas/tipos'
import { hexagonosOficiaisDnd, RAMOS_HEX_DND, type EstadoHexDnd, type HexagonoDnd } from '@/lib/sistemas/arvoreDndOficial'
import type { LivroBaseDnd } from '@/lib/sistemas/dndLivros'
import { lerArvore, noAtivo } from '@/lib/sistemas/arvore'

type Props = { d: DadosFicha; edicao: LivroBaseDnd; fontes: Set<string> | null }
const estados: Record<EstadoHexDnd, { texto: string; fundo: string }> = {
  recebido: { texto: 'Recebido pela ficha', fundo: '#276f60' },
  pendente: { texto: 'Escolha pendente', fundo: '#9a6428' },
  referencia: { texto: 'Conferir no livro', fundo: '#514a75' },
  futuro: { texto: 'Futuro / bloqueado', fundo: '#302b41' },
}
const resumo = (n: HexagonoDnd) => n.titulo.length > 30 ? n.titulo.slice(0, 28) + '…' : n.titulo

/** Árvore visual oficial, separada do estado editável de hexágonos do mestre.
 * Derivada da classe/nível/espécie/antecedente, sem precisar salvar ou comprar nós.
 */
export default function ArvoreDndOficial({ d, edicao, fontes }: Props) {
  const [futuros, setFuturos] = useState(false)
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const [ramoAtivo, setRamoAtivo] = useState<'todos' | 'classe' | 'especie' | 'antecedente' | 'mestre'>('todos')
  const nos = useMemo(() => {
    const oficiais = hexagonosOficiaisDnd(d, edicao, fontes, futuros)
    const a = lerArvore(d.arvore)
    const nv = Math.max(1, Math.floor(Number(d.campos.nivel) || 1))
    const extras: HexagonoDnd[] = a.nos.filter(n => futuros || !(n.nivel && n.nivel > nv)).map(n => ({
      id: 'mestre-' + n.id, titulo: n.nome, descricao: n.descricao || 'Hexágono criado na árvore personalizada; veja os requisitos e efeitos no editor abaixo.',
      nivel: n.nivel ?? 1, ramo: 'mestre' as const,
      estado: n.nivel && n.nivel > nv ? 'futuro' : noAtivo(a, n, d) ? 'recebido' : 'pendente',
      livro: 'Personalizado pelo mestre (não é regra oficial)',
    }))
    return [...oficiais, ...extras]
  }, [d, edicao, fontes, futuros])
  const visiveis = nos.filter(n => ramoAtivo === 'todos' || n.ramo === ramoAtivo)
  const detalhe = nos.find(n => n.id === selecionado) ?? null
  const recebidos = nos.filter(n => n.estado === 'recebido').length
  const pendentes = nos.filter(n => n.estado === 'pendente').length

  return <section aria-label="Árvore de características oficiais D&D"
    className="overflow-hidden rounded-2xl border border-(--a-62527e) bg-(--s-0c0a16)">
    <div className="border-b border-(--a-55456e) bg-(--s-171325) p-4 sm:p-5">
      <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-(--a-ed9cd8)">
        <GitBranch size={19} /> Árvore de origem e características
      </h2>
      <p className="mt-1 text-xs text-(--a-c4b6d4)">
        Hexágonos gerados automaticamente a partir da <strong>classe, espécie/raça, origem, antecedente,
        nível e escolhas da ficha</strong>. Atualizam quando essas informações mudam.
      </p>
      <p className="mt-2 text-xs text-(--a-d3adf0)">
        {edicao === 'phb2014' ? 'D&D 5e · Player’s Handbook (2014) — conferência manual' :
          'D&D revisado · Player’s Handbook (2024) / SRD 5.2.1'}.
        {' '}{recebidos} característica(s) adquirida(s){pendentes ? ` · ${pendentes} escolha(s) pendente(s)` : ''}.
      </p>
      <p className="mt-1 text-[11px] text-(--a-a998bd)">
        Os hexágonos oficiais não custam pontos nem duplicam benefícios. Os hexágonos personalizados do mestre aparecem no mesmo mapa, mas sua edição e liberação permanecem na área abaixo.
      </p>
    </div>
    <div className="flex flex-wrap items-center gap-2 border-b border-(--a-55456e) px-3 py-3 sm:px-4">
      {[{ id: 'todos', titulo: 'Todos os ramos' }, ...RAMOS_HEX_DND.map(r => ({ id: r.id, titulo: r.titulo }))].map(r =>
        <button key={r.id} type="button" aria-pressed={ramoAtivo === r.id}
          onClick={() => { setRamoAtivo(r.id as typeof ramoAtivo); setSelecionado(null) }}
          className={'rounded-lg border px-3 py-2 text-xs ' +
            (ramoAtivo === r.id ? 'border-(--a-b99bff) bg-(--s-34294f) font-semibold' : 'border-(--a-55456e) hover:bg-(--s-34294f)')}>
          {r.titulo}
        </button>)}
      {<label className="ml-auto flex items-center gap-2 text-xs text-(--a-c4b6d4)">
        <input type="checkbox" checked={futuros} onChange={e => setFuturos(e.target.checked)} /> Mostrar níveis futuros
      </label>}
    </div>
    {!visiveis.length && <p className="p-5 text-sm text-(--a-c4b6d4)">
      Escolha a classe, a espécie/raça e o antecedente na aba Principal para formar os ramos da árvore.
    </p>}
    <div className="grid gap-4 bg-[radial-gradient(ellipse_at_50%_30%,#241840_0%,#0b0814_70%)] p-3 sm:p-5">
      {RAMOS_HEX_DND.filter(r => ramoAtivo === 'todos' || r.id === ramoAtivo).map(r => {
        const grupo = visiveis.filter(n => n.ramo === r.id)
        return grupo.length ? <div key={r.id} className="rounded-xl border border-(--a-55456e)/70 bg-(--s-120e1f)/75 p-2 sm:p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: r.cor }}>
            <span aria-hidden>{r.icone}</span>{r.titulo}
            <span className="rounded-full border border-(--a-55456e) px-2 text-[10px] text-(--a-c4b6d4)">{grupo.length}</span>
          </h3>
          <div className="flex flex-wrap justify-center gap-x-2 gap-y-4 sm:justify-start">
            {grupo.map(n => {
              const selecionou = detalhe?.id === n.id
              const cor = estados[n.estado].fundo
              return <button key={n.id} type="button" aria-pressed={selecionou}
                aria-label={n.titulo + ' · ' + estados[n.estado].texto + ' · nível ' + n.nivel}
                title={n.titulo} onClick={() => setSelecionado(selecionou ? null : n.id)}
                className="group flex w-[118px] flex-col items-center gap-1.5 text-center sm:w-[133px]">
                <span className="relative flex h-[100px] w-[100px] items-center justify-center p-[3px] transition-transform group-hover:scale-105 sm:h-[112px] sm:w-[112px]"
                  style={{ clipPath: 'polygon(50% 0%,95% 25%,95% 75%,50% 100%,5% 75%,5% 25%)',
                    background: selecionou ? '#fff' : r.cor, opacity: n.estado === 'futuro' ? 0.5 : 1 }}>
                  <span className="flex h-full w-full flex-col items-center justify-center gap-1 px-2"
                    style={{ clipPath: 'polygon(50% 0%,95% 25%,95% 75%,50% 100%,5% 75%,5% 25%)',
                      background: `linear-gradient(160deg, ${cor}, #181126)` }}>
                    <strong className="line-clamp-2 text-[10px] leading-tight text-white sm:text-[11px]">
                      {n.titulo.length > 38 ? n.titulo.slice(0, 35) + '…' : n.titulo}
                    </strong>
                    <span className="text-[9px] font-bold text-amber-100">Nv. {n.nivel} {n.estado === 'recebido' ? '✓' : n.estado === 'pendente' ? '?' : ''}</span>
                  </span>
                </span>
                <span className="line-clamp-1 w-full text-[10px] text-(--a-cfc0df)">{resumo(n)}</span>
              </button>
            })}
          </div>
        </div> : null
      })}
    </div>
    {detalhe ? <div className="border-t border-(--a-62527e) bg-(--s-201a32) p-4" role="region" aria-label="Detalhes do hexágono">
      <div className="flex items-start justify-between gap-3">
        <div><h3 className="font-semibold text-(--a-ed9cd8)">{detalhe.titulo}</h3>
          <p className="text-xs text-(--a-c4b6d4)">
            {RAMOS_HEX_DND.find(x => x.id === detalhe.ramo)?.titulo} · Nível {detalhe.nivel} · {estados[detalhe.estado].texto}
          </p></div>
        <button type="button" onClick={() => setSelecionado(null)} aria-label="Fechar detalhes" className="rounded-lg border border-(--a-55456e) p-2"><X size={15}/></button>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-(--a-cfc0df)">{detalhe.descricao}</p>
      {detalhe.escolha && <p className="mt-2 text-xs text-emerald-200">Escolha registrada: {detalhe.escolha}</p>}
      {detalhe.estado === 'pendente' && <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-200">
        <CircleHelp size={14}/> {detalhe.ramo === 'mestre' ? 'Hexágono personalizado ainda não liberado: o mestre controla sua liberação na árvore editável abaixo.' : 'Registre esta escolha no painel de Progressão / Origem abaixo.'}
      </p>}
      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-(--a-c4b6d4)">
        <BookOpenCheck size={13}/> Fonte: {detalhe.livro}. {detalhe.estado === 'referencia' ? 'Efeitos comerciais não concedidos automaticamente.' : ''}
      </p>
    </div> : <p className="flex items-center gap-1 px-4 py-3 text-xs text-(--a-c4b6d4)">
      <ChevronDown size={14}/> Toque num hexágono para ver a descrição, a origem e se já foi adquirido.
    </p>}
  </section>
}
