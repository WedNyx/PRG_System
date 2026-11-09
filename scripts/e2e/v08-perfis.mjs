// v0.8.0: editar o próprio perfil e remover perfis com a senha de administrador. Ver LEIA-ME.md.
// Rode o site com PRG_ADMIN_SENHA=lua-roxa-teste (ou defina ADMIN_SENHA igual à do servidor).
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222'
const BASE=process.env.PRG_BASE || 'http://localhost:3000', SENHA=process.env.ADMIN_SENHA || 'lua-roxa-teste'; let falhas=0
async function call(quem, metodo, caminho, body, base='/api/'){ const h={'content-type':'application/json',origin:BASE}; if(quem) h['x-prg-aventureiro']=quem; const r=await fetch(BASE+base+caminho,{method:metodo,headers:h,body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,300))); if(!c) falhas++ }
const FOTO='data:image/jpeg;base64,'+Buffer.from('foto-de-teste').toString('base64')

let r=await call(J,'PATCH','aventureiros/'+J,{apelido:'Sol Radiante',avatar:FOTO}); check('jogador muda o próprio nome e foto', r.s===200 && r.d.perfil.apelido==='Sol Radiante' && r.d.perfil.avatar===FOTO, r)
r=await call(null,'GET','aventureiros'); check('todos veem o novo nome', r.d.perfis.some(p=>p.id===J && p.apelido==='Sol Radiante'), r.d)
r=await call(J,'PATCH','aventureiros/'+M,{apelido:'Hackeado'}); check('não dá para editar o perfil de outra pessoa', r.s===403, r)
r=await call(J,'PATCH','aventureiros/'+J,{apelido:'Mestra Lua'}); check('nome repetido é recusado', r.s===409, r)
r=await call(J,'PATCH','aventureiros/'+J,{apelido:'ab'}); check('nome curto é recusado', r.s===400, r)
r=await call(J,'PATCH','aventureiros/'+J,{avatar:'javascript:alert(1)'}); check('foto inválida é recusada', r.s===400, r)
r=await call(J,'PATCH','aventureiros/'+J,{avatar:null}); check('pode remover a foto', r.s===200 && r.d.perfil.avatar===null, r)
await call(J,'PATCH','aventureiros/'+J,{apelido:'Jogador Sol'})

r=await call(null,'POST','aventureiros/admin',{senha:'errada'}); check('senha errada não libera', r.s===401, r)
r=await call(null,'POST','aventureiros/admin',{senha:SENHA}); check('senha certa libera o modo administrador', r.s===200, r)
r=await call(null,'POST','aventureiros',{apelido:'Perfil Temporário'}); const tmp=r.d.perfil.id
r=await call(null,'DELETE','aventureiros/'+tmp,{senha:'errada'}); check('remover sem a senha certa é recusado', r.s===401, r)
const camp=await call(tmp,'POST','campanhas',{nome:'Do Temporário',sistema:'Lunethernnyis — Opositores',modeloPadrao:'C'},'/api/prg/')
r=await call(null,'DELETE','aventureiros/'+tmp,{senha:SENHA}); check('mestre de campanha não é removido (avisa qual campanha)', r.s===409 && r.d.erro.includes('Do Temporário'), r)
await call(tmp,'DELETE','campanhas/'+camp.d.campanha.id,undefined,'/api/prg/')
r=await call(null,'POST','aventureiros',{apelido:'Outro Temporário'}); const tmp2=r.d.perfil.id
await call(tmp2,'POST','fichas',{sistema:'livre',nome:'Ficha do temporário'},'/api/prg/')
r=await call(null,'DELETE','aventureiros/'+tmp2,{senha:SENHA}); check('administrador remove o perfil', r.s===200, r)
r=await call(null,'GET','aventureiros'); check('perfil removido sumiu da lista', !r.d.perfis.some(p=>p.id===tmp2), r.d)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
