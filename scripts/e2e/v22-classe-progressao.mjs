// v0.22.0: a classe escolhida (campo “Lista de opções”) define a tabela de níveis. Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,300))); if(!c) falhas++ }
const soma=(g)=>{let s=0;return g.map(x=>s+=x)}, tab=v=>({vida:soma(Array(20).fill(v))})
const def={ nome:'Multiclasse', dados:'d20', rolagem:'d20',
  campos:[{id:'nivel',nome:'Nível',tipo:'numero',padrao:1},{id:'nivel2',nome:'Nível 2',tipo:'numero',padrao:0},
    {id:'classe',nome:'Classe',tipo:'escolha',opcoes:[{nome:'Guerreiro',progressao:'guerreiro'},{nome:'Mago',progressao:'mago'},{nome:'Fantasma',progressao:'sumiu'}]},
    {id:'classe2',nome:'Segunda classe',tipo:'escolha',nivel:'nivel2',opcoes:[{nome:'Mago',progressao:'mago'}]},
    {id:'origem',nome:'Origem',tipo:'escolha',nivel:'nivel2',opcoes:[{nome:'Nobre'}]}],
  atributos:[{id:'FOR',nome:'Força',min:0,max:5,padrao:1}], derivados:[{id:'vida_max',nome:'Vida máxima',formula:'5 + prog_vida'}], recursos:[{id:'vida',nome:'Vida',formula:'vida_max'}],
  progressoes:{classes:[{id:'guerreiro',nome:'Guerreiro',campoNivel:'nivel',tabela:tab(10)},{id:'mago',nome:'Mago',campoNivel:'nivel',tabela:tab(4)}]} }
let r=await call(M,'POST','sistemas',{acao:'criar',definicao:def}); check('sistema com classes ligadas às tabelas é criado', r.s===201, r); const sid=r.d.id
check('ligação para tabela inexistente vira aviso', (r.d.avisos??[]).some(a=>/tabela de níveis/.test(a)), r.d)
r=await call(M,'GET','sistemas/'+sid); const cs=r.d.sistema.campos
check('opções guardam a tabela', cs[2].opcoes[0].progressao==='guerreiro' && cs[2].opcoes[1].progressao==='mago' && !cs[2].opcoes[2].progressao, cs[2])
check('segunda classe guarda o campo do nível', cs[3].nivel==='nivel2', cs[3])
check('lista sem tabela não guarda campo de nível', cs[4].nivel===undefined, cs[4])
r=await call(M,'POST','fichas',{sistema:sid}); const fid=r.d.ficha.id
r=await call(M,'GET','fichas/'+fid); const d=r.d.ficha.dados
r=await call(M,'PUT','fichas/'+fid,{versao:r.d.ficha.versao,dados:{...d,campos:{...d.campos,classe:'Guerreiro',nivel:3,classe2:'Mago',nivel2:2}}}); check('ficha salva as duas classes e níveis', r.s===200, r)
r=await call(M,'GET','fichas/'+fid); const c=r.d.ficha.dados.campos; check('classes e níveis guardados', c.classe==='Guerreiro' && c.nivel===3 && c.classe2==='Mago' && c.nivel2===2, c)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
