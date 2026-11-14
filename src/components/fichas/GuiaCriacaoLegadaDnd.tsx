'use client'

import type { DadosFicha } from '@/lib/sistemas/tipos'
import { SUBRACAS_2014, RACAS_2014, ANTECEDENTES_2014 } from '@/lib/sistemas/dnd2014Criacao'
import { ATRIBUTOS_DND, aumentosRaciais2014, atributosEfetivos2014, lerAtributosBase2014,
  periciasAntecedente2014, periciasClasse2014 } from '@/lib/sistemas/dnd2014Regras'

type Props = { d: DadosFicha; onChange: (d: DadosFicha) => void; somenteLeitura: boolean }
const classInput = 'mt-1 min-w-0 w-full rounded-xl border border-(--a-62527e) bg-(--s-151123) p-2.5 text-sm text-white'
const nomes: Record<string,string> = { FOR:'Força',DES:'Destreza',CON:'Constituição',INT:'Inteligência',SAB:'Sabedoria',CAR:'Carisma' }
const nomePericia = (x:string) => x.replaceAll('_',' ').replace(/(^|\s)\p{L}/gu, c => c.toUpperCase())

export default function GuiaCriacaoLegadaDnd({ d, onChange, somenteLeitura }: Props) {
  const raca = String(d.campos.especie ?? '')
  const classe = String(d.campos.classe ?? '')
  const antecedente = String(d.campos.antecedente ?? '')
  const subracas = SUBRACAS_2014[raca] ?? []
  const racaMeta = RACAS_2014.find(x => x.nome === raca)
  const antMeta = ANTECEDENTES_2014.find(x => x.nome === antecedente)
  const escolha = String(d.campos.subraca2014 ?? '')
  const sub = subracas.find(x => x.nome === escolha)
  const base = lerAtributosBase2014(d.dnd2014AtributosBase)
  const aumento = aumentosRaciais2014(raca,escolha,d.dnd2014AtributosExtras)
  const total = atributosEfetivos2014(d)
  const escolhasExtras = d.dnd2014AtributosExtras ?? []
  const periciasClasse = periciasClasse2014(classe)
  const periciasEscolhidas = d.dnd2014PericiasClasse ?? []
  const raciais = d.dnd2014PericiasRaciais ?? []
  const qtdRaciais = raca === 'Meio-Elfo' ? 2 : raca === 'Humano' && escolha === 'Humano Variante' ? 1 : 0
  const todasPericias = periciasClasse2014('Bardo')?.opcoes ?? []
  const alterarRacial = (pos:number, pericia:string) => {
    const lista=Array.from({ length:qtdRaciais },(_,i)=>raciais[i]??'')
    lista[pos]=pericia
    onChange({ ...d, dnd2014PericiasRaciais:lista })
  }
  const doAntecedente = periciasAntecedente2014(antecedente)
  const precisaEscolher = raca === 'Meio-Elfo' || raca === 'Humano' && escolha === 'Humano Variante'
  const mudarBase = (atr: string, valor: number) => {
    if (!base) return
    onChange({ ...d, dnd2014AtributosBase: { ...base, [atr]: Math.max(1,Math.min(20,Number.isFinite(valor) ? Math.floor(valor) : 10)) } })
  }
  const mudarExtras = (pos:number, atr:string) => {
    const x = [...escolhasExtras]
    x[pos]=atr
    onChange({ ...d, dnd2014AtributosExtras: [...new Set(x.filter(Boolean))] })
  }
  const alterarPericia = (pos:number, pericia:string) => {
    const p = Array.from({ length: periciasClasse?.qtd ?? 0 }, (_,i) => periciasEscolhidas[i] ?? '')
    p[pos]=pericia
    onChange({ ...d, dnd2014PericiasClasse: p })
  }
  return <section aria-label="Regras de criação 2014" className="space-y-4 rounded-2xl border border-amber-500/35 bg-(--s-201a32) p-4 sm:p-5">
    <div>
      <h3 className="text-base font-semibold text-amber-100">📜 Criação D&D 5e · Livro do Jogador (2014)</h3>
      <p className="mt-1 text-xs text-(--a-c4b6d4)">
        Regras-base do SRD 5.1 (2014). Atributos raciais, proficiências básicas e recursos de classe
        são separados das regras revisadas de 2024. Subclasses, escolhas não cobertas pelo SRD e suplementos pagos
        continuam para conferência no livro com o mestre.
      </p>
    </div>
    {racaMeta && <p className="rounded-lg bg-(--s-171325) p-2 text-xs"><strong>Raça:</strong> {racaMeta.descricao}</p>}
    {subracas.length > 0 && <label className="block text-sm">Sub-raça / variante (Livro do Jogador 2014)
      <select value={subracas.some(x => x.nome === escolha) ? escolha : ''} disabled={somenteLeitura}
        onChange={e => onChange({ ...d, campos: { ...d.campos, subraca2014: e.target.value }, dnd2014AtributosExtras: [] })}
        className={classInput}>
        <option value="">Escolha a sub-raça</option>
        {subracas.map(x => <option key={x.nome} value={x.nome}>{x.nome}</option>)}
      </select>
      {sub && <span className="mt-1 block rounded-lg bg-(--s-171325) p-2 text-xs text-(--a-d3adf0)">{sub.detalhe}</span>}
    </label>}
    {antMeta && <p className="rounded-lg bg-(--s-171325) p-2 text-xs"><strong>Antecedente:</strong> {antMeta.descricao}</p>}
    <div className="space-y-3 rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3">
      <h4 className="text-sm font-semibold text-(--a-d3adf0)">Atributos de criação e bônus de raça (2014)</h4>
      {!base ? <>
        <p className="text-xs text-amber-200">A ficha não tem atributos-base confirmados. Os números já salvos são tratados como
          totais definitivos para evitar que os bônus raciais sejam adicionados novamente.</p>
        {!somenteLeitura && <button type="button" className="min-h-10 rounded-lg border border-amber-400/45 px-3 py-2 text-xs font-semibold"
          onClick={() => onChange({ ...d, dnd2014AtributosBase: Object.fromEntries(ATRIBUTOS_DND.map(a => [a, Math.max(1,Math.min(20,d.atributos[a] ?? 10))])) })}>
          Começar criação com atributos ANTES dos bônus raciais
        </button>}
        <p className="text-[11px] text-(--a-a998bd)">Use esse botão apenas para uma criação nova: os valores atuais serão
          tratados como valores ANTES dos bônus. Para uma ficha antiga com atributos finais, mantenha o modo manual.</p>
      </> : <>
        <p className="text-xs text-(--a-c4b6d4)">Edite os valores antes da raça. A tabela mostra bônus e total
          automaticamente. Os mesmos bônus não serão somados outra vez na ficha.</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {ATRIBUTOS_DND.map(a => <label key={a} className="rounded-lg border border-(--a-55456e) p-2 text-center text-xs">
            <span className="block font-semibold">{nomes[a]}</span>
            <input type="number" aria-label={'Atributo-base '+a} min={1} max={20} value={base[a]}
              disabled={somenteLeitura} onChange={e => mudarBase(a,Number(e.target.value))} className={classInput+' text-center'} />
            <span className="mt-1 block text-(--a-d3adf0)">+{aumento.bonus[a]} → <strong>{total?.[a] ?? base[a]}</strong></span>
          </label>)}
        </div>
      </>}
      {precisaEscolher && <div className="grid gap-2 sm:grid-cols-2">
        {[0,1].map(i => <label key={i} className="text-xs">Aumento variável {i+1}/2 · {raca}
          <select value={escolhasExtras[i] ?? ''} disabled={somenteLeitura} className={classInput}
            onChange={e => mudarExtras(i,e.target.value)}>
            <option value="">Escolha o atributo</option>
            {ATRIBUTOS_DND.filter(a => (raca !== 'Meio-Elfo' || a !== 'CAR') &&
              (escolhasExtras[i] === a || !escolhasExtras.includes(a))).map(a =>
              <option key={a} value={a}>{nomes[a]}</option>)}
          </select>
        </label>)}
      </div>}
      {aumento.pendencias.length>0 && <p role="status" className="text-xs text-amber-200">
        Pendente: {aumento.pendencias.join(' · ')}. Bônus incompletos ficam sinalizados.</p>}
    </div>
    {periciasClasse && <div className="rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3">
      <h4 className="text-sm font-semibold text-(--a-d3adf0)">Perícias iniciais de {classe} · SRD 5.1</h4>
      <p className="mt-1 text-xs text-(--a-c4b6d4)">Escolha {periciasClasse.qtd} perícia(s) da lista
        da classe. Seu antecedente já concede {doAntecedente.map(nomePericia).join(' e ') || 'nenhuma definida'}.
        Escolhas repetidas não recebem bônus adicional.</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {Array.from({ length: periciasClasse.qtd }, (_, i) => <label key={i} className="text-xs">
          Perícia {i+1}/{periciasClasse.qtd}
          <select className={classInput} disabled={somenteLeitura} value={periciasEscolhidas[i] ?? ''}
            onChange={e => alterarPericia(i,e.target.value)}>
            <option value="">Escolher...</option>
            {periciasClasse.opcoes.filter(x => !doAntecedente.includes(x) &&
              (!periciasEscolhidas.includes(x) || periciasEscolhidas[i] === x))
              .map(x => <option value={x} key={x}>{nomePericia(x)}</option>)}
          </select>
        </label>)}
      </div>
    </div>}
    {qtdRaciais>0 && <div className="rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3">
      <h4 className="text-sm font-semibold text-(--a-d3adf0)">
        Perícias raciais · {raca} {escolha}
      </h4>
      <p className="mt-1 text-xs text-(--a-c4b6d4)">
        {raca==='Meio-Elfo' ? 'Versatilidade: duas perícias à escolha.' : 'Humano Variante: uma perícia à escolha.'}
        Não repita as concedidas pela classe ou antecedente.
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {Array.from({length:qtdRaciais},(_,i)=><label key={i} className="text-xs">
          Perícia racial {i+1}/{qtdRaciais}
          <select className={classInput} disabled={somenteLeitura} value={raciais[i]??''}
            onChange={e=>alterarRacial(i,e.target.value)}>
            <option value="">Escolher...</option>
            {todasPericias.filter(x=> !doAntecedente.includes(x) && !periciasEscolhidas.includes(x) &&
              (raciais[i]===x || !raciais.includes(x))).map(x=><option key={x} value={x}>{nomePericia(x)}</option>)}
          </select>
        </label>)}
      </div>
    </div>}
    <p className="rounded-lg border border-amber-500/30 bg-amber-950/15 p-2 text-xs text-amber-200">
      Resta conferir no livro: traços condicionais, proficiências de ferramentas, equipamentos iniciais,
      subclasses, escolhas especiais, talentos e magias não contempladas pela automação. A edição 2024 não concede
      nada a esta ficha 2014.
    </p>
    <p className="text-[11px] text-(--a-a998bd)">Fonte aberta: <a target="_blank" rel="noopener noreferrer"
      href="https://www.dndbeyond.com/srd" className="underline">SRD 5.1 · Creative Commons BY 4.0</a>.
      As regras comerciais devem ser confirmadas na obra original.</p>
  </section>
}
