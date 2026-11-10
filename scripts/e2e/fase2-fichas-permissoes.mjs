const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222', X='33333333-3333-4333-8333-333333333333'
const B=(process.env.PRG_BASE || 'http://localhost:3000') + '/api/prg/'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(B+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:(process.env.PRG_BASE || 'http://localhost:3000')},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
// v0.13.0: a Ficha V8 não entra mais pela API; estes testes usam uma V8 que "já existia" no banco (inserida direto, precisa de KEY).
async function fichaAntigaV8(dono, dados){ const r=await fetch((process.env.PRG_REST || 'http://localhost:3001/rest/v1') + '/prg_fichas',{method:'POST',headers:{'content-type':'application/json',apikey:process.env.KEY,Authorization:'Bearer '+process.env.KEY,Prefer:'return=representation'},body:JSON.stringify({dono_id:dono,sistema:'lunethernnyis-v8',nome:dados.fields?.name??'',dados})}); const j=await r.json(); return {s:r.ok?201:r.status,d:{ficha:Array.isArray(j)?j[0]:undefined}} }
// Campanha modelo C (identidade/pv/anotações livres; atributos etc. com aprovação)
let r=await call(M,'POST','campanhas',{nome:'Fase Dois',sistema:'Lunethernnyis',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); const cod=r.d.convite.codigo
await call(J,'POST','convites/'+cod,{}); r=await call(M,'GET','campanhas/'+cid); await call(M,'POST',`campanhas/${cid}/solicitacoes/${r.d.solicitacoes[0].id}`,{decisao:'aceitar'})
// Ficha independente V8 do jogador
r=await fichaAntigaV8(J,{version:2,fields:{name:'Lyra',statPOT:'1',hpCurrent:'30'},powers:[]}); const fid=r.d.ficha.id
r=await call(M,'GET','campanhas'); check('mestre vê 0 pendências antes', r.d.campanhas.find(c=>c.id===cid).pendencias===0, r.d)
r=await call(X,'POST',`fichas/${fid}/enviar`,{campanhaId:cid}); check('outro não envia a ficha do jogador', r.s===404, r)
r=await call(J,'POST',`fichas/${fid}/enviar`,{campanhaId:cid,mensagem:'Pronta!'}); check('jogador envia ficha ao mestre', r.s===201, r); const cop=r.d.ficha.id
r=await call(J,'POST',`fichas/${fid}/enviar`,{campanhaId:cid}); check('não envia duas vezes enquanto pendente', r.s===409, r)
r=await call(M,'GET','campanhas'); check('mestre vê 1 pendência (notificação)', r.d.campanhas.find(c=>c.id===cid).pendencias===1, r.d)
r=await call(M,'GET',`campanhas/${cid}/fichas`); check('mestre lista ficha pendente', r.d.fichas?.[0]?.status==='pendente' && r.d.fichas[0].dono.apelido==='Jogador Sol', r)
r=await call(J,'GET',`campanhas/${cid}/fichas`); check('jogador vê só a dele', r.d.fichas.length===1, r)
r=await call(J,'POST',`campanhas/${cid}/fichas/${cop}`,{decisao:'aprovar'}); check('jogador não se aprova', r.s===403, r)
r=await call(M,'POST',`campanhas/${cid}/fichas/${cop}`,{decisao:'ajustar'}); check('ajuste exige explicação', r.s===400, r)
r=await call(M,'POST',`campanhas/${cid}/fichas/${cop}`,{decisao:'ajustar',observacao:'Reduza POT'}); check('mestre pede ajuste', r.s===200, r)
r=await call(M,'POST',`campanhas/${cid}/fichas/${cop}`,{decisao:'aprovar'}); check('mestre aprova', r.s===200, r)
r=await call(J,'GET','fichas/'+cop); check('cópia aprovada, ligada à original', r.d.ficha.status==='ativa' && r.d.ficha.origem_id===fid && r.d.regras?.atributos==='aprovacao', r)
let versao=r.d.ficha.versao
// Jogador edita: nome (livre), POT (aprovação), hp (livre)
r=await call(J,'PUT','fichas/'+cop,{versao,dados:{version:2,fields:{name:'Lyra Nyx',statPOT:'3',hpCurrent:'25'},powers:[]}})
check('salva livres e cria pedido para atributos', r.s===200 && r.d.pendentes.join()==='atributos' && r.d.ignoradas.length===0, r); versao=r.d.versao
r=await call(J,'GET','fichas/'+cop); check('no servidor: nome e PV mudaram, POT não', r.d.ficha.dados.fields.name==='Lyra Nyx' && r.d.ficha.dados.fields.hpCurrent==='25' && r.d.ficha.dados.fields.statPOT==='1' && r.d.pendentes.join()==='atributos', r.d.ficha?.dados)
r=await call(J,'GET','fichas/'+fid); check('ficha original intacta', r.d.ficha.dados.fields.name==='Lyra', r)
// reenvio com mesma mudança substitui o pedido (não duplica)
r=await call(J,'PUT','fichas/'+cop,{versao,dados:{version:2,fields:{name:'Lyra Nyx',statPOT:'2',hpCurrent:'25'},powers:[]}}); check('reenviar substitui pedido', r.s===200, r)
r=await call(M,'GET',`campanhas/${cid}/alteracoes`); check('mestre vê 1 pedido com antes→depois', r.d.alteracoes.length===1 && r.d.alteracoes[0].itens[0].antes==='1' && r.d.alteracoes[0].itens[0].depois==='2', r)
// Mestre trava área pv para o jogador
r=await call(M,'POST',`campanhas/${cid}/fichas/${cop}`,{areasBloqueadas:['pv','xyz']}); check('mestre trava área PV', r.s===200, r)
r=await call(J,'GET','fichas/'+cop); versao=r.d.ficha.versao
r=await call(J,'PUT','fichas/'+cop,{versao,dados:{version:2,fields:{name:'Lyra Nyx',statPOT:'2',hpCurrent:'5'},powers:[]}}); check('mudança em área travada é ignorada', r.s===200 && r.d.ignoradas.join()==='pv', r)
r=await call(J,'GET','fichas/'+cop); check('PV não mudou no servidor', r.d.ficha.dados.fields.hpCurrent==='25', r.d.ficha.dados)
r=await call(M,'GET',`campanhas/${cid}/alteracoes`); check('continua 1 pedido (substituído)', r.d.alteracoes.length===1, r); const pid=r.d.alteracoes[0].id
r=await call(M,'POST',`campanhas/${cid}/alteracoes`,{id:pid,decisao:'aceitar'}); check('mestre aceita pedido', r.s===200, r)
r=await call(J,'GET','fichas/'+cop); check('POT aplicado (2), nome preservado', r.d.ficha.dados.fields.statPOT==='2' && r.d.ficha.dados.fields.name==='Lyra Nyx', r.d.ficha.dados)
r=await call(M,'POST',`campanhas/${cid}/alteracoes`,{id:pid,decisao:'aceitar'}); check('não decide duas vezes', r.s===404, r)
// Bloqueio total
await call(M,'POST',`campanhas/${cid}/fichas/${cop}`,{bloqueada:true})
r=await call(J,'GET','fichas/'+cop); versao=r.d.ficha.versao; check('ficha travada: jogador não pode editar', r.d.podeEditar===false, r)
r=await call(J,'PUT','fichas/'+cop,{versao,dados:{version:2,fields:{name:'X'}}}); check('PUT em ficha travada → 423', r.s===423, r)
// Mestre edita diretamente (tudo)
r=await call(M,'PUT','fichas/'+cop,{versao,dados:{version:2,fields:{name:'Lyra Nyx',statPOT:'4',hpCurrent:'10'},powers:[]}}); check('mestre edita tudo', r.s===200 && r.d.pendentes.length===0, r)
r=await call(J,'GET','fichas/'+cop); check('valores do mestre aplicados', r.d.ficha.dados.fields.statPOT==='4' && r.d.ficha.dados.fields.hpCurrent==='10', r.d.ficha.dados)
// Exceção: atributos livres para o jogador
await call(M,'POST',`campanhas/${cid}/fichas/${cop}`,{bloqueada:false,areasBloqueadas:[]})
await call(M,'PATCH',`campanhas/${cid}/membros/${J}`,{excecoes:{atributos:'livre'}})
r=await call(J,'GET','fichas/'+cop); versao=r.d.ficha.versao
r=await call(J,'PUT','fichas/'+cop,{versao,dados:{version:2,fields:{name:'Lyra Nyx',statPOT:'5',hpCurrent:'10'},powers:[]}}); check('exceção do jogador vale no servidor', r.d.pendentes.length===0, r)
r=await call(J,'GET','fichas/'+cop); check('POT 5 salvo direto', r.d.ficha.dados.fields.statPOT==='5', r.d.ficha.dados)
// NPCs
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'npc',sistema:'dnd5e-srd',nome:'Xerife Cole'}); check('mestre cria NPC', r.s===201, r); const npc=r.d.ficha.id
r=await call(J,'GET','fichas/'+npc); check('jogador não abre NPC', r.s===404, r)
r=await call(J,'GET',`campanhas/${cid}/fichas`); check('jogador não lista NPC', r.d.fichas.every(f=>!f.npc), r)
r=await call(J,'PUT','fichas/'+npc,{versao:1,dados:{nome:'hack'}}); check('jogador não edita NPC', r.s===403, r)
r=await call(M,'POST',`campanhas/${cid}/fichas/${npc}`,{acao:'duplicar'}); check('duplicar NPC', r.s===201, r)
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'faroeste-arcano',nome:'Pistoleira'}); check('mestre cria ficha COM o jogador', r.s===201, r)
r=await call(J,'GET','fichas/'+r.d.ficha.id); check('jogador abre a ficha criada pelo mestre', r.s===200 && r.d.podeEditar, r)
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:X,sistema:'dnd5e-srd'}); check('não cria para quem não participa', r.s===400, r)
// Histórico
r=await call(J,'GET',`fichas/${cop}/historico`); check('histórico da ficha com autor e tipos', r.d.historico.length>=5 && r.d.historico.some(h=>h.tipo==='decisao') && r.d.historico.some(h=>h.tipo==='envio'), r.d.historico?.map(h=>h.tipo))
r=await call(J,'GET',`campanhas/${cid}/historico`); check('jogador não vê registro da campanha', r.s===403, r)
r=await call(M,'GET',`campanhas/${cid}/historico`); check('mestre vê registro de decisões', r.d.historico.length>=8, r.d.historico?.length)
r=await call(X,'GET',`fichas/${cop}/historico`); check('estranho não vê histórico', r.s===404, r)
// Recusa
r=await fichaAntigaV8(J,{version:2,fields:{name:'Outra'}}); const f2=r.d.ficha.id
r=await call(J,'POST',`fichas/${f2}/enviar`,{campanhaId:cid}); const c2=r.d.ficha.id
await call(M,'POST',`campanhas/${cid}/fichas/${c2}`,{decisao:'recusar',observacao:'Não combina com a história'})
r=await call(J,'GET','fichas/'+c2); check('recusada: jogador vê motivo e não edita', r.d.ficha.status==='recusada' && r.d.ficha.observacao_mestre.includes('história') && !r.d.podeEditar, r)
r=await call(J,'DELETE','fichas/'+c2); check('jogador não apaga ficha de campanha', r.s===403, r)
console.log(falhas?`\n${falhas} FALHA(S)`:'\nTODOS OS TESTES PASSARAM')
