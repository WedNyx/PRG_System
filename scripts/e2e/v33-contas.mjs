// v0.33.2: código de recuperação da senha (migração 026), apagar o próprio perfil e importar ficha de arquivo. Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
const aparelho=()=>({ jar:{} })
async function call(ap, quem, metodo, caminho, body, base='/api/prg/'){
  const cookie=Object.entries(ap?.jar ?? {}).map(([k,v])=>k+'='+v).join('; ')
  const r=await fetch(BASE+base+caminho,{method:metodo,headers:{'content-type':'application/json',...(quem?{'x-prg-aventureiro':quem}:{}),origin:BASE,...(cookie?{cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)})
  if (ap) for (const c of r.headers.getSetCookie?.() ?? []) { const [kv,...attr]=c.split(';'); const [k,v]=kv.split('='); if (/max-age=0/i.test(attr.join(';')) || v==='') delete ap.jar[k.trim()]; else ap.jar[k.trim()]=v }
  let d={}; try{d=await r.json()}catch{}; return {s:r.status,d}
}
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
const A=aparelho(), B=aparelho(), C=aparelho()

let r=await call(null,null,'POST','aventureiros',{apelido:'Perfil Temporário'},'/api/'); const P=r.d.perfil?.id
check('cria perfil temporário', r.s===201 && P, r)

// ---- código de recuperação ----
r=await call(A,P,'POST','perfil/'+P,{acao:'definir',nova:'segredo-123'})
const cod1=r.d.codigo
check('criar senha devolve o código de recuperação (4 grupos)', r.s===200 && /^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/.test(cod1||''), r)
r=await call(A,P,'GET','perfil/'+P); check('perfil diz que tem código', r.d.temCodigo===true, r.d)
r=await call(B,P,'POST','perfil/'+P,{acao:'recuperar',codigo:'AAAA-BBBB-CCCC-DDDD',nova:'outra-456'}); check('código errado não entra', r.s===401 && /código/i.test(r.d.erro), r)
r=await call(B,P,'POST','perfil/'+P,{acao:'recuperar',codigo:cod1.toLowerCase().replace(/-/g,' '),nova:'outra-456'})
const cod2=r.d.codigo
check('código certo (minúsculo, sem traço) troca a senha e dá código novo', r.s===200 && cod2 && cod2!==cod1, r)
r=await call(B,P,'GET','fichas'); check('o aparelho que recuperou já entra', r.s===200, r)
r=await call(A,P,'GET','fichas'); check('os outros aparelhos foram desconectados', r.s===401, r)
r=await call(C,P,'POST','perfil/'+P,{acao:'recuperar',codigo:cod1}); check('código usado não vale mais', r.s===401, r)
r=await call(C,P,'POST','perfil/'+P,{acao:'entrar',senha:'outra-456'}); check('entra com a senha nova', r.s===200, r)
r=await call(C,P,'POST','perfil/'+P,{acao:'novo_codigo',atual:'errada'}); check('novo código pede a senha atual', r.s===401, r)
r=await call(C,P,'POST','perfil/'+P,{acao:'novo_codigo',atual:'outra-456'}); const cod3=r.d.codigo
check('gera outro código com a senha', r.s===200 && cod3 && cod3!==cod2, r)
r=await call(aparelho(),P,'POST','perfil/'+P,{acao:'recuperar',codigo:cod3}); check('recuperar sem senha nova tira a senha', r.s===200 && r.d.protegido===false, r)
r=await call(aparelho(),P,'GET','fichas'); check('perfil fica aberto de novo', r.s===200, r)

// ---- importar ficha de arquivo ----
const arquivo={ formato:'prg-ficha', versao:1, sistema:'fate-core', nome:'Rosa', dados:{ sistema:'fate-core', nome:'Rosa', campos:{ conceito:'Piloto rebelde' } } }
r=await call(null,P,'POST','fichas',{ sistema:arquivo.sistema, dados:arquivo.dados }); const fImp=r.d.ficha?.id
check('importa ficha avulsa a partir do arquivo', r.s===201 && r.d.ficha.nome==='Rosa', r)
r=await call(null,P,'GET','fichas/'+fImp); check('dados importados ficam na ficha', r.d.ficha?.dados?.campos?.conceito==='Piloto rebelde', r.d)
r=await call(null,P,'POST','fichas',{ sistema:'sistema-que-nao-existe', dados:{ nome:'X' } }); check('sistema inexistente é recusado', r.s===400, r)

// ---- apagar o próprio perfil ----
r=await call(null,M,'POST','campanhas',{nome:'Saga',sistema:'fate-core',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(null,M,'POST',`campanhas/${cid}/convites`,{}); await call(null,P,'POST','convites/'+r.d.convite.codigo,{})
r=await call(null,M,'GET','campanhas/'+cid); await call(null,M,'POST',`campanhas/${cid}/solicitacoes/${r.d.solicitacoes[0].id}`,{decisao:'aceitar'})
r=await call(null,M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:P,sistema:'fate-core',nome:'Herói da Saga'}); const fCamp=r.d.ficha?.id
r=await call(null,P,'POST','campanhas',{nome:'Minha mesa',sistema:'fate-core',modeloPadrao:'C'}); const minha=r.d.campanha.id
r=await call(null,M,'DELETE','aventureiros/'+P,{confirmar:'Perfil Temporário'},'/api/'); check('ninguém apaga o perfil de outra pessoa', r.s===403, r)
r=await call(null,P,'DELETE','aventureiros/'+P,{confirmar:'outro nome'},'/api/'); check('precisa escrever o nome do perfil', r.s===400, r)
r=await call(null,P,'DELETE','aventureiros/'+P,{confirmar:'perfil temporário'},'/api/'); check('mestre de campanha precisa aceitar levar as campanhas junto', r.s===409 && /Minha mesa/.test(r.d.erro), r)
r=await call(null,M,'DELETE','campanhas/'+minha,{confirmar:'Minha mesa'}); check('só o mestre exclui a campanha', r.s===404 || r.s===403, r)
r=await call(null,P,'DELETE','campanhas/'+minha,{confirmar:'outra'}); check('excluir campanha pede o nome dela', r.s===400, r)
r=await call(null,P,'POST','campanhas',{nome:'Segunda mesa',sistema:'fate-core',modeloPadrao:'C'}); const segunda=r.d.campanha.id
r=await call(null,P,'DELETE','campanhas/'+segunda,{confirmar:'segunda MESA'}); check('mestre exclui a própria campanha', r.s===200, r)
r=await call(null,P,'GET','campanhas/'+segunda); check('campanha excluída não existe mais', r.s===404, r)
r=await call(null,P,'DELETE','aventureiros/'+P,{confirmar:'Perfil Temporário',manterPersonagens:true,apagarCampanhas:true},'/api/'); check('apaga o próprio perfil (e a campanha dele)', r.s===200 && r.d.mantidos===1, r)
r=await call(null,M,'GET','campanhas/'+minha); check('a campanha em que ele era mestre foi junto', r.s===404, r)
r=await call(null,M,'GET','fichas/'+fCamp); check('personagem da campanha ficou com o mestre, como NPC', r.s===200 && r.d.ficha?.npc===true && r.d.ficha?.dono_id===M, r.d.ficha ?? r)
r=await call(null,M,'GET','fichas'); check('nada dele ficou para o mestre além do personagem', !r.d.fichas.some(f=>f.id===fImp), r.d)
const lista=await (await fetch(BASE+'/api/aventureiros',{cache:'no-store'})).json()
check('perfil sumiu da lista', !lista.perfis.some(p=>p.id===P), null)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
