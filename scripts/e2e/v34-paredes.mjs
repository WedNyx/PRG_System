// v0.34.10: paredes, portas e janelas bloqueiam a passagem dos tokens dos jogadores. Precisa da migração 031.
// v0.35.4: o token anda em linha reta (não pula a parede por um caminho em volta), o mestre também é bloqueado
// (a não ser com “atravessar”), pontas fora da grade e formas (grupo) que apagam e abrem juntas.
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
await mesa(M,{acao:'token_mover',tokenId:tJ,x:8,y:3,atravessar:true})
r=await mesa(J,{acao:'token_mover',tokenId:tJ,x:4,y:3}); check('jogador não entra com a porta fechada', r.s===400 && /parede/.test(r.d.erro), r)
r=await mesa(J,{acao:'token_mover',tokenId:tJ,x:9,y:9}); check('jogador anda livre por fora', r.s===200, r)
await mesa(M,{acao:'token_mover',tokenId:tJ,x:8,y:3,atravessar:true})
r=await mesa(J,{acao:'porta',cenaId:cena,id:porta}); check('jogador abre a porta', r.s===200 && r.d.paredes.find(p=>p.id===porta).aberta===true, r)
r=await mesa(J,{acao:'token_mover',tokenId:tJ,x:4,y:3}); check('com a porta aberta, entra', r.s===200, r)
r=await mesa(J,{acao:'porta',cenaId:cena,id:porta,trancada:true}); check('jogador não tranca', r.s===403, r)
r=await mesa(M,{acao:'porta',cenaId:cena,id:porta,trancada:true}); check('mestre tranca (e a porta fecha)', r.s===200 && r.d.paredes.find(p=>p.id===porta).trancada===true && !r.d.paredes.find(p=>p.id===porta).aberta, r)
r=await mesa(J,{acao:'porta',cenaId:cena,id:porta}); check('porta trancada não abre para o jogador', r.s===403, r)
r=await mesa(J,{acao:'token_mover',tokenId:tJ,x:9,y:3}); check('preso na sala com a porta trancada', r.s===400, r)
r=await mesa(M,{acao:'token_mover',tokenId:tJ,x:9,y:3}); check('o mestre também não atravessa a parede sem querer', r.s===400, r)
r=await mesa(M,{acao:'token_mover',tokenId:tJ,x:9,y:3,atravessar:true}); check('com “atravessar”, o mestre põe o token onde quiser', r.s===200, r)
r=await mesa(J,{acao:'token_mover',tokenId:tJ,x:4,y:3,atravessar:true}); check('jogador não usa “atravessar”', r.s===400, r)
r=await mesa(N,{acao:'porta',cenaId:cena,id:porta}); check('outro jogador também não abre a porta trancada', r.s===403, r)
r=await call(J,'GET','mesa/'+cid); check('a cena traz as paredes', r.d.cenaAtiva?.paredes?.length===6, r.d.cenaAtiva?.paredes)
const qual=r.d.cenaAtiva.paredes.find(p=>p.tipo==='parede').id
r=await mesa(M,{acao:'parede_excluir',cenaId:cena,id:qual}); check('mestre apaga uma parede', r.s===200 && r.d.paredes.length===5, r)
r=await mesa(M,{acao:'paredes_limpar',cenaId:cena}); check('mestre apaga todas', r.s===200 && r.d.paredes.length===0, r)
// v0.35.4: parede solta (como em volta de um caixote) trava quem tenta passar por ela, mesmo havendo caminho em volta.
await mesa(M,{acao:'token_mover',tokenId:tJ,x:1,y:3,atravessar:true})
r=await mesa(M,{acao:'parede_criar',cenaId:cena,paredes:[{x1:3.25,y1:1.5,x2:3.75,y2:7.4,tipo:'parede'}]}); check('ponta fora da grade é aceita', r.s===200 && r.d.paredes[0].x1===3.25, r)
r=await mesa(J,{acao:'token_mover',tokenId:tJ,x:6,y:3}); check('parede solta trava o jogador', r.s===400, r)
r=await mesa(J,{acao:'token_mover',tokenId:tJ,x:1,y:0}); check('anda para o lado livre', r.s===200, r)
r=await mesa(J,{acao:'token_mover',tokenId:tJ,x:6,y:0}); check('e contorna por cima', r.s===200, r)
await mesa(M,{acao:'paredes_limpar',cenaId:cena})
// Porta em forma (3 pedaços com o mesmo grupo): abre junto e apaga junto.
const g='porta-grupo-123'
r=await mesa(M,{acao:'parede_criar',cenaId:cena,paredes:[[8,8,9,8],[9,8,9,9],[9,9,8,9]].map(([x1,y1,x2,y2])=>({x1,y1,x2,y2,tipo:'porta',grupo:g}))}); check('forma com grupo', r.s===200 && r.d.paredes.every(p=>p.grupo===g), r)
r=await mesa(J,{acao:'porta',cenaId:cena,id:r.d.paredes[1].id}); check('a porta em forma abre inteira', r.s===200 && r.d.paredes.every(p=>p.aberta===true), r)
r=await mesa(M,{acao:'parede_criar',cenaId:cena,paredes:[{x1:0,y1:11,x2:3,y2:11}]})
r=await mesa(M,{acao:'parede_excluir',cenaId:cena,id:r.d.paredes[0].id}); check('apagar um pedaço apaga a forma inteira', r.s===200 && r.d.paredes.length===1 && !r.d.paredes[0].grupo, r)
r=await mesa(M,{acao:'parede_criar',cenaId:cena,paredes:Array.from({length:81},(_,i)=>({x1:0,y1:i*0.1,x2:1,y2:i*0.1+0.05}))}); check('no máximo 80 pedaços por vez', r.s===200 && r.d.paredes.length===81, r)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
