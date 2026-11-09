// v0.6.0: mapa em camadas, movimento/travas de tokens, sessões, anotações e recompensas. Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222', X='33333333-3333-4333-8333-333333333333'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,300))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'V06',sistema:'Lunethernnyis — Opositores',modeloPadrao:'C'}); const cid=r.d.campanha.id
// v0.10.0: a mesa só abre com a sessão aberta pelo mestre.
await call(M,'POST','mesa/'+cid,{acao:'sessao',aberta:true})
const mesa=(q,b)=>call(q,'POST','mesa/'+cid,b)
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); await call(J,'POST','convites/'+r.d.convite.codigo,{}); r=await call(M,'GET','campanhas/'+cid); await call(M,'POST',`campanhas/${cid}/solicitacoes/${r.d.solicitacoes[0].id}`,{decisao:'aceitar'})
r=await mesa(M,{acao:'cena_criar',nome:'Vila',grid_cols:20,grid_rows:12}); const c=r.d.cena.id
// camadas
r=await mesa(M,{acao:'cena_editar',cenaId:c,camadas:[{url:'https://x/a.png',x:0,y:0,w:10,h:6},{url:'https://x/b.png',x:10,y:0,w:10,h:6}]}); check('mestre monta mapa com 2 imagens', r.s===200, r)
r=await call(J,'GET','mesa/'+cid); check('jogador vê as camadas', r.d.cenaAtiva.camadas.length===2, r.d.cenaAtiva)
r=await mesa(J,{acao:'cena_editar',cenaId:c,camadas:[]}); check('jogador não mexe no mapa', r.s===403, r)
r=await mesa(M,{acao:'cena_editar',cenaId:c,camadas:[{id:'r1',url:'https://x/a.png',x:0,y:0,w:20,h:12,cx:0.25,cy:0.1,cw:0.5,ch:0.6}]}); r=await call(J,'GET','mesa/'+cid); check('recorte da imagem é salvo (v0.6.1)', r.d.cenaAtiva.camadas[0].cw===0.5 && r.d.cenaAtiva.camadas[0].cx===0.25, r.d.cenaAtiva.camadas)
r=await mesa(M,{acao:'cena_editar',cenaId:c,grid_cols:30,grid_rows:20}); r=await call(J,'GET','mesa/'+cid); check('mestre muda o tamanho do mapa', r.d.cenaAtiva.grid_cols===30 && r.d.cenaAtiva.grid_rows===20, r.d.cenaAtiva)
await mesa(M,{acao:'cena_editar',cenaId:c,grid_cols:20,grid_rows:12})
r=await mesa(M,{acao:'cena_criar',nome:'Com imagem',grid_cols:10,grid_rows:6,camadas:[{url:'https://x/m.png',x:0,y:0,w:10,h:6}]}); check('cena nova já com imagem recortável', r.s===201 && r.d.cena.camadas.length===1, r)
r=await mesa(M,{acao:'cena_editar',cenaId:c,camadas:[{url:'javascript:alert(1)'}]}); check('camada com link perigoso recusada', r.s===400, r)
// névoa tudo
await mesa(M,{acao:'cena_editar',cenaId:c,fog_ativo:true})
r=await mesa(M,{acao:'cena_editar',cenaId:c,nevoa_tudo:true}); r=await call(J,'GET','mesa/'+cid); check('revelar tudo', r.d.cenaAtiva.fog_revelado.length===240, r.d.cenaAtiva.fog_revelado.length)
await mesa(M,{acao:'cena_editar',cenaId:c,fog_limpar:true}); r=await call(J,'GET','mesa/'+cid); check('esconder tudo', r.d.cenaAtiva.fog_revelado.length===0, r)
// token do jogador sem ficha
r=await mesa(J,{acao:'token_criar',cenaId:c,nome:'Sol'}); check('jogador coloca token próprio sem ficha', r.s===201 && r.d.token.dono_id===J, r); const tj=r.d.token.id
await mesa(J,{acao:'token_criar',cenaId:c,nome:'2'}); await mesa(J,{acao:'token_criar',cenaId:c,nome:'3'})
r=await mesa(J,{acao:'token_criar',cenaId:c,nome:'4'}); check('limite de 3 tokens do jogador', r.s===429, r)
r=await mesa(M,{acao:'token_criar',cenaId:c,nome:'Carroça',movimento:'todos',tamanho:2}); const tt=r.d.token.id; check('mestre cria token que todos movem (2×2)', r.d.token.movimento==='todos' && r.d.token.tamanho===2, r)
r=await mesa(J,{acao:'token_mover',tokenId:tt,x:5,y:5}); check('jogador move token "todos movem"', r.s===200, r)
await mesa(M,{acao:'token_editar',tokenId:tj,movimento:'mestre'})
r=await mesa(J,{acao:'token_mover',tokenId:tj,x:1,y:1}); check('mestre bloqueou o token do jogador', r.s===403, r)
await mesa(M,{acao:'token_editar',tokenId:tj,movimento:'dono'})
await mesa(M,{acao:'cena_editar',cenaId:c,tokens_travados:true})
r=await mesa(J,{acao:'token_mover',tokenId:tj,x:1,y:1}); check('cena travada: jogador não move nada', r.s===403 && r.d.erro.includes('travou'), r)
r=await mesa(M,{acao:'token_mover',tokenId:tj,x:2,y:2}); check('mestre move mesmo travado', r.s===200, r)
await mesa(M,{acao:'cena_editar',cenaId:c,tokens_travados:false})
r=await mesa(J,{acao:'token_editar',tokenId:tj,imagem_url:'https://x/foto.png'}); check('jogador troca a imagem do próprio token', r.s===200, r)
r=await mesa(J,{acao:'token_editar',tokenId:tt,imagem_url:'https://x/foto.png'}); check('jogador não troca imagem do token do mestre', r.s===403, r)
r=await mesa(J,{acao:'token_editar',tokenId:tj,movimento:'todos',hp_atual:5}); r=await call(M,'GET','mesa/'+cid); check('jogador não muda a regra de movimento', r.d.tokens.find(t=>t.id===tj).movimento==='dono', r.d.tokens)
// sessões
r=await call(M,'POST',`campanhas/${cid}/sessoes`,{numero:1,titulo:'Chegada',preparacao:'Segredo: o xerife é o vilão',resumo:'O grupo chegou à vila.',publicada:false}); const s1=r.d.sessao.id; check('mestre cria sessão', r.s===201, r)
r=await call(J,'GET',`campanhas/${cid}/sessoes`); check('rascunho não aparece para jogador', r.d.sessoes.length===0, r)
await call(M,'POST',`campanhas/${cid}/sessoes`,{id:s1,numero:1,titulo:'Chegada',preparacao:'Segredo: o xerife é o vilão',resumo:'O grupo chegou à vila.',publicada:true})
r=await call(J,'GET',`campanhas/${cid}/sessoes`); check('publicada aparece sem a preparação', r.d.sessoes.length===1 && !('preparacao' in r.d.sessoes[0]) && r.d.sessoes[0].resumo.includes('chegou'), r)
r=await call(J,'POST',`campanhas/${cid}/sessoes`,{titulo:'x'}); check('jogador não cria sessão', r.s===403, r)
// notas
await call(M,'POST',`campanhas/${cid}/notas`,{titulo:'Privada do mestre',texto:'x',visibilidade:'privada'})
await call(M,'POST',`campanhas/${cid}/notas`,{titulo:'Para todos',texto:'mapa',visibilidade:'campanha'})
await call(M,'POST',`campanhas/${cid}/notas`,{titulo:'Só pro Sol',visibilidade:'jogador',destinatarioId:J})
r=await call(J,'POST',`campanhas/${cid}/notas`,{titulo:'Pro mestre',visibilidade:'mestre'}); const nj=r.d.nota.id
await call(J,'POST',`campanhas/${cid}/notas`,{titulo:'Minha privada',visibilidade:'privada'})
r=await call(J,'GET',`campanhas/${cid}/notas`); check('jogador vê: todos, a dele com mestre, privada dele, a enviada a ele (4)', r.d.notas.length===4 && !r.d.notas.some(n=>n.titulo==='Privada do mestre'), r.d.notas.map(n=>n.titulo))
r=await call(M,'GET',`campanhas/${cid}/notas`); check('mestre vê as suas + a do jogador para o mestre, não a privada do jogador', r.d.notas.some(n=>n.titulo==='Pro mestre') && !r.d.notas.some(n=>n.titulo==='Minha privada'), r.d.notas.map(n=>n.titulo))
r=await call(M,'POST',`campanhas/${cid}/notas`,{id:nj,titulo:'hack'}); check('não edita nota de outro', r.s===403, r)
r=await call(X,'GET',`campanhas/${cid}/notas`); check('estranho não vê notas', r.s===404, r)
// recompensas
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'lunethernnyis-v8',nome:'Lyra'}); const f1=r.d.ficha.id
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'dnd5e-srd',nome:'Thorin'}); const f2=r.d.ficha.id
r=await call(J,'POST',`campanhas/${cid}/recompensas`,{fichaIds:[f1],xp:100}); check('jogador não dá recompensa', r.s===403, r)
r=await call(M,'POST',`campanhas/${cid}/recompensas`,{fichaIds:[f1,f2],xp:300,item:'Revólver',motivo:'Salvaram a vila'}); check('mestre recompensa 2 fichas', r.d.recompensados?.length===2, r)
r=await call(J,'GET','fichas/'+f1); check('V8: XP somado e item no inventário', r.d.ficha.dados.fields.xp==='300' && r.d.ficha.dados.fields.inventory.includes('Revólver'), r.d.ficha.dados)
r=await call(J,'GET','fichas/'+f2); check('D&D: XP anotado e item no inventário estruturado (v0.9.0)', r.d.ficha.dados.listas.anotacoes.includes('+300 XP') && r.d.ficha.dados.itens.some(i=>i.nome.includes('Revólver')), r.d.ficha.dados)
r=await call(J,'GET','mesa/'+cid); check('recompensa anunciada no chat', r.d.eventos.some(e=>e.tipo==='sistema' && e.texto.includes('Revólver')), r.d.eventos.map(e=>e.texto))
r=await call(J,'GET',`fichas/${f1}/historico`); check('recompensa no histórico da ficha', r.d.historico.some(h=>h.tipo==='recompensa' && h.descricao.includes('Salvaram')), r.d.historico)
console.log(falhas?`\n${falhas} FALHA(S)`:'\nTODOS OS TESTES PASSARAM')
