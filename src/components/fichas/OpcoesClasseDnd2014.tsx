'use client'
import type {DadosFicha} from '@/lib/sistemas/tipos'
import {useState} from 'react'
import {niveisConjuradores2014,limiteMetamagia2014,PACTOS_BRUXO_2014,METAMAGICAS_2014,custoMetamagia2014,usarMetamagia2014} from '@/lib/sistemas/dnd2014OpcoesClasse'
const select='min-h-11 w-full min-w-0 rounded-lg border border-(--a-55456e) bg-(--s-151123) p-2 text-sm'
export default function OpcoesClasseDnd2014({d,onChange,somenteLeitura}:{
 d:DadosFicha;onChange:(d:DadosFicha)=>void;somenteLeitura:boolean
}) {
 const [circulo,setCirculo]=useState(1)
 const [mensagem,setMensagem]=useState('')
 const n=niveisConjuradores2014(d)
 const op=d.dnd2014OpcoesClasse??{}
 const max=limiteMetamagia2014(n.feiticeiro)
 const pontosRestantes=d.recursos?.feiticaria?.atual===undefined?
   n.feiticeiro:Number(d.recursos.feiticaria.atual)
 if(n.bruxo<3&&max===0)return null
 return <section aria-label="Escolhas de classe do Bruxo e Feiticeiro 2014"
   className="min-w-0 space-y-3 rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3">
   <h4 className="font-semibold text-(--a-d3adf0)">🧙 Escolhas de classe · PHB 2014</h4>
   {n.bruxo>=3&&<label className="block text-xs">
     Dádiva do Pacto · Bruxo nível {n.bruxo}
     <select className={select} value={op.pactoBruxo??''} disabled={somenteLeitura}
      onChange={e=>onChange({...d,dnd2014OpcoesClasse:{...op,pactoBruxo:e.target.value||undefined}})}>
      <option value="">Escolha uma dádiva...</option>
      {PACTOS_BRUXO_2014.map(x=><option key={x} value={x}>{x}</option>)}
     </select>
     <span className="mt-1 block text-(--a-c4b6d4)">A dádiva e o patrono são escolhas diferentes; os benefícios exatos exigem conferência do livro.</span>
   </label>}
   {max>0&&<div className="space-y-2">
     <p className="text-xs">Metamagia · Feiticeiro nível {n.feiticeiro} · {(op.metamagicas??[]).length}/{max}</p>
     <div className="flex flex-wrap gap-2">
      {(op.metamagicas??[]).map(x=><span key={x}
       className="inline-flex items-center gap-2 rounded-lg border border-(--a-55456e) px-2 py-1 text-xs">
       {x}
       {!somenteLeitura&&<button type="button" aria-label={'Remover '+x}
        className="min-h-8 min-w-8" onClick={()=>onChange({...d,dnd2014OpcoesClasse:{
         ...op,metamagicas:(op.metamagicas??[]).filter(y=>y!==x)}})}>×</button>}
      </span>)}
     </div>
     {(op.metamagicas??[]).length<max&&!somenteLeitura&&<select className={select} value=""
       onChange={e=>{if(e.target.value)onChange({...d,dnd2014OpcoesClasse:{
        ...op,metamagicas:[...(op.metamagicas??[]),e.target.value]}})}}>
       <option value="">Escolha uma metamagia...</option>
       {METAMAGICAS_2014.filter(x=>!(op.metamagicas??[]).includes(x))
         .map(x=><option key={x} value={x}>{x}</option>)}
      </select>}
     <div className="space-y-2 rounded-lg border border-(--a-55456e) p-3">
       <p className="text-xs font-semibold">Pontos de Feitiçaria restantes: {pontosRestantes}/{n.feiticeiro}</p>
       <label className="block text-xs">Círculo da magia ao utilizar Metamagia
         <select className={select} value={circulo}
           onChange={e=>setCirculo(Number(e.target.value))}>
           {Array.from({length:10},(_,i)=>i).map(i=>
             <option key={i} value={i}>{i===0?'Truque':i+'º círculo'}</option>)}
         </select>
       </label>
       <div className="flex flex-wrap gap-2">
         {(op.metamagicas??[]).map(nome=>{
           const custo=custoMetamagia2014(nome,circulo)
           return <button type="button" key={nome}
             className="min-h-10 rounded-lg border border-(--a-55456e) px-3 py-2 text-xs"
             disabled={somenteLeitura||custo===null||pontosRestantes<(custo??Infinity)}
             onClick={()=>{
               if(!window.confirm('Confirmar o gasto de '+custo+' ponto(s) de Feitiçaria para '+nome+
                   '? Verifique se a magia cumpre as condições do PHB 2014.'))return
               const resultado=usarMetamagia2014(d,nome,circulo)
               if(!resultado){setMensagem('Uso indisponível: pontos insuficientes ou opção incompatível.');return}
               onChange(resultado.ficha)
               setMensagem(nome+': '+resultado.custo+' ponto(s) de Feitiçaria descontado(s).')
             }}>{nome} · gastar {custo??'?'} PF</button>
         })}
       </div>
       {mensagem&&<p role="status" className="text-xs text-sky-200">{mensagem}</p>}
       <p className="text-xs text-(--a-c4b6d4)">O botão desconta apenas o recurso já existente da ficha.
         Não conjura a magia nem verifica automaticamente alvo, alcance, concentração ou componentes.
         Somente uma Metamagia por conjuração, salvo a exceção de Magia Potencializada conforme o PHB 2014.
         Os pontos retornam no descanso longo.</p>
     </div>
   </div>}
 </section>
}
