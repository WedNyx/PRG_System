// v0.31.0: senha opcional por perfil (aparelho lembrado por cookie HttpOnly; admin redefine). Precisa da migração 023. Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222'
const BASE=process.env.PRG_BASE || 'http://localhost:3000', ADMIN=process.env.ADMIN_SENHA || 'lua-roxa-teste'; let falhas=0
// Cada “aparelho” guarda os próprios cookies.
const aparelho=()=>({ jar:{} })
async function call(ap, quem, metodo, caminho, body, base='/api/prg/'){
  const cookie=Object.entries(ap.jar).map(([k,v])=>k+'='+v).join('; ')
  const r=await fetch(BASE+base+caminho,{method:metodo,headers:{'content-type':'application/json',...(quem?{'x-prg-aventureiro':quem}:{}),origin:BASE,...(cookie?{cookie}:{}),'user-agent':'Mozilla/5.0 (Linux; Android 14) Mobile'},body:body===undefined?undefined:JSON.stringify(body)})
  for (const c of r.headers.getSetCookie?.() ?? []) { const [kv,...attr]=c.split(';'); const [k,v]=kv.split('='); if (/max-age=0/i.test(attr.join(';')) || v==='') delete ap.jar[k.trim()]; else ap.jar[k.trim()]=v }
  let d={}; try{d=await r.json()}catch{}; return {s:r.status,d,setCookie:r.headers.getSetCookie?.() ?? []}
}
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
const A=aparelho(), B=aparelho(), C=aparelho()
const perfil=(ap)=>call(ap,null,'GET','perfil/'+J)
const catalogo=async()=>(await call(C,null,'GET','aventureiros',undefined,'/api/')).d.perfis.find(p=>p.id===J)

let r=await perfil(A); check('perfil começa sem senha', r.s===200 && r.d.protegido===false, r.d)
check('catálogo diz “sem senha” e não mostra hash', (await catalogo()).protegido===false && !JSON.stringify(await catalogo()).includes('scrypt'), await catalogo())
r=await call(A,J,'GET','fichas'); check('sem senha: entra só com o perfil escolhido (como antes)', r.s===200, r)
r=await call(A,M,'POST','perfil/'+J,{acao:'definir',nova:'segredo-sol'}); check('outro perfil não cria a senha do Sol', r.s===403, r)
r=await call(A,J,'POST','perfil/'+J,{acao:'definir',nova:'123'}); check('senha curta é recusada', r.s===400, r)
r=await call(A,J,'POST','perfil/'+J,{acao:'definir',nova:'segredo-sol'})
const ck=r.setCookie.join(';')
check('Sol cria a senha e este aparelho fica lembrado', r.s===200 && /prg_s_/.test(ck) && /HttpOnly/i.test(ck) && /SameSite=lax/i.test(ck) && !ck.includes('segredo'), r)
check('catálogo agora mostra 🔒 (protegido)', (await catalogo()).protegido===true, await catalogo())
r=await call(A,J,'GET','fichas'); check('aparelho lembrado continua usando o perfil', r.s===200, r)
r=await call(B,J,'GET','fichas'); check('outro aparelho sem a senha é barrado', r.s===401 && r.d.senha===true && r.d.perfil===J, r)
r=await call(B,J,'PATCH','aventureiros/'+J,{apelido:'Invasor'},'/api/'); check('outro aparelho não muda nome/foto do Sol', r.s===401, r)
r=await call(B,J,'POST','perfil/'+J,{acao:'definir',nova:'roubei-aqui'}); check('outro aparelho não troca a senha', r.s===401, r)
B.jar['prg_s_'+J]='x'.repeat(43); r=await call(B,J,'GET','fichas'); check('cookie inventado não vale', r.s===401, r); B.jar={}
r=await call(B,null,'POST','perfil/'+J,{acao:'entrar',senha:'errada'}); check('senha errada é recusada', r.s===401 && !Object.keys(B.jar).length, r)
r=await call(B,null,'POST','perfil/'+J,{acao:'entrar',senha:'segredo-sol'}); check('senha certa lembra o aparelho', r.s===200 && Object.keys(B.jar).length===1, r)
r=await call(B,J,'GET','fichas'); check('agora o segundo aparelho entra', r.s===200, r)
r=await call(A,null,'GET','perfil/'+J); check('lista dos aparelhos lembrados (2, “este” marcado)', r.d.conectado && r.d.aparelhos.length===2 && r.d.aparelhos.filter(a=>a.este).length===1 && r.d.aparelhos[0].aparelho==='Celular Android', r.d)
r=await call(B,J,'POST','perfil/'+J,{acao:'sair'}); check('sair deste aparelho apaga o cookie', r.s===200 && !Object.keys(B.jar).length, r)
r=await call(B,J,'GET','fichas'); check('depois de sair, pede a senha de novo', r.s===401, r)
r=await call(A,J,'POST','perfil/'+J,{acao:'definir',nova:'senha-nova-2',atual:'errada'}); check('trocar a senha exige a atual', r.s===401, r)
await call(B,null,'POST','perfil/'+J,{acao:'entrar',senha:'segredo-sol'})
r=await call(A,J,'POST','perfil/'+J,{acao:'definir',nova:'senha-nova-2',atual:'segredo-sol'}); check('troca a senha', r.s===200, r)
r=await call(B,J,'GET','fichas'); check('trocar a senha desconecta os outros aparelhos', r.s===401, r)
r=await call(A,J,'GET','fichas'); check('…mas este continua', r.s===200, r)
// trava depois de 5 erros
for (let i=0;i<5;i++) r=await call(C,null,'POST','perfil/'+J,{acao:'entrar',senha:'chute'+i})
check('5 erros seguidos travam', r.s===401 && /Muitas tentativas/.test(r.d.erro), r)
r=await call(C,null,'POST','perfil/'+J,{acao:'entrar',senha:'senha-nova-2'}); check('travado: nem a senha certa entra por 10 min', r.s===429, r)
r=await call(C,null,'POST','perfil/'+J,{acao:'redefinir',admin:'nao-sou-admin'}); check('redefinir exige a senha de administrador', r.s===401, r)
r=await call(C,null,'POST','perfil/'+J,{acao:'redefinir',admin:ADMIN}); check('administrador apaga a senha esquecida', r.s===200 && r.d.protegido===false, r)
r=await call(B,J,'GET','fichas'); check('sem senha de novo: volta a entrar como antes', r.s===200, r)
r=await call(A,J,'POST','perfil/'+J,{acao:'definir',nova:'mais-uma-vez'}); await call(A,J,'POST','perfil/'+J,{acao:'remover',atual:'errada'})
r=await call(A,J,'POST','perfil/'+J,{acao:'remover',atual:'mais-uma-vez'}); check('o próprio perfil remove a senha (com a atual)', r.s===200 && r.d.protegido===false && !Object.keys(A.jar).length, r)
check('catálogo volta a “sem senha”', (await catalogo()).protegido===false, await catalogo())
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
