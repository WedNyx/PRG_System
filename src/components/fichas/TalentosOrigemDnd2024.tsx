'use client'

/** Talentos de origem ativos na ficha: resumo de regras, efeitos e limites. Não copia o PHB comercial. */
import { toast } from 'sonner'
import type { DadosFicha } from '@/lib/sistemas/tipos'
import type { Calculo } from '@/lib/sistemas/calculo'
import { idDe } from '@/lib/sistemas/dnd2024Classes'
import { ANTECEDENTES_GUIADOS, lerRegistroAntecedenteDnd } from '@/lib/sistemas/dnd2024Antecedentes'

const NOMES: Record<string, string> = {
  alerta: 'Alerta', 'iniciado-magia': 'Iniciado em Magia', 'iniciado-magia-clerigo': 'Iniciado em Magia (Clérigo)',
  'iniciado-magia-druida': 'Iniciado em Magia (Druida)', 'iniciado-magia-mago': 'Iniciado em Magia (Mago)',
  'atacante-selvagem': 'Atacante Selvagem', habilidoso: 'Habilidoso',
  crafter: 'Artesão', healer: 'Curandeiro', lucky: 'Sortudo', musician: 'Músico',
  'tavern-brawler': 'Brigão de Taverna', tough: 'Robusto',
}
const INSTRUCOES: Record<string, string> = {
  alerta: 'Soma o bônus de proficiência à Iniciativa (calculado na ficha). Também permite trocar a Iniciativa com um aliado disposto; resolva na mesa.',
  'iniciado-magia': 'Duas magias de nível 0 e uma de nível 1 da lista escolhida. A magia de nível 1 tem uma conjuração gratuita por descanso longo; use o painel de Magias para rolar com o atributo escolhido.',
  'atacante-selvagem': 'Uma vez no turno, ao causar dano com arma, role os dados de dano da arma duas vezes e escolha o resultado. Aplique no ataque específico; o sistema não modifica automaticamente as armas.',
  habilidoso: 'Três perícias ou ferramentas adicionais. As perícias registradas são aplicadas como proficiências, sem somar o grau duas vezes.',
  crafter: 'Três ferramentas de artesão, desconto de 20% na compra de itens não mágicos e fabricação rápida conforme a tabela do livro. Registre as compras e a criação de itens com o mestre.',
  healer: 'Ao utilizar kit de curandeiro, o alvo pode gastar um Dado de Vida e acrescentar sua proficiência à cura; também há regra de repetir resultados 1 em curas. Controle o dado do alvo e o kit em mesa.',
  lucky: 'Pontos de Sorte iguais ao bônus de proficiência, recuperados com descanso longo. Um ponto pode dar Vantagem a um teste de d20 ou impor Desvantagem a um ataque contra você.',
  musician: 'Proficiência em três instrumentos musicais. Ao terminar descanso curto ou longo, pode conceder Inspiração Heroica a aliados em quantidade até seu bônus de proficiência.',
  'tavern-brawler': 'Ataque desarmado, proficiência com armas improvisadas e empurrão situacional. O dado de dano desarmado tem regra própria para resultados 1; confira o livro ao rolar.',
  tough: 'Seu máximo de PV recebe +2 por nível de personagem. O cálculo da ficha já considera esse bônus uma única vez.',
}
const resolver = (id: string) => id.startsWith('iniciado-magia') ? 'iniciado-magia' : id
type Props = { d: DadosFicha; c: Calculo; onChange: (d: DadosFicha) => void; somenteLeitura: boolean; compacto?: boolean }

/** Quadro visível tanto junto à árvore Híbrida como nas habilidades e magias da ficha. */
export default function TalentosOrigemDnd2024({ d, c, onChange, somenteLeitura, compacto = false }: Props) {
  const id = idDe(d.campos.antecedente)
  const def = ANTECEDENTES_GUIADOS[id]
  const registro = lerRegistroAntecedenteDnd(d.dndAntecedente)
  const talentoAntecedente = id === 'forasteiro'
    ? (registro?.id === id ? registro.talento : undefined)
    : def?.talentoId
  const talentoHumano = idDe(d.campos.especie) === 'humano' ? d.dndEscolhas?.['esp-humano-versatil'] : undefined
  const talentos = [talentoAntecedente, talentoHumano].filter((v): v is string => !!v)
  const unicos = [...new Set(talentos.map(resolver))]
  if (!unicos.length) return null
  const usos = Math.max(0, Number(d.recursos.pontos_sorte?.atual ?? 0))
  const max = Math.max(0, Number(c.recursosMax.pontos_sorte ?? 0))
  const gastarSorte = () => {
    if (somenteLeitura || max < 1 || usos < 1) { toast.error('Sem Pontos de Sorte disponíveis.'); return }
    onChange({ ...d, recursos: { ...d.recursos, pontos_sorte: { ...d.recursos.pontos_sorte, atual: usos - 1 } } })
    toast.success('Um Ponto de Sorte gasto. Escolha Vantagem ou Desvantagem na rolagem, conforme o talento.')
  }
  return <section aria-label="Talentos de origem D&D 2024" className="space-y-3 rounded-xl border border-(--a-55456e) bg-(--s-201a32) p-4">
    <div>
      <h3 className="font-semibold text-(--a-ed9cd8)">Talentos de origem ativos</h3>
      <p className="text-xs text-(--a-c4b6d4)">Vêm do antecedente e, se aplicável, do Humano Versátil. Suas escolhas continuam independentes dos hexágonos personalizados do mestre.</p>
    </div>
    <div className={compacto ? 'grid gap-2 sm:grid-cols-2' : 'space-y-2'}>
      {unicos.map(t => <article key={t} className="rounded-lg border border-(--a-3d3152) p-3">
        <strong className="text-sm">{NOMES[t] ?? t}</strong>
        <p className="mt-1 text-xs text-(--a-cfc0df)">{INSTRUCOES[t] ?? 'Consulte a fonte oficial autorizada para conferir o benefício e suas escolhas.'}</p>
        {t === 'alerta' && <p className="mt-1 text-xs text-emerald-200">Bônus automático de Iniciativa: +{Number(c.vars.dnd_ini_extra) || 0}</p>}
        {t === 'tough' && <p className="mt-1 text-xs text-emerald-200">PV adicionais calculados: +{2 * (Number(d.campos.nivel) || 1)}</p>}
        {t === 'lucky' && <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-emerald-200">Pontos de Sorte: {Math.min(usos, max)}/{max}</span>
          {!compacto && <button type="button" disabled={somenteLeitura || usos < 1 || max < 1}
            onClick={gastarSorte} className="rounded-md border border-(--a-62527e) px-2 py-1 text-xs disabled:opacity-40">
            Gastar 1 ponto (resolva Vantagem/Desvantagem na rolagem)
          </button>}
        </div>}
      </article>)}
    </div>
    <p className="text-[11px] text-(--a-a998bd)">Os benefícios narrativos e situacionais não são concedidos automaticamente como modificadores permanentes. Consulte o SRD ou o Livro do Jogador 2024, conforme a origem.</p>
  </section>
}
