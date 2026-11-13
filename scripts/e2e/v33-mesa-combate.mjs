// v0.33.8: iniciativa e combate — entrar no meio, desempatar, mudar valor, adiar, sair, e dano/cura em vários.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222', N='33333333-3333-4333-8333-333333333333'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'Arena',sistema:'tormenta20',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); await call(J,'POST','convites/'+r.d.convite.codigo,{}); await call(N,'POST','convites/'+r.d.convite.codigo,{})
r=await call(M,'GET','campanhas/'+cid); for (const s of r.d.solicitacoes) await call(M,'POST',`campanhas/${cid}/solicitacoes/${s.id}`,{decisao:'aceitar'})
await call(M,'POST','mesa/'+cid,{acao:'sessao',aberta:true})
const mesa=(b,q=M)=>call(q,'POST','mesa/'+cid,b)
r=await mesa({acao:'cena_criar',nome:'Arena',grid_cols:20,grid_rows:12}); const cena=r.d.cena.id
const tk=async(nome,q=M,hp=20)=>(await mesa({acao:'token_criar',cenaId:cena,nome,hp_max:hp},q)).d.token.id
const A=await tk('Ana',J), B=await tk('Bruno',N), O=await tk('Ogro'), L=await tk('Lobo')
const ini=async()=> (await call(M,'GET','mesa/'+cid)).d.mesa
await mesa({acao:'iniciativa',iniciativa:[{id:'a',nome:'Ana',valor:18,tokenId:A},{id:'o',nome:'Ogro',valor:12,tokenId:O},{id:'b',nome:'Bruno',valor:12,tokenId:B}],turno:1,rodada:2})
let m=await ini(); check('ordem começa no Ogro (vez 2)', m.iniciativa[m.turno].nome==='Ogro', m)
r=await mesa({acao:'iniciativa_entrar',tokenId:L,valor:15}); m=await ini()
check('Lobo entra no meio (15) e a vez continua do Ogro', m.iniciativa.map(x=>x.nome).join()==='Ana,Lobo,Ogro,Bruno' && m.iniciativa[m.turno].nome==='Ogro' && m.rodada===2, m)
r=await mesa({acao:'iniciativa_entrar',tokenId:L}); check('não entra duas vezes', r.s===409, r)
r=await mesa({acao:'iniciativa_mover',id:'b',direcao:-1}); m=await ini()
check('desempate: Bruno sobe acima do Ogro, a vez continua do Ogro', m.iniciativa.map(x=>x.nome).join()==='Ana,Lobo,Bruno,Ogro' && m.iniciativa[m.turno].nome==='Ogro', m.iniciativa.map(x=>x.nome))
r=await mesa({acao:'iniciativa_valor',id:'a',valor:5}); m=await ini()
check('mudar o valor reordena', m.iniciativa.at(-1).nome==='Ana' && m.iniciativa[m.turno].nome==='Ogro', m.iniciativa.map(x=>x.nome+x.valor))
r=await mesa({acao:'iniciativa_adiar',turnoAtual:m.turno},J); check('jogador não adia na vez dos outros', r.s===403, r)
r=await mesa({acao:'iniciativa_adiar'}); m=await ini()
check('mestre adia o Ogro: Ana joga agora, Ogro logo depois', m.iniciativa[m.turno].nome==='Ana' && m.iniciativa[m.turno+1].nome==='Ogro', m.iniciativa.map(x=>x.nome))
r=await mesa({acao:'iniciativa_adiar',turnoAtual:m.turno},J); m=await ini(); check('Ana (jogadora) adia na vez dela: o Ogro joga e ela vem depois', r.s===200 && m.iniciativa[m.turno].nome==='Ogro' && m.iniciativa[m.turno+1].nome==='Ana', m.iniciativa.map(x=>x.nome))
await mesa({acao:'turno',direcao:1}); r=await mesa({acao:'iniciativa_adiar'}); check('o último da rodada não adia', r.s===400, r)
m=await ini(); const daVez=m.iniciativa[m.turno].nome
r=await mesa({acao:'iniciativa_sair',id:'b'}); m=await ini(); check('Bruno sai do combate e a vez não muda', !m.iniciativa.some(x=>x.nome==='Bruno') && m.iniciativa[m.turno].nome===daVez, m.iniciativa.map(x=>x.nome))
r=await mesa({acao:'iniciativa_mover',id:'a',direcao:-1},J); check('jogador não reordena', r.s===403, r)
// Jogador entra com o próprio token, não com o dos outros
r=await mesa({acao:'iniciativa_entrar',tokenId:B},J); check('jogador não coloca token dos outros', r.s===403, r)
r=await mesa({acao:'iniciativa_entrar',tokenId:B},N); m=await ini(); check('jogador entra com o próprio token (rola sozinho)', r.s===200 && m.iniciativa.some(x=>x.tokenId===B), r.d)
// Dano em vários
r=await mesa({acao:'dano_varios',dano:'10',rotulo:'Bola de fogo',alvos:[{tokenId:O},{tokenId:L,metade:true}]})
let t=(await call(M,'GET','mesa/'+cid)).d.tokens
check('dano em área: Ogro −10, Lobo −5 (metade)', t.find(x=>x.id===O).hp_atual===10 && t.find(x=>x.id===L).hp_atual===15 && /Bola de fogo/.test(r.d.evento?.texto), {t:t.map(x=>x.nome+x.hp_atual),r:r.d})
r=await mesa({acao:'dano_varios',dano:'1d4',cura:true,alvos:[{tokenId:O}]}); t=(await call(M,'GET','mesa/'+cid)).d.tokens
check('cura em grupo rola 1d4', r.s===200 && t.find(x=>x.id===O).hp_atual===10+r.d.total, r.d)
r=await mesa({acao:'dano_varios',dano:'5',alvos:[{tokenId:O}]},J); check('jogador não faz dano em vários', r.s===403, r)
console.log(falhas?`\n${falhas} falha(s)`:'\nTudo certo!'); process.exit(falhas?1:0)
