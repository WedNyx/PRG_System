'use client'

import {useState} from 'react'
import {BookOpen,Plus,Trash2,Dice5,Sparkles} from 'lucide-react'
import type {DadosFicha} from '@/lib/sistemas/tipos'
import type {Calculo} from '@/lib/sistemas/calculo'
import {classesDaFicha2014} from '@/lib/sistemas/dnd2014Multiclasse'
import {lerLivrosDnd,suplementoDndPorId} from '@/lib/sistemas/dndLivros'
import {lerMagias2014,maximoNivelMagiaClasse2014,expressaoMagia2014Valida,type RegistroMagiaDnd2014} from '@/lib/sistemas/dnd2014Magias'
import {magiasDaClasse2014} from '@/lib/sistemas/dnd2014CatalogoMagias'
import {idDe} from '@/lib/sistemas/dnd2024Classes'
const btn='inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-(--a-5e4b78) px-3 py-2 text-xs hover:bg-(--s-34294f) disabled:opacity-40'
const campo='min-h-10 w-full min-w-0 rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-sm text-white'
const nomeLivro=(id:string)=>id==='phb2014'?'Livro do Jogador 2014':suplementoDndPorId(id)?.titulo??id
type Props={d:DadosFicha;c:Calculo;onChange:(d:DadosFicha)=>void;somenteLeitura:boolean;rolar:(ex:string,rotulo:string)=>void}
export default function MagiasDnd2014({d,c,onChange,somenteLeitura,rolar}:Props) {
 const [nome,setNome]=useState('')
 const [buscaCatalogo,setBuscaCatalogo]=useState('')
 const [nivel,setNivel]=useState(0)
 const [classe,setClasse]=useState('')
 const [fonte,setFonte]=useState('phb2014')
 const [modo,setModo]=useState<'conhecida'|'preparada'|'extra'>('conhecida')
 const [notas,setNotas]=useState('')
 const [expressao,setExpressao]=useState('')
 const [aberto,setAberto]=useState(false)
 const [erro,setErro]=useState('')
 const livros=lerLivrosDnd(d.dndLivros,'phb2014')
 const fontes=[livros.base,...livros.suplementos]
 const {lista}=classesDaFicha2014(d)
 const magias=lerMagias2014(d.dnd2014Magias)
 const classeAtual=lista.find(x=>x.cls.id===classe)??lista[0]
 const permissao=classeAtual?maximoNivelMagiaClasse2014(classeAtual.cls.nome,classeAtual.nivel,
   classeAtual.principal?d.dnd2014Subclasse:undefined):0
 const refonte=fontes.includes(fonte)?fonte:fontes[0]
 const catalogo=magiasDaClasse2014(classe||classeAtual?.cls.id||'')
 const normalizar=(s:string)=>s.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 const opcoesCatalogo=catalogo.filter(m=>
   (m.nivel===0||m.nivel<=permissao||modo==='extra')&&
   normalizar(m.nome).includes(normalizar(buscaCatalogo))).slice(0,100)

 const rclasse=classe||classeAtual?.cls.id||''
 const maxSlot=(n:number)=>Math.max(0,Number(c.recursosMax['espacos_'+n]??0))
 const atualSlot=(n:number)=>Math.max(0,Number(d.recursos['espacos_'+n]?.atual??0))
 function salvar(itens:RegistroMagiaDnd2014[]) {onChange({...d,dnd2014Magias:itens})}
 function adicionar(){
   const n=nome.trim()
   if(!n||!rclasse){setErro('Escreva o nome da magia e escolha sua classe.');return}
   if(nivel>0&&modo!=='extra'&&nivel>permissao){setErro('A classe ainda não alcançou o nível dessa magia.');return}
   if(expressao.trim()&&!expressaoMagia2014Valida(expressao)){setErro('Rolagem inválida. Ex.: 2d6+3.');return}
   const novo=lerMagias2014([{nome:n,nivel,classe:rclasse,fonte:refonte,modo,
     notas:notas.trim(),expressao:expressao.trim()}])[0]
   if(!novo||magias.some(m=>m.id===novo.id)){setErro('Magia inválida ou já registrada.');return}
   salvar([...magias,novo]);setErro('');setNome('');setNotas('');setExpressao('');setAberto(false)
 }
 function gastar(n:number,magia:RegistroMagiaDnd2014,pacto:boolean){
   if(n===0) {
     if(magia.expressao)rolar(magia.expressao,magia.nome+' · magia 2014')
     return
   }
   const id=pacto?'pacto':'espacos_'+n
   const atual=Math.max(0,Number(d.recursos[id]?.atual??0))
   if(atual<1){setErro('Sem espaço disponível. Registre um descanso antes de conjurar.');return}
   onChange({...d,recursos:{...d.recursos,[id]:{...d.recursos[id],atual:atual-1}}})
   setErro('')
   if(magia.expressao)rolar(magia.expressao,magia.nome+' · magia 2014 (espaço '+n+'º)')
 }
 return <section aria-label="Grimório do Livro do Jogador 2014" className="space-y-3 rounded-2xl border border-(--a-55456e) bg-(--s-201a32) p-4 sm:p-5">
  <h3 className="flex items-center gap-2 font-bold text-(--a-ed9cd8)"><BookOpen size={19}/> Grimório de D&D 2014 · SRD 5.1</h3>
  <p className="text-xs text-(--a-c4b6d4)">Registre magias **conhecidas, preparadas ou extras** a partir do Livro do Jogador 2014 e dos suplementos liberados.
    A plataforma confere níveis e espaços da classe, mas não supõe que uma magia de mesmo nome tem efeito igual na edição 2024.
    Consulte o livro para dano, duração, componentes e regras; a expressão de dados é opcional.</p>
  {lista.length>0&&<p className="text-xs text-(--a-d3adf0)">
    Classes: {lista.map(x=>x.cls.nome+' '+x.nivel).join(' · ')}.
    Espaços disponíveis: {[1,2,3,4,5,6,7,8,9].filter(n=>maxSlot(n)>0).map(n=>n+'º '+atualSlot(n)+'/'+maxSlot(n)).join(' · ')||'nenhum'}.
  </p>}
  {!somenteLeitura&&<div className="flex flex-wrap gap-2">
    <button type="button" className={btn} onClick={()=>setAberto(x=>!x)}><Plus size={15}/> {aberto?'Fechar cadastro':'Registrar magia do livro'}</button>
    <button type="button" className={btn} onClick={()=>{
      const recursos={...d.recursos}
      for(let n=1;n<=9;n++)if(maxSlot(n)>0)recursos['espacos_'+n]={...recursos['espacos_'+n],atual:maxSlot(n)}
      const pactoMax=Number(c.recursosMax.pacto??0)
      if(pactoMax>0)recursos.pacto={...recursos.pacto,atual:pactoMax}
      onChange({...d,recursos})
    }}>🌙 Repor espaços (descanso confirmado pelo mestre)</button>
  </div>}
  {aberto&&!somenteLeitura&&<div className="grid gap-3 rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3 sm:grid-cols-2">
    <div className="space-y-2 rounded-lg border border-(--a-55456e) p-2 sm:col-span-2">
      <strong className="text-xs text-(--a-ed9cd8)">📚 Buscar no catálogo do Livro do Jogador 2014 ({catalogo.length} magias desta classe)</strong>
      <input className={campo} aria-label="Buscar magia no catálogo de 2014" value={buscaCatalogo}
        onChange={e=>setBuscaCatalogo(e.target.value)} placeholder="Digite parte do nome para filtrar..."/>
      <select className={campo} aria-label="Selecionar magia do livro de 2014" value=""
        onChange={e=>{
          const index=Number(e.target.value)
          if(!Number.isInteger(index)||index<0||index>=opcoesCatalogo.length)return
          const m=opcoesCatalogo[index]
          setNome(m.nome);setNivel(m.nivel);setFonte('phb2014')
          setErro('')
        }}>
        <option value="">Selecionar magia ({opcoesCatalogo.length} resultados visíveis)...</option>
        {opcoesCatalogo.map((m,i)=><option key={m.nivel+'-'+m.nome} value={i}>
          {m.nivel===0?'Truque':m.nivel+'º nível'} — {m.nome} ({m.escola}{m.ritual?', ritual':''})
        </option>)}
      </select>
      {catalogo.length>100&&!buscaCatalogo&&<p className="text-[11px] text-(--a-a998bd)">Mostrando as primeiras 100. Pesquise para encontrar outras magias.</p>}
      <p className="text-[11px] text-(--a-a998bd)">A seleção preenche nome e nível. Não aplica automaticamente efeitos de 2024. Magias adicionais dos suplementos podem ser registradas manualmente.</p>
    </div>
    <label className="text-xs">Nome exato no livro
      <input className={campo} value={nome} maxLength={100} onChange={e=>setNome(e.target.value)} placeholder="Ex.: Mísseis Mágicos"/>
    </label>
    <label className="text-xs">Classe
      <select className={campo} value={rclasse} onChange={e=>setClasse(e.target.value)}>
        {lista.map(x=><option key={x.cls.id} value={x.cls.id}>{x.cls.nome} · nível {x.nivel}</option>)}
      </select>
    </label>
    <label className="text-xs">Nível da magia
      <select className={campo} value={nivel} onChange={e=>setNivel(Number(e.target.value))}>
        {Array.from({length:10},(_,i)=><option key={i} value={i}>{i===0?'Truque':i+'º nível'}</option>)}
      </select>
    </label>
    <label className="text-xs">Como foi recebida
      <select className={campo} value={modo} onChange={e=>setModo(e.target.value as typeof modo)}>
        <option value="conhecida">Conhecida pela classe</option>
        <option value="preparada">Preparada pela classe</option>
        <option value="extra">Extra (item, talento ou mestre)</option>
      </select>
    </label>
    <label className="text-xs">Livro de origem
      <select className={campo} value={refonte} onChange={e=>setFonte(e.target.value)}>
        {fontes.map(x=><option key={x} value={x}>{nomeLivro(x)}</option>)}
      </select>
    </label>
    <label className="text-xs">Expressão de rolagem (opcional)
      <input className={campo} value={expressao} maxLength={25} onChange={e=>setExpressao(e.target.value)}
        placeholder="Ex.: 3d6+2"/>
    </label>
    <label className="text-xs sm:col-span-2">Notas da magia (suas anotações)
      <textarea className={campo} rows={2} maxLength={500} value={notas} onChange={e=>setNotas(e.target.value)}
        placeholder="CD, tempo, componentes e condições conferidos com o mestre."/>
    </label>
    <button type="button" className={btn+' sm:col-span-2 justify-center'} onClick={adicionar}>Salvar magia</button>
  </div>}
  {erro&&<p role="alert" className="text-xs text-amber-200">{erro}</p>}
  {magias.length===0&&<p className="text-xs text-(--a-c4b6d4)">Nenhuma magia de 2014 registrada nesta ficha.</p>}
  <div className="grid gap-2 sm:grid-cols-2">{magias.map(m=><article key={m.id}
    className="space-y-2 rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <strong className="text-sm">{m.nome}</strong>
      <span className="text-xs text-(--a-d3adf0)">{m.nivel===0?'Truque':m.nivel+'º nível'} · {m.modo}</span>
    </div>
    <p className="text-[11px] text-(--a-c4b6d4)">{m.classe} · {nomeLivro(m.fonte)}</p>
    {m.notas&&<p className="whitespace-pre-wrap text-xs">{m.notas}</p>}
    {m.expressao&&<p className="text-xs font-semibold text-(--a-ed9cd8)">{m.expressao}</p>}
    <div className="flex flex-wrap gap-2">
      {m.nivel===0&&<button type="button" className={btn} onClick={()=>gastar(0,m,false)}><Sparkles size={14}/> Conjurar truque</button>}
      {m.nivel>0&&<button type="button" className={btn}
        disabled={somenteLeitura||atualSlot(m.nivel)<1} onClick={()=>gastar(m.nivel,m,false)}>
        <Dice5 size={14}/> Gastar 1 espaço {m.nivel}º
      </button>}
      {m.nivel>0&&m.classe==='bruxo'&&Number(c.recursosMax.pacto??0)>0&&<button type="button"
        className={btn} disabled={somenteLeitura||Number(d.recursos.pacto?.atual??0)<1}
        onClick={()=>gastar(Number(c.vars.dnd_pacto_nivel)||m.nivel,m,true)}>
        <Dice5 size={14}/> Conjurar com Pacto
      </button>}
      {!somenteLeitura&&<button type="button" className={btn} onClick={()=>salvar(magias.filter(x=>x.id!==m.id))}
        aria-label={'Remover magia '+m.nome}><Trash2 size={14}/> Remover</button>}
    </div>
  </article>)}</div>
  <p className="text-[11px] text-(--a-a998bd)">Fonte: SRD 5.1 (CC BY 4.0). O catálogo 2024 não é reutilizado.
    Quantidade de magias conhecidas/preparadas, duração e componentes devem ser conferidos no livro escolhido.
    Para efeitos comerciais, use suas próprias anotações.</p>
 </section>
}
