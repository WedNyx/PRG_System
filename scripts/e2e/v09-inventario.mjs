// v0.9.0: inventário/poderes estruturados, biblioteca do mestre e recompensas. Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222', X='33333333-3333-4333-8333-333333333333'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,300))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'V09',sistema:'D&D 5ª edição (SRD 5.2)',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); await call(J,'POST','convites/'+r.d.convite.codigo,{}); r=await call(M,'GET','campanhas/'+cid); await call(M,'POST',`campanhas/${cid}/solicitacoes/${r.d.solicitacoes[0].id}`,{decisao:'aceitar'})
const bib=(q,b)=>call(q,'POST',`campanhas/${cid}/biblioteca`,b)

r=await bib(M,{acao:'criar',tipo:'item',dados:{nome:'Escudo do Leão',categoria:'armadura',peso:3,bonus:[{alvo:'derivado:ca',valor:2},{alvo:'xss<script>',valor:5}]}}); check('mestre cria item na biblioteca (bônus inválido descartado)', r.s===201 && r.d.entrada.dados.bonus.length===1 && !('id' in r.d.entrada.dados), r); const escudo=r.d.entrada.id
r=await bib(M,{acao:'criar',tipo:'poder',dados:{nome:'Mísseis mágicos',tipo:'magia',expressao:'3d4+3',usosMax:2}}); check('mestre cria poder', r.s===201, r); const missil=r.d.entrada.id
r=await bib(M,{acao:'criar',tipo:'item',dados:{nome:''}}); check('item sem nome é recusado', r.s===400, r)
r=await bib(M,{acao:'editar',id:escudo,tipo:'item',dados:{nome:'Escudo do Leão',categoria:'armadura',peso:2.5,bonus:[{alvo:'derivado:ca',valor:2}]}}); check('mestre edita', r.s===200 && r.d.entrada.dados.peso===2.5, r)
r=await call(J,'GET',`campanhas/${cid}/biblioteca`); check('jogador não vê a biblioteca', r.s===403, r)
r=await bib(J,{acao:'criar',tipo:'item',dados:{nome:'Trapaça'}}); check('jogador não cria na biblioteca', r.s===403, r)
r=await call(X,'GET',`campanhas/${cid}/biblioteca`); check('intruso não vê', r.s===403, r)
r=await call(M,'GET',`campanhas/${cid}/biblioteca`); check('biblioteca lista 2 entradas', r.d.biblioteca.length===2, r.d)

// ficha do jogador na campanha
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'dnd5e-srd',nome:'Sol'}); const fid=r.d.ficha?.id; check('mestre cria a ficha do jogador na campanha', !!fid, r)
{ const g=await call(M,'GET','fichas/'+fid); await call(M,'PUT','fichas/'+fid,{versao:g.d.ficha.versao,dados:{...g.d.ficha.dados,criacaoLivre:false}}) } // v0.33.7: mestre encerra a criação livre; daqui em diante valem as regras da campanha
r=await call(M,'POST',`campanhas/${cid}/recompensas`,{fichaIds:[fid],bibliotecaIds:[escudo,missil,escudo],moedas:'20 PO',item:'Corda'})
const aprovada = r.s===200
if (aprovada) {
  r=await call(J,'GET','fichas/'+fid); const d=r.d.ficha.dados
  const it=d.itens.find(i=>i.nome==='Escudo do Leão')
  check('item da biblioteca chega pronto (com bônus) e repetido soma quantidade', it && it.bonus[0].alvo==='derivado:ca' && d.uso.itens[it.id].qtd===2, d)
  check('poder chega em Poderes', d.poderes.some(p=>p.nome==='Mísseis mágicos' && p.expressao==='3d4+3'), d.poderes)
  check('item rápido vira item e moedas vão para a carteira', d.itens.some(i=>i.nome==='Corda') && d.uso.carteira==='+20 PO', d)
  // jogador equipa (área de uso é livre no modelo C) e tenta inventar item (precisa de aprovação)
  const dados={...d, uso:{...d.uso, itens:{...d.uso.itens,[it.id]:{qtd:2,equipado:true}}}, itens:[...d.itens,{id:'hack',nome:'Espada lendária',categoria:'arma',peso:1,bonus:[{alvo:'derivado:ca',valor:10}]}]}
  r=await call(J,'PUT','fichas/'+fid,{versao:r.d.ficha.versao,dados})
  check('equipar salva na hora; item novo vai para aprovação do mestre', r.s===200 && (r.d.pendentes||[]).includes('equipamentos'), r.d)
  r=await call(J,'GET','fichas/'+fid)
  check('item inventado não entrou sem aprovação', !r.d.ficha.dados.itens.some(i=>i.id==='hack') && r.d.ficha.dados.uso.itens[it.id].equipado===true, r.d.ficha.dados)
} else check('recompensa entregue (ficha aprovada)', false, r)
r=await call(J,'POST',`campanhas/${cid}/recompensas`,{fichaIds:[fid],bibliotecaIds:[escudo]}); check('jogador não dá recompensa', r.s===403, r)
r=await bib(M,{acao:'excluir',id:missil}); r=await call(M,'GET',`campanhas/${cid}/biblioteca`); check('mestre exclui da biblioteca', r.d.biblioteca.length===1, r.d)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
