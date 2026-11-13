// v0.33.7: criação livre (ficha de jogador criada pelo mestre salva atributos e perícias sem aprovação até “Terminei a criação”)
// e o pedido pendente volta para a ficha do jogador ao recarregar.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'Mesa C',sistema:'dnd5e-srd',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); await call(J,'POST','convites/'+r.d.convite.codigo,{})
r=await call(M,'GET','campanhas/'+cid); for (const s of r.d.solicitacoes) await call(M,'POST',`campanhas/${cid}/solicitacoes/${s.id}`,{decisao:'aceitar'})
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'dnd5e-srd',nome:'Kaelen'}); const f=r.d.ficha.id
const salvar=async(quem, mudar)=>{ const g=await call(quem,'GET','fichas/'+f); return call(quem,'PUT','fichas/'+f,{versao:g.d.ficha.versao,dados:mudar(g.d.ficha.dados)}) }
r=await call(J,'GET','fichas/'+f); check('ficha nova do jogador começa em criação livre', r.d.criacaoLivre===true && r.d.regras?.atributos==='livre', r.d)
r=await salvar(J,d=>({...d,atributos:{...d.atributos,DES:15,SAB:14},pericias:{...d.pericias,furtividade:'proficiente'},campos:{...d.campos,classe:'Patrulheiro'}}))
check('na criação, atributos, perícias e classe salvam direto', r.s===200 && !r.d.pendentes.length, r.d)
r=await call(J,'GET','fichas/'+f); check('valores ficam salvos', r.d.ficha.dados.atributos.DES===15 && r.d.ficha.dados.pericias.furtividade==='proficiente', r.d.ficha.dados.atributos)
r=await salvar(J,d=>({...d,criacaoLivre:true,nome:'Kaelen'})); check('jogador não liga a criação livre de novo (só o mestre)', r.s===200, r)
r=await salvar(J,d=>({...d,criacaoLivre:false})); check('jogador toca em “Terminei a criação”', r.s===200, r)
r=await call(J,'GET','fichas/'+f); check('criação encerrada', r.d.criacaoLivre===false && r.d.regras?.atributos==='aprovacao', {c:r.d.criacaoLivre,a:r.d.regras?.atributos})
r=await salvar(J,d=>({...d,criacaoLivre:true})); r=await call(J,'GET','fichas/'+f); check('o jogador não consegue religar sozinho', r.d.criacaoLivre===false, r.d.criacaoLivre)
r=await salvar(J,d=>({...d,atributos:{...d.atributos,FOR:13}})); check('depois da criação, atributo vira pedido ao mestre', r.s===200 && r.d.pendentes.includes('atributos'), r.d)
r=await call(J,'GET','fichas/'+f); check('ao recarregar, o pedido volta para a ficha do jogador', r.d.pedido?.some(m=>m.caminho==='atributos'&&m.depois?.FOR===13) && r.d.ficha.dados.atributos.FOR!==13, {pedido:r.d.pedido,FOR:r.d.ficha.dados.atributos.FOR})
r=await salvar(M,d=>({...d,criacaoLivre:true})); check('mestre religa a criação livre', r.s===200, r)
r=await salvar(J,d=>({...d,atributos:{...d.atributos,FOR:13,CON:12}})); check('com a criação religada, salva direto', r.s===200 && !r.d.pendentes.length, r.d)
r=await call(J,'GET','fichas/'+f); check('e o pedido antigo some', !r.d.pendentes?.length && r.d.ficha.dados.atributos.FOR===13, {p:r.d.pendentes,a:r.d.ficha.dados.atributos})
// NPC não começa em criação livre
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'npc',sistema:'dnd5e-srd',nome:'Goblin'}); r=await call(M,'GET','fichas/'+r.d.ficha.id); check('NPC não tem criação livre', !r.d.ficha.dados.criacaoLivre, r.d.ficha.dados.criacaoLivre)
// outro sistema (Tormenta20) também
r=await call(M,'POST','campanhas',{nome:'Mesa T20',sistema:'tormenta20',modeloPadrao:'C'}); const c2=r.d.campanha.id
r=await call(M,'POST',`campanhas/${c2}/convites`,{}); await call(J,'POST','convites/'+r.d.convite.codigo,{})
r=await call(M,'GET','campanhas/'+c2); for (const s of r.d.solicitacoes) await call(M,'POST',`campanhas/${c2}/solicitacoes/${s.id}`,{decisao:'aceitar'})
r=await call(M,'POST',`campanhas/${c2}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'tormenta20',nome:'Nix'}); const f2=r.d.ficha.id
let g=await call(J,'GET','fichas/'+f2); r=await call(J,'PUT','fichas/'+f2,{versao:g.d.ficha.versao,dados:{...g.d.ficha.dados,atributos:{...g.d.ficha.dados.atributos,FOR:3}}})
check('Tormenta20: atributos salvam direto na criação', r.s===200 && !r.d.pendentes.length, r.d)
console.log(falhas?`\n${falhas} falha(s)`:'\nTudo certo!'); process.exit(falhas?1:0)
