// v0.13.0: limpeza do login antigo, cópias de segurança, saúde e registro de erros. Ver LEIA-ME.md.
// Precisa do servidor com PRG_ADMIN_SENHA=lua-roxa-teste e CRON_SECRET=cron-teste.
const M='11111111-1111-4111-8111-111111111111'
const BASE=process.env.PRG_BASE || 'http://localhost:3000', SENHA='lua-roxa-teste'; let falhas=0
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,300))); if(!c) falhas++ }
async function admin(body, senha=SENHA){ const r=await fetch(BASE+'/api/prg/admin',{method:'POST',headers:{'content-type':'application/json',origin:BASE},body:JSON.stringify({senha,...body})}); const t=await r.text(); let d={}; try{d=JSON.parse(t)}catch{}; return {s:r.status,d,t,h:r.headers} }

// endereços antigos do login por e-mail vão para o portal
for (const p of ['/', '/login', '/register', '/dashboard', '/campanha/x', '/mesa/abc']) {
  const r=await fetch(BASE+p,{redirect:'manual'}); check(`${p} → portal`, [307,308].includes(r.status) && r.headers.get('location')?.endsWith('/portal'), r.status)
}
let r=await fetch(BASE+'/mesa?campanha=x',{redirect:'manual'}); check('/mesa (nova) continua abrindo', r.status===200, r.status)

// saúde pública
r=await fetch(BASE+'/api/prg/saude'); let d=await r.json(); check('saúde pública: banco ok + versão', r.status===200 && d.banco==='ok' && d.versao==='0.13.0', d)
check('saúde pública não expõe dados', !('erros' in d) && !('copias' in d), d)

// área do administrador
r=await admin({acao:'saude'},'errada'); check('senha errada é recusada', r.s===401, r.d)
r=await admin({acao:'saude'}); check('admin vê a saúde', r.s===200 && r.d.banco===true && Array.isArray(r.d.erros) && r.d.agendada===true, r.d)
r=await admin({acao:'limpar_erros'}); check('admin limpa registro de erros', r.s===200, r.d)

// erros do navegador
r=await fetch(BASE+'/api/prg/erros',{method:'POST',headers:{'content-type':'application/json',origin:'https://malicioso.example'},body:JSON.stringify({mensagem:'x'})}); check('erro de outro site é recusado', r.status===403, r.status)
r=await fetch(BASE+'/api/prg/erros',{method:'POST',headers:{'content-type':'application/json',origin:BASE},body:JSON.stringify({mensagem:'TypeError: teste e2e',pagina:'/ficha?nuvem=11111111-1111-4111-8111-111111111111',detalhe:'at Ficha (ficha.js:1:1)'})}); check('navegador registra erro', r.status===201, r.status)
r=await admin({acao:'saude'}); const e=r.d.erros?.find(x=>x.mensagem==='TypeError: teste e2e')
check('erro aparece para o admin, sem o id na página', e && e.origem==='navegador' && e.local==='/ficha' && r.d.erros24h>=1, r.d.erros)

// erro inesperado no servidor fica registrado (ficha com JSON inválido no banco não é o caso; usamos rota inexistente de ação)
r=await admin({acao:'?'}); check('ação desconhecida = 400 (não vira erro registrado)', r.s===400, r.d)

// cópia agendada (cron)
r=await fetch(BASE+'/api/prg/backup'); check('cron sem segredo é recusado', r.status===401, r.status)
r=await fetch(BASE+'/api/prg/backup',{headers:{authorization:'Bearer errado'}}); check('cron com segredo errado é recusado', r.status===401, r.status)
r=await fetch(BASE+'/api/prg/backup',{headers:{authorization:'Bearer cron-teste'}}); d=await r.json()
check('cron guarda a cópia do dia', r.status===200 && /^prg-backup-\d{4}-\d{2}-\d{2}\.json$/.test(d.nome) && d.tabelas.prg_public_adventurers>=2, d)
const nome=d.nome
r=await admin({acao:'backup_agora'}); check('admin guarda cópia na hora (substitui a do dia)', r.s===200 && r.d.nome===nome, r.d)
r=await admin({acao:'saude'}); check('lista mostra a cópia', r.d.copias?.length===1 && r.d.copias[0].nome===nome, r.d.copias)
r=await admin({acao:'baixar',nome}); let c=JSON.parse(r.t)
check('baixa a cópia guardada (arquivo)', r.s===200 && /attachment; filename="prg-backup-/.test(r.h.get('content-disposition')) && c.tabelas.prg_public_adventurers.some(p=>p.id===M), r.h.get('content-disposition'))
check('cópia tem todas as tabelas', ['prg_campanhas','prg_fichas','prg_mesa_eventos','prg_sistemas_autorais','prg_notificacoes'].every(t=>Array.isArray(c.tabelas[t])) && !('prg_erros' in c.tabelas), Object.keys(c.tabelas))
r=await admin({acao:'baixar'}); c=JSON.parse(r.t); check('baixa uma cópia novinha', r.s===200 && c.versao===1 && c.plataforma==='0.13.0', c.plataforma)
r=await admin({acao:'baixar',nome:'../../etc/passwd'}); check('nome inválido é recusado', r.s===400, r.d)
r=await admin({acao:'baixar',nome:'prg-backup-1999-01-01.json'}); check('cópia inexistente = 404', r.s===404, r.d)
r=await fetch(BASE+'/api/prg/admin',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({senha:SENHA,acao:'baixar'})}); check('download exige vir do próprio site', r.status===403, r.status)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
