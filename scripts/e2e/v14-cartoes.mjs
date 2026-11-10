// v0.14.0: retrato das fichas e capa das campanhas (cartões). Ver LEIA-ME.md. Precisa da migração 015.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,300))); if(!c) falhas++ }
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==','base64')
async function enviar(quem, destino, corpo, tipo='image/png', origin=BASE){ const r=await fetch(BASE+'/api/prg/'+destino,{method:'POST',body:corpo,headers:{'content-type':tipo,'x-prg-aventureiro':quem,origin}}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }

let r=await enviar(J,'imagens',png); check('jogador envia retrato', r.s===201 && /\/storage\/v1\/object\/public\/prg-mesa\/retratos\/2222/.test(r.d.url), r); const url=r.d.url
r=await enviar(J,'imagens',Buffer.from('oi'),'text/plain'); check('só imagem', r.s===415, r)
r=await enviar(J,'imagens',png,'image/png','https://outro.site'); check('envio só do próprio site', r.s===403, r)
r=await call(J,'POST','fichas',{sistema:'dnd5e-srd'}); const fid=r.d.ficha.id
r=await call(J,'GET','fichas/'+fid); let v=r.d.ficha.versao, d=r.d.ficha.dados
r=await call(J,'PUT','fichas/'+fid,{versao:v,dados:{...d,nome:'Lyra',retrato:url}}); check('salva ficha com retrato', r.s===200, r); v=r.d.versao
r=await call(J,'GET','fichas'); check('lista de fichas traz o retrato (cartão)', r.d.fichas.find(f=>f.id===fid)?.retrato===url, r.d.fichas)
r=await call(J,'PUT','fichas/'+fid,{versao:v,dados:{...d,nome:'Lyra',retrato:'https://rastreador.example/pixel.png'}}); v=r.d.versao
r=await call(J,'GET','fichas/'+fid); check('retrato de fora da plataforma é descartado', r.d.ficha.dados.retrato===undefined, r.d.ficha.dados.retrato)
// capa da campanha
r=await call(M,'POST','campanhas',{nome:'Capa Teste',sistema:'livre',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); await call(J,'POST','convites/'+r.d.convite.codigo,{}); r=await call(M,'GET','campanhas/'+cid); await call(M,'POST',`campanhas/${cid}/solicitacoes/${r.d.solicitacoes[0].id}`,{decisao:'aceitar'})
r=await enviar(M,`mesa/${cid}/upload`,png); const capa=r.d.url
r=await call(M,'PATCH','campanhas/'+cid,{capa}); check('mestre coloca a capa', r.s===200 && r.d.campanha.capa_url===capa, r)
r=await call(J,'PATCH','campanhas/'+cid,{capa:null}); check('jogador não troca a capa', r.s===403, r)
r=await call(M,'PATCH','campanhas/'+cid,{capa:'javascript:alert(1)'}); check('capa inválida é recusada', r.s===400, r)
r=await call(J,'GET','campanhas'); check('lista de campanhas traz a capa', r.d.campanhas.find(c=>c.id===cid)?.capa_url===capa, r.d)
r=await call(M,'PATCH','campanhas/'+cid,{capa:null}); check('mestre remove a capa', r.s===200 && r.d.campanha.capa_url===null, r)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
