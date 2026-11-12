// v0.33.6: livros e fontes da campanha de D&D — mestre libera o Livro do Jogador; opções do livro só com ele liberado.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'Mesa dos livros',sistema:'dnd5e-srd',modeloPadrao:'A'}); const cid=r.d.campanha.id
check('campanha nova: só o SRD', !r.d.campanha.config_progressao?.fontes?.length, r.d.campanha.config_progressao)
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); await call(J,'POST','convites/'+r.d.convite.codigo,{})
r=await call(M,'GET','campanhas/'+cid); for (const s of r.d.solicitacoes) await call(M,'POST',`campanhas/${cid}/solicitacoes/${s.id}`,{decisao:'aceitar'})
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'dnd5e-srd',nome:'Kael'}); const f=r.d.ficha.id
const salvar=async(quem, mudar)=>{ const g=await call(quem,'GET','fichas/'+f); return call(quem,'PUT','fichas/'+f,{versao:g.d.ficha.versao,dados:mudar(g.d.ficha.dados)}) }
r=await salvar(M,d=>({...d,campos:{...d.campos,classe:'Guerreiro',nivel:3}})); check('mestre faz Guerreiro 3', r.s===200, r)
r=await salvar(J,d=>({...d,dndEscolhas:{'guerreiro-subclasse':'mestre-batalha'}})); check('sem o livro, o jogador não escolhe Mestre de Batalha', r.s===400 && /não foi liberada/.test(r.d.erro), r)
r=await salvar(J,d=>({...d,campos:{...d.campos,antecedente:'Nobre'}})); check('sem o livro, antecedente Nobre é recusado', r.s===400 && /Nobre/.test(r.d.erro), r)
r=await salvar(J,d=>({...d,dndEscolhas:{'guerreiro-subclasse':'campeao'}})); check('subclasse do SRD continua livre', r.s===200, r)
r=await call(J,'PATCH','campanhas/'+cid,{configProgressao:{modo:'hibrido',fontes:['phb2024']}}); check('jogador não libera livro', r.s===403, r)
r=await call(M,'PATCH','campanhas/'+cid,{configProgressao:{modo:'hibrido',fontes:['phb2024','dmg2024'],fontesExtras:['Aventura caseira']}}); check('mestre libera Livro do Jogador e Guia do Mestre', r.s===200 && r.d.campanha.config_progressao.fontes.includes('phb2024'), r)
r=await call(M,'PATCH','campanhas/'+cid,{excecaoFicha:{fichaId:f,modo:'manual'}}); check('exceção de ficha não apaga as fontes', r.d.campanha?.config_progressao?.fontes?.length===2 && r.d.campanha.config_progressao.fontesExtras?.[0]==='Aventura caseira', r.d.campanha?.config_progressao)
r=await call(M,'PATCH','campanhas/'+cid,{nome:'Mesa dos livros 2'}); r=await call(M,'GET','campanhas/'+cid); check('editar só o nome mantém as fontes', r.d.campanha.config_progressao?.fontes?.length===2, r.d.campanha.config_progressao)
r=await call(M,'PATCH','campanhas/'+cid,{excecaoFicha:{fichaId:f,modo:null}})
r=await salvar(J,d=>({...d,dndEscolhas:{'guerreiro-subclasse':'mestre-batalha'},campos:{...d.campos,antecedente:'Nobre'}})); check('com o livro liberado, Mestre de Batalha e Nobre entram', r.s===200, r)
r=await call(J,'GET','fichas/'+f); check('ficha recebe as fontes da campanha', r.d.configProgressao?.fontes?.includes('phb2024'), r.d.configProgressao)
// ficha avulsa: tudo liberado
r=await call(J,'POST','fichas',{sistema:'dnd5e-srd',dados:{nome:'Avulsa',campos:{classe:'Mago',nivel:3}}}); const fa=r.d.ficha?.id
let g=await call(J,'GET','fichas/'+fa); r=await call(J,'PUT','fichas/'+fa,{versao:g.d.ficha.versao,dados:{...g.d.ficha.dados,campos:{...g.d.ficha.dados.campos,classe:'Mago',nivel:3},dndEscolhas:{'mago-subclasse':'ilusionista'}}})
check('ficha avulsa usa o livro sem pedir', r.s===200, r)
console.log(falhas?`\n${falhas} falha(s)`:'\nTudo certo!'); process.exit(falhas?1:0)
