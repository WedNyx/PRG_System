// v0.23.0: condições com duração em rodadas (descem no fim do turno) e o jogador encerra o próprio turno. Precisa da migração 018. Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'Condições',sistema:'dnd5e-srd',modeloPadrao:'C'}); const cid=r.d.campanha.id
const mesa=(q,b)=>call(q,'POST','mesa/'+cid,b)
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); await call(J,'POST','convites/'+r.d.convite.codigo,{})
r=await call(M,'GET','campanhas/'+cid); await call(M,'POST',`campanhas/${cid}/solicitacoes/${r.d.solicitacoes[0].id}`,{decisao:'aceitar'})
await mesa(M,{acao:'sessao',aberta:true})
r=await mesa(M,{acao:'cena_criar',nome:'Ponte',grid_cols:12,grid_rows:8}); r=await call(M,'GET','mesa/'+cid); const cena=r.d.cenaAtiva?.id ?? r.d.cenas[0].id; if(!r.d.cenaAtiva) await mesa(M,{acao:'cena_ativar',cenaId:cena})
r=await mesa(J,{acao:'token_criar',cenaId:cena,nome:'Lyra',hp_max:20}); const tL=r.d.token.id
r=await mesa(M,{acao:'token_criar',cenaId:cena,nome:'Ogro',hp_max:30}); const tO=r.d.token.id
const tok=async id=>(await call(M,'GET','mesa/'+cid)).d.tokens.find(t=>t.id===id)
r=await mesa(M,{acao:'token_editar',tokenId:tO,condicoes:['envenenado','caido','atordoado']}); check('mestre põe condições', r.s===200, r)
r=await mesa(M,{acao:'token_editar',tokenId:tO,rodadas:{envenenado:2,atordoado:1,caido:0,cego:5}}); let t=await tok(tO)
check('duração guardada só das condições ativas', t.condicoes_rodadas.envenenado===2 && t.condicoes_rodadas.atordoado===1 && Object.keys(t.condicoes_rodadas).length===2, t)
r=await mesa(J,{acao:'token_editar',tokenId:tO,rodadas:{envenenado:9}}); check('jogador não mexe no token dos outros', r.s===403, r)
r=await mesa(M,{acao:'combate_preparar',tokens:[{tokenId:tO,bonus:50},{tokenId:tL,bonus:-50}]}); check('combate: Ogro primeiro', r.d.rolagens?.[0]?.tokenId===tO, r.d)
r=await mesa(J,{acao:'turno',direcao:1,turnoAtual:0}); check('jogador não encerra o turno do Ogro', r.s===403, r)
r=await mesa(M,{acao:'turno',direcao:1}); t=await tok(tO)
check('fim do turno do Ogro: atordoado (1) acabou, envenenado 2→1, caído fica', t.condicoes.join()==='envenenado,caido' && JSON.stringify(t.condicoes_rodadas)===JSON.stringify({envenenado:1}), t)
r=await call(J,'GET','mesa/'+cid); const txt=r.d.eventos.map(e=>e.texto)
check('chat avisa que a condição acabou', txt.some(x=>x?.includes('Atordoado acabou em Ogro')), txt.slice(-4))
r=await mesa(J,{acao:'turno',direcao:1,turnoAtual:1}); check('Lyra encerra o próprio turno', r.s===200 && r.d.mesa.turno===0 && r.d.mesa.rodada===2, r)
r=await mesa(J,{acao:'turno',direcao:1,turnoAtual:1}); check('não dá para passar de novo com turno velho', r.s===403, r)
r=await call(J,'GET','mesa/'+cid); check('vez do Ogro mostra as condições dele', r.d.eventos.some(e=>e.texto?.startsWith('▶️ Vez de Ogro · rodada 2 (') && e.texto.includes('Envenenado · 1')), r.d.eventos.map(e=>e.texto).slice(-3))
r=await mesa(M,{acao:'turno',direcao:1}); t=await tok(tO)
check('envenenado acabou na rodada 2; caído (sem limite) continua', t.condicoes.join()==='caido' && JSON.stringify(t.condicoes_rodadas)==='{}', t)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
