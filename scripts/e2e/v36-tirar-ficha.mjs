// v0.36.7: o mestre tira a ficha de um jogador da campanha (volta para ele como avulsa) ou exclui de vez (digitando o nome).
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222', C='33333333-3333-4333-8333-333333333333'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{} return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'Mesa Tirar',sistema:'tormenta20',modeloPadrao:'C'}); const cid=r.d.campanha.id
for (const quem of [J, C]) { r=await call(M,'POST',`campanhas/${cid}/convites`,{}); await call(quem,'POST','convites/'+r.d.convite.codigo,{}) }
r=await call(M,'GET','campanhas/'+cid); for (const s of r.d.solicitacoes) await call(M,'POST',`campanhas/${cid}/solicitacoes/${s.id}`,{decisao:'aceitar'})
await call(M,'PATCH',`campanhas/${cid}/membros/${C}`,{papel:'comestre'})
const nova=async nome=>(await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'tormenta20',nome})).d.ficha.id
const f1=await nova('Lyra'), f2=await nova('Borin')
// Tirar da campanha
r=await call(J,'POST',`campanhas/${cid}/fichas/${f2}`,{bloqueada:true}); check('jogador não usa as ações do mestre (travar)', r.s===403, r)
r=await call(C,'POST',`campanhas/${cid}/fichas/${f1}`,{acao:'devolver'}); check('co-mestre tira a ficha da campanha', r.s===200, r)
r=await call(J,'GET','fichas/'+f1); check('a ficha volta para o jogador como avulsa, com o nome da campanha', r.s===200 && !r.d.ficha.campanha_id && r.d.ficha.status==='ativa' && /\(de Mesa Tirar\)$/.test(r.d.ficha.nome), r.d.ficha && {c:r.d.ficha.campanha_id,s:r.d.ficha.status,n:r.d.ficha.nome})
r=await call(M,'GET',`campanhas/${cid}/fichas`); check('e some da lista da campanha', !r.d.fichas.some(x=>x.id===f1), r.d.fichas.map(x=>x.nome))
r=await call(J,'GET','notificacoes'); check('o jogador recebe um aviso', JSON.stringify(r.d).includes('saiu de Mesa Tirar'), r.d)
// NPC não se devolve
const npc=(await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'npc',sistema:'tormenta20',nome:'Goblin'})).d.ficha.id
r=await call(M,'POST',`campanhas/${cid}/fichas/${npc}`,{acao:'devolver'}); check('NPC não é devolvido (é do mestre)', r.s===400, r)
r=await call(M,'DELETE','fichas/'+npc); check('NPC continua saindo com Excluir, sem digitar nome', r.s===200, r)
// Excluir de vez
r=await call(C,'DELETE','fichas/'+f2,{confirmar:'Borin'}); check('co-mestre não exclui de vez a ficha de um jogador', r.s===403, r)
r=await call(M,'DELETE','fichas/'+f2); check('mestre precisa digitar o nome', r.s===400 && /Borin/.test(r.d.erro), r)
r=await call(M,'DELETE','fichas/'+f2,{confirmar:'outro'}); check('nome errado não exclui', r.s===400, r)
r=await call(M,'DELETE','fichas/'+f2,{confirmar:' borin '}); check('nome certo (sem diferença de maiúsculas) exclui de vez', r.s===200, r)
r=await call(J,'GET','fichas/'+f2); check('a ficha não existe mais', r.s===404, r.s)
r=await call(J,'GET','notificacoes'); check('o jogador é avisado da exclusão', JSON.stringify(r.d).includes('excluiu Borin'), r.d)
r=await call(J,'GET','fichas/'+f1); check('a ficha devolvida continua com o jogador', r.s===200, r.s)
console.log(falhas ? `\n${falhas} falha(s)` : '\nTudo certo.'); process.exit(falhas ? 1 : 0)
