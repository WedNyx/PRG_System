// v0.35.0: visão dos personagens — a névoa se abre pelo que os tokens dos jogadores enxergam; paredes e portas fechadas bloqueiam, janelas deixam ver. Precisa da migração 032.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222', N='33333333-3333-4333-8333-333333333333'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'Mesa da visão',sistema:'tormenta20',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); const cod=r.d.convite.codigo; await call(J,'POST','convites/'+cod,{}); await call(N,'POST','convites/'+cod,{})
r=await call(M,'GET','campanhas/'+cid); for (const s of r.d.solicitacoes) await call(M,'POST',`campanhas/${cid}/solicitacoes/${s.id}`,{decisao:'aceitar'})
await call(M,'POST','mesa/'+cid,{acao:'sessao',aberta:true})
const mesa=(q,b)=>call(q,'POST','mesa/'+cid,b)
const celulas=lista=>{ const s=new Set(); for (const k of lista??[]) { const m=/^(\d+)(?:-(\d+))?,(\d+)$/.exec(k); if(!m) continue; for(let x=+m[1];x<=+(m[2]??m[1]);x++) s.add(x+','+m[3]) } return s }
const nevoa=async()=>{ const r=await call(M,'GET','mesa/'+cid); return celulas(r.d.cenaAtiva?.fog_revelado) }
r=await mesa(M,{acao:'cena_criar',nome:'Cripta',grid_cols:16,grid_rows:12}); let cena=r.d.cena.id
r=await call(M,'GET','mesa/'+cid); cena=r.d.cenaAtiva?.id ?? cena; if(!r.d.cenaAtiva) await mesa(M,{acao:'cena_ativar',cenaId:cena})
// Sala de (2,2) a (7,7): porta no lado direito (y 4–5) e janela embaixo (x 4–5).
const sala=[[2,2,7,2],[2,2,2,7],[2,7,4,7],[5,7,7,7],[7,2,7,4],[7,5,7,7]].map(([x1,y1,x2,y2])=>({x1,y1,x2,y2,tipo:'parede'}))
r=await mesa(M,{acao:'parede_criar',cenaId:cena,paredes:[...sala,{x1:7,y1:4,x2:7,y2:5,tipo:'porta'},{x1:4,y1:7,x2:5,y2:7,tipo:'janela'}]}); const porta=r.d.paredes.find(p=>p.tipo==='porta').id
r=await mesa(M,{acao:'cena_editar',cenaId:cena,visao_dinamica:true,visao_alcance:0}); check('mestre liga a visão dos personagens (a névoa liga junto)', r.s===200, r)
r=await call(M,'GET','mesa/'+cid); check('cena com visão e névoa', r.d.cenaAtiva.visao_dinamica===true && r.d.cenaAtiva.fog_ativo===true, r.d.cenaAtiva)
check('sem personagens, nada se revela', (await nevoa()).size===0, [...await nevoa()].slice(0,5))
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'tormenta20',nome:'Nix'}); const fJ=r.d.ficha.id
r=await mesa(J,{acao:'token_criar',cenaId:cena,fichaId:fJ,x:11,y:4}); const tJ=r.d.token.id
await mesa(M,{acao:'token_mover',tokenId:tJ,x:11,y:4})
let n=await nevoa(); check('o personagem revela o que vê de fora', n.has('11,4') && n.has('14,4') && n.has('8,4'), [...n].length)
check('a porta fechada esconde o lado de dentro', !n.has('4,4') && !n.has('3,3'), [...n].filter(k=>/^[3-6],[3-6]$/.test(k)))
r=await mesa(J,{acao:'porta',cenaId:cena,id:porta}); n=await nevoa()
check('abrindo a porta, o que dá para ver lá dentro aparece', r.s===200 && n.has('6,4') && n.has('4,4'), [...n].filter(k=>/^[3-6],[3-6]$/.test(k)))
await mesa(J,{acao:'porta',cenaId:cena,id:porta})
await mesa(M,{acao:'cena_editar',cenaId:cena,fog_limpar:true}); n=await nevoa()
check('“Esconder tudo” reabre só o que se vê agora', n.has('11,4') && !n.has('4,4'), [...n].length)
r=await mesa(J,{acao:'token_mover',tokenId:tJ,x:4,y:10}); n=await nevoa()
check('pela janela dá para ver dentro da sala', r.s===200 && n.has('4,5'), [...n].filter(k=>/^[3-6],[3-6]$/.test(k)))
check('mas não atrás da parede ao lado', !n.has('2,3'), [...n].filter(k=>/^[2-3],[2-3]$/.test(k)))
await mesa(M,{acao:'cena_editar',cenaId:cena,visao_alcance:3}); await mesa(M,{acao:'cena_editar',cenaId:cena,fog_limpar:true}); n=await nevoa()
check('o alcance limita a visão (3 m = 2 células)', n.has('4,10') && n.has('4,9') && !n.has('4,5') && !n.has('10,10'), [...n].length)
r=await mesa(M,{acao:'token_criar',cenaId:cena,nome:'Goblin',hp_max:7,x:14,y:1}); const antes=(await nevoa()).size
await mesa(M,{acao:'token_mover',tokenId:r.d.token.id,x:13,y:1}); check('token de NPC não revela nada', (await nevoa()).size===antes, antes)
await mesa(M,{acao:'cena_editar',cenaId:cena,visao_dinamica:false}); await mesa(M,{acao:'cena_editar',cenaId:cena,fog_limpar:true})
await mesa(J,{acao:'token_mover',tokenId:tJ,x:5,y:10}); check('com a visão desligada, andar não revela', (await nevoa()).size===0, [...await nevoa()].length)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
