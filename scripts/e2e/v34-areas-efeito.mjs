// v0.34.9: áreas de efeito no mapa (círculo, cone, linha, quadrado) e decisão do mestre fora do chat. Precisa da migração 030.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222', N='33333333-3333-4333-8333-333333333333'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'Mesa das áreas',sistema:'tormenta20',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); const cod=r.d.convite.codigo; await call(J,'POST','convites/'+cod,{}); await call(N,'POST','convites/'+cod,{})
r=await call(M,'GET','campanhas/'+cid); for (const s of r.d.solicitacoes) await call(M,'POST',`campanhas/${cid}/solicitacoes/${s.id}`,{decisao:'aceitar'})
await call(M,'POST','mesa/'+cid,{acao:'sessao',aberta:true})
const mesa=(q,b)=>call(q,'POST','mesa/'+cid,b)
r=await mesa(M,{acao:'cena_criar',nome:'Ponte',grid_cols:20,grid_rows:20}); let cena=r.d.cena.id
r=await call(M,'GET','mesa/'+cid); cena=r.d.cenaAtiva?.id ?? cena; if(!r.d.cenaAtiva) await mesa(M,{acao:'cena_ativar',cenaId:cena})

r=await mesa(J,{acao:'area_criar',cenaId:cena,area:{forma:'circulo',x:5.5,y:5.5,metros:6,cor:'#38bdf8',nome:'Bola de fogo'}})
check('jogador coloca uma área no mapa', r.s===200 && r.d.areas?.length===1 && r.d.areas[0].nome==='Bola de fogo', r)
const aJ=r.d.areas?.[0]?.id
r=await mesa(M,{acao:'area_criar',cenaId:cena,area:{forma:'cone',x:2.5,y:2.5,angulo:45,metros:9}}); const aM=r.d.areas?.find(a=>a.forma==='cone')?.id
check('mestre coloca um cone', r.s===200 && r.d.areas.length===2 && !!aM, r)
r=await call(J,'GET','mesa/'+cid); check('todos veem as áreas da cena', r.d.cenaAtiva?.areas_efeito?.length===2, r.d.cenaAtiva?.areas_efeito)
r=await mesa(J,{acao:'area_criar',cenaId:cena,area:{forma:'estrela',x:1,y:1,metros:6}}); check('forma inválida é recusada', r.s===400, r)
r=await mesa(J,{acao:'area_criar',cenaId:cena,area:{forma:'circulo',x:99,y:1,metros:6}}); check('fora do mapa é recusada', r.s===400, r)
r=await mesa(J,{acao:'area_excluir',cenaId:cena,id:aM}); check('jogador não tira a área do mestre', r.s===403, r)
r=await mesa(N,{acao:'area_criar',cenaId:cena,area:{forma:'circulo',x:1.5,y:1.5,metros:3}}); check('outro jogador também coloca', r.s===200 && r.d.areas.length===3, r)
r=await mesa(J,{acao:'area_excluir',cenaId:cena,id:aJ}); check('jogador tira a própria área', r.s===200 && r.d.areas.length===2 && !r.d.areas.some(a=>a.id===aJ), r)
r=await mesa(J,{acao:'areas_limpar',cenaId:cena}); check('só o mestre tira todas', r.s===403, r)
r=await mesa(M,{acao:'areas_limpar',cenaId:cena}); check('mestre tira todas', r.s===200 && r.d.areas.length===0, r)
for (let i=0;i<30;i++) await mesa(M,{acao:'area_criar',cenaId:cena,area:{forma:'quadrado',x:(i%20)+0.5,y:1.5,metros:1.5}})
r=await mesa(M,{acao:'area_criar',cenaId:cena,area:{forma:'quadrado',x:3.5,y:3.5,metros:1.5}}); check('limite de 30 áreas por cena', r.s===400, r)

// Ataque esperando o mestre: o texto de “não acertou” e o status.
await mesa(M,{acao:'combate_config',acerto:'mestre'})
const tA=(await mesa(M,{acao:'token_criar',cenaId:cena,nome:'Ogro',hp_max:30,x:4,y:4})).d.token.id
const tB=(await mesa(M,{acao:'token_criar',cenaId:cena,nome:'Rato',hp_max:30,x:5,y:4})).d.token.id
let pend=null
for (let i=0;i<20 && !pend;i++) { r=await mesa(M,{acao:'ataque',atacante:tA,alvo:tB,dano:'1d6',bonus:50,defesa:1}); if (r.d.evento?.dados?.status==='pendente') pend=r.d.evento }
check('ataque que acerta fica esperando o mestre', !!pend, r.d)
if (pend) { r=await mesa(M,{acao:'ataque_decidir',eventoId:pend.id,fator:0}); r=await call(M,'GET','mesa/'+cid)
  check('“não acertou” deixa o aviso claro no chat', r.d.eventos.some(e=>/decidiu: o ataque não acertou Rato/.test(e.texto??'')) && r.d.eventos.find(e=>e.id===pend.id)?.dados?.status==='ignorado', r.d.eventos.slice(-3)) }
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
