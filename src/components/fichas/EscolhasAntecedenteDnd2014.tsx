'use client'

import type { DadosFicha } from '@/lib/sistemas/tipos'
import { detalhesAntecedente2014, diagnosticarEscolhasAntecedente2014 } from '@/lib/sistemas/dnd2014AntecedentesDetalhes'
const input='w-full min-w-0 rounded-lg border border-(--a-62527e) bg-(--s-151123) p-2.5 text-sm text-white'

/** A ficha não concede duas vezes proficiências: ferramentas fixas vêm da
 * referência do antecedente, e este componente só registra escolhas variáveis.
 */
export default function EscolhasAntecedenteDnd2014({d,onChange,somenteLeitura}:{
 d:DadosFicha;onChange:(d:DadosFicha)=>void;somenteLeitura:boolean
}) {
  const ref=detalhesAntecedente2014(d.campos.antecedente)
  if(!ref)return null
  const atual=d.dnd2014AntecedenteExtras?.antecedente===ref.nome ? d.dnd2014AntecedenteExtras : null
  const idiomas=atual?.idiomas??[]
  const ferramentas=atual?.ferramentas??[]
  const valido=diagnosticarEscolhasAntecedente2014(d).length===0
  const atualizar=(campo:'idiomas'|'ferramentas',indice:number,valor:string)=>{
    const lista=Array.from({length:campo==='idiomas'?ref.idiomas:ref.ferramentasLivres},
      (_,i)=>(campo==='idiomas'?idiomas:ferramentas)[i]??'')
    lista[indice]=valor.slice(0,80).trimStart()
    const base=atual??{antecedente:ref.nome,idiomas:[],ferramentas:[]}
    onChange({...d,dnd2014AntecedenteExtras:{...base,[campo]:lista}})
  }
  return <section aria-label="Ferramentas e idiomas do antecedente 2014"
    className="min-w-0 space-y-3 rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3">
    <h4 className="font-semibold text-(--a-d3adf0)">🧰 Ferramentas e idiomas · {ref.nome} (2014)</h4>
    <p className="text-xs text-(--a-cfc0df)">O antecedente concede as perícias indicadas acima e estes benefícios adicionais.
      Registre escolhas livres sem repetir proficiências existentes. Não adicionamos itens ou bônus automaticamente.</p>
    {ref.ferramentasFixas.length>0&&<p className="text-xs">Proficiências fixas: {ref.ferramentasFixas.join(' · ')}.</p>}
    {ref.idiomas===0&&ref.ferramentasLivres===0
      ? <p className="text-xs text-(--a-c4b6d4)">Este antecedente não pede escolhas livres de idioma ou ferramenta.</p>
      : <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        {Array.from({length:ref.idiomas},(_,i)=><label key={'idioma'+i} className="text-xs">
          Idioma {i+1}/{ref.idiomas}
          <input className={input} value={idiomas[i]??''} placeholder="Ex.: Élfico" maxLength={80}
            disabled={somenteLeitura} onChange={e=>atualizar('idiomas',i,e.target.value)}/>
        </label>)}
        {Array.from({length:ref.ferramentasLivres},(_,i)=><label key={'ferramenta'+i} className="text-xs">
          {ref.tipoFerramenta??'Ferramenta'} · escolha {i+1}
          <input className={input} value={ferramentas[i]??''} placeholder="Qual instrumento, kit ou ferramenta?"
            maxLength={80} disabled={somenteLeitura} onChange={e=>atualizar('ferramentas',i,e.target.value)}/>
        </label>)}
      </div>}
    {ref.ferramentasLivres===0&&ref.idiomas===0&&!atual&&!somenteLeitura&&
      <button type="button" className="min-h-11 w-full rounded-lg border border-(--a-62527e) px-3 py-2 text-sm sm:w-auto"
        onClick={()=>onChange({...d,dnd2014AntecedenteExtras:{antecedente:ref.nome,idiomas:[],ferramentas:[]}})}>
        Confirmar proficiências do antecedente
      </button>}
    {valido?<p className="text-xs text-emerald-200">Escolhas registradas nesta ficha.</p>:
      <p className="text-xs text-amber-200" role="status">Confira idiomas, ferramentas e/ou escolha de antecedente no guia.</p>}
    <p className="text-xs text-(--a-cfc0df)">Kit de referência do antecedente (capítulo 4): {ref.equipamentos}.
      Registre os itens manualmente no Inventário quando escolher o método de kits.</p>
  </section>
}
