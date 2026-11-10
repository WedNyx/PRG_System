// v0.21.0: grupos de perfis (Lunethernnyis / De Fora) e campos de escolha (classe, espécie) com bônus. Precisa da migração 017. Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function req(metodo, caminho, body, extra={}){ const r=await fetch(BASE+caminho,{method:metodo,headers:{'content-type':'application/json',origin:BASE,...extra},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
const call=(quem,metodo,c,body)=>req(metodo,'/api/prg/'+c,body,{'x-prg-aventureiro':quem})
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,300))); if(!c) falhas++ }
let r=await req('GET','/api/aventureiros')
check('perfis antigos estão em Lunethernnyis', r.s===200 && r.d.perfis.find(p=>p.id===M)?.grupo==='lunethernnyis', r.d)
r=await req('POST','/api/aventureiros',{apelido:'Perfil Temporário',grupo:'de-fora'}); check('cria perfil De Fora', r.s===201 && r.d.perfil.grupo==='de-fora', r); const novo=r.d.perfil?.id
r=await req('POST','/api/aventureiros',{apelido:'Outro Temporário',grupo:'hackers'}); check('grupo inventado é recusado', r.s===400, r)
r=await req('PATCH','/api/aventureiros/'+novo,{grupo:'lunethernnyis'},{'x-prg-aventureiro':M}); check('ninguém troca o grupo dos outros', r.s===403, r)
r=await req('PATCH','/api/aventureiros/'+novo,{grupo:'lunethernnyis'},{'x-prg-aventureiro':novo}); check('o próprio troca de grupo', r.s===200 && r.d.perfil.grupo==='lunethernnyis', r)
r=await req('PATCH','/api/aventureiros/'+novo,{grupo:'x'},{'x-prg-aventureiro':novo}); check('grupo inválido no editar é recusado', r.s===400, r)
r=await req('GET','/api/aventureiros'); check('lista mostra o grupo novo', r.d.perfis.find(p=>p.id===novo)?.grupo==='lunethernnyis', r.d)
// campos de escolha
const def={ nome:'Lâminas da Névoa', dados:'d20', rolagem:'d20',
  campos:[{id:'classe',nome:'Classe',tipo:'escolha',opcoes:[{nome:'Guerreiro',descricao:'Linha de frente.',bonus:[{alvo:'atributo:FOR',valor:1},{alvo:'derivado:defesa',valor:2},{alvo:'atributo:NADA',valor:5}]},{nome:'Sábio'}]}],
  atributos:[{id:'FOR',nome:'Força',min:0,max:5,padrao:1}], derivados:[{id:'defesa',nome:'Defesa',formula:'10 + FOR'}], recursos:[{id:'vida',nome:'Vida',formula:'10'}] }
r=await call(M,'POST','sistemas',{acao:'criar',definicao:{...def,campos:[{nome:'Classe',tipo:'escolha',opcoes:[]}]}}); check('lista de opções vazia é recusada', r.s===400 && r.d.erros?.some(e=>/opção/.test(e)), r)
r=await call(M,'POST','sistemas',{acao:'criar',definicao:def}); check('sistema com classe é criado (bônus sem alvo vira aviso)', r.s===201 && r.d.avisos?.some(a=>/opções/.test(a)), r); const sid=r.d.id
r=await call(M,'GET','sistemas/'+sid); const op=r.d.sistema.campos[0].opcoes
check('opções guardadas com descrição e bônus válidos', op.length===2 && op[0].bonus.length===2 && op[0].descricao==='Linha de frente.', op)
r=await call(M,'POST','fichas',{sistema:sid}); const fid=r.d.ficha.id
r=await call(M,'GET','fichas/'+fid); let d=r.d.ficha.dados
r=await call(M,'PUT','fichas/'+fid,{versao:r.d.ficha.versao,dados:{...d,campos:{...d.campos,classe:'Guerreiro'}}}); check('ficha salva a classe escolhida', r.s===200, r)
r=await call(M,'GET','fichas/'+fid); check('classe guardada na ficha', r.d.ficha.dados.campos.classe==='Guerreiro', r.d.ficha.dados.campos)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
