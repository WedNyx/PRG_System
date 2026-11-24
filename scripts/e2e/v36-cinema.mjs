// v0.36.8: Cinema Secreto — salas com perfil, fila, chat, lista de presentes e anfitrião que passa (ou perde) o controle.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222', N='33333333-3333-4333-8333-333333333333'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const h={'content-type':'application/json',origin:BASE}; if(quem) h['x-prg-aventureiro']=quem; const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:h,body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{} return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
const espera = ms => new Promise(r => setTimeout(r, ms))
let r=await call(null,'POST','cinema',{acao:'criar',nome:'X'}); check('sem perfil não entra no cinema', r.s===401, r)
r=await call(M,'POST','cinema',{acao:'criar',nome:'Sessão da madrugada'}); const cod=r.d.codigo
check('mestra abre a sala e vira anfitriã', r.s===201 && /^[A-F0-9]{16}$/.test(cod) && r.d.souAnfitriao && r.d.anfitriao.apelido==='Mestra Lua', r.d)
r=await call(J,'GET','cinema?codigo='+cod.toLowerCase().replace(/(.{4})/g,'$1 ')); check('jogador entra pelo código (mesmo com espaços e minúsculas)', r.s===200 && !r.d.souAnfitriao, r)
r=await call(N,'GET','cinema?codigo='+cod)
check('lista de pessoas mostra os três, na ordem de chegada, com a anfitriã marcada', r.d.participantes.map(p=>p.apelido).join(',')==='Mestra Lua,Jogador Sol,Nix' && r.d.participantes[0].anfitriao, r.d.participantes)
// fila e controle
r=await call(J,'POST','cinema',{acao:'adicionar',codigo:cod,url:'https://youtu.be/dQw4w9WgXcQ'}); check('espectador não mexe na fila', r.s===403, r)
r=await call(M,'POST','cinema',{acao:'adicionar',codigo:cod,url:'https://youtu.be/dQw4w9WgXcQ',titulo:'Abertura'}); check('anfitriã põe vídeo na fila', r.s===200 && r.d.estado.fila.length===1, r)
r=await call(M,'POST','cinema',{acao:'adicionar',codigo:cod,url:'https://example.com/x'}); check('link que não é do YouTube é recusado', r.s===400, r)
r=await call(M,'POST','cinema',{acao:'selecionar',codigo:cod,indice:0}); r=await call(M,'POST','cinema',{acao:'continuar',codigo:cod})
check('anfitriã escolhe e dá play', r.s===200 && r.d.estado.reproducao.video_id==='dQw4w9WgXcQ' && !r.d.estado.reproducao.pausado, r.d.estado)
r=await call(J,'GET','cinema?codigo='+cod); check('o jogador vê o mesmo vídeo tocando', r.d.estado.reproducao.video_id==='dQw4w9WgXcQ' && !r.d.estado.reproducao.pausado, r.d.estado)
// chat
r=await call(J,'POST','cinema',{acao:'mensagem',codigo:cod,texto:'  boa noite, pessoal!  '}); check('jogador manda mensagem', r.s===200 && r.d.mensagens.some(m=>m.texto==='boa noite, pessoal!' && m.autor.apelido==='Jogador Sol'), r.d.mensagens)
r=await call(J,'POST','cinema',{acao:'mensagem',codigo:cod,texto:'de novo'}); check('mensagem em sequência rápida espera um instante', r.s===429, r)
r=await call(J,'POST','cinema',{acao:'mensagem',codigo:cod,texto:'   '}); check('mensagem vazia é recusada', r.s===400, r)
r=await call(N,'GET','cinema?codigo='+cod+'&desde=0'); const ultimo=r.d.mensagens.at(-1).id
check('chat chega para quem está na sala (com o aviso de abertura)', r.d.mensagens.some(m=>m.sistema && /abriu a sala/.test(m.texto)) && r.d.mensagens.some(m=>m.texto==='boa noite, pessoal!'), r.d.mensagens)
await espera(800); await call(M,'POST','cinema',{acao:'mensagem',codigo:cod,texto:'pipoca pronta 🍿'})
r=await call(N,'GET','cinema?codigo='+cod+'&desde='+ultimo); check('consulta com “desde” traz só as mensagens novas', r.d.mensagens.length===1 && r.d.mensagens[0].texto==='pipoca pronta 🍿', r.d.mensagens)
// transferência
r=await call(J,'POST','cinema',{acao:'transferir',codigo:cod,para:J}); check('espectador não transfere', r.s===403, r)
r=await call(J,'POST','cinema',{acao:'assumir',codigo:cod}); check('não dá para assumir com a anfitriã presente', r.s===403, r)
r=await call(M,'POST','cinema',{acao:'transferir',codigo:cod,para:'44444444-4444-4444-8444-444444444444'}); check('não transfere para quem não está na sala', r.s===400, r)
r=await call(M,'POST','cinema',{acao:'transferir',codigo:cod,para:J}); check('anfitriã passa o controle para o jogador', r.s===200 && r.d.anfitriao.id===J && !r.d.souAnfitriao, r.d)
r=await call(M,'POST','cinema',{acao:'pausar',codigo:cod}); check('quem passou o controle não controla mais', r.s===403, r)
r=await call(J,'POST','cinema',{acao:'pausar',codigo:cod}); check('o novo anfitrião controla', r.s===200 && r.d.estado.reproducao.pausado, r.d.estado)
check('o chat avisa a troca', r.d.mensagens.some(m=>m.sistema && /passou o controle para Jogador Sol/.test(m.texto)), r.d.mensagens)
// anfitrião sai: o controle vai para quem chegou primeiro entre os que ficaram
r=await call(J,'POST','cinema',{acao:'sair',codigo:cod}); r=await call(N,'GET','cinema?codigo='+cod)
check('anfitrião que sai passa o controle para quem chegou primeiro', r.d.anfitriao.id===M && !r.d.participantes.some(p=>p.id===J), {a:r.d.anfitriao,p:r.d.participantes})
// encerrar
r=await call(N,'POST','cinema',{acao:'encerrar',codigo:cod}); check('espectador não encerra', r.s===403, r)
r=await call(M,'POST','cinema',{acao:'encerrar',codigo:cod}); check('anfitriã encerra a sala', r.s===200, r)
r=await call(N,'GET','cinema?codigo='+cod); check('sala encerrada some para todo mundo', r.s===404, r)
r=await call(N,'GET','cinema?codigo=ABC'); check('código inválido é recusado', r.s===400, r)
console.log(falhas ? `\n${falhas} falha(s)` : '\nTudo certo.'); process.exit(falhas ? 1 : 0)
