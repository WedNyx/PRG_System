// v0.16.0: rolagem personalizada nos sistemas autorais + dados novos no servidor. Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,300))); if(!c) falhas++ }
const def = { nome: 'Pool das Sombras', atributos: [{ id: 'COR', nome: 'Corpo', min: 0, max: 8, padrao: 3 }], recursos: [{ id: 'vida', nome: 'Vida', maxFixo: 10 }] }
let r=await call(M,'POST','sistemas',{acao:'criar',definicao:{...def,rolagem:'personalizada',regraRolagem:{nome:'Sucessos',formula:'VALORd6s9'}}}); check('fórmula impossível é recusada', r.s===400 && r.d.erros?.join().includes('Rolagem personalizada'), r)
r=await call(M,'POST','sistemas',{acao:'criar',definicao:{...def,rolagem:'personalizada',regraRolagem:{nome:'Sucessos',formula:'VALOR d6 s5'}}}); check('cria sistema com rolagem personalizada', r.s===201, r); const sid=r.d.id
r=await call(M,'GET','sistemas/'+sid); check('regra salva (sem espaços)', r.d.sistema.rolagem==='personalizada' && r.d.sistema.regraRolagem.formula==='VALORd6s5', r.d.sistema)
// servidor rola os dados novos no chat da mesa
r=await call(M,'POST','campanhas',{nome:'Sombras',sistema:sid,modeloPadrao:'C'}); const cid=r.d.campanha.id
await call(M,'POST','mesa/'+cid,{acao:'sessao',aberta:true})
for (const [expr, ok] of [['6d6s5', e => e.total === e.resultados.filter(v=>v>=5).length], ['4dF+1', e => e.resultados.every(v=>v>=-1&&v<=1)], ['5d10!kh2', e => e.total>=2], ['2d6r1', e => e.total>=2]]) {
  r=await call(M,'POST','mesa/'+cid,{acao:'evento',tipo:'rolagem',expressao:expr,texto:'Corpo (Sucessos)'}); check(`servidor rola ${expr}`, r.s===201 && ok(r.d.evento), r.d)
}
r=await call(M,'POST','mesa/'+cid,{acao:'evento',tipo:'rolagem',expressao:'2d6s9'}); check('expressão impossível recusada', r.s===400, r)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
