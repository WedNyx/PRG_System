// v0.37.3: os três bugs do Leste — zoom do fundo (barra de rolagem), botões do canto fixos, visual do perfil com senha só depois da senha.
// Uso: KEY=<service key> NODE_PATH=$(npm root -g) node scripts/tela/bugs-leste.cjs <pasta>  (servidor local em :3000, banco de teste).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium } = require('playwright')
const B = 'http://localhost:3000', M = '11111111-1111-4111-8111-111111111111', J = '22222222-2222-4222-8222-222222222222', O = process.argv[2] || '.'
const call = async (q, m, c, body, raiz = '/api/prg/') => { const r = await fetch(B + raiz + c, { method: m, headers: { 'content-type': 'application/json', 'x-prg-aventureiro': q, origin: B }, body: body && JSON.stringify(body) }); let d = {}; try { d = await r.json() } catch {} return { s: r.status, d } }
const ok = (c, m) => { if (!c) { console.log('✘ ' + m); process.exitCode = 1 } else console.log('✓ ' + m) }
;(async () => {
  // M com senha e com tema próprio; J sem senha.
  await call(M, 'PATCH', M, { visual: { tema: 'mar', tamanho: 'g' } }, '/api/aventureiros/')
  const sen = await call(M, 'POST', 'perfil/' + M, { acao: 'definir', nova: 'lua-secreta-123' })
  const b = await chromium.launch(); const erros = []
  const c = await b.newContext({ viewport: { width: 1280, height: 720 } }); const p = await c.newPage(); p.on('pageerror', e => erros.push(e.message))
  await p.goto(B + '/portal', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
  ok(await p.evaluate(() => getComputedStyle(document.documentElement).scrollbarGutter) === 'stable', 'espaço da barra de rolagem reservado (sem zoom no fundo)')
  const antes = await p.evaluate(() => ({ tema: document.documentElement.dataset.tema ?? '', tam: document.documentElement.dataset.tamanho ?? '' }))
  const lun = p.getByRole('button', { name: /Lunethernnyis/ }).first(); if (await lun.count()) { await lun.click(); await p.waitForTimeout(1000) }
  if (sen.s < 300) {
    await p.getByText('Mestra Lua', { exact: true }).click(); await p.waitForTimeout(1500)
    const depois = await p.evaluate(() => ({ tema: document.documentElement.dataset.tema ?? '', tam: document.documentElement.dataset.tamanho ?? '', sel: localStorage.getItem('prg-aventureiro-selecionado-v1') }))
    ok(depois.tema === antes.tema && depois.tam === antes.tam, 'perfil com senha: o visual dele não vale antes da senha')
    ok(depois.sel !== M, 'perfil com senha: nem fica escolhido antes da senha')
    await p.screenshot({ path: O + '/bug3-senha.png' })
  } else console.log('(sem senha no banco de teste: pulei o bug 3)', sen.s)
  // Bug 2: página comprida, rolada até o fim — o canto continua no canto da tela
  await c.addInitScript(i => { try { localStorage.setItem('prg-aventureiro-selecionado-v1', i) } catch {} }, J)
  const p2 = await c.newPage(); p2.on('pageerror', e => erros.push(e.message))
  await p2.goto(B + '/central?secao=perfil&aba=aparencia', { waitUntil: 'domcontentloaded' }); await p2.waitForTimeout(3000)
  await p2.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p2.waitForTimeout(600)
  const caixa = await p2.locator('[data-canto-plataforma]').boundingBox(), alto = await p2.evaluate(() => innerHeight), rola = await p2.evaluate(() => scrollY)
  ok(rola > 200 && caixa && caixa.y + caixa.height <= alto && caixa.y + caixa.height > alto - 90, 'botões do canto presos no canto, com a página rolada')
  await p2.screenshot({ path: O + '/bug2-canto.png' })
  ok(!erros.length, 'sem erros ' + erros.join(' | '))
  await b.close()
})()
