'use client'
import type {DadosFicha} from '@/lib/sistemas/tipos'
import {INIMIGOS_FAVORITOS_PDF_2014,nivelPatrulheiro2014} from '@/lib/sistemas/dnd2014PatrulheiroEscolhas'
const campo='mt-1 min-h-11 w-full min-w-0 rounded-lg border border-(--a-55456e) bg-(--s-151123) p-2.5 text-sm'
export default function EscolhasPatrulheiroDnd2014({d,onChange,somenteLeitura}:{
 d:DadosFicha;onChange:(d:DadosFicha)=>void;somenteLeitura:boolean
}) {
 const nivel=nivelPatrulheiro2014(d)
 if(nivel<1)return null
 return <section aria-label="Escolhas de Patrulheiro 2014" className="min-w-0 space-y-3 rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3">
   <h4 className="text-sm font-semibold text-(--a-d3adf0)">🏹 Patrulheiro · características de nível 1</h4>
   <p className="text-xs leading-relaxed text-(--a-c4b6d4)">
     O PDF de 2014 fornecido inclui uma versão de Inimigo Favorito e Explorador Natural que difere de outras publicações.
     O mestre confirma a variante usada. Aqui você registra a escolha sem ativar bônus duplicados.
   </p>
   <label className="block text-xs font-medium">Inimigo Favorito
     <select className={campo} disabled={somenteLeitura} value={d.dnd2014InimigoFavorito??''}
       onChange={e=>onChange({...d,dnd2014InimigoFavorito:e.target.value})}>
       <option value="">Escolha o tipo de inimigo...</option>
       {INIMIGOS_FAVORITOS_PDF_2014.map(nome=><option key={nome} value={nome}>{nome}</option>)}
     </select>
   </label>
   <label className="block text-xs font-medium">Idioma relacionado aos inimigos (quando aplicável)
     <input className={campo} maxLength={80} disabled={somenteLeitura}
       value={d.dnd2014IdiomaInimigo??''} placeholder="Ex.: Goblin, Silvestre..."
       onChange={e=>onChange({...d,dnd2014IdiomaInimigo:e.target.value})}/>
   </label>
   <p className="text-xs leading-relaxed text-(--a-c4b6d4)">
     Na Árvore, abra Inimigo Favorito ou Explorador Natural para ver uma explicação dos benefícios
     e das condições de uso. O botão da Árvore não concede habilidades nem altera a ficha.
   </p>
 </section>
}
