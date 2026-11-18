'use client'

import {useState} from 'react'
import {BookOpen,Plus,Trash2,Dice5,Sparkles} from 'lucide-react'
import type {DadosFicha} from '@/lib/sistemas/tipos'
import type {Calculo} from '@/lib/sistemas/calculo'
import {classesDaFicha2014} from '@/lib/sistemas/dnd2014Multiclasse'
import {subclasseDaFicha2014} from '@/lib/sistemas/dnd2014Subclasses'
import {lerLivrosDnd,suplementoDndPorId} from '@/lib/sistemas/dndLivros'
import {lerMagias2014,maximoNivelMagiaClasse2014,expressaoMagia2014Valida,podeConjurarRitualMagia2014,type RegistroMagiaDnd2014} from '@/lib/sistemas/dnd2014Magias'
import {magiasDaClasse2014} from '@/lib/sistemas/dnd2014CatalogoMagias'
import {magiasCirculoTerra2014} from '@/lib/sistemas/dnd2014MagiasCirculo'
import {resumoPreparacaoMagias2014, limiteTruques2014} from '@/lib/sistemas/dnd2014PreparacaoMagias'
import {cdConcentracaoDano2014,encerrarConcentracao2014} from '@/lib/sistemas/dnd2014Concentracao'
import {conjurarArcanaMistica2014,NIVEL_ARCANA_MISTICA_2014,nivelBruxoArcana2014} from '@/lib/sistemas/dnd2014ArcanaMistica'
import {idDe} from '@/lib/sistemas/dnd2024Classes'
const btn='inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-(--a-5e4b78) px-3 py-2 text-xs hover:bg-(--s-34294f) disabled:opacity-40'
const campo='min-h-10 w-full min-w-0 rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-sm text-white'
const nomeLivro=(id:string)=>id==='phb2014'?'Livro do Jogador 2014':suplementoDndPorId(id)?.titulo??id
type Props={d:DadosFicha;c:Calculo;onChange:(d:DadosFicha)=>void;somenteLeitura:boolean;rolar:(ex:string,rotulo:string)=>void}
export default function MagiasDnd2014({d,c,onChange,somenteLeitura,rolar}:Props) {
 const [nome,setNome]=useState('')
  const [pagina,setPagina]=useState(-1)
  const [buscaGrimorio,setBuscaGrimorio]=useState('')
  const [modoGrimorio,setModoGrimorio]=useState('todos')
 const [buscaCatalogo,setBuscaCatalogo]=useState('')
 const [espacosEscolhidos,setEspacosEscolhidos]=useState<Record<string,number>>({})
 const [nivel,setNivel]=useState(0)
 const [classe,setClasse]=useState('')
 const [fonte,setFonte]=useState('phb2014')
 const [modo,setModo]=useState<'conhecida'|'preparada'|'extra'>('conhecida')
 const [notas,setNotas]=useState('')
 const [expressao,setExpressao]=useState('')
 const [exigeConcentracao,setExigeConcentracao]=useState(false)
 const [arcanaMistica,setArcanaMistica]=useState(false)
 const [componentes,setComponentes]=useState({verbal:false,somatico:false,material:false,descricao:'',custoPo:0,consumido:false})
 const [tempoConjuracao,setTempoConjuracao]=useState<'ação'|'ação bônus'|'reação'|'especial'>('ação')
 const [danoConcentracao,setDanoConcentracao]=useState(0)
 const [aberto,setAberto]=useState(false)
 const [erro,setErro]=useState('')
 const [aviso,setAviso]=useState('')
 const livros=lerLivrosDnd(d.dndLivros,'phb2014')
 const fontes=[livros.base,...livros.suplementos]
 const {lista}=classesDaFicha2014(d)
 const magias=lerMagias2014(d.dnd2014Magias)
  const visiveis = magias.filter(m => (pagina === -1 || m.nivel === pagina) && m.nome.toLocaleLowerCase('pt-BR').includes(buscaGrimorio.trim().toLocaleLowerCase('pt-BR')) && (modoGrimorio === 'todos' || m.modo === modoGrimorio))
 const resumos=resumoPreparacaoMagias2014(d,magias)
 const doCirculo=magiasCirculoTerra2014(d)
 const faltamCirculo=doCirculo.filter(x=>!magias.some(m=>
   m.classe==='druida'&&m.nivel===x.nivelMagia&&
   m.nome.toLocaleLowerCase('pt-BR')===x.nome.toLocaleLowerCase('pt-BR')))
 const classeAtual=lista.find(x=>x.cls.id===classe)??lista[0]
 const permissao=classeAtual?maximoNivelMagiaClasse2014(classeAtual.cls.nome,classeAtual.nivel,
   subclasseDaFicha2014(d,classeAtual.cls.id)?.id):0
 const refonte=fontes.includes(fonte)?fonte:fontes[0]
 const catalogo=magiasDaClasse2014(classe||classeAtual?.cls.id||'')
 const normalizar=(s:string)=>s.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 const opcoesCatalogo=catalogo.filter(m=>
   (m.nivel===0||m.nivel<=permissao||modo==='extra')&&
   normalizar(m.nome).includes(normalizar(buscaCatalogo))).slice(0,100)

 const rclasse=classe||classeAtual?.cls.id||''
 const modoEsperado=(id:string)=>['mago','clerigo','druida','paladino'].includes(id)?'preparada':'conhecida'
 const maxSlot=(n:number)=>Math.max(0,Number(c.recursosMax['espacos_'+n]??0))
 const atualSlot=(n:number)=>Math.max(0,Number(d.recursos['espacos_'+n]?.atual??0))
 function salvar(itens:RegistroMagiaDnd2014[]) {
   const ativa=d.dnd2014Concentracao
   const valido=ativa&&itens.some(x=>x.id===ativa.magiaId&&x.concentracao)
   onChange({...d,dnd2014Magias:itens,...(!valido?{dnd2014Concentracao:undefined}:{})})
 }
 function adicionar(){
   const n=nome.trim()
   if(!n||!rclasse){setErro('Escreva o nome da magia e escolha sua classe.');return}
   if(nivel>0&&modo!=='extra'&&!arcanaMistica&&nivel>permissao){setErro('A classe ainda não alcançou o nível dessa magia.');return}
   if(nivel>0&&modo!=='extra'&&!arcanaMistica&&modo!==modoEsperado(rclasse)&&rclasse!=='mago'){
     setErro('Esta classe registra suas magias de 2014 como '+modoEsperado(rclasse)+'.');return
   }
   if(arcanaMistica&&(rclasse!=='bruxo'||!NIVEL_ARCANA_MISTICA_2014[nivel]||
      nivelBruxoArcana2014(d)<NIVEL_ARCANA_MISTICA_2014[nivel]||
      magias.some(m=>m.arcanaMistica&&m.nivel===nivel))){
     setErro('Arcana Mística exige nível de Bruxo adequado e apenas uma magia por círculo 6º a 9º.');return
   }
   if(expressao.trim()&&!expressaoMagia2014Valida(expressao)){setErro('Rolagem inválida. Ex.: 2d6+3.');return}
   const novo=lerMagias2014([{nome:n,nivel,classe:rclasse,fonte:refonte,modo:arcanaMistica?'extra':modo,
     notas:notas.trim(),expressao:expressao.trim(),concentracao:exigeConcentracao,arcanaMistica,
     componentes,tempoConjuracao}])[0]
   if(!novo||magias.some(m=>m.id===novo.id)){setErro('Magia inválida ou já registrada.');return}
   salvar([...magias,novo]);setErro('');setNome('');setNotas('');setExpressao('');setExigeConcentracao(false);setArcanaMistica(false);setComponentes({verbal:false,somatico:false,material:false,descricao:'',custoPo:0,consumido:false});setTempoConjuracao('ação');setAberto(false)
 }
 function gastar(n:number,magia:RegistroMagiaDnd2014,pacto:boolean,ritual=false){
   const componentes=magia.componentes
   if(componentes?.material&&(componentes.custoPo||componentes.consumido)&&
     !window.confirm('Confira que os componentes materiais foram usados: '+(componentes.descricao||'conforme o PHB 2014')+
       (componentes.custoPo?' · custo '+componentes.custoPo+' PO':'')+
       (componentes.consumido?' · consumidos':'')+'. A plataforma NÃO retira moedas/itens automaticamente. Continuar?'))return
   if(magia.tempoConjuracao==='ação bônus'&&!ritual)
     setAviso('Lembrete 2014: conjurar magia com ação bônus restringe a outra conjuração no turno a um truque de 1 ação.')
   if(n===0) {
     setAviso(ritual
       ? 'Ritual de '+magia.nome+': reserve o tempo normal +10 minutos; nenhum espaço foi gasto.'
       : 'Truque '+magia.nome+' ativado; não houve gasto de espaço.')
     if(magia.concentracao)onChange({...d,dnd2014Concentracao:{magiaId:magia.id,nome:magia.nome}})
     if(magia.expressao)rolar(magia.expressao,magia.nome+' · magia 2014')
     return
   }
   const id=pacto?'pacto':'espacos_'+n
   const atual=Math.max(0,Number(d.recursos[id]?.atual??0))
   if(atual<1){setErro('Sem espaço disponível. Registre um descanso antes de conjurar.');return}
   onChange({...d,recursos:{...d.recursos,[id]:{...d.recursos[id],atual:atual-1}},
     ...(magia.concentracao?{dnd2014Concentracao:{magiaId:magia.id,nome:magia.nome}}:{})})
   setErro('')
   setAviso('Magia '+magia.nome+' conjurada com '+(pacto?'Magia de Pacto':'espaço')+' de '+n+'º nível.')
   if(magia.expressao)rolar(magia.expressao,magia.nome+' · magia 2014 (espaço '+n+'º)')
 }
 return <section aria-label="Grimório do Livro do Jogador 2014" className="dnd-grimorio space-y-3 rounded-2xl border border-(--a-55456e) bg-(--s-201a32) p-4 sm:p-5">
  <h3 className="flex items-center gap-2 font-bold text-(--a-ed9cd8)"><BookOpen size={19}/> Grimório de D&D 2014 · SRD 5.1</h3>
    <div className="dnd-espacos-grimorio">{[...Array.from({length:9},(_,i)=>'espacos_'+(i+1)), 'pacto'].map(id=>{ const max=Math.max(0,Number(c.recursosMax[id]??0)||0), atual=Math.max(0,Number(d.recursos[id]?.atual??0)||0); if(!max)return null; return <div key={id} className="dnd-espaco-grimorio"><div className="flex justify-between gap-2 text-xs"><strong>{id==='pacto'?'Magia de Pacto':id.replace('espacos_','')+'º nível'}</strong><span>{atual} / {max}</span></div><div className="dnd-cristais" aria-hidden="true">{Array.from({length:Math.min(20,Math.floor(max))},(_,i)=><svg key={i} viewBox="0 0 22 30" data-disponivel={i<atual?'sim':'nao'}><path d="M11 1L21 11L11 29L1 11Z"/><path d="M11 1L7 11L11 29L15 11Z M1 11H21" fill="none"/></svg>)}</div></div>})}</div>

  <p className="text-xs text-(--a-c4b6d4)">Registre magias <strong>conhecidas, preparadas ou extras</strong> a partir do Livro do Jogador 2014 e dos suplementos liberados.
    A plataforma confere níveis e espaços da classe, mas não supõe que uma magia de mesmo nome tem efeito igual na edição 2024.
    Consulte o livro para dano, duração, componentes e regras; a expressão de dados é opcional.</p>
  {doCirculo.length>0&&<div className="space-y-2 rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3">
    <h4 className="text-sm font-semibold">🌲 Magias do Círculo da Terra (2014)</h4>
    <p className="text-xs text-(--a-c4b6d4)">Seu terreno concede estas magias sempre preparadas nos níveis de Druida indicados.
      Elas não consomem a cota de preparação diária. Os efeitos devem ser conferidos no livro.</p>
    <p className="text-xs">{doCirculo.map(x=>x.nome+' ('+x.nivelMagia+'º)').join(' · ')}</p>
    {!somenteLeitura&&faltamCirculo.length>0&&<button className={btn} type="button"
      onClick={()=>{
        const registros=faltamCirculo.map(x=>({nome:x.nome,nivel:x.nivelMagia,classe:'druida',
          fonte:'phb2014',modo:'extra' as const}))
        salvar(lerMagias2014([...magias,...registros]))
      }}>
      <Plus size={14}/> Registrar {faltamCirculo.length} magia(s) sempre preparadas
    </button>}
  </div>}
  {resumos.length>0&&<div className="grid gap-2 sm:grid-cols-2">
    {resumos.map(x=><div key={x.classe}
      className="rounded-lg border border-(--a-55456e) bg-(--s-171325) p-2 text-xs">
      <strong>{x.classe} · {x.tipo==='conhecidas'?'Magias conhecidas':'Magias preparadas'}</strong>
      <p>{x.total}/{x.maximo===null?'conferir atributo':x.maximo} · nível da classe, não nível total</p>
      <p className="mt-1 text-(--a-c4b6d4)">{x.descricao}</p>
      {x.maximo!==null&&x.total>x.maximo&&<p role="alert" className="text-amber-200">Limite excedido.</p>}
    </div>)}
  </div>}
  {d.dnd2014Concentracao&&<div role="status" className="space-y-2 rounded-xl border border-sky-500/40 p-3">
    <strong className="text-sm text-sky-200">🌀 Concentração ativa: {d.dnd2014Concentracao.nome}</strong>
    <p className="text-xs">Somente uma concentração por vez. Ao sofrer dano, teste de resistência de Constituição (CD 10 ou metade do dano, o maior).</p>
    <label className="block text-xs">Dano recebido
      <input type="number" min="0" step="1" className={campo} value={danoConcentracao}
        onChange={e=>setDanoConcentracao(Math.max(0,Math.floor(Number(e.target.value)||0)))}/>
    </label>
    <strong className="text-xs">CD de concentração: {cdConcentracaoDano2014(danoConcentracao)}</strong>
    {!somenteLeitura&&<button type="button" className={btn}
      onClick={()=>onChange(encerrarConcentracao2014(d))}>Encerrar concentração</button>}
    <p className="text-[11px] text-(--a-c4b6d4)">O mestre verifica interrupções, duração e efeito conforme o livro; o sistema não presume sucesso na resistência.</p>
  </div>}
  {lista.length>0&&<p className="text-xs text-(--a-c4b6d4)">
    Truques 2014: {lista.map(x=>{
      const max=limiteTruques2014(x.cls.id,x.nivel,subclasseDaFicha2014(d,x.cls.id)?.id)
      const total=magias.filter(m=>m.classe===x.cls.id&&m.nivel===0&&m.modo!=='extra').length
      return x.cls.nome+' '+total+'/'+max
    }).join(' · ')}. Truques não usam espaços de magia.
  </p>}
  {lista.length>0&&<p className="text-xs text-(--a-d3adf0)">
    Classes: {lista.map(x=>x.cls.nome+' '+x.nivel).join(' · ')}.
    Espaços disponíveis: {[1,2,3,4,5,6,7,8,9].filter(n=>maxSlot(n)>0).map(n=>n+'º '+atualSlot(n)+'/'+maxSlot(n)).join(' · ')||'nenhum'}.
  </p>}
  {!somenteLeitura&&<div className="flex flex-wrap gap-2">
    <button type="button" className={btn} onClick={()=>setAberto(x=>!x)}><Plus size={15}/> {aberto?'Fechar cadastro':'Registrar magia do livro'}</button>
  </div>}
  <p className="text-[11px] text-(--a-c4b6d4)">Para recuperar espaços ou Magia de Pacto, use o botão 🌙 Descansar na seção Valores e recursos. O descanso curto não recupera espaços comuns de conjuração.</p>
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
      <select className={campo} value={rclasse} onChange={e=>{setClasse(e.target.value);setModo(modoEsperado(e.target.value))}}>
        {lista.map(x=><option key={x.cls.id} value={x.cls.id}>{x.cls.nome} · nível {x.nivel}</option>)}
      </select>
    </label>
    <label className="text-xs">Nível da magia
      <select className={campo} value={nivel} onChange={e=>setNivel(Number(e.target.value))}>
        {Array.from({length:10},(_,i)=><option key={i} value={i}>{i===0?'Truque':i+'º nível'}</option>)}
      </select>
    </label>
    <p className="text-xs sm:col-span-2 text-(--a-c4b6d4)">Classe {classeAtual?.cls.nome??'não selecionada'}:
      magias de nível 1+ usam {modoEsperado(rclasse)==='preparada'?'preparação diária':'lista de conhecidas'}.
      No Mago, magias conhecidas ficam no grimório e as preparadas têm limite diário.</p>
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
    <div className="space-y-2 rounded-lg border border-(--a-55456e) p-3 sm:col-span-2">
      <strong className="text-xs">Componentes e tempo (confirme no PHB 2014)</strong>
      <label className="block text-xs">Tempo de conjuração
        <select className={campo} value={tempoConjuracao}
         onChange={e=>setTempoConjuracao(e.target.value as typeof tempoConjuracao)}>
          {['ação','ação bônus','reação','especial'].map(x=><option key={x} value={x}>{x}</option>)}
        </select>
      </label>
      <div className="flex flex-wrap gap-3 text-xs">
        {(['verbal','somatico','material'] as const).map((campoTipo,i)=><label key={campoTipo}
          className="flex min-h-10 items-center gap-2">
          <input type="checkbox" checked={componentes[campoTipo]}
            onChange={e=>setComponentes(x=>({...x,[campoTipo]:e.target.checked}))}/>
          {['Verbal (V)','Somático (S)','Material (M)'][i]}
        </label>)}
      </div>
      {componentes.material&&<div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs sm:col-span-2">Descrição do material
          <input className={campo} maxLength={150} value={componentes.descricao}
           onChange={e=>setComponentes(x=>({...x,descricao:e.target.value}))}/>
        </label>
        <label className="text-xs">Custo do material (PO)
          <input className={campo} type="number" min={0} max={100000000} step={1}
           value={componentes.custoPo} onChange={e=>setComponentes(x=>({...x,custoPo:Math.max(0,Math.floor(Number(e.target.value)||0))}))}/>
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={componentes.consumido}
            onChange={e=>setComponentes(x=>({...x,consumido:e.target.checked}))}/>
          Material consumido pela magia
        </label>
      </div>}
      <p className="text-xs text-(--a-c4b6d4)">Esses dados são inseridos manualmente. A plataforma avisa antes de gastar materiais, mas não concede componentes nem retira moedas automaticamente.</p>
    </div>
    <label className="flex items-start gap-2 text-xs sm:col-span-2">
      <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0" checked={exigeConcentracao}
        onChange={e=>setExigeConcentracao(e.target.checked)}/>
      Esta magia exige concentração (confirmado no texto de 2014; não inferido do catálogo 2024).
    </label>
    {rclasse==='bruxo'&&nivel>=6&&<label className="flex items-start gap-2 text-xs sm:col-span-2">
       <input type="checkbox" checked={arcanaMistica} className="mt-0.5 h-5 w-5 shrink-0"
        onChange={e=>{setArcanaMistica(e.target.checked);if(e.target.checked)setModo('extra')}}/>
       Arcana Mística (Bruxo 2014): escolha uma magia do 6º ao 9º círculo conforme o nível da classe;
       permite conjuração única sem espaço até o próximo descanso longo.
     </label>}
    <label className="text-xs sm:col-span-2">Notas da magia (suas anotações)
      <textarea className={campo} rows={2} maxLength={500} value={notas} onChange={e=>setNotas(e.target.value)}
        placeholder="CD, tempo, componentes e condições conferidos com o mestre."/>
    </label>
    <button type="button" className={btn+' sm:col-span-2 justify-center'} onClick={adicionar}>Salvar magia</button>
  </div>}
  {erro&&<p role="alert" className="text-xs text-amber-200">{erro}</p>}
  {aviso&&<p role="status" className="rounded-lg border border-sky-500/30 p-2 text-xs text-sky-200">{aviso}</p>}
  {magias.length===0&&<p className="text-xs text-(--a-c4b6d4)">Nenhuma magia de 2014 registrada nesta ficha.</p>}
  <div className="dnd-indice-grimorio">
    <label>Buscar no grimório<input value={buscaGrimorio} onChange={e=>setBuscaGrimorio(e.target.value)} placeholder="Nome da magia" /></label>
    <label>Registro<select value={modoGrimorio} onChange={e=>setModoGrimorio(e.target.value)}><option value="todos">Todos</option><option value="conhecida">Conhecidas</option><option value="preparada">Preparadas</option><option value="extra">Extras</option></select></label>
    <div className="dnd-indice-circulos" role="group" aria-label="Círculos do grimório">{[-1,0,1,2,3,4,5,6,7,8,9].map(n=><button key={n} type="button" aria-pressed={pagina===n} onClick={()=>setPagina(n)}>{n===-1?'Todos':n===0?'Truques':n+'º'} <small>{n===-1?magias.length:magias.filter(m=>m.nivel===n).length}</small></button>)}</div>
    <p className="text-xs" role="status">{visiveis.length} de {magias.length} magias</p>
  </div>
  {magias.length>0&&visiveis.length===0&&<p className="text-xs">Nenhuma magia corresponde aos filtros.</p>}
  <div className="grid gap-2 sm:grid-cols-2">{[...visiveis].sort((a,b)=>a.nivel-b.nivel||a.nome.localeCompare(b.nome)).map(m=><article key={m.id}
    className="dnd-magia-pagina space-y-2 rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <strong className="text-sm"><span className="dnd-escola-selo" aria-hidden="true">{({'Abjuração':'◇','Adivinhação':'◉','Conjuração':'✧','Encantamento':'♡','Evocação':'✦','Ilusão':'◈','Necromancia':'☾','Transmutação':'⇄'} as Record<string,string>)[magiasDaClasse2014(m.classe).find(x=>normalizar(x.nome)===normalizar(m.nome)&&x.nivel===m.nivel)?.escola??'']??'✧'}</span> {m.nome}</strong>
      <span className="text-xs text-(--a-d3adf0)">{m.nivel===0?'Truque':m.nivel+'º nível'} · {m.modo}</span>
    </div>
    <p className="text-[11px] text-(--a-c4b6d4)">{m.classe} · {nomeLivro(m.fonte)}</p>
    {m.arcanaMistica&&<p className="text-xs font-semibold text-sky-200">Arcana Mística · um uso por descanso longo</p>}
    {m.componentes&&<p className="text-xs text-(--a-c4b6d4)">
      Componentes: {m.componentes.verbal?'V ':''}{m.componentes.somatico?'S ':''}{m.componentes.material?'M':''}
      {m.componentes.material&&m.componentes.descricao?' · '+m.componentes.descricao:''}
      {m.componentes.custoPo?' · '+m.componentes.custoPo+' PO':''}
      {m.componentes.consumido?' · consumido':''}
      {m.tempoConjuracao?' · '+m.tempoConjuracao:''}
    </p>}
    {m.notas&&<p className="whitespace-pre-wrap text-xs">{m.notas}</p>}
    {m.expressao&&<p className="text-xs font-semibold text-(--a-ed9cd8)">{m.expressao}</p>}
    <label className="flex items-start gap-2 text-xs text-(--a-c4b6d4)">
      <input type="checkbox" className="h-5 w-5 shrink-0" disabled={somenteLeitura}
        checked={m.concentracao===true}
        onChange={e=>salvar(magias.map(x=>x.id===m.id?{...x,concentracao:e.target.checked}:x))}/>
      Exige concentração (conferir no livro de 2014).
    </label>
    {d.dnd2014Concentracao?.magiaId===m.id&&<p className="text-xs text-sky-200">Concentração ativa</p>}
    <div className="flex flex-wrap gap-2">
      {m.arcanaMistica&&<button type="button" className={btn}
        disabled={somenteLeitura||d.dnd2014ArcanasUsadas?.includes(m.nivel)}
        onClick={()=>{const nova=conjurarArcanaMistica2014(d,m.id);
          if(!nova){setErro('Arcana Mística já usada ou nível da classe insuficiente.');return}
          onChange(nova);setErro('');setAviso('Arcana Mística '+m.nome+' conjurada sem espaço. Recarrega no descanso longo.')
          if(m.expressao)rolar(m.expressao,m.nome+' · Arcana Mística 2014')
        }}>
        <Sparkles size={14}/> {d.dnd2014ArcanasUsadas?.includes(m.nivel)?'Arcana usada':'Conjurar Arcana Mística'}
      </button>}
      {m.nivel===0&&<button type="button" className={btn} disabled={somenteLeitura} onClick={()=>gastar(0,m,false)}><Sparkles size={14}/> Conjurar truque</button>}
      {m.nivel>0&&!m.arcanaMistica&&<>
        <label className="flex items-center gap-1 text-xs">
          Espaço
          <select className={campo+' max-w-24'} aria-label={'Nível do espaço para '+m.nome}
            value={espacosEscolhidos[m.id]??m.nivel}
            disabled={somenteLeitura}
            onChange={e=>setEspacosEscolhidos(v=>({...v,[m.id]:Number(e.target.value)}))}>
            {Array.from({length:10-m.nivel},(_,i)=>m.nivel+i).filter(n=>maxSlot(n)>0)
              .map(n=><option key={n} value={n}>{n}º</option>)}
          </select>
        </label>
        <button type="button" className={btn} disabled={somenteLeitura||atualSlot(espacosEscolhidos[m.id]??m.nivel)<1}
          onClick={()=>gastar(espacosEscolhidos[m.id]??m.nivel,m,false)}>
          <Dice5 size={14}/> Gastar espaço {(espacosEscolhidos[m.id]??m.nivel)}º
        </button>
      </>}
      {!m.arcanaMistica&&podeConjurarRitualMagia2014(m)&&<button type="button" className={btn} disabled={somenteLeitura}
        onClick={()=>{
          if(window.confirm('Este ritual leva 10 minutos adicionais e não consome espaço de magia. Confirma a conjuração?'))
            gastar(0,m,false,true)
        }}>
        <Sparkles size={14}/> Ritual (+10 minutos, sem espaço)
      </button>}
      {m.nivel>0&&!m.arcanaMistica&&Number(c.vars.dnd_pacto_nivel??0)>=m.nivel&&Number(c.recursosMax.pacto??0)>0&&<button type="button"
        className={btn} disabled={somenteLeitura||Number(d.recursos.pacto?.atual??0)<1}
        onClick={()=>gastar(Number(c.vars.dnd_pacto_nivel)||m.nivel,m,true)}>
        <Dice5 size={14}/> Conjurar com Pacto
      </button>}
      {!somenteLeitura&&<button type="button" className={btn} onClick={()=>salvar(magias.filter(x=>x.id!==m.id))}
        aria-label={'Remover magia '+m.nome}><Trash2 size={14}/> Remover</button>}
    </div>
  </article>)}</div>
  <p className="text-[11px] text-(--a-a998bd)">Fonte: SRD 5.1 (CC BY 4.0). O catálogo 2024 não é reutilizado.
    Quantidades de magias conhecidas/preparadas e truques são verificadas por classe. Rituais simples dependem da característica da classe; componentes, duração e magias de subclasse ainda exigem conferência no livro escolhido.
    Para efeitos comerciais, use suas próprias anotações.</p>
 </section>
}
