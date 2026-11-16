// v0.34.10: paredes, portas e janelas bloqueiam a passagem dos tokens dos jogadores. Precisa da migração 031.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222', N='33333333-3333-4333-8333-333333333333'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'Mesa das paredes',sistema:'tormenta20',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); const cod=r.d.convite.codigo; await call(J,'POST','convites/'+cod,{}); await call(N,'POST','convites/'+cod,{})
r=await call(M,'GET','campanhas/'+cid); for (const s of r.d.solicitacoes) await call(M,'POST',`campanhas/${cid}/solicitacoes/${s.id}`,{decisao:'aceitar'})
await call(M,'POST','mesa/'+cid,{acao:'sessao',aberta:true})
const mesa=(q,b)=>call(q,'POST','mesa/'+cid,b)
r=await mesa(M,{acao:'cena_criar',nome:'Masmorra',grid_cols:12,grid_rows:12}); let cena=r.d.cena.id
r=await call(M,'GET','mesa/'+cid); cena=r.d.cenaAtiva?.id ?? cena; if(!r.d.cenaAtiva) await mesa(M,{acao:'cena_ativar',cenaId:cena})
await mesa(M,{acao:'cena_editar',cenaId:cena,tokens_travados:false})
// Sala de (2,2) a (6,6) com uma porta no lado direito (entre y=3 e y=4).
const sala=[[2,2,6,2],[2,2,2,6],[2,6,6,6],[6,2,6,3],[6,4,6,6]].map(([x1,y1,x2,y2])=>({x1,y1,x2,y2,tipo:'parede'}))
r=await mesa(J,{acao:'parede_criar',cenaId:cena,paredes:sala}); check('jogador não desenha paredes', r.s===403, r)
r=await mesa(M,{acao:'parede_criar',cenaId:cena,paredes:[...sala,{x1:6,y1:3,x2:6,y2:4,tipo:'porta'}]}); check('mestre desenha a sala com uma porta', r.s===200 && r.d.paredes.length===6, r)
const porta=r.d.paredes.find(p=>p.tipo==='porta').id
r=await mesa(M,{acao:'parede_criar',cenaId:cena,parede:{x1:0,y1:0,x2:0,y2:0}}); check('parede sem comprimento é recusada', r.s===400, r)
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'tormenta20',nome:'Nix'}); const fJ=r.d.ficha.id
r=await mesa(J,{acao:'token_criar',cenaId:cena,fichaId:fJ}); const tJ=r.d.token.id
await mesa(M,{acao:'token_mover',tokenId:tJ,x:8,y:3})
r=await mesa(J,{acao:'token_mover',tokenId:tJ,x:4,y:4}); check('jogador não entra com a porta fechada', r.s===400 && /parede/.test(r.d.erro), r)
r=await mesa(J,{acao:'token_mover',tokenId:tJ,x:9,y:9}); check('jogador anda livre por fora', r.s===200, r)
await mesa(M,{acao:'token_mover',tokenId:tJ,x:8,y:3})
r=await mesa(J,{acao:'porta',cenaId:cena,id:porta}); check('jogador abre a porta', r.s===200 && r.d.paredes.find(p=>p.id===porta).aberta===true, r)
r=await mesa(J,{acao:'token_mover',tokenId:tJ,x:4,y:4}); check('com a porta aberta, entra', r.s===200, r)
r=await mesa(J,{acao:'porta',cenaId:cena,id:porta,trancada:true}); check('jogador não tranca', r.s===403, r)
r=await mesa(M,{acao:'porta',cenaId:cena,id:porta,trancada:true}); check('mestre tranca (e a porta fecha)', r.s===200 && r.d.paredes.find(p=>p.id===porta).trancada===true && !r.d.paredes.find(p=>p.id===porta).aberta, r)
r=await mesa(J,{acao:'porta',cenaId:cena,id:porta}); check('porta trancada não abre para o jogador', r.s===403, r)
r=await mesa(J,{acao:'token_mover',tokenId:tJ,x:9,y:3}); check('preso na sala com a porta trancada', r.s===400, r)
r=await mesa(M,{acao:'token_mover',tokenId:tJ,x:9,y:3}); check('o mestre põe o token onde quiser', r.s===200, r)
r=await mesa(N,{acao:'porta',cenaId:cena,id:porta}); check('outro jogador também não abre a porta trancada', r.s===403, r)
r=await call(J,'GET','mesa/'+cid); check('a cena traz as paredes', r.d.cenaAtiva?.paredes?.length===6, r.d.cenaAtiva?.paredes)
const qual=r.d.cenaAtiva.paredes.find(p=>p.tipo==='parede').id
r=await mesa(M,{acao:'parede_excluir',cenaId:cena,id:qual}); check('mestre apaga uma parede', r.s===200 && r.d.paredes.length===5, r)
r=await mesa(M,{acao:'paredes_limpar',cenaId:cena}); check('mestre apaga todas', r.s===200 && r.d.paredes.length===0, r)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
