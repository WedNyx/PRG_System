// v0.32.2: mesa cheia — 6 jogadores + mestre agindo ao mesmo tempo (ataques, dano, decisões, turnos, chat). Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111'
const BASE=process.env.PRG_BASE || 'http://localhost:3000', ADMIN=process.env.ADMIN_SENHA || 'lua-roxa-teste'; let falhas=0
async function call(quem, metodo, caminho, body, base='/api/prg/'){ const r=await fetch(BASE+base+caminho,{method:metodo,headers:{'content-type':'application/json',...(quem?{'x-prg-aventureiro':quem}:{}),origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,500))); if(!c) falhas++ }
const juntos=fs=>Promise.all(fs.map(f=>f()))

// 6 jogadores temporários
const sufixo=Date.now().toString(36).slice(-4)
const J=[]
for (let i=1;i<=6;i++){ const r=await call(null,'POST','aventureiros',{apelido:`Carga ${sufixo}${i}`},'/api/'); J.push(r.d.perfil?.id) }
check('6 jogadores criados', J.every(Boolean), J)
let r=await call(M,'POST','campanhas',{nome:'Mesa cheia',sistema:'dnd5e-srd',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); const cod=r.d.convite.codigo
await juntos(J.map(j=>()=>call(j,'POST','convites/'+cod,{})))
r=await call(M,'GET','campanhas/'+cid); await juntos(r.d.solicitacoes.map(s=>()=>call(M,'POST',`campanhas/${cid}/solicitacoes/${s.id}`,{decisao:'aceitar'})))
r=await call(M,'GET','campanhas/'+cid); check('6 jogadores entram ao mesmo tempo', r.d.membros?.filter(m=>m.papel==='jogador').length===6, r.d.membros)
await call(M,'POST','mesa/'+cid,{acao:'cena_criar',nome:'Arena',grid_cols:20,grid_rows:20}); r=await call(M,'GET','mesa/'+cid); const cena=r.d.cenaAtiva?.id ?? r.d.cenas[0].id; if(!r.d.cenaAtiva) await call(M,'POST','mesa/'+cid,{acao:'cena_ativar',cenaId:cena})
await call(M,'POST','mesa/'+cid,{acao:'sessao',aberta:true})
const fichas=await Promise.all(J.map((j,i)=>call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:j,sistema:'dnd5e-srd',nome:'Herói '+(i+1)}).then(x=>x.d.ficha.id)))
const fDragao=(await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'npc',sistema:'dnd5e-srd',nome:'Dragão'})).d.ficha.id
let f=(await call(M,'GET','fichas/'+fDragao)).d.ficha
await call(M,'PUT','fichas/'+fDragao,{versao:f.versao,dados:{...f.dados,recursos:{...f.dados.recursos,pv:{atual:400,max:400}},campos:{...f.dados.campos,ca_base:1}}})
// tokens: heróis em volta do Ogro (sem ficha) e do Dragão (com ficha)
const tk=await Promise.all(J.map((j,i)=>call(M,'POST','mesa/'+cid,{acao:'token_criar',cenaId:cena,fichaId:fichas[i]}).then(x=>x.d.token?.id)))
const ogro=(await call(M,'POST','mesa/'+cid,{acao:'token_criar',cenaId:cena,nome:'Ogro',x:2,y:2,hp_max:500,npc:true})).d.token?.id
const dragao=(await call(M,'POST','mesa/'+cid,{acao:'token_criar',cenaId:cena,fichaId:fDragao,x:3,y:2,npc:true})).d.token?.id
check('tokens criados ao mesmo tempo, cada um numa casa', tk.every(Boolean) && ogro && dragao, {tk,ogro,dragao})
r=await call(M,'GET','mesa/'+cid); const casas=new Set(r.d.tokens.map(t=>t.x+','+t.y)); check('nenhum token empilhado', casas.size===r.d.tokens.length, r.d.tokens.map(t=>[t.nome,t.x,t.y]))

await call(M,'POST','mesa/'+cid,{acao:'combate_config',acerto:'automatico',morte:'desligado'})
const vidaOgro=async()=> (await call(M,'GET','mesa/'+cid)).d.tokens.find(t=>t.id===ogro).hp_atual
const vidaDragao=async()=> (await call(M,'GET','fichas/'+fDragao)).d.ficha.dados.recursos.pv.atual
// A) 6 ataques simultâneos no Ogro (token sem ficha) — 3 vezes
let somaOgro=0, erros=[]
for (let k=0;k<3;k++){ const rs=await juntos(J.map((j,i)=>()=>call(j,'POST','mesa/'+cid,{acao:'ataque',atacante:tk[i],alvo:ogro,dano:'1d6+4'})))
  for (const x of rs){ if (x.s!==201) erros.push(x); else somaOgro+=x.d.evento.dados.aplicado } }
