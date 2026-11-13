// v0.33.8: mapa até 200×200, partes do mapa com névoa, escuridão da cena e luz própria dos tokens. Precisa da migração 028.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222', N='33333333-3333-4333-8333-333333333333'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'Mesa da névoa',sistema:'tormenta20',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); const cod=r.d.convite.codigo; await call(J,'POST','convites/'+cod,{}); await call(N,'POST','convites/'+cod,{})
r=await call(M,'GET','campanhas/'+cid); for (const s of r.d.solicitacoes) await call(M,'POST',`campanhas/${cid}/solicitacoes/${s.id}`,{decisao:'aceitar'})
await call(M,'POST','mesa/'+cid,{acao:'sessao',aberta:true})
const mesa=(b)=>call(M,'POST','mesa/'+cid,b)

r=await mesa({acao:'cena_criar',nome:'Reino',grid_cols:200,grid_rows:150}); check('cena de 200×150', r.s===201 && r.d.cena.grid_cols===200 && r.d.cena.grid_rows===150, r.d)
const cena=r.d.cena.id
r=await mesa({acao:'cena_criar',nome:'Grande demais',grid_cols:500,grid_rows:500}); check('acima de 200 fica em 200', r.d.cena?.grid_cols===200, r.d)
r=await mesa({acao:'cena_editar',cenaId:cena,fog_ativo:true}); check('liga a névoa', r.s===200, r.d)
r=await mesa({acao:'cena_editar',cenaId:cena,nevoa_tudo:true}); r=await call(M,'GET','mesa/'+cid)
check('“revelar tudo” num mapa 200×150 guarda faixas (150), não 30 mil células', r.d.cenaAtiva.fog_revelado.length===150 && r.d.cenaAtiva.fog_revelado[0]==='0-199,0', r.d.cenaAtiva.fog_revelado.slice(0,3))
r=await mesa({acao:'nevoa',cenaId:cena,revelar:false,retangulo:{x:10,y:10,w:20,h:5}}); r=await call(M,'GET','mesa/'+cid)
check('esconder um retângulo grande de uma vez', r.d.cenaAtiva.fog_revelado.includes('0-9,10') && r.d.cenaAtiva.fog_revelado.includes('30-199,10'), r.d.cenaAtiva.fog_revelado.slice(10,12))
r=await mesa({acao:'cena_editar',cenaId:cena,fog_limpar:true,fog_areas:[{id:'sala',nome:'Cripta',x:5,y:5,w:10,h:8},{id:'rio',nome:'Rio',x:400,y:5,w:3,h:3}]})
r=await call(M,'GET','mesa/'+cid); check('cria as partes com névoa (fora do mapa é ajustada para dentro)', r.d.cenaAtiva.fog_areas.length===2 && r.d.cenaAtiva.fog_areas[0].nome==='Cripta' && r.d.cenaAtiva.fog_areas[1].x===199, r.d.cenaAtiva.fog_areas)
r=await mesa({acao:'cena_editar',cenaId:cena,fog_areas:r.d.cenaAtiva.fog_areas.map(a=>a.id==='sala'?{...a,revelada:true}:a)}); r=await call(M,'GET','mesa/'+cid)
check('revela a Cripta com um toque', r.d.cenaAtiva.fog_areas.find(a=>a.id==='sala').revelada===true, r.d.cenaAtiva.fog_areas)
r=await call(J,'POST','mesa/'+cid,{acao:'cena_editar',cenaId:cena,fog_areas:[]}); check('jogador não mexe na névoa', r.s===403, r)
r=await mesa({acao:'cena_editar',cenaId:cena,escuridao:80,luz_revela_nevoa:false}); r=await call(J,'GET','mesa/'+cid)
check('escuridão da cena chega ao jogador', r.d.cenaAtiva.escuridao===80 && r.d.cenaAtiva.luz_revela_nevoa===false, r.d.cenaAtiva)
r=await mesa({acao:'cena_editar',cenaId:cena,escuridao:250}); r=await call(M,'GET','mesa/'+cid); check('escuridão fica entre 0 e 100', r.d.cenaAtiva.escuridao===100, r.d.cenaAtiva.escuridao)

// Luz dos tokens
r=await call(J,'POST','mesa/'+cid,{acao:'token_criar',cenaId:cena,nome:'Nix',x:6,y:6}); const tJ=r.d.token.id
r=await call(J,'POST','mesa/'+cid,{acao:'token_editar',tokenId:tJ,luz:{brilho:6,penumbra:6,cor:'#ffb347'}}); check('jogador acende uma tocha no próprio token', r.s===200, r.d)
r=await call(N,'POST','mesa/'+cid,{acao:'token_editar',tokenId:tJ,luz:{brilho:60,penumbra:0}}); check('outro jogador não mexe na luz do token dos outros', r.s===403, r)
r=await mesa({acao:'token_criar',cenaId:cena,nome:'Fogueira',x:20,y:20,luz:{brilho:9,penumbra:12,cor:'#ff8c42'}}); check('mestre cria token já com luz', r.s===201 && r.d.token.luz?.penumbra===12, r.d)
r=await call(J,'GET','mesa/'+cid); const t=r.d.tokens.find(x=>x.id===tJ)
check('a luz fica salva (metros, limite de 60)', t.luz?.brilho===6 && t.luz?.cor==='#ffb347', t)
r=await call(J,'POST','mesa/'+cid,{acao:'token_editar',tokenId:tJ,luz:null}); r=await call(J,'GET','mesa/'+cid); check('apagar a luz', r.d.tokens.find(x=>x.id===tJ).luz===null, r.d.tokens.find(x=>x.id===tJ))
console.log(falhas?`\n${falhas} falha(s)`:'\nTudo certo!'); process.exit(falhas?1:0)
