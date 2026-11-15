'use client'

import type {DadosFicha} from '@/lib/sistemas/tipos'
import {classesDaFicha2014} from '@/lib/sistemas/dnd2014Multiclasse'
import {subclasseDaFicha2014} from '@/lib/sistemas/dnd2014Subclasses'
import {gruposSubclasseDaFicha2014} from '@/lib/sistemas/dnd2014EscolhasSubclasse'

const input='min-h-11 min-w-0 w-full rounded-lg border border-(--a-55456e) bg-(--s-151123) p-2 text-sm'
const btn='min-h-10 rounded-lg border border-(--a-55456e) px-3 py-2 text-xs hover:bg-(--s-34294f)'

export default function EscolhasSubclasseDnd2014({d,onChange,somenteLeitura}:{
 d:DadosFicha;onChange:(d:DadosFicha)=>void;somenteLeitura:boolean
}) {
 const classes=classesDaFicha2014(d).lista
 const ativas=classes.flatMap(c=>{
  const sub=subclasseDaFicha2014(d,c.cls.id)
  const grupos=gruposSubclasseDaFicha2014(d,c.cls.id)
  return sub&&grupos.length?[{classe:c.cls.id,classeNome:c.cls.nome,sub,grupos}]:[]
 })
 if(!ativas.length)return null
 const atualizar=(classe:string,subclasse:string,grupo:string,selecionadas:string[])=>{
  const todas={...d.dnd2014EscolhasSubclasse}
  const entrada=todas[classe]?.subclasse===subclasse
    ? {...todas[classe],grupos:{...todas[classe].grupos}}
    : {subclasse,grupos:{} as Record<string,string[]>}
  entrada.grupos[grupo]=selecionadas
  todas[classe]=entrada
  onChange({...d,dnd2014EscolhasSubclasse:todas})
 }
 return <section aria-label="Escolhas internas das subclasses D&D 2014"
   className="min-w-0 space-y-4 rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3">
   <h4 className="font-semibold text-(--a-d3adf0)">🌿 Decisões das subclasses · Livro do Jogador 2014</h4>
   <p className="text-xs text-(--a-c4b6d4)">As opções respeitam o nível de cada classe, inclusive multiclasse. Selecionar não aplica
     efeitos situacionais nem copia os textos comerciais; use o livro e confirme com o mestre.</p>
   {ativas.map(x=><div key={x.classe} className="space-y-3 rounded-xl border border-(--a-55456e) p-3">
     <h5 className="text-sm font-semibold">{x.classeNome} — {x.sub.nome}</h5>
     {x.grupos.map(grupo=>{
       const guardado=d.dnd2014EscolhasSubclasse?.[x.classe]
       const atual=guardado?.subclasse===x.sub.id?guardado.grupos[grupo.id]??[]:[]
       const usadasEmOutros=grupo.id.startsWith('manobras-')?
         new Set(x.grupos.filter(g=>g.id!==grupo.id&&g.id.startsWith('manobras-'))
           .flatMap(g=>guardado?.subclasse===x.sub.id?guardado.grupos[g.id]??[]:[])):new Set<string>()
       return <div key={grupo.id} className="space-y-2">
         <p className="text-xs font-medium">{grupo.titulo} · nível {grupo.nivel} · {atual.length}/{grupo.quantidade}</p>
         {atual.length>0&&<div className="flex flex-wrap gap-2">
           {atual.map(nome=><span key={nome} className="inline-flex max-w-full items-center gap-1 rounded-lg border border-(--a-62527e) px-2 py-1.5 text-xs">
             <span className="min-w-0 break-words">{nome}</span>
             {!somenteLeitura&&<button type="button" className="ml-1 min-h-8 min-w-8" aria-label={'Remover '+nome}
              onClick={()=>atualizar(x.classe,x.sub.id,grupo.id,atual.filter(n=>n!==nome))}>×</button>}
           </span>)}
         </div>}
         {atual.length<grupo.quantidade&&!somenteLeitura&&<select className={input} value=""
          aria-label={'Adicionar escolha em '+grupo.titulo}
          onChange={e=>{if(e.target.value)atualizar(x.classe,x.sub.id,grupo.id,[...atual,e.target.value])}}>
           <option value="">Escolha uma opção...</option>
           {grupo.opcoes.filter(o=>!atual.includes(o)&&!usadasEmOutros.has(o))
             .map(o=><option value={o} key={o}>{o}</option>)}
         </select>}
       </div>
     })}
   </div>)}
   <p className="text-xs text-amber-200">Os benefícios específicos dessas escolhas continuam condicionais ao livro e à mesa.
     Nenhum efeito não implementado será aplicado automaticamente.</p>
 </section>
}