check('18 ataques simultâneos no Ogro sem erro', !erros.length, erros.slice(0,3))
check(`nenhum dano perdido no Ogro (500 − ${somaOgro})`, await vidaOgro()===Math.max(0,500-somaOgro), {vida:await vidaOgro(), somaOgro})
// B) 6 ataques simultâneos no Dragão (vida na ficha) — 3 vezes
let somaDragao=0; erros=[]
for (let k=0;k<3;k++){ const rs=await juntos(J.map((j,i)=>()=>call(j,'POST','mesa/'+cid,{acao:'ataque',atacante:tk[i],alvo:dragao,dano:'1d6+4'})))
  for (const x of rs){ if (x.s!==201) erros.push(x); else somaDragao+=x.d.evento.dados.aplicado } }
check('18 ataques simultâneos no Dragão sem erro', !erros.length, erros.slice(0,3))
check(`nenhum dano perdido no Dragão (400 − ${somaDragao})`, await vidaDragao()===400-somaDragao, {vida:await vidaDragao(), somaDragao})

// C) Mestre confirma: clique duplo não aplica dano duas vezes
await call(M,'POST','mesa/'+cid,{acao:'combate_config',acerto:'mestre'})
const antesC=await vidaOgro()
const pend=(await juntos(J.map((j,i)=>()=>call(j,'POST','mesa/'+cid,{acao:'ataque',atacante:tk[i],alvo:ogro,dano:'5'})))).map(x=>x.d.evento).filter(e=>e?.dados?.status==='pendente')
const dec=await juntos(pend.flatMap(e=>[()=>call(M,'POST','mesa/'+cid,{acao:'ataque_decidir',eventoId:e.id,fator:1}),()=>call(M,'POST','mesa/'+cid,{acao:'ataque_decidir',eventoId:e.id,fator:1})]))
const aceitos=dec.filter(x=>x.s===200).length
check(`clique duplo do mestre: cada ataque aplicado uma vez só (${pend.length} acertos)`, aceitos===pend.length && await vidaOgro()===Math.max(0,antesC-5*pend.length), {aceitos, pend:pend.length, antesC, depois:await vidaOgro(), st:dec.map(x=>x.s)})

// D) Turnos: jogador da vez toca duas vezes + mestre passa junto → anda só 1
r=await call(M,'POST','mesa/'+cid,{acao:'combate_preparar',tokens:tk.map(t=>({tokenId:t}))}); const ordem=r.d.mesa.iniciativa
const daVez=J[tk.indexOf(ordem[0].tokenId)]
const tr=await juntos([()=>call(daVez,'POST','mesa/'+cid,{acao:'turno',turnoAtual:0}),()=>call(daVez,'POST','mesa/'+cid,{acao:'turno',turnoAtual:0}),()=>call(M,'POST','mesa/'+cid,{acao:'turno',turnoAtual:0})])
r=await call(M,'GET','mesa/'+cid)
check('“terminar turno” repetido ao mesmo tempo passa só uma vez', r.d.mesa?.turno===1 && tr.filter(x=>x.s===200).length===1, {turno:r.d.mesa?.turno, st:tr.map(x=>[x.s,x.d.erro])})

// E) Todo mundo mexe, conversa e rola ao mesmo tempo
const antesEv=(await call(M,'GET','mesa/'+cid)).d.eventos.length
const rs=await juntos(J.flatMap((j,i)=>[()=>call(j,'POST','mesa/'+cid,{acao:'token_mover',tokenId:tk[i],x:10+i,y:12}),()=>call(j,'POST','mesa/'+cid,{acao:'evento',tipo:'chat',texto:'oi '+i}),()=>call(j,'POST','mesa/'+cid,{acao:'evento',tipo:'rolagem',expressao:'1d20+3'})]))
check('18 ações simultâneas (mover, chat, rolar) sem erro', rs.every(x=>x.s<300), rs.filter(x=>x.s>=300).slice(0,3))
r=await call(M,'GET','mesa/'+cid)
check('todas as mensagens e rolagens chegaram', r.d.eventos.length-antesEv>=12 && J.every((j,i)=>r.d.tokens.find(t=>t.id===tk[i]).x===10+i), {novos:r.d.eventos.length-antesEv})

// F) 7 pessoas atualizando a mesa ao mesmo tempo
const t0=Date.now(); const gs=await juntos([M,...J].map(q=>()=>call(q,'GET','mesa/'+cid))); const ms=Date.now()-t0
check(`7 pessoas carregam a mesa juntas (${ms} ms)`, gs.every(x=>x.s===200) && ms<8000, gs.map(x=>x.s))

// limpeza
await call(M,'DELETE','campanhas/'+cid)
await juntos(J.map(j=>()=>call(null,'DELETE','aventureiros/'+j,{senha:ADMIN},'/api/')))
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
