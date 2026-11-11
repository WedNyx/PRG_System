// v0.32.4: biblioteca da campanha (importar prontos, duplicar, dar com quantidade para jogadores e NPCs). Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'Biblioteca',sistema:'dnd5e-srd',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); await call(J,'POST','convites/'+r.d.convite.codigo,{})
r=await call(M,'GET','campanhas/'+cid); await call(M,'POST',`campanhas/${cid}/solicitacoes/${r.d.solicitacoes[0].id}`,{decisao:'aceitar'})
const fL=(await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'dnd5e-srd',nome:'Lyra'})).d.ficha.id
const fG=(await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'npc',sistema:'dnd5e-srd',nome:'Mercador'})).d.ficha.id
const bib=`campanhas/${cid}/biblioteca`

r=await call(J,'GET',bib); check('jogador não vê a biblioteca do mestre', r.s===403, r)
r=await call(M,'POST',bib,{acao:'importar',entradas:[
  {tipo:'item',dados:{nome:'Poção de cura',categoria:'consumivel',peso:0.5,dano:'2d4+2',bonus:[],arte:{forma:'pocao',cor:'#ef4444',cor2:'#fde68a'}}},
  {tipo:'item',dados:{nome:'Lâmina do Crepúsculo',categoria:'arma',peso:1.5,dano:'1d8+1d6',bonus:[],raridade:'raro',arte:{forma:'<script>',cor:'#a78bfa'}}},
  {tipo:'poder',dados:{nome:'Segundo fôlego',tipo:'habilidade',expressao:'1d10',usosMax:1,recarga:'curto'}}]})
check('importa vários de uma vez', r.s===201 && r.d.entradas?.length===3, r)
r=await call(J,'POST',bib,{acao:'importar',entradas:[{tipo:'item',dados:{nome:'Hack',categoria:'arma',peso:0,bonus:[]}}]}); check('jogador não importa', r.s===403, r)
r=await call(M,'POST',bib,{acao:'importar',entradas:[{tipo:'item',dados:{nome:'',categoria:'arma'}}]}); check('entrada sem nome é recusada', r.s===400, r)
r=await call(M,'GET',bib); const lista=r.d.biblioteca
const pocao=lista.find(b=>b.nome==='Poção de cura'), lamina=lista.find(b=>b.nome==='Lâmina do Crepúsculo'), folego=lista.find(b=>b.nome==='Segundo fôlego')
check('guarda arte e raridade; arte inválida sai', pocao?.dados.arte?.forma==='pocao' && lamina?.dados.raridade==='raro' && !lamina?.dados.arte && folego?.dados.recarga==='curto', lista)
r=await call(M,'POST',bib,{acao:'duplicar',id:lamina.id}); check('duplica com “(cópia)”', r.s===201 && r.d.entrada?.nome==='Lâmina do Crepúsculo (cópia)' && r.d.entrada?.dados.raridade==='raro', r)

r=await call(M,'POST',`campanhas/${cid}/recompensas`,{fichaIds:[fL,fG],bibliotecaIds:[pocao.id,pocao.id,pocao.id],anunciar:true})
check('dá 3 poções para Lyra e para o NPC', r.s===200 && r.d.recompensados?.length===2, r)
const ler=async id=>(await call(M,'GET','fichas/'+id)).d.ficha.dados
let d=await ler(fL); let p=d.itens.filter(i=>i.nome==='Poção de cura')
check('empilha: 1 item com quantidade 3, com arte', p.length===1 && d.uso.itens[p[0].id].qtd===3 && p[0].arte?.forma==='pocao', {itens:d.itens, uso:d.uso})
await call(M,'POST',`campanhas/${cid}/recompensas`,{fichaIds:[fL],bibliotecaIds:[pocao.id,folego.id]})
d=await ler(fL); p=d.itens.filter(i=>i.nome==='Poção de cura')
check('dar de novo soma (4) e o poder entra com a recarga', d.uso.itens[p[0].id].qtd===4 && d.poderes.some(x=>x.nome==='Segundo fôlego' && x.recarga==='curto'), {uso:d.uso, poderes:d.poderes})
r=await call(J,'POST',`campanhas/${cid}/recompensas`,{fichaIds:[fL],bibliotecaIds:[pocao.id]}); check('jogador não se dá itens', r.s===403, r)
r=await call(M,'GET','mesa/'+cid); check('chat anuncia a entrega', (r.d.eventos??[]).some(e=>/🎁 Recompensa para Lyra, Mercador: .*Poção de cura/.test(e.texto??'')), (r.d.eventos??[]).map(e=>e.texto))
r=await call(J,'GET','notificacoes'); check('Lyra recebe aviso', JSON.stringify(r.d).includes('Lyra recebeu'), r.d)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
