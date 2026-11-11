// v0.26.0: à beira da morte (testes contra a morte, dano caído, levantar, medidas desesperadas). Precisa da migração 020. Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'Morte',sistema:'dnd5e-srd',modeloPadrao:'C'}); const cid=r.d.campanha.id
const mesa=(q,b)=>call(q,'POST','mesa/'+cid,b)
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); await call(J,'POST','convites/'+r.d.convite.codigo,{})
r=await call(M,'GET','campanhas/'+cid); await call(M,'POST',`campanhas/${cid}/solicitacoes/${r.d.solicitacoes[0].id}`,{decisao:'aceitar'})
await mesa(M,{acao:'sessao',aberta:true})
r=await mesa(M,{acao:'cena_criar',nome:'C',grid_cols:12,grid_rows:8}); r=await call(M,'GET','mesa/'+cid); const cena=r.d.cenaAtiva?.id ?? r.d.cenas[0].id; if(!r.d.cenaAtiva) await mesa(M,{acao:'cena_ativar',cenaId:cena})
r=await mesa(J,{acao:'token_criar',cenaId:cena,nome:'Lyra',hp_max:10}); const tL=r.d.token.id
r=await mesa(M,{acao:'token_criar',cenaId:cena,nome:'Ogro',hp_max:30}); const tO=r.d.token.id
const tok=async id=>(await call(M,'GET','mesa/'+cid)).d.tokens.find(t=>t.id===id)
const textos=async()=>(await call(M,'GET','mesa/'+cid)).d.eventos.map(e=>e.texto||'')
r=await call(M,'GET','mesa/'+cid); check('regra padrão: testes contra a morte', r.d.combate?.morte==='testes', r.d.combate)
r=await mesa(J,{acao:'morte',tokenId:tL,op:'medida',n:1}); check('sem a regra opcional, não há medidas desesperadas', r.s===400, r)
r=await mesa(M,{acao:'combate_config',morte:'desesperadas'}); check('mestre liga Medidas desesperadas (acerto continua)', r.d.combate?.morte==='desesperadas' && r.d.combate?.acerto==='mestre', r.d)
r=await mesa(J,{acao:'morte',tokenId:tO,op:'medida',n:1}); check('jogador não usa medida no token dos outros', r.s===403, r)
r=await mesa(J,{acao:'morte',tokenId:tL,op:'medida',n:1}); check('jogador aceita 1 falha futura', r.s===200 && r.d.morte.futuras===1, r)
r=await mesa(J,{acao:'morte',tokenId:tL,op:'medida',n:3}); check('não passa de 3 guardadas', r.s===400, r)
check('chat conta a medida', (await textos()).some(t=>t.startsWith('⚠️ Lyra usou Medidas desesperadas')), (await textos()).slice(-2))
r=await mesa(M,{acao:'token_editar',tokenId:tL,hp_atual:0}); let t=await tok(tL)
check('vida 0: cai com a falha guardada', t.morte.estado==='caido' && t.morte.falhas===1 && t.morte.futuras===0, t.morte)
check('chat avisa que caiu', (await textos()).some(x=>x.startsWith('💀 Lyra caiu!')), (await textos()).slice(-2))
r=await mesa(M,{acao:'token_editar',tokenId:tL,hp_atual:0}); t=await tok(tL); check('editar sem mudar não conta falha', t.morte.falhas===1, t.morte)
r=await mesa(J,{acao:'morte',tokenId:tL,op:'medida',n:1}); check('caído não usa medida', r.s===400, r)
r=await mesa(J,{acao:'morte',tokenId:tL,op:'rolar'}); t=await tok(tL)
check('dono rola o teste contra a morte', r.s===200 && (t.morte.sucessos+t.morte.falhas>=2 || t.hp_atual===1), {s:r.s,m:t.morte,hp:t.hp_atual})
await mesa(M,{acao:'morte',tokenId:tL,op:'zerar'}); await mesa(M,{acao:'morte',tokenId:tL,op:'cair'}); await mesa(M,{acao:'token_editar',tokenId:tL,hp_atual:0})
r=await mesa(M,{acao:'morte',tokenId:tL,op:'sucesso'}); r=await mesa(M,{acao:'morte',tokenId:tL,op:'sucesso'}); r=await mesa(M,{acao:'morte',tokenId:tL,op:'sucesso'}); t=await tok(tL)
check('3 sucessos: estável', t.morte.estado==='estavel', t.morte)
r=await mesa(M,{acao:'ataque',atacante:tO,alvo:tL,dano:'3',bonus:'90',defesa:'1'})
const ev=(await call(M,'GET','mesa/'+cid)).d.eventos.filter(e=>e.tipo==='ataque').at(-1); await mesa(M,{acao:'ataque_decidir',eventoId:ev.id,fator:1}); t=await tok(tL)
check('dano em quem está estável: volta a cair com falha', t.morte.estado==='caido' && t.morte.falhas>=1 && t.morte.sucessos===0, t.morte)
r=await mesa(M,{acao:'token_editar',tokenId:tL,hp_atual:5}); t=await tok(tL)
check('cura levanta e zera a contagem', t.hp_atual===5 && !t.morte.estado && t.morte.falhas===0, t)
check('chat: levantou', (await textos()).some(x=>x==='💚 Lyra levantou!'), (await textos()).slice(-2))
// teste automático no turno
await mesa(M,{acao:'token_editar',tokenId:tL,hp_atual:0})
r=await mesa(M,{acao:'combate_preparar',tokens:[{tokenId:tO,bonus:50},{tokenId:tL,bonus:-50}]})
r=await mesa(M,{acao:'turno',direcao:1}); t=await tok(tL)
check('no turno de quem caiu, o teste rola sozinho', (await textos()).some(x=>x.startsWith('💀 Teste contra a morte de Lyra')), (await textos()).slice(-3))
for (let i=0;i<3;i++) await mesa(M,{acao:'morte',tokenId:tL,op:'falha'}); t=await tok(tL)
check('3 falhas: morreu', t.morte.estado==='morto', t.morte)
r=await mesa(M,{acao:'combate_config',morte:'desligado'}); r=await mesa(J,{acao:'morte',tokenId:tL,op:'rolar'}); check('regra desligada recusa', r.s===400, r)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
