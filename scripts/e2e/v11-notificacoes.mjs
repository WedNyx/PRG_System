// v0.11.0: avisos dentro da plataforma (sem e-mail). Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222', X='33333333-3333-4333-8333-333333333333'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,300))); if(!c) falhas++ }
const avisos=async q=>(await call(q,'GET','notificacoes')).d
const tem=(d,tipo)=>d.itens.some(a=>a.tipo===tipo)
for (const q of [M,J,X]) await call(q,'POST','notificacoes',{acao:'ler'}), await call(q,'POST','notificacoes',{acao:'apagar_lidas'})

let r=await call(M,'POST','campanhas',{nome:'Avisos',sistema:'D&D 5ª edição (SRD 5.2)',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); const cod=r.d.convite.codigo
await call(J,'POST','convites/'+cod,{mensagem:'Posso jogar?'}); await call(X,'POST','convites/'+cod,{})
let m=await avisos(M); check('mestre é avisado dos pedidos de entrada', m.itens.filter(a=>a.tipo==='pedido_entrada').length===2 && m.naoLidas>=2 && m.itens[0].link.includes(cid), m)
r=await call(M,'GET','campanhas/'+cid); const sj=r.d.solicitacoes.find(s=>s.aventureiro_id===J), sx=r.d.solicitacoes.find(s=>s.aventureiro_id===X)
await call(M,'POST',`campanhas/${cid}/solicitacoes/${sj.id}`,{decisao:'aceitar'}); await call(M,'POST',`campanhas/${cid}/solicitacoes/${sx.id}`,{decisao:'recusar'})
check('jogador sabe que entrou', tem(await avisos(J),'entrada_aceita'), await avisos(J))
check('quem foi recusado também sabe', tem(await avisos(X),'entrada_recusada'), await avisos(X))
check('o próprio mestre não recebe aviso das ações dele', !(await avisos(M)).itens.some(a=>a.tipo.startsWith('entrada_')), 0)

r=await call(J,'POST','fichas',{sistema:'dnd5e-srd'}); const fl=r.d.ficha.id
r=await call(J,'POST',`fichas/${fl}/enviar`,{campanhaId:cid}); const fc=r.d.ficha.id
check('mestre é avisado da ficha enviada', tem(await avisos(M),'ficha_enviada'), await avisos(M))
await call(M,'POST',`campanhas/${cid}/fichas/${fc}`,{decisao:'aprovar'})
let j=await avisos(J); const ap=j.itens.find(a=>a.tipo==='ficha_aprovada'); check('jogador é avisado da aprovação, com link para a ficha', ap && ap.link==='/ficha?nuvem='+fc, j)
await call(M,'POST',`campanhas/${cid}/recompensas`,{fichaIds:[fc],xp:100,moedas:'10 PO'})
check('jogador é avisado da recompensa', (await avisos(J)).itens.some(a=>a.tipo==='recompensa' && a.texto.includes('10 PO')), await avisos(J))
await call(M,'POST','mesa/'+cid,{acao:'sessao',aberta:true})
j=await avisos(J); check('jogador é avisado que a sessão começou (link da mesa)', j.itens.some(a=>a.tipo==='sessao_aberta' && a.link==='/mesa?campanha='+cid), j)
r=await call(J,'POST',`campanhas/${cid}/musica`,{acao:'playlist_criar',nome:'Batalha'}); await call(J,'POST',`campanhas/${cid}/musica`,{acao:'playlist_editar',id:r.d.playlist.id,enviada:true})
check('mestre é avisado da playlist enviada', tem(await avisos(M),'playlist_enviada'), 0)
await call(M,'PATCH',`campanhas/${cid}/membros/${J}`,{papel:'espectador'}); await call(M,'PATCH',`campanhas/${cid}/membros/${J}`,{papel:'jogador'})
check('mudança de papel avisa a pessoa', (await avisos(J)).itens.filter(a=>a.tipo==='papel').length===2, 0)
await call(M,'POST',`campanhas/${cid}/sessoes`,{numero:1,titulo:'Começo',resumo:'Tudo começou.',publicada:true})
check('resumo publicado no diário avisa o grupo', tem(await avisos(J),'diario'), 0)

// ler / apagar / segurança
j=await avisos(J); const id1=j.itens[0].id, antes=j.naoLidas
await call(J,'POST','notificacoes',{acao:'ler',ids:[id1]}); j=await avisos(J)
check('marcar um como lido', j.naoLidas===antes-1 && j.itens.find(a=>a.id===id1).lida, j)
await call(X,'POST','notificacoes',{acao:'ler',ids:j.itens.map(a=>a.id)}); j=await avisos(J)
check('ninguém mexe nos avisos dos outros', j.naoLidas===antes-1, j)
await call(J,'POST','notificacoes',{acao:'ler'}); j=await avisos(J); check('ler todos', j.naoLidas===0, j)
await call(J,'POST','notificacoes',{acao:'apagar_lidas'}); j=await avisos(J); check('apagar os lidos', j.itens.length===0, j)
r=await call('nao-existe','GET','notificacoes'); check('sem perfil não lê avisos', r.s===401, r)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
