const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222', X='33333333-3333-4333-8333-333333333333'
const B=(process.env.PRG_BASE || 'http://localhost:3000') + '/api/prg/'
let falhas=0
async function call(quem, metodo, caminho, body, origem=true){
  const r=await fetch(B+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,...(origem?{origin:(process.env.PRG_BASE || 'http://localhost:3000')}:{})},body:body===undefined?undefined:JSON.stringify(body)})
  let d={}; try{d=await r.json()}catch{}; return {s:r.status,d}
}
function check(nome, cond, extra){ console.log((cond?'✔':'✘')+' '+nome+(cond?'':'  '+JSON.stringify(extra))); if(!cond) falhas++ }
// v0.13.0: a Ficha V8 não entra mais pela API; estes testes usam uma V8 que "já existia" no banco (inserida direto, precisa de KEY).
async function fichaAntigaV8(dono, dados){ const r=await fetch((process.env.PRG_REST || 'http://localhost:3001/rest/v1') + '/prg_fichas',{method:'POST',headers:{'content-type':'application/json',apikey:process.env.KEY,Authorization:'Bearer '+process.env.KEY,Prefer:'return=representation'},body:JSON.stringify({dono_id:dono,sistema:'lunethernnyis-v8',nome:dados.fields?.name??'',dados})}); const j=await r.json(); return {s:r.ok?201:r.status,d:{ficha:Array.isArray(j)?j[0]:undefined}} }

let r=await call(M,'POST','campanhas',{nome:'Ecos da Lua',descricao:'Teste',sistema:'Lunethernnyis — Opositores',modeloPadrao:'B'})
check('mestre cria campanha',r.s===201,r); const cid=r.d.campanha?.id
r=await call(M,'POST','campanhas',{nome:'Sem origem',sistema:'X1',modeloPadrao:'A'},false); check('POST sem Origin é bloqueado',r.s===403,r)
r=await call('nao-uuid','GET','campanhas'); check('sem aventureiro válido → 401',r.s===401,r)
r=await call(M,'GET','campanhas'); check('lista do mestre tem a campanha com papel mestre',r.d.campanhas?.[0]?.meuPapel==='mestre',r)
r=await call(J,'GET','campanhas/'+cid); check('não-membro não vê detalhes',r.s===404,r)
r=await call(J,'PATCH','campanhas/'+cid,{estado:'ativa'}); check('não-membro não altera',r.s===403,r)
r=await call(M,'PATCH','campanhas/'+cid,{estado:'ativa'}); check('mestre muda estado p/ ativa',r.d.campanha?.estado==='ativa',r)
r=await call(M,'POST','campanhas/'+cid+'/convites',{dias:7,maxUsos:2}); check('mestre gera convite',r.s===201,r); const cod=r.d.convite?.codigo
r=await call(J,'POST','campanhas/'+cid+'/convites',{}); check('jogador não gera convite',r.s===403,r)
r=await call(J,'GET','convites/'+cod.toLowerCase()); check('prévia do convite (minúsculas aceitas)',r.d.campanha?.nome==='Ecos da Lua'&&r.d.campanha?.mestre?.apelido==='Mestra Lua'&&r.d.convite?.situacao==='valido',r)
r=await call(J,'POST','convites/'+cod,{mensagem:'quero jogar'}); check('jogador pede para entrar',r.s===201,r)
r=await call(J,'POST','convites/'+cod,{}); check('pedido duplicado bloqueado',r.s===409,r)
r=await call(X,'POST','convites/'+cod,{}); check('intruso também pede (uso 2/2)',r.s===201,r)
r=await call(M,'GET','campanhas/'+cid); check('mestre vê 2 pedidos',r.d.solicitacoes?.length===2,r)
const pj=r.d.solicitacoes.find(p=>p.aventureiro_id===J).id, px=r.d.solicitacoes.find(p=>p.aventureiro_id===X).id
r=await call(J,'POST',`campanhas/${cid}/solicitacoes/${pj}`,{decisao:'aceitar'}); check('jogador não se aceita sozinho',r.s===403,r)
r=await call(M,'POST',`campanhas/${cid}/solicitacoes/${pj}`,{decisao:'aceitar'}); check('mestre aceita jogador',r.s===200,r)
r=await call(M,'POST',`campanhas/${cid}/solicitacoes/${pj}`,{decisao:'aceitar'}); check('aceitar 2x → 404',r.s===404,r)
r=await call(M,'POST',`campanhas/${cid}/solicitacoes/${px}`,{decisao:'recusar'}); check('mestre recusa intruso',r.s===200,r)
r=await call(X,'GET','campanhas/'+cid); check('recusado continua sem acesso',r.s===404,r)
r=await call(J,'GET','campanhas'); check('jogador vê a campanha como jogador',r.d.campanhas?.[0]?.meuPapel==='jogador',r)
r=await call(J,'GET','campanhas/'+cid); check('jogador vê participantes, sem convites/exceções',r.d.membros?.length===2&&r.d.convites.length===0&&!('excecoes' in r.d.membros[0]),r)
const novo='44444444-4444-4444-8444-444444444444'
await fetch((process.env.PRG_REST || 'http://localhost:3001/rest/v1') + '/prg_public_adventurers',{method:'POST',headers:{'content-type':'application/json',Authorization:'Bearer '+process.env.KEY},body:JSON.stringify({id:novo,apelido:'Terceiro'})})
r=await call(novo,'POST','convites/'+cod,{}); check('convite esgotado (2/2) recusa',r.s===410,r)
r=await call(M,'DELETE',`campanhas/${cid}/convites?codigo=${cod}`); check('mestre revoga convite',r.s===200,r)
r=await call(M,'GET','campanhas/'+cid); check('convite aparece como revogado',r.d.convites?.[0]?.situacao==='revogado',r)
r=await call(M,'PATCH',`campanhas/${cid}/membros/${J}`,{excecoes:{pv:'livre',hack:'x'}}); check('mestre define exceção',r.s===200,r)
r=await call(M,'GET','campanhas/'+cid); check('exceção salva só com campo válido',JSON.stringify(r.d.membros.find(m=>m.aventureiro_id===J).excecoes)==='{"pv":"livre"}',r.d.membros)
r=await call(J,'PATCH',`campanhas/${cid}/membros/${J}`,{papel:'comestre'}); check('jogador não se promove',r.s===403,r)
r=await call(J,'DELETE',`campanhas/${cid}/membros/${M}`); check('ninguém remove o mestre',r.s===400,r)

