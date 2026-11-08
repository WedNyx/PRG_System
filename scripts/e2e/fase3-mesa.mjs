// Testes da mesa virtual (Fase 3). Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222', X='33333333-3333-4333-8333-333333333333'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
const mesa=(q,b)=>call(q,'POST','mesa/'+cid,b)
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,300))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'Mesa Teste',sistema:'Faroeste Arcano',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); await call(J,'POST','convites/'+r.d.convite.codigo,{}); r=await call(M,'GET','campanhas/'+cid); await call(M,'POST',`campanhas/${cid}/solicitacoes/${r.d.solicitacoes[0].id}`,{decisao:'aceitar'})
r=await call(X,'GET','mesa/'+cid); check('quem não participa não abre a mesa', r.s===404, r)
r=await call(J,'GET','mesa/'+cid); check('jogador abre mesa vazia', r.s===200 && r.d.cenaAtiva===null, r)
r=await mesa(J,{acao:'cena_criar',nome:'X'}); check('jogador não cria cena', r.s===403, r)
r=await mesa(M,{acao:'cena_criar',nome:'Saloon',mapa_url:'javascript:alert(1)'}); check('mapa só https', r.s===400, r)
r=await mesa(M,{acao:'cena_criar',nome:'Saloon',mapa_url:'https://exemplo.com/mapa.png',grid_cols:12,grid_rows:8}); check('mestre cria cena (1ª já fica ativa)', r.s===201 && r.d.cena.ativa, r); const c1=r.d.cena.id
r=await mesa(M,{acao:'cena_criar',nome:'Deserto'}); const c2=r.d.cena.id
r=await call(J,'GET','mesa/'+cid); check('jogador só vê a cena ativa', r.d.cenas.length===1 && r.d.cenaAtiva.id===c1, r.d.cenas)
// ficha do jogador aprovada na campanha
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'faroeste-arcano',nome:'Calamity'}); const fj=r.d.ficha.id
r=await mesa(J,{acao:'token_criar',cenaId:c1,fichaId:fj,nome:'Calamity',hp_max:20}); check('jogador coloca o próprio personagem', r.s===201, r); const tj=r.d.token.id
r=await mesa(J,{acao:'token_criar',cenaId:c1,nome:'Monstro'}); check('jogador não cria token avulso', r.s===403, r)
r=await mesa(M,{acao:'token_criar',cenaId:c1,nome:'Bandido',hp_max:11,visivel:false,npc:true,cor:'#ff0000'}); check('mestre cria token escondido', r.s===201, r); const tm=r.d.token.id
r=await call(J,'GET','mesa/'+cid); check('jogador não vê token escondido', r.d.tokens.length===1 && r.d.tokens[0].id===tj, r.d.tokens)
r=await call(M,'GET','mesa/'+cid); check('mestre vê todos os tokens', r.d.tokens.length===2, r.d.tokens)
r=await mesa(J,{acao:'token_mover',tokenId:tj,x:3,y:4}); check('jogador move o seu token', r.s===200, r)
r=await mesa(J,{acao:'token_mover',tokenId:tm,x:1,y:1}); check('jogador não move token do mestre', r.s===403, r)
r=await mesa(M,{acao:'token_mover',tokenId:tm,x:999,y:-5}); r=await call(M,'GET','mesa/'+cid); const b=r.d.tokens.find(t=>t.id===tm); check('posição limitada à grade', b.x===11 && b.y===0, b)
r=await mesa(J,{acao:'token_editar',tokenId:tj,hp_atual:15,condicoes:['caido','hack'],nome:'Hack'}); r=await call(J,'GET','mesa/'+cid); const tt=r.d.tokens[0]; check('dono muda PV/condições, não o nome', tt.hp_atual===15 && tt.condicoes.join()==='caido' && tt.nome==='Calamity', tt)
r=await mesa(J,{acao:'token_editar',tokenId:tm,hp_atual:1}); check('jogador não edita token do mestre', r.s===403, r)
r=await mesa(M,{acao:'nevoa',cenaId:c1,celulas:['1,1','2,2','50,50'],revelar:true}); r=await call(J,'GET','mesa/'+cid); check('névoa revelada (só células válidas)', r.d.cenaAtiva.fog_revelado.sort().join()==='1,1,2,2', r.d.cenaAtiva)
r=await mesa(J,{acao:'nevoa',cenaId:c1,celulas:['3,3'],revelar:true}); check('jogador não mexe na névoa', r.s===403, r)
// chat e rolagens
r=await mesa(J,{acao:'evento',tipo:'rolagem',expressao:'2d6+3',personagem:'Calamity'}); check('rolagem feita no servidor', r.s===201 && r.d.evento.resultados.length===2 && r.d.evento.total===r.d.evento.resultados[0]+r.d.evento.resultados[1]+3, r)
r=await mesa(J,{acao:'evento',tipo:'rolagem',expressao:'rm -rf'}); check('expressão inválida recusada', r.s===400, r)
await mesa(J,{acao:'evento',tipo:'rolagem',expressao:'1d20',visibilidade:'mestre'})
await mesa(M,{acao:'evento',tipo:'chat',texto:'Psiu, só pra você',visibilidade:'privada',destinatarioId:J})
await mesa(M,{acao:'evento',tipo:'chat',texto:'Segredo do mestre',visibilidade:'mestre'})
r=await mesa(J,{acao:'evento',tipo:'chat',texto:'oi',visibilidade:'privada',destinatarioId:X}); check('privado só para participantes', r.s===400, r)
r=await call(J,'GET','mesa/'+cid); const ej=r.d.eventos
check('jogador vê: a própria secreta, a privada para ele, não o segredo do mestre', ej.length===3 && ej.some(e=>e.visibilidade==='mestre'&&e.autor_id===J) && ej.some(e=>e.visibilidade==='privada') && !ej.some(e=>e.texto==='Segredo do mestre'), ej.map(e=>[e.visibilidade,e.texto]))
r=await call(M,'GET','mesa/'+cid); check('mestre vê todos os 4', r.d.eventos.length===4, r.d.eventos.length)
// histórico com filtros
r=await call(M,'GET',`mesa/${cid}?historico=1&tipo=rolagem&autor=${J}`); check('histórico filtrado por jogador e tipo', r.d.eventos.length===2, r)
r=await call(M,'GET',`mesa/${cid}?historico=1&personagem=calam`); check('histórico por personagem', r.d.eventos.length===1, r)
// iniciativa
r=await mesa(J,{acao:'iniciativa',iniciativa:[]}); check('jogador não controla iniciativa', r.s===403, r)
r=await mesa(M,{acao:'iniciativa',iniciativa:[{nome:'Bandido',valor:8},{nome:'Calamity',valor:17}],turno:1,rodada:2}); check('iniciativa ordenada', r.d.mesa.iniciativa[0].nome==='Calamity' && r.d.mesa.turno===1, r)
// desenhos
r=await mesa(J,{acao:'desenho',cenaId:c1,cor:'#38bdf8',pontos:[1,2,30,40]}); check('jogador desenha', r.s===201, r)
r=await mesa(J,{acao:'desenhos_limpar',cenaId:c1}); check('só o mestre apaga desenhos', r.s===403, r)
// trocar cena
r=await mesa(M,{acao:'cena_ativar',cenaId:c2}); r=await call(J,'GET','mesa/'+cid); check('jogador passa a ver a nova cena, sem tokens da outra', r.d.cenaAtiva.id===c2 && r.d.tokens.length===0, r.d.cenaAtiva)
r=await mesa(M,{acao:'cena_excluir',cenaId:c1}); check('excluir cena', r.s===200, r)
console.log(falhas?`\n${falhas} FALHA(S)`:'\nTODOS OS TESTES PASSARAM')
