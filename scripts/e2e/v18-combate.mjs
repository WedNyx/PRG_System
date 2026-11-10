// v0.18.0: combate na mesa (tokens das fichas, ataque com arma/poder, dano automático ou confirmado pelo mestre). Ver LEIA-ME.md. Migração 016.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222', X='33333333-3333-4333-8333-333333333333'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'Arena',sistema:'dnd5e-srd',modeloPadrao:'C'}); const cid=r.d.campanha.id
const mesa=(q,b)=>call(q,'POST','mesa/'+cid,b)
for (const quem of [J, X]) { r=await call(M,'POST',`campanhas/${cid}/convites`,{}); await call(quem,'POST','convites/'+r.d.convite.codigo,{}) }
r=await call(M,'GET','campanhas/'+cid); for (const s of r.d.solicitacoes) await call(M,'POST',`campanhas/${cid}/solicitacoes/${s.id}`,{decisao:'aceitar'})
await call(M,'PATCH',`campanhas/${cid}/membros/${X}`,{papel:'espectador'})
await mesa(M,{acao:'sessao',aberta:true})
// fichas: Thorin (jogador) e Goblin (NPC)
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'dnd5e-srd',nome:'Thorin'}); const fT=r.d.ficha.id
r=await call(M,'GET','fichas/'+fT); let d=r.d.ficha.dados
r=await call(M,'PUT','fichas/'+fT,{versao:r.d.ficha.versao,dados:{...d,atributos:{...d.atributos,FOR:16},recursos:{...d.recursos,pv:{atual:12,max:12},pv_temp:{atual:2}},
  itens:[{id:'esp',nome:'Espada',categoria:'arma',peso:1,dano:'1d8+3',bonus:[]},{id:'arco',nome:'Arco',categoria:'arma',peso:1,dano:'1d6',alcance:30,bonus:[]}],
  poderes:[{id:'raio',nome:'Raio',tipo:'magia',expressao:'2d6',recurso:'pv_temp',custo:2,alcance:18}]}}); check('mestre equipa a ficha do jogador', r.s===200, r)
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'npc',sistema:'dnd5e-srd',nome:'Goblin'}); const fG=r.d.ficha.id
r=await call(M,'GET','fichas/'+fG); d=r.d.ficha.dados
await call(M,'PUT','fichas/'+fG,{versao:r.d.ficha.versao,dados:{...d,recursos:{...d.recursos,pv:{atual:500,max:500}}}})
// aba Fichas
r=await call(M,'GET',`mesa/${cid}?fichas=1`); const tf=r.d.fichas?.find(f=>f.id===fT)
check('mestre vê todas as fichas (jogador e NPC) com combate', r.d.fichas?.length===2 && tf.combate.ataques.length===3 && tf.combate.vida.atual===12 && typeof tf.combate.defesa?.valor==='number', r.d)
r=await call(J,'GET',`mesa/${cid}?fichas=1`); check('jogador vê só a dele', r.d.fichas.length===1 && r.d.fichas[0].id===fT, r.d)
// cena e tokens importados das fichas
r=await mesa(M,{acao:'cena_criar',nome:'Arena',grid_cols:20,grid_rows:12}); let cena=r.d.cena?.id
r=await call(M,'GET','mesa/'+cid); cena=r.d.cenaAtiva?.id ?? cena; if(!r.d.cenaAtiva) await mesa(M,{acao:'cena_ativar',cenaId:cena})
r=await mesa(J,{acao:'token_criar',cenaId:cena,fichaId:fT,x:2,y:2}); check('jogador coloca o personagem pela ficha (nome vem da ficha)', r.s===201 && r.d.token.nome==='Thorin', r); const tT=r.d.token.id
r=await mesa(J,{acao:'token_criar',cenaId:cena,fichaId:fG,x:3,y:3}); check('jogador não importa NPC', r.s===403, r)
r=await mesa(M,{acao:'token_criar',cenaId:cena,fichaId:fG,x:3,y:3}); const tG=r.d.token.id
r=await call(J,'GET','mesa/'+cid); check('token mostra a vida da ficha', r.d.tokens.find(t=>t.id===tT)?.hp_atual===12 && r.d.tokens.find(t=>t.id===tG)?.hp_max===500, r.d.tokens)
check('regra padrão: mestre confirma o dano', r.d.combate?.acerto==='mestre', r.d.combate)
// regras: só o mestre muda
r=await mesa(J,{acao:'combate_config',acerto:'automatico'}); check('jogador não muda a regra de combate', r.s===403, r)
r=await mesa(M,{acao:'combate_config',acerto:'automatico'}); check('mestre escolhe dano automático', r.d.combate?.acerto==='automatico', r)
// ataques
r=await mesa(J,{acao:'ataque',atacante:tG,alvo:tT,fonte:{tipo:'item',id:'esp'}}); check('jogador não ataca com o token do NPC', r.s===403, r)
r=await mesa(X,{acao:'ataque',atacante:tT,alvo:tG,fonte:{tipo:'item',id:'esp'}}); check('espectador não ataca', r.s===403, r)
await mesa(M,{acao:'token_mover',tokenId:tG,x:12,y:3})
r=await mesa(J,{acao:'ataque',atacante:tT,alvo:tG,fonte:{tipo:'item',id:'esp'}}); check('espada não alcança 15 m', r.s===400 && /alcance/i.test(r.d.erro), r)
let acertos=0, total=0
for (let i=0;i<8;i++) { r=await mesa(J,{acao:'ataque',atacante:tT,alvo:tG,fonte:{tipo:'item',id:'arco'}}); if (r.s!==201) { check('ataque com arco', false, r); break }
  const e=r.d.evento; if (e.dados.acerto) { acertos++; total+=e.dados.dano.total; if (e.dados.status!=='aplicado') check('acerto aplicado automaticamente', false, e.dados) } }
