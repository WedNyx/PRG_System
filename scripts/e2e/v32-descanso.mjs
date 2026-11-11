// v0.32.3: descanso curto e longo para o grupo (mestre, pela mesa). Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'Descanso',sistema:'dnd5e-srd',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); await call(J,'POST','convites/'+r.d.convite.codigo,{})
r=await call(M,'GET','campanhas/'+cid); await call(M,'POST',`campanhas/${cid}/solicitacoes/${r.d.solicitacoes[0].id}`,{decisao:'aceitar'})
await call(M,'POST','mesa/'+cid,{acao:'sessao',aberta:true})
const fL=(await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'dnd5e-srd',nome:'Lyra'})).d.ficha.id
const fG=(await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'npc',sistema:'dnd5e-srd',nome:'Goblin'})).d.ficha.id
const ler=async id=>(await call(M,'GET','fichas/'+id)).d.ficha
let f=await ler(fL); const pvMax=f.dados.recursos.pv.atual
const ferir=async(id)=>{ const x=await ler(id); return call(M,'PUT','fichas/'+id,{versao:x.versao,dados:{...x.dados,recursos:{...x.dados.recursos,pv:{atual:1},pv_temp:{atual:4}},
  poderes:[{id:'f',nome:'Fôlego',tipo:'habilidade',usosMax:1,recarga:'curto'},{id:'b',nome:'Bola de fogo',tipo:'magia',usosMax:3}],uso:{itens:{},poderes:{f:1,b:3},carteira:''}}}) }
r=await ferir(fL); check('Lyra ferida e sem usos', r.s===200, r); await ferir(fG)

r=await call(J,'POST','mesa/'+cid,{acao:'descanso',tipo:'longo'}); check('jogador não dá descanso para o grupo', r.s===403, r)
r=await call(M,'POST','mesa/'+cid,{acao:'descanso',tipo:'curto'})
f=await ler(fL)
check('curto: volta só o poder de descanso curto', r.s===200 && f.dados.uso.poderes.f===undefined && f.dados.uso.poderes.b===3 && f.dados.recursos.pv.atual===1, f.dados.uso)
check('poder guarda a recarga “curto”', f.dados.poderes.find(p=>p.id==='f').recarga==='curto' && !f.dados.poderes.find(p=>p.id==='b').recarga, f.dados.poderes)
r=await call(M,'POST','mesa/'+cid,{acao:'descanso',tipo:'longo'})
f=await ler(fL); let g=await ler(fG)
check('longo: vida cheia, temporários zerados, todos os usos', f.dados.recursos.pv.atual===pvMax && f.dados.recursos.pv_temp.atual===0 && Object.keys(f.dados.uso.poderes).length===0, f.dados.recursos)
check('NPC fica de fora sem pedir', g.dados.recursos.pv.atual===1, g.dados.recursos.pv)
r=await call(M,'POST','mesa/'+cid,{acao:'descanso',tipo:'longo',npcs:true}); g=await ler(fG)
check('com “incluir NPCs”, o NPC também descansa', g.dados.recursos.pv.atual>1 && r.d.recuperaram===1, {pv:g.dados.recursos.pv, r:r.d})
r=await call(M,'GET','mesa/'+cid); const ev=(r.d.eventos??[]).filter(e=>e.tipo==='sistema').map(e=>e.texto)
check('chat conta o descanso e o que cada um recuperou', ev.some(t=>t.startsWith('🌙 Descanso longo para o grupo.') && t.includes('Lyra: Pontos de Vida: 1 →')) && ev.some(t=>t.startsWith('☕ Descanso curto para o grupo.')), ev.slice(-4))
// caído levanta no longo
await call(M,'POST','mesa/'+cid,{acao:'cena_criar',nome:'Acampamento',grid_cols:10,grid_rows:10}); r=await call(M,'GET','mesa/'+cid); const cena=r.d.cenaAtiva?.id ?? r.d.cenas[0].id; if(!r.d.cenaAtiva) await call(M,'POST','mesa/'+cid,{acao:'cena_ativar',cenaId:cena})
const tk=(await call(M,'POST','mesa/'+cid,{acao:'token_criar',cenaId:cena,fichaId:fL})).d.token.id
await call(M,'POST','mesa/'+cid,{acao:'combate_config',morte:'testes'})
await call(M,'POST','mesa/'+cid,{acao:'token_editar',tokenId:tk,hp_atual:0})
r=await call(M,'GET','mesa/'+cid); check('Lyra caiu', r.d.tokens.find(t=>t.id===tk)?.morte?.estado==='caido', r.d.tokens.find(t=>t.id===tk)?.morte)
await call(M,'POST','mesa/'+cid,{acao:'descanso',tipo:'longo'})
r=await call(M,'GET','mesa/'+cid); const t=r.d.tokens.find(t=>t.id===tk)
check('depois do descanso longo ela levanta com a vida cheia', !t?.morte?.estado && t?.hp_atual===pvMax, t)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
