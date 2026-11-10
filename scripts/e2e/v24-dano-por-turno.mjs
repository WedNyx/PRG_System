// v0.24.0: dano por turno das condições, ficha nova com vida cheia. Precisa da migração 019. Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'Fogo',sistema:'dnd5e-srd',modeloPadrao:'C'}); const cid=r.d.campanha.id
const mesa=b=>call(M,'POST','mesa/'+cid,b)
await mesa({acao:'sessao',aberta:true})
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'npc',sistema:'dnd5e-srd',nome:'Goblin'}); const fG=r.d.ficha.id
r=await call(M,'GET','fichas/'+fG); const pv=r.d.ficha.dados.recursos.pv
check('ficha nova começa com a vida cheia', pv && pv.atual > 0, r.d.ficha.dados.recursos)
r=await mesa({acao:'cena_criar',nome:'C',grid_cols:12,grid_rows:8}); r=await call(M,'GET','mesa/'+cid); const cena=r.d.cenaAtiva?.id ?? r.d.cenas[0].id; if(!r.d.cenaAtiva) await mesa({acao:'cena_ativar',cenaId:cena})
r=await mesa({acao:'token_criar',cenaId:cena,fichaId:fG}); const tG=r.d.token.id
r=await mesa({acao:'token_criar',cenaId:cena,nome:'Ogro',hp_max:30}); const tO=r.d.token.id
const tok=async id=>(await call(M,'GET','mesa/'+cid)).d.tokens.find(t=>t.id===id)
{ const g=await tok(tG), o2=await tok(tO); check('tokens novos não ficam um em cima do outro', g.x+','+g.y !== o2.x+','+o2.y, {g:[g.x,g.y],o:[o2.x,o2.y]}) }
r=await mesa({acao:'token_editar',tokenId:tO,condicoes:['queimando','caido']}); let t=await tok(tO)
check('Queimando entra com o dano sugerido (1d6); Caído sem dano', t.condicoes_dano?.queimando==='1d6' && !t.condicoes_dano?.caido, t)
r=await mesa({acao:'token_editar',tokenId:tO,danos:{queimando:'5',caido:'2d4'},rodadas:{queimando:2}}); t=await tok(tO)
check('mestre muda o dano por turno (fixo 5) e põe dano no Caído', t.condicoes_dano.queimando==='5' && t.condicoes_dano.caido==='2d4', t)
r=await mesa({acao:'token_editar',tokenId:tO,danos:{caido:''}}); t=await tok(tO); check('vazio tira o dano', !t.condicoes_dano.caido, t)
r=await mesa({acao:'token_editar',tokenId:tO,danos:{queimando:'99d6'}}); t=await tok(tO); check('dano absurdo não entra', !t.condicoes_dano.queimando, t)
await mesa({acao:'token_editar',tokenId:tO,danos:{queimando:'5'}})
r=await mesa({acao:'token_editar',tokenId:tG,condicoes:['envenenado'],danos:{envenenado:'2'}})
r=await mesa({acao:'combate_preparar',tokens:[{tokenId:tO,bonus:50},{tokenId:tG,bonus:-50}]}); t=await tok(tO)
check('começo do turno do Ogro: queimando tira 5 (30 → 25)', t.hp_atual===25, t)
r=await call(M,'GET','mesa/'+cid); check('chat conta o dano', r.d.eventos.some(e=>e.texto?.startsWith('🔥 Queimando: Ogro sofreu 5 de dano')), r.d.eventos.map(e=>e.texto).slice(-3))
const antes=(await call(M,'GET','fichas/'+fG)).d.ficha.dados.recursos.pv.atual
r=await mesa({acao:'turno',direcao:1}); 
const depois=(await call(M,'GET','fichas/'+fG)).d.ficha.dados.recursos.pv.atual
check('envenenado tira 2 da vida da FICHA do Goblin', depois===antes-2, {antes,depois})
r=await mesa({acao:'turno',direcao:1}); t=await tok(tO)
check('rodada 2: queimando de novo (25 → 20), falta 1 rodada', t.hp_atual===20 && t.condicoes.includes('queimando') && t.condicoes_rodadas.queimando===1, t)
r=await mesa({acao:'turno',direcao:1}); t=await tok(tO)
check('fim do turno do Ogro: queimando acaba (durava 2), caído continua', !t.condicoes.includes('queimando') && t.condicoes.includes('caido') && t.hp_atual===20, t)
r=await mesa({acao:'token_editar',tokenId:tO,hp_atual:30}); t=await tok(tO); check('vida cheia', t.hp_atual===30, t)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
