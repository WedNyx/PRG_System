// v0.37.2: a prévia grande de cada moldura em Perfil › Aparência, com os efeitos vivos (fogo, neve, vagalumes…).
// Uso: KEY=<service key> NODE_PATH=$(npm root -g) node scripts/tela/molduras-vivas.cjs <pasta>  (servidor local em :3000, banco de teste).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium, devices } = require('playwright')
const B = 'http://localhost:3000', J = '22222222-2222-4222-8222-222222222222', O = process.argv[2] || '.'
const REST = process.env.PRG_REST || 'http://localhost:3001/rest/v1', H = { 'content-type': 'application/json', apikey: process.env.KEY, Authorization: 'Bearer ' + process.env.KEY }
const call = async (m, c, body, raiz = '/api/prg/') => { const r = await fetch(B + raiz + c, { method: m, headers: { 'content-type': 'application/json', 'x-prg-aventureiro': J, origin: B }, body: body && JSON.stringify(body) }); let d = {}; try { d = await r.json() } catch {} return { s: r.status, d } }
const ok = (c, m) => { if (!c) { console.log('✘ ' + m); process.exitCode = 1 } else console.log('✓ ' + m) }
const IDS = ['lua', 'estrelas', 'chamas', 'gelo', 'folhas', 'pirata', 'neon', 'runas', 'ouro', 'mestre', 'criador']
;(async () => {
  await fetch(`${REST}/prg_public_adventurers?id=eq.${J}`, { method: 'PATCH', headers: H, body: JSON.stringify({ minutos_mestrados: 30 }) })
  await call('POST', 'sistemas', { acao: 'criar', definicao: { nome: 'Mundo de Teste', resumo: 'Teste', dados: 'd20', rolagem: 'd20', campos: [], atributos: [{ id: 'COR', nome: 'Corpo', min: 0, max: 5, padrao: 2 }], derivados: [], pericias: { modo: 'treino', total: 'MOD + TREINO', treinos: [{ id: 'nada', nome: 'Nada', formula: '0' }], lista: [] }, recursos: [], listas: [] } })
  const b = await chromium.launch(); const erros = []
  const c = await b.newContext(devices['Pixel 7']); await c.addInitScript(i => { try { localStorage.setItem('prg-aventureiro-selecionado-v1', i) } catch {} }, J)
  const p = await c.newPage(); p.on('pageerror', e => erros.push(e.message))
  for (const id of IDS) {
    const r = await call('PATCH', J, { visual: { moldura: id } }, '/api/aventureiros/'); ok(r.s === 200, `salva a moldura ${id}`)
    await p.goto(B + '/central?secao=perfil&aba=aparencia', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2600)
    const pv = p.locator('[data-previa-moldura]'); await pv.scrollIntoViewIfNeeded(); await p.waitForTimeout(1200)
    if (['chamas', 'gelo', 'lua', 'estrelas', 'folhas', 'pirata', 'neon', 'runas', 'ouro', 'mestre', 'criador'].includes(id)) ok(await pv.locator('canvas').count() > 0, `${id}: efeitos vivos na prévia grande`)
    await pv.screenshot({ path: `${O}/viva-${id}.png` })
  }
  ok(await p.locator('header [data-moldura] canvas').count() === 0, 'no avatar pequeno do topo não liga canvas')
  await p.emulateMedia({ reducedMotion: 'reduce' }); await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2600)
  ok(await p.locator('[data-previa-moldura] canvas').count() === 0, 'com menos movimento, sem efeitos')
  ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1), 'sem rolagem para o lado')
  ok(!erros.length, 'sem erros ' + erros.join(' | '))
  await call('PATCH', J, { visual: null }, '/api/aventureiros/')
  await b.close()
})()
