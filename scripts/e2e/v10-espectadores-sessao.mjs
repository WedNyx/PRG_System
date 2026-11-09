// v0.10.0: espectadores, sessão aberta/fechada pelo mestre e controles de música só do mestre. Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222', X='33333333-3333-4333-8333-333333333333'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,300))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'V10',sistema:'D&D 5ª edição (SRD 5.2)',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); const cod=r.d.convite.codigo
await call(J,'POST','convites/'+cod,{}); await call(X,'POST','convites/'+cod,{})
r=await call(M,'GET','campanhas/'+cid); for (const s of r.d.solicitacoes) await call(M,'POST',`campanhas/${cid}/solicitacoes/${s.id}`,{decisao:'aceitar'})
const mesa=(q,b)=>call(q,'POST','mesa/'+cid,b), mus=(q,b)=>call(q,'POST',`campanhas/${cid}/musica`,b)

// sessão
r=await call(J,'GET','mesa/'+cid); check('sessão fechada: jogador não entra na mesa', r.s===423, r)
r=await call(M,'GET','mesa/'+cid); check('mestre entra mesmo com a sessão fechada', r.s===200 && r.d.sessao.aberta===false, r.d.sessao)
r=await mesa(J,{acao:'evento',tipo:'chat',texto:'oi'}); check('sessão fechada: jogador não manda nada', r.s===423, r)
r=await mesa(J,{acao:'sessao',aberta:true}); check('jogador não abre a sessão', r.s===423 || r.s===403, r)
r=await mesa(M,{acao:'sessao',aberta:true}); check('mestre abre a sessão', r.s===200, r)
r=await call(J,'GET','mesa/'+cid); check('jogador entra; aviso no chat', r.s===200 && r.d.sessao.aberta && r.d.eventos.some(e=>e.texto?.includes('abriu a sessão')), r.d.sessao)
r=await call(J,'GET','campanhas'); check('lista de campanhas mostra sessão aberta', r.d.campanhas.find(c=>c.id===cid)?.sessao_aberta===true, r.d)

// espectador
r=await call(M,'PATCH',`campanhas/${cid}/membros/${X}`,{papel:'espectador'}); check('mestre torna alguém espectador', r.s===200, r)
r=await call(J,'PATCH',`campanhas/${cid}/membros/${X}`,{papel:'jogador'}); check('jogador não muda papéis', r.s===403, r)
r=await call(X,'GET','mesa/'+cid); check('espectador assiste a mesa', r.s===200 && r.d.campanha.meuPapel==='espectador', r)
r=await mesa(X,{acao:'evento',tipo:'chat',texto:'Que cena!'}); check('espectador conversa no chat', r.s===201, r)
r=await mesa(X,{acao:'evento',tipo:'rolagem',expressao:'1d20'}); check('espectador não rola dados', r.s===403, r)
const cenaR=await mesa(M,{acao:'cena_criar',nome:'Vila',grid_cols:10,grid_rows:8}); const cena=cenaR.d.cena.id
r=await mesa(X,{acao:'token_criar',cenaId:cena,nome:'Eu'}); check('espectador não cria token', r.s===403, r)
r=await mesa(X,{acao:'desenho',cenaId:cena,cor:'#fff',pontos:[1,1,2,2]}); check('espectador não desenha', r.s===403, r)
r=await call(X,'POST',`campanhas/${cid}/notas`,{titulo:'x',visibilidade:'privada'}); check('espectador não cria anotações', r.s===403, r)
r=await mus(X,{acao:'playlist_criar',nome:'Minha'}); check('espectador não cria playlist', r.s===403, r)
r=await call(X,'GET',`campanhas/${cid}/musica`); check('espectador consegue ver o que toca', r.s===200, r)
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:X,sistema:'dnd5e-srd'}); check('mestre não cria ficha para espectador', r.s===400, r)
r=await call(X,'POST','fichas',{sistema:'livre'}); const fx=r.d.ficha.id
r=await call(X,'POST',`fichas/${fx}/enviar`,{campanhaId:cid}); check('espectador não envia ficha à campanha', r.s===403, r)
r=await call(M,'GET','mesa/'+cid); const ev=r.d.eventos.find(e=>e.texto==='Que cena!'); const mx=r.d.membros.find(m=>m.aventureiro_id===X)
check('mesa informa o papel de cada um (para as cores do chat)', ev && mx?.papel==='espectador', r.d.membros)

// música: controles só do mestre
r=await mus(M,{acao:'playlist_criar',nome:'Trilha'}); const pl=r.d.playlist.id
const a=(await mus(M,{acao:'musica_adicionar',playlistId:pl,url:'https://site.com/a.mp3',titulo:'A'})).d.musica.id
const b=(await mus(M,{acao:'musica_adicionar',playlistId:pl,url:'https://site.com/b.mp3',titulo:'B'})).d.musica.id
await mus(M,{acao:'tocar',musicaId:a})
r=await mus(J,{acao:'pausar'}); check('jogador não pausa', r.s===403, r)
r=await mus(J,{acao:'proxima'}); check('jogador não avança', r.s===403, r)
r=await mus(X,{acao:'pausar'}); check('espectador não pausa', r.s===403, r)
r=await mus(M,{acao:'pausar'}); check('mestre pausa (todos ficam na mesma posição)', r.s===200 && r.d.tocando.pausado===true && typeof r.d.tocando.posicao==='number', r.d)
r=await mus(M,{acao:'pular',segundos:30}); check('mestre avança 30 s', r.d.tocando.posicao>=30, r.d)
r=await mus(M,{acao:'continuar'}); check('mestre continua', r.d.tocando.pausado===false, r.d)
r=await mus(M,{acao:'proxima'}); check('próxima música da playlist', r.d.tocando.musica_id===b, r.d)
r=await mus(M,{acao:'proxima',auto:true}); check('fim da playlist (automático) para a música', r.d.tocando.tocando===false, r.d)
await mus(M,{acao:'tocar',musicaId:b})
r=await mus(M,{acao:'anterior'}); check('música anterior', r.d.tocando.musica_id===a, r.d)

// encerrar
r=await mesa(M,{acao:'sessao',aberta:false}); check('mestre encerra a sessão', r.s===200, r)
r=await call(J,'GET','mesa/'+cid); check('jogador sai da mesa ao encerrar', r.s===423, r)
r=await call(X,'GET','mesa/'+cid); check('espectador também', r.s===423, r)
r=await call(M,'GET','mesa/'+cid); check('música parou ao encerrar', r.d.musica.tocando===false, r.d.musica)
r=await call(J,'GET','mesa/'+cid+'?historico=1'); check('histórico continua disponível com a sessão fechada', r.s===200, r)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