check('arco acerta o goblin a 15 m (8 ataques)', r.s===201, r)
r=await call(M,'GET','fichas/'+fG); check(`dano automático sai da ficha do NPC (${acertos} acertos, ${total} de dano)`, r.d.ficha.dados.recursos.pv.atual===500-total, r.d.ficha.dados.recursos.pv)
r=await call(J,'GET','mesa/'+cid); const ev=r.d.eventos.filter(e=>e.tipo==='ataque').at(-1); check('ataque aparece no chat com os detalhes', ev && ev.texto.startsWith('⚔️ Thorin atacou Goblin com Arco') && ev.dados.alvo.nome==='Goblin', ev)
// poder com custo
r=await mesa(J,{acao:'ataque',atacante:tT,alvo:tG,fonte:{tipo:'poder',id:'raio'}}); check('poder gasta o custo', r.s===201, r)
r=await call(J,'GET','fichas/'+fT); check('custo descontado da ficha', r.d.ficha.dados.recursos.pv_temp.atual===0, r.d.ficha.dados.recursos)
r=await mesa(J,{acao:'ataque',atacante:tT,alvo:tG,fonte:{tipo:'poder',id:'raio'}}); check('sem recurso, não ataca', r.s===400 && /suficiente/.test(r.d.erro), r)
// modo mestre confirma
await mesa(M,{acao:'combate_config',acerto:'mestre'})
let pend=null
for (let i=0;i<15 && !pend;i++) { r=await mesa(J,{acao:'ataque',atacante:tT,alvo:tG,fonte:{tipo:'item',id:'arco'}}); if (r.d.evento?.dados.status==='pendente') pend=r.d.evento }
check('com o mestre confirmando, o acerto fica pendente', !!pend, r)
r=await call(M,'GET','fichas/'+fG); const antes=r.d.ficha.dados.recursos.pv.atual
r=await mesa(J,{acao:'ataque_decidir',eventoId:pend.id,fator:1}); check('jogador não decide o dano', r.s===403, r)
r=await mesa(M,{acao:'ataque_decidir',eventoId:pend.id,fator:0.5}); check('mestre aplica metade', r.s===200 && r.d.aplicado===Math.floor(pend.dados.dano.total/2), r)
r=await call(M,'GET','fichas/'+fG); check('metade do dano saiu da vida', r.d.ficha.dados.recursos.pv.atual===antes-Math.floor(pend.dados.dano.total/2), r.d.ficha.dados.recursos.pv)
r=await mesa(M,{acao:'ataque_decidir',eventoId:pend.id,fator:1}); check('não aplica duas vezes', r.s===409, r)
// editar vida no token ligado muda a ficha
r=await mesa(M,{acao:'token_editar',tokenId:tT,hp_atual:5}); r=await call(J,'GET','fichas/'+fT); check('vida mudada no token vai para a ficha', r.d.ficha.dados.recursos.pv.atual===5, r.d.ficha.dados.recursos.pv)
// ataque livre (token sem ficha)
r=await mesa(M,{acao:'token_criar',cenaId:cena,nome:'Lobo',hp_max:10,x:4,y:4}); const tL=r.d.token.id
r=await mesa(M,{acao:'combate_config',acerto:'automatico'})
r=await mesa(M,{acao:'ataque',atacante:tG,alvo:tL,dano:'1d4',bonus:20,defesa:5}); check('ataque livre do mestre com bônus e defesa informados', r.s===201 && r.d.evento.dados.acerto===true, r)
r=await call(M,'GET','mesa/'+cid); check('dano no token sem ficha', r.d.tokens.find(t=>t.id===tL).hp_atual===10-r.d.eventos.filter(e=>e.tipo==='ataque').at(-1).dados.dano.total, r.d.tokens.find(t=>t.id===tL))
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
