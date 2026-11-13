// Checagem rápida depois do deploy (só leitura, sem login e sem mexer em dados).
// Uso: node scripts/producao/smoke.mjs https://prg-system.vercel.app 0.33.6
const BASE = (process.argv[2] || 'https://prg-system.vercel.app').replace(/\/$/, ''), VERSAO = process.argv[3] || ''
let falhas = 0
const check = (n, c, e) => { console.log((c ? '✔' : '✘') + ' ' + n + (c ? '' : '  ' + String(e).slice(0, 200))); if (!c) falhas++ }
const r = await fetch(BASE + '/api/prg/saude', { cache: 'no-store' }); const s = await r.json().catch(() => ({}))
check('site no ar e banco respondendo', r.status === 200 && s.ok && s.banco === 'ok', JSON.stringify(s))
if (VERSAO) check('versão publicada ' + VERSAO, s.versao === VERSAO, 'está em ' + s.versao)
for (const p of ['/portal', '/guia', '/novidades', '/mestre/dnd', '/tutorial']) {
  const x = await fetch(BASE + p, { redirect: 'manual' })
  check('página ' + p, x.status === 200, 'HTTP ' + x.status)
}
// Sem perfil, a API recusa (nada de dados abertos).
const a = await fetch(BASE + '/api/prg/campanhas'); check('API sem perfil recusa', a.status === 401 || a.status === 400 || a.status === 403, 'HTTP ' + a.status)
console.log(falhas ? `\n${falhas} falha(s)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
