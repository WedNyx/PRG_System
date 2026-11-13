// v0.33.8: tokens das fichas (imagem ao vivo, cópias de NPC com vida própria, ataques e iniciativa da ficha-modelo) e ficha aberta na mesa.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'Mesa das fichas',sistema:'dnd5e-srd',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); await call(J,'POST','convites/'+r.d.convite.codigo,{})
r=await call(M,'GET','campanhas/'+cid); for (const s of r.d.solicitacoes) await call(M,'POST',`campanhas/${cid}/solicitacoes/${s.id}`,{decisao:'aceitar'})
await call(M,'POST','mesa/'+cid,{acao:'sessao',aberta:true})
r=await call(M,'POST','mesa/'+cid,{acao:'cena_criar',nome:'Ponte',grid_cols:20,grid_rows:12}); const cena=r.d.cena.id
const RET='https://vzmytrafnpxvupjwlejl.supabase.co/storage/v1/object/public/prg-mesa/teste/retrato.png'
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'dnd5e-srd',nome:'Lyra'}); const fL=r.d.ficha.id
let g=await call(M,'GET','fichas/'+fL); await call(M,'PUT','fichas/'+fL,{versao:g.d.ficha.versao,dados:{...g.d.ficha.dados,campos:{...g.d.ficha.dados.campos,classe:'Guerreiro',nivel:3},atributos:{...g.d.ficha.dados.atributos,DES:16},recursos:{...g.d.ficha.dados.recursos,pv:{atual:28,max:28}}}})
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'npc',sistema:'dnd5e-srd',nome:'Goblin'}); const fG=r.d.ficha.id
g=await call(M,'GET','fichas/'+fG); await call(M,'PUT','fichas/'+fG,{versao:g.d.ficha.versao,dados:{...g.d.ficha.dados,retrato:RET,recursos:{...g.d.ficha.dados.recursos,pv:{atual:7,max:7}},atributos:{...g.d.ficha.dados.atributos,DES:14},
  itens:[{id:'cimitarra',nome:'Cimitarra',categoria:'arma',quantidade:1,dano:'1d6+2',equipado:true}]}})

r=await call(J,'POST','mesa/'+cid,{acao:'token_criar',cenaId:cena,fichaId:fL}); const tL=r.d.token?.id; check('jogador põe o próprio personagem na mesa', r.s===201, r.d)
r=await call(J,'POST','mesa/'+cid,{acao:'token_criar',cenaId:cena,fichaId:fG,copia:true}); check('jogador não faz cópias de NPC', r.s===403, r)
r=await call(M,'POST','mesa/'+cid,{acao:'token_criar',cenaId:cena,fichaId:fL,copia:true}); check('cópia só de NPC', r.s===403, r)
const copias=[]; for (let i=0;i<3;i++){ r=await call(M,'POST','mesa/'+cid,{acao:'token_criar',cenaId:cena,fichaId:fG,copia:true}); copias.push(r.d.token) }
check('três cópias do Goblin com nomes numerados', copias.map(t=>t?.nome).join()==='Goblin 1,Goblin 2,Goblin 3', copias.map(t=>t?.nome))
check('cópia: sem ficha ligada, com ficha-modelo e vida cheia da ficha', copias.every(t=>t.ficha_id===null && t.ficha_modelo===fG && t.hp_max===7 && t.hp_atual===7), copias[0])
r=await call(M,'GET','mesa/'+cid); const vivos=r.d.tokens
check('a cópia mostra o retrato da ficha', vivos.find(t=>t.id===copias[0].id)?.imagem_url===RET, vivos.find(t=>t.id===copias[0].id))
// Dano numa cópia não mexe na ficha nem nas outras
await call(M,'POST','mesa/'+cid,{acao:'token_editar',tokenId:copias[0].id,hp_atual:2})
r=await call(M,'GET','mesa/'+cid); g=await call(M,'GET','fichas/'+fG)
check('dano na cópia 1 fica só nela', r.d.tokens.find(t=>t.id===copias[0].id).hp_atual===2 && r.d.tokens.find(t=>t.id===copias[1].id).hp_atual===7 && g.d.ficha.dados.recursos.pv.atual===7, r.d.tokens.map(t=>t.nome+':'+t.hp_atual))
// Ataque com a cópia usa a arma da ficha-modelo
r=await call(M,'GET',`mesa/${cid}?fichas=1`); const fichaG=r.d.fichas.find(f=>f.id===fG); const arma=fichaG.combate.ataques.find(a=>a.nome==='Cimitarra')
check('a ficha do Goblin tem a Cimitarra como ataque', !!arma, fichaG.combate.ataques)
await call(M,'POST','mesa/'+cid,{acao:'token_mover',tokenId:copias[1].id,x:1,y:1}); await call(J,'POST','mesa/'+cid,{acao:'token_mover',tokenId:tL,x:2,y:1})
r=await call(M,'POST','mesa/'+cid,{acao:'ataque',atacante:copias[1].id,alvo:tL,fonte:{tipo:arma.tipo,id:arma.id}})
check('a cópia ataca com a arma da ficha-modelo', r.s===201 && r.d.evento.dados.arma==='Cimitarra', r.d)
r=await call(M,'POST','mesa/'+cid,{acao:'combate_preparar',tokens:[{tokenId:copias[2].id},{tokenId:tL}]})
const ini=r.d.rolagens?.find(o=>o.tokenId===copias[2].id); check('iniciativa da cópia usa o bônus da ficha (Des 14 → +2)', ini?.bonus===2, r.d)
// Fichas na mesa
r=await call(J,'GET','mesa/'+cid); check('jogador recebe só a própria ficha para abrir na mesa', r.d.fichas.length===1 && r.d.fichas[0].id===fL, r.d.fichas)
r=await call(J,'GET','fichas/'+fL); check('e consegue abrir e editar a ficha', r.s===200 && r.d.podeEditar===true, r.d)
r=await call(J,'GET','fichas/'+fG); check('mas não a do NPC', r.s===404, r.s)
console.log(falhas?`\n${falhas} falha(s)`:'\nTudo certo!'); process.exit(falhas?1:0)
