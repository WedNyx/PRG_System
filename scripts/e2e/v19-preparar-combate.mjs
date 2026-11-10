// v0.19.0: preparar combate (iniciativa de todos os tokens com o bônus da ficha) e turnos. Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'Turnos',sistema:'dnd5e-srd',modeloPadrao:'C'}); const cid=r.d.campanha.id
const mesa=(q,b)=>call(q,'POST','mesa/'+cid,b)
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); await call(J,'POST','convites/'+r.d.convite.codigo,{})
r=await call(M,'GET','campanhas/'+cid); await call(M,'POST',`campanhas/${cid}/solicitacoes/${r.d.solicitacoes[0].id}`,{decisao:'aceitar'})
await mesa(M,{acao:'sessao',aberta:true})
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'dnd5e-srd',nome:'Lyra'}); const fL=r.d.ficha.id
r=await call(M,'GET','fichas/'+fL); await call(M,'PUT','fichas/'+fL,{versao:r.d.ficha.versao,dados:{...r.d.ficha.dados,atributos:{...r.d.ficha.dados.atributos,DES:18}}})
r=await mesa(M,{acao:'cena_criar',nome:'Ponte',grid_cols:12,grid_rows:8}); r=await call(M,'GET','mesa/'+cid); const cena=r.d.cenaAtiva?.id ?? r.d.cenas[0].id; if(!r.d.cenaAtiva) await mesa(M,{acao:'cena_ativar',cenaId:cena})
r=await mesa(J,{acao:'token_criar',cenaId:cena,fichaId:fL}); const tL=r.d.token.id
r=await mesa(M,{acao:'token_criar',cenaId:cena,nome:'Ogro',hp_max:30}); const tO=r.d.token.id
r=await mesa(M,{acao:'token_criar',cenaId:cena,nome:'Rato',hp_max:3}); const tR=r.d.token.id
r=await call(M,'GET',`mesa/${cid}?fichas=1`); check('bônus de iniciativa vem da ficha (DES 18 → +4)', r.d.fichas.find(f=>f.id===fL)?.combate?.iniciativa===4, r.d.fichas)
r=await mesa(J,{acao:'combate_preparar',tokens:[{tokenId:tL}]}); check('jogador não prepara combate', r.s===403, r)
r=await mesa(M,{acao:'combate_preparar',tokens:[]}); check('precisa escolher alguém', r.s===400, r)
r=await mesa(M,{acao:'combate_preparar',tokens:[{tokenId:tL},{tokenId:tO,bonus:-30}]})
const ord=r.d.rolagens
check('rola iniciativa de quem foi escolhido (Rato ficou de fora)', r.s===200 && ord.length===2 && !ord.some(o=>o.tokenId===tR), r.d)
check('Lyra soma +4 da ficha; Ogro usa o bônus do mestre (−30)', ord.find(o=>o.tokenId===tL).bonus===4 && ord.find(o=>o.tokenId===tO).bonus===-30 && ord[0].tokenId===tL, ord)
r=await call(J,'GET','mesa/'+cid)
check('ordem salva na mesa, com os tokens, vez do primeiro', r.d.mesa.iniciativa.map(x=>x.tokenId).join()===[tL,tO].join() && r.d.mesa.turno===0 && r.d.mesa.rodada===1, r.d.mesa)
check('chat anuncia o começo do combate', r.d.eventos.some(e=>e.tipo==='sistema' && e.texto.startsWith('⚔️ O combate começou!') && e.texto.includes('Vez de Lyra')), r.d.eventos.map(e=>e.texto))
r=await mesa(J,{acao:'turno',direcao:1}); check('jogador não passa o turno', r.s===403, r)
r=await mesa(M,{acao:'turno',direcao:1}); check('próximo turno: vez do Ogro', r.d.mesa.turno===1 && r.d.mesa.rodada===1, r.d)
r=await mesa(M,{acao:'turno',direcao:1}); check('volta ao primeiro e começa a rodada 2', r.d.mesa.turno===0 && r.d.mesa.rodada===2, r.d)
r=await call(J,'GET','mesa/'+cid); check('chat avisa a vez e a rodada', r.d.eventos.some(e=>e.texto==='▶️ Vez de Lyra · rodada 2.'), r.d.eventos.map(e=>e.texto).slice(-4))
r=await mesa(M,{acao:'turno',direcao:-1}); check('turno anterior volta para a rodada 1', r.d.mesa.turno===1 && r.d.mesa.rodada===1, r.d)
r=await mesa(M,{acao:'combate_encerrar'}); r=await call(J,'GET','mesa/'+cid); check('encerrar limpa a ordem e avisa', r.d.mesa.iniciativa.length===0 && r.d.eventos.at(-1).texto==='🏳️ Fim do combate.', r.d.mesa)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
