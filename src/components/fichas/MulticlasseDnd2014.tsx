'use client'

import {useState} from 'react'
import {Minus,Plus,Users} from 'lucide-react'
import type {DadosFicha} from '@/lib/sistemas/tipos'
import {CLASSES_SRD} from '@/lib/sistemas/dnd2024Srd'
import {atributosEfetivos2014} from '@/lib/sistemas/dnd2014Regras'
import {classesDaFicha2014, espacosDeMagia2014} from '@/lib/sistemas/dnd2014Multiclasse'
import {requisitosMulticlasse} from '@/lib/sistemas/dnd2024Classes'
const btn='inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-(--a-5e4b78) px-3 py-2 text-sm disabled:opacity-40 hover:bg-(--s-34294f)'

export default function MulticlasseDnd2014({d,onChange,somenteLeitura=false}:{
 d:DadosFicha;onChange:(d:DadosFicha)=>void;somenteLeitura?:boolean
}) {
 const {total,lista,outras}=classesDaFicha2014(d)
 const [nova,setNova]=useState('')
 const [erro,setErro]=useState('')
 const esp=espacosDeMagia2014(lista,d.dnd2014Subclasse)
 const disponíveis=CLASSES_SRD.filter(c=>!lista.some(x=>x.cls.id===c.id))
 const atributos=atributosEfetivos2014(d)??d.atributos
 const faltas=nova?requisitosMulticlasse(atributos,[...lista.map(x=>x.cls.id),nova]):[]
 const primeiro=lista.find(c=>c.principal)
 if(!primeiro)return null
 function mudar(id:string|null,delta:1|-1) {
   const proximas={...outras}
   if(id) {const n=(proximas[id]??0)+delta;if(n>0)proximas[id]=n;else delete proximas[id]}
   const novoTotal=total+delta
   if(novoTotal<1||novoTotal>20||Object.values(proximas).reduce((a,b)=>a+b,0)>=novoTotal){
     setErro('A classe inicial precisa conservar pelo menos 1 nível e o total não pode passar de 20.')
     return
   }
   setErro('')
   onChange({...d,campos:{...d.campos,nivel:novoTotal},dnd2014Multiclasse:proximas})
 }
 return <section aria-label="Multiclasse de D&D 2014" className="space-y-3 rounded-2xl border border-(--a-55456e) bg-(--s-201a32) p-4">
   <h3 className="flex items-center gap-2 font-semibold text-(--a-ed9cd8)"><Users size={18}/> Multiclasse · D&D 2014 · nível total {total}</h3>
   <p className="text-xs text-(--a-c4b6d4)">O Livro do Jogador 2014 usa os níveis reais de cada classe.
     Paladino e Patrulheiro contam metade <strong>arredondada para baixo</strong> quando combinados
     com outra classe conjuradora; Magia de Pacto do Bruxo é separada.
     Salvaguardas iniciais não são concedidas novamente por multiclasse.</p>
   <ul className="space-y-2">{lista.map(c=><li key={c.cls.id}
     className="flex flex-wrap items-center gap-2 rounded-lg border border-(--a-55456e) bg-(--s-171325) p-2">
     <span className="min-w-0 flex-1 text-sm font-semibold">{c.cls.nome} · nível {c.nivel}
       {c.principal&&<span className="ml-2 text-xs text-(--a-d3adf0)">Classe inicial</span>}</span>
     {!somenteLeitura&&<>
       {!c.principal&&<button type="button" className={btn} aria-label={'Remover um nível de '+c.cls.nome}
         onClick={()=>mudar(c.cls.id,-1)}><Minus size={16}/></button>}
       <button type="button" className={btn} disabled={total>=20}
         aria-label={'Subir um nível de '+c.cls.nome} onClick={()=>mudar(c.principal?null:c.cls.id,1)}><Plus size={16}/></button>
     </>}
   </li>)}</ul>
   {(esp.conjuradores.length>0||esp.pacto>0)&&<p className="text-xs text-(--a-d3adf0)">
     Conjurador nível {esp.nivelConjurador}: {esp.espacos.slice(1).map((v,i)=>v?`${v}×${i+1}º`:'').filter(Boolean).join(', ')||'sem espaços'}.
     {esp.pacto>0&&` Pacto separado: ${esp.pacto} espaço(s) de ${esp.pactoNivel}º nível.`}
   </p>}
   {!somenteLeitura&&total<20&&<div className="space-y-2 rounded-xl border border-dashed border-(--a-55456e) p-3">
     <label className="block text-xs font-semibold">Entrar em outra classe (2014)
       <select value={nova} onChange={e=>setNova(e.target.value)}
         className="mt-1 min-h-10 w-full rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-white">
         <option value="">Selecione...</option>
         {disponíveis.map(c=><option value={c.id} key={c.id}>{c.nome}</option>)}
       </select>
     </label>
     {nova&&<div className="space-y-2">
       {faltas.length>0&&<p className="text-xs text-amber-200">Requisitos de atributo: {faltas.join('; ')}.</p>}
       <button type="button" className={btn} disabled={faltas.length>0}
         onClick={()=>{mudar(nova,1);setNova('')}}>Adicionar nível em {CLASSES_SRD.find(c=>c.id===nova)?.nome}</button>
       <p className="text-[11px] text-(--a-a998bd)">Características da nova classe e subclasse aparecem como referência;
         escolha magias conforme o nível dessa classe, não pelo espaço mais alto da multiclasse.
         O mestre confere novas proficiências da classe.</p>
     </div>}
   </div>}
   {erro&&<p role="alert" className="text-xs text-rose-200">{erro}</p>}
 </section>
}
