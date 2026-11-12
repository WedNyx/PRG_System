// v0.33.4: Assimilação na mesa (teste com d6/d10 de símbolos, dano por símbolo nos níveis de Saúde, chat com os símbolos). Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'Rio Comprido',sistema:'assimilacao',modeloPadrao:'C'}); const cid=r.d.campanha.id
const mesa=(b)=>call(M,'POST','mesa/'+cid,b)
await mesa({acao:'sessao',aberta:true})
const cheio=n=>Object.fromEntries([1,2,3,4,5,6].map(i=>['saude'+i,{atual:n}]))
async function npc(nome, extra){ r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'npc',sistema:'assimilacao',nome}); const id=r.d.ficha.id
  r=await call(M,'GET','fichas/'+id); const d=r.d.ficha.dados
  r=await call(M,'PUT','fichas/'+id,{versao:r.d.ficha.versao,dados:{...d,...extra}}); return id }
const fH=await npc('Hugo',{atributos:{INF:1,PER:2,POT:2,REA:3,RSL:1,SAG:1},pericias:{armas:3},recursos:cheio(4),itens:[{id:'faca',nome:'Faca',categoria:'arma',peso:1,dano:'2d10',bonus:[]}]})
const fB=await npc('Bicho',{atributos:{INF:1,PER:1,POT:3,REA:1,RSL:3,SAG:1},recursos:cheio(7)})
r=await call(M,'GET',`mesa/${cid}?fichas=1`); const ch=r.d.fichas?.find(f=>f.id===fH)?.combate, cb=r.d.fichas?.find(f=>f.id===fB)?.combate
check('a vida é a soma dos 6 níveis de Saúde', ch?.vida?.id==='saude' && ch.vida.atual===24 && cb?.vida?.max===42, {ch, cb})
check('testes juntam Instinto (d6) e aptidão (d10)', ch?.testes.some(t=>t.id==='combo:REA:armas' && t.assim.d6===3 && t.assim.d10===3) && ch.testePadrao==='combo:REA:armas', ch?.testes)
r=await mesa({acao:'cena_criar',nome:'Ruínas',grid_cols:20,grid_rows:12}); let cena=r.d.cena?.id
r=await call(M,'GET','mesa/'+cid); cena=r.d.cenaAtiva?.id ?? cena; if(!r.d.cenaAtiva) await mesa({acao:'cena_ativar',cenaId:cena})
r=await mesa({acao:'token_criar',cenaId:cena,fichaId:fH,x:2,y:2}); const tH=r.d.token.id
r=await mesa({acao:'token_criar',cenaId:cena,fichaId:fB,x:3,y:2}); const tB=r.d.token.id
await mesa({acao:'combate_config',acerto:'automatico'})
let acertos=0, erros=0, ok=true
for (let i=0;i<12;i++) {
  r=await mesa({acao:'ataque',atacante:tH,alvo:tB,fonte:{tipo:'item',id:'faca'},teste:'combo:REA:armas'})
  const e=r.d.evento, dd=e?.dados
  if (r.s!==201 || e.expressao!=='3d6+3d10' || !dd?.assimilacao || !/Sucesso/.test(e.texto)) { ok=false; console.log(JSON.stringify(r).slice(0,300)); break }
  if (dd.acerto) { acertos++; if (dd.dano.expressao!=='2d10' || dd.dano.total>6) ok=false; if (dd.dano.total>0) break } else erros++
}
check('ataque rola 3d6+3d10, conta Sucessos e o dano por símbolo', ok && acertos>0, {acertos, erros})
r=await call(M,'GET','fichas/'+fB); const rec=r.d.ficha.dados.recursos
const soma=[1,2,3,4,5,6].reduce((t,i)=>t+(rec['saude'+i]?.atual||0),0)
check('o dano desceu pelos níveis de Saúde (6 primeiro)', soma<42 && rec.saude6.atual<7 && rec.saude5.atual===7 && rec.saude1.atual===7, rec)
r=await call(M,'GET','mesa/'+cid); const tok=r.d.tokens.find(t=>t.id===tB)
check('o token mostra a Saúde somada', tok?.hp_atual===soma && tok?.hp_max===42, tok)
r=await mesa({acao:'evento',tipo:'rolagem',expressao:'2d6+2d10',estilo:'assimilacao',manter:2,personagem:'Hugo',texto:'Percepção + Medicina'})
check('rolagem da ficha guarda o estilo de símbolos', r.s===201 && r.d.evento?.dados?.assimilacao?.manter===2, r)
r=await mesa({acao:'evento',tipo:'rolagem',expressao:'1d20',estilo:'assimilacao'})
check('d20 não vira rolagem de símbolos', r.s===201 && !r.d.evento?.dados, r)
r=await mesa({acao:'combate_preparar',tokens:[{tokenId:tH},{tokenId:tB}]})
check('iniciativa rola a Reação em d6', r.s===200 && r.d.rolagens?.find(o=>o.tokenId===tH)?.dados.length===3, r.d)
console.log(falhas?`\n${falhas} falha(s)`:'\nTudo certo!'); process.exit(falhas?1:0)
