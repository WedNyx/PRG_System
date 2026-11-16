// v0.35.2: visão de cada personagem — alcance próprio e visão no escuro; com a cena escura, só se vê o que a luz alcança. Precisa da migração 033.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222', N='33333333-3333-4333-8333-333333333333'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'Mesa do escuro',sistema:'tormenta20',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); const cod=r.d.convite.codigo; await call(J,'POST','convites/'+cod,{}); await call(N,'POST','convites/'+cod,{})
r=await call(M,'GET','campanhas/'+cid); for (const s of r.d.solicitacoes) await call(M,'POST',`campanhas/${cid}/solicitacoes/${s.id}`,{decisao:'aceitar'})
await call(M,'POST','mesa/'+cid,{acao:'sessao',aberta:true})
const mesa=(q,b)=>call(q,'POST','mesa/'+cid,b)
const celulas=lista=>{ const s=new Set(); for (const k of lista??[]) { const m=/^(\d+)(?:-(\d+))?,(\d+)$/.exec(k); if(!m) continue; for(let x=+m[1];x<=+(m[2]??m[1]);x++) s.add(x+','+m[3]) } return s }
const nevoa=async()=>{ const r=await call(M,'GET','mesa/'+cid); return celulas(r.d.cenaAtiva?.fog_revelado) }
r=await mesa(M,{acao:'cena_criar',nome:'Caverna',grid_cols:30,grid_rows:6}); let cena=r.d.cena.id
r=await call(M,'GET','mesa/'+cid); cena=r.d.cenaAtiva?.id ?? cena; if(!r.d.cenaAtiva) await mesa(M,{acao:'cena_ativar',cenaId:cena})
await mesa(M,{acao:'cena_editar',cenaId:cena,visao_dinamica:true,escuridao:80})
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'tormenta20',nome:'Nix'}); const fJ=r.d.ficha.id
r=await mesa(J,{acao:'token_criar',cenaId:cena,fichaId:fJ}); const tJ=r.d.token.id
await mesa(M,{acao:'token_mover',tokenId:tJ,x:2,y:2})
let n=await nevoa(); check('no escuro, sem luz nem visão no escuro, só a própria casa aparece', n.has('2,2') && !n.has('3,2') && !n.has('5,2'), [...n])
r=await mesa(J,{acao:'token_editar',tokenId:tJ,visao:{alcance:0,escuro:6}}); n=await nevoa()
check('com visão no escuro de 6 m (4 casas), enxerga em volta', r.s===200 && n.has('5,2') && !n.has('8,2'), [...n].length)
r=await call(J,'GET','mesa/'+cid); check('o token guarda a visão', r.d.tokens.find(t=>t.id===tJ)?.visao?.escuro===6 && r.d.tokens.find(t=>t.id===tJ)?.visao?.alcance===0, r.d.tokens.find(t=>t.id===tJ)?.visao)
// Uma fogueira longe ilumina outra parte da caverna.
r=await mesa(M,{acao:'token_criar',cenaId:cena,nome:'Fogueira',x:20,y:2,luz:{brilho:3,penumbra:3,cor:'#ff8c42'}}); n=await nevoa()
check('a luz de outro token ilumina o que fica no alcance dela', n.has('20,2') && n.has('23,2') && !n.has('14,2'), [...n].filter(k=>+k.split(',')[0]>10))
// Parede entre o personagem e a fogueira: a área atrás dela não se revela.
await mesa(M,{acao:'parede_criar',cenaId:cena,parede:{x1:12,y1:0,x2:12,y2:6}})
await mesa(M,{acao:'cena_editar',cenaId:cena,fog_limpar:true}); n=await nevoa()
check('parede no caminho: a luz lá longe não aparece', !n.has('20,2') && n.has('5,2'), [...n].filter(k=>+k.split(',')[0]>10))
// Cena clara: alcance limitado pelo token.
await mesa(J,{acao:'token_editar',tokenId:tJ,visao:{alcance:3,escuro:0}})
await mesa(M,{acao:'cena_editar',cenaId:cena,escuridao:0}); await mesa(M,{acao:'cena_editar',cenaId:cena,fog_limpar:true}); n=await nevoa()
check('com a cena clara, cada um vê até o próprio alcance (3 m = 2 casas)', n.has('4,2') && !n.has('6,2'), [...n].length)
r=await mesa(J,{acao:'token_editar',tokenId:tJ,visao:null}); r=await call(J,'GET','mesa/'+cid); check('tirar a visão própria volta ao alcance da cena', r.d.tokens.find(t=>t.id===tJ)?.visao===null, r.d.tokens.find(t=>t.id===tJ))
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
