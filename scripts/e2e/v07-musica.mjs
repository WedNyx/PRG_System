// v0.7.0: playlists, envio ao mestre e música tocando para a mesa. Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222', X='33333333-3333-4333-8333-333333333333'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,300))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'V07',sistema:'Lunethernnyis — Opositores',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); await call(J,'POST','convites/'+r.d.convite.codigo,{}); r=await call(M,'GET','campanhas/'+cid); await call(M,'POST',`campanhas/${cid}/solicitacoes/${r.d.solicitacoes[0].id}`,{decisao:'aceitar'})
const mus=(q,b)=>call(q,'POST',`campanhas/${cid}/musica`,b)

// jogador organiza a própria playlist
r=await mus(J,{acao:'playlist_criar',nome:'Tema do Sol'}); check('jogador cria playlist', r.s===201, r); const pj=r.d.playlist.id
r=await mus(J,{acao:'musica_adicionar',playlistId:pj,url:'https://youtu.be/dQw4w9WgXcQ',titulo:'Abertura'}); check('adiciona link do YouTube', r.s===201 && r.d.musica.video_id==='dQw4w9WgXcQ' && r.d.musica.tipo==='youtube', r); const m1=r.d.musica.id
r=await mus(J,{acao:'musica_adicionar',playlistId:pj,url:'https://site.com/batalha.mp3'}); check('adiciona áudio mp3 (título pelo nome do arquivo)', r.s===201 && r.d.musica.titulo==='batalha.mp3', r); const m2=r.d.musica.id
r=await mus(J,{acao:'musica_adicionar',playlistId:pj,url:'javascript:alert(1)'}); check('link perigoso recusado', r.s===400, r)
r=await mus(J,{acao:'musica_adicionar',playlistId:pj,url:'https://site.com/pagina.html'}); check('link que não é música recusado', r.s===400, r)
r=await mus(J,{acao:'musica_mover',id:m2,direcao:'cima'}); r=await call(J,'GET',`campanhas/${cid}/musica`); check('reordena músicas', r.d.minhas[0].musicas[0].id===m2, r.d.minhas)
// mestre ainda não vê
r=await call(M,'GET',`campanhas/${cid}/musica`); check('mestre não vê playlist não enviada', r.d.recebidas.length===0, r.d)
r=await mus(M,{acao:'tocar',musicaId:m1}); check('mestre não toca playlist não enviada', r.s===403, r)
r=await mus(M,{acao:'musica_remover',id:m1}); check('mestre não apaga música do jogador', r.s===403, r)
// envia
r=await mus(J,{acao:'playlist_editar',id:pj,enviada:true}); check('jogador envia ao mestre', r.s===200, r)
r=await call(M,'GET',`campanhas/${cid}/musica`); check('mestre recebe e vê de quem é', r.d.recebidas.length===1 && r.d.recebidas[0].dono.apelido==='Jogador Sol' && r.d.recebidas[0].musicas.length===2, r.d.recebidas)
r=await call(J,'GET',`campanhas/${cid}/musica`); check('jogador não vê playlists dos outros', r.d.recebidas.length===0, r.d)
// tocar / loop / parar
r=await mus(J,{acao:'tocar',musicaId:m1}); check('jogador não escolhe a música da mesa', r.s===403, r)
r=await mus(M,{acao:'tocar',musicaId:m1}); check('mestre toca para a mesa', r.s===200 && r.d.tocando.tocando && r.d.tocando.video_id==='dQw4w9WgXcQ', r)
r=await call(J,'GET','mesa/'+cid); check('todos na mesa recebem a música e a hora do servidor', r.d.musica?.tocando===true && r.d.musica.titulo==='Abertura' && !!r.d.agora, r.d.musica)
r=await mus(J,{acao:'loop',ativo:true}); check('jogador não liga loop', r.s===403, r)
r=await mus(M,{acao:'loop',ativo:true}); r=await call(J,'GET','mesa/'+cid); check('mestre liga o loop', r.d.musica.loop===true && r.d.musica.tocando, r.d.musica)
r=await mus(J,{acao:'parar'}); check('jogador não para a música', r.s===403, r)
r=await mus(M,{acao:'parar'}); r=await call(J,'GET','mesa/'+cid); check('mestre para a música', r.d.musica.tocando===false, r.d.musica)
// playlist do próprio mestre
r=await mus(M,{acao:'playlist_criar',nome:'Taverna'}); const pm=r.d.playlist.id
r=await mus(M,{acao:'musica_adicionar',playlistId:pm,url:'https://www.youtube.com/watch?v=aaaaaaaaaaa',titulo:'Alaúde'}); const mm=r.d.musica.id
r=await mus(M,{acao:'tocar',musicaId:mm}); check('mestre toca da própria playlist (loop continua ligado)', r.s===200 && r.d.tocando.loop===true, r)
r=await mus(J,{acao:'musica_adicionar',playlistId:pm,url:'https://youtu.be/dQw4w9WgXcQ'}); check('jogador não mexe na playlist do mestre', r.s===403, r)
// cancelar envio
await mus(J,{acao:'playlist_editar',id:pj,enviada:false}); r=await call(M,'GET',`campanhas/${cid}/musica`); check('cancelar envio esconde do mestre', r.d.recebidas.length===0, r.d)
// intruso
r=await call(X,'GET',`campanhas/${cid}/musica`); check('intruso não vê nada', r.s===404, r)
r=await mus(X,{acao:'playlist_criar',nome:'x'}); check('intruso não cria', r.s===404, r)
r=await call(M,'GET',`campanhas/${cid}/musica?buscar=taverna`); check('busca sem chave do YouTube dá aviso amigável', r.s===503 || r.s===200, r)
// excluir
r=await mus(J,{acao:'playlist_excluir',id:pj}); r=await call(J,'GET',`campanhas/${cid}/musica`); check('jogador exclui a playlist', r.d.minhas.length===0, r.d)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
