'use client'

import { BookOpenCheck, ChevronRight, CircleHelp, ScrollText, Swords, WandSparkles } from 'lucide-react'
import type { DadosFicha } from '@/lib/sistemas/tipos'
import { CLASSES_SRD } from '@/lib/sistemas/dnd2024Srd'
import { progressoDaFichaDnd } from '@/lib/sistemas/dnd2024Ficha'
import { progressaoVisivel, type MarcoVisivel } from '@/lib/sistemas/dnd2024Progressao'
import { MARCOS_DND_2024 } from '@/lib/sistemas/dnd2024Marcos'
import { ANTECEDENTES_GUIADOS, lerRegistroAntecedenteDnd } from '@/lib/sistemas/dnd2024Antecedentes'
import { periciasClasseDnd, nomePericiaDnd } from '@/lib/sistemas/dnd2024PericiasClasse'

const btn = 'inline-flex min-h-9 items-center gap-1 rounded-lg border border-(--a-5e4b78) px-3 py-1.5 text-xs hover:bg-(--s-34294f)'
type Props = { d: DadosFicha; irPara: (aba: string) => void; modoManual?: boolean }
const pendentes = (m: MarcoVisivel[]) => m.filter(x => x.estado === 'escolher' || x.estado === 'pendente')
const adquiridos = (m: MarcoVisivel[]) => m.filter(x => x.estado === 'adquirido' && x.modo === 'automatico')
const descricaoEscolha = (m: MarcoVisivel[]) => m.filter(x => x.modo === 'escolha' && x.estado === 'adquirido')
  .map(x => x.opcoes?.find(o => o.id === x.escolha)?.nome).filter((v): v is string => !!v)
const limit = (x: string[], n = 3) => x.slice(0, n).join(' · ') + (x.length > n ? ` · +${x.length - n}` : '')

/** Resumo de origem voltado ao jogador: distingue decisões, benefícios e onde editar. */
export default function ResumoEscolhasDnd2024({ d, irPara, modoManual = false }: Props) {
  const progresso = progressoDaFichaDnd(d)
  const vis = progressaoVisivel(MARCOS_DND_2024, progresso).filter(m => m.estado !== 'futuro')
  const classe = CLASSES_SRD.find(x => x.nome === d.campos.classe)
  const antigo = lerRegistroAntecedenteDnd(d.dndAntecedente)
  const def = ANTECEDENTES_GUIADOS[progresso.antecedenteId ?? '']
  const registro = antigo?.id === def?.id ? antigo : null
  const destaClasse = vis.filter(m => m.origem === 'classe' || m.origem === 'subclasse')
  const daEspecie = vis.filter(m => m.origem === 'especie')
  const doAntecedente = vis.filter(m => m.origem === 'antecedente')
  const itens = [
    { id: 'classe', icone: <Swords size={18} />, titulo: 'Classe e subclasse', nome: String(d.campos.classe || 'Não escolhida'),
      ir: 'arvore', tituloBotao: 'Escolher características', marcos: destaClasse,
      recebe: classe ? [`Dado de Vida d${classe.dv}`, `Salvaguardas ${classe.salvaguardas.join(' e ')}`, `${classe.pericias.qtd} perícia(s) iniciais`] : [],
      extra: classe ? `Perícias selecionadas: ${periciasClasseDnd(d).map(nomePericiaDnd).join(', ') || 'nenhuma'}.` : 'Selecione uma classe na aba Principal.',
    },
    { id: 'antecedente', icone: <ScrollText size={18} />, titulo: 'Antecedente', nome: String(d.campos.antecedente || 'Não escolhido'),
      ir: 'atributos', tituloBotao: 'Configurar antecedente', marcos: doAntecedente,
      recebe: def ? [`Talento: ${def.talento}`, `Perícias: ${def.pericias.map(nomePericiaDnd).join(', ')}`, `Ferramenta: ${def.ferramenta}`] : [],
      extra: def ? `Atributos: ${def.elegiveis.join(' / ')} · Distribuição: ${registro ? Object.entries(registro.aumentos).map(([a, n]) => a + ' +' + n).join(', ') || 'pendente' : 'pendente'} · Equipamento: ${registro?.equipamento === 'pacote' ? 'pacote' : registro?.equipamento === 'moedas' ? 'moedas' : 'não registrado'}.` : 'Selecione um antecedente na aba Principal.',
    },
    { id: 'especie', icone: <WandSparkles size={18} />, titulo: 'Espécie (raça)', nome: String(d.campos.especie || 'Não escolhida'),
      ir: 'arvore', tituloBotao: 'Escolher linhagem e traços', marcos: daEspecie,
      recebe: adquiridos(daEspecie).map(x => x.nome),
      extra: 'Traços, resistências e habilidades raciais são mostrados na aba Poderes. Magias inatas aparecem no Grimório.',
    },
  ]
  return <section aria-label="Resumo das escolhas de D&D" className="rounded-2xl border border-(--a-55456e) bg-(--s-201a32) p-4 sm:p-5">
    <div className="mb-3">
      <h2 className="flex items-center gap-2 font-semibold text-(--a-ed9cd8)"><BookOpenCheck size={18} /> Suas escolhas de D&D</h2>
      <p className="mt-1 text-xs text-(--a-c4b6d4)">O que a ficha concede, o que você já escolheu e o que falta decidir. O nível de cada classe conta na multiclasse; espécie e antecedente seguem o nível do personagem.</p>
      {modoManual && <p className="mt-1 text-xs text-amber-200">Modo manual: estas informações são referência, sem conceder efeitos automáticos.</p>}
    </div>
    <div className="grid gap-3 xl:grid-cols-3">
      {itens.map(x => <article key={x.id} className="flex min-w-0 flex-col rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3">
        <div className="flex items-center gap-2 text-(--a-d3adf0)">{x.icone}<h3 className="text-xs font-semibold uppercase tracking-wide">{x.titulo}</h3></div>
        <strong className="mt-1 text-base">{x.nome}</strong>
        <p className="mt-2 text-[11px] font-semibold uppercase text-(--a-c4b6d4)">Recebe</p>
        <p className="mt-0.5 text-xs text-(--a-cfc0df)">{x.recebe.length ? limit(x.recebe) : 'Escolha para consultar os benefícios.'}</p>
        <p className="mt-2 text-[11px] font-semibold uppercase text-(--a-c4b6d4)">Escolhas feitas</p>
        <p className="mt-0.5 text-xs text-(--a-cfc0df)">{limit(descricaoEscolha(x.marcos)) || 'Nenhuma ainda'}</p>
        <p className="mt-2 text-[11px] text-(--a-a998bd)">{x.extra}</p>
        {pendentes(x.marcos).length > 0 && <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-950/15 p-2">
          <p className="flex items-center gap-1 text-xs font-semibold text-amber-200"><CircleHelp size={13} /> {pendentes(x.marcos).length} pendente(s)</p>
          <p className="mt-1 text-xs text-amber-100">{limit(pendentes(x.marcos).map(m => m.nome), 2)}</p>
        </div>}
        <button type="button" className={btn + ' mt-auto self-start pt-2'} onClick={() => irPara(x.ir)}>
          {x.tituloBotao} <ChevronRight size={14} />
        </button>
      </article>)}
    </div>
    <p className="mt-3 text-[11px] text-(--a-a998bd)">Fonte: SRD 5.2.1 (CC BY 4.0). Opções do Livro do Jogador 2024 são apenas referências quando o mestre libera o livro; o texto completo permanece na fonte oficial.</p>
  </section>
}