// Fichas
r=await call(J,'POST','fichas',{dados:{version:2,fields:{name:'Lyra'}}}); check('Ficha V8 nova é recusada (saiu da plataforma)',r.s===400,r)
r=await fichaAntigaV8(J,{version:2,fields:{name:'Lyra'}}); check('ficha V8 antiga está na nuvem',r.s===201&&r.d.ficha.nome==='Lyra',r); const fid=r.d.ficha?.id
r=await call(J,'GET','fichas/'+fid); check('dono lê ficha',r.d.podeEditar===true&&r.d.ficha.versao===1,r)
r=await call(X,'GET','fichas/'+fid); check('outro não lê ficha',r.s===404,r)
r=await call(X,'PUT','fichas/'+fid,{versao:1,dados:{fields:{name:'hack'}}}); check('outro não salva ficha',r.s===403,r)
r=await call(J,'PUT','fichas/'+fid,{versao:1,dados:{version:2,fields:{name:'Lyra II'}}}); check('salva v1→v2',r.d.versao===2,r)
r=await call(J,'PUT','fichas/'+fid,{versao:1,dados:{version:2,fields:{name:'velha'}}}); check('versão antiga → conflito 409',r.s===409&&r.d.versaoAtual===2,r)
r=await call(J,'GET','fichas'); check('lista mostra nome atualizado',r.d.fichas?.[0]?.nome==='Lyra II',r)
r=await call(J,'POST','fichas',{dados:{portrait:'x'.repeat(520000)}}); check('ficha gigante recusada',r.s===400||r.s===413,r)
// Sair da campanha
r=await call(J,'DELETE',`campanhas/${cid}/membros/${J}`); check('jogador sai da campanha',r.s===200,r)
r=await call(J,'GET','campanhas'); check('campanha some da lista dele',r.d.campanhas?.length===0,r)
r=await call(M,'PATCH','campanhas/'+cid,{estado:'encerrada'}); r=await call(M,'POST','campanhas/'+cid+'/convites',{}); check('encerrada não gera convite',r.s===409,r)
r=await call(J,'DELETE','fichas/'+fid); check('dono exclui ficha',r.s===200,r)
console.log(falhas? `\n${falhas} FALHA(S)` : '\nTODOS OS TESTES PASSARAM')
