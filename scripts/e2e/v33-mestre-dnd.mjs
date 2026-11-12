// v0.33.6: ferramentas do mestre de D&D — lista de fichas traz classe e nível (grupo do encontro) e o XP do encontro chega às fichas.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'Mesa do encontro',sistema:'dnd5e-srd',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); await call(J,'POST','convites/'+r.d.convite.codigo,{})
r=await call(M,'GET','campanhas/'+cid); for (const s of r.d.solicitacoes) await call(M,'POST',`campanhas/${cid}/solicitacoes/${s.id}`,{decisao:'aceitar'})
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'dnd5e-srd',nome:'Lyra'}); const f=r.d.ficha.id
let g=await call(M,'GET','fichas/'+f)
r=await call(M,'PUT','fichas/'+f,{versao:g.d.ficha.versao,dados:{...g.d.ficha.dados,campos:{...g.d.ficha.dados.campos,classe:'Mago',nivel:3,xp:900}}}); check('mestre faz Mago 3', r.s===200, r)
r=await call(M,'GET',`campanhas/${cid}/fichas`); const l=r.d.fichas.find(x=>x.id===f)
check('lista de fichas traz classe e nível (para montar o grupo)', l?.classe==='Mago' && l?.nivel==='3', l)
r=await call(J,'GET',`campanhas/${cid}/fichas`); check('jogador vê a própria ficha na lista com nível', r.d.fichas?.[0]?.nivel==='3', r.d)
r=await call(M,'POST',`campanhas/${cid}/recompensas`,{fichaIds:[f],xp:225,motivo:'Encontro: 2× Gnoll'}); check('“Dar XP ao grupo” entrega o XP do encontro', r.s===200, r)
g=await call(J,'GET','fichas/'+f); check('XP somado na ficha', Number(g.d.ficha.dados.campos.xp)===1125, g.d.ficha.dados.campos)
r=await call(J,'POST',`campanhas/${cid}/recompensas`,{fichaIds:[f],xp:5000}); check('jogador não dá XP a si mesmo', r.s===403, r)
console.log(falhas?`\n${falhas} falha(s)`:'\nTudo certo!'); process.exit(falhas?1:0)
