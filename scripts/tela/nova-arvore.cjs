// Projeto N.O.V.A (v0.36.3): árvore do autor na ficha (rede de circuitos), liberar com pontos, vivências em d4 e aparência no construtor.
// Uso: NODE_PATH=$(npm root -g) node scripts/tela/nova-arvore.cjs <pasta> (servidor local; migração 034 aplicada e o sistema com árvore — ver o roteiro).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium, devices } = require('playwright')
const B = 'http://localhost:3000', O = process.argv[2] || '.', J = '22222222-2222-4222-8222-222222222222'
const ID = 'autoral-4e0a7c1d2b6f4c8e9a3d5f1e2d3c4b5a', DONO = process.env.DONO
const call = async (q, m, c, body) => { const r = await fetch(B + '/api/prg/' + c, { method: m, headers: { 'content-type': 'application/json', 'x-prg-aventureiro': q, origin: B }, body: body && JSON.stringify(body) }); let d = {}; try { d = await r.json() } catch {} return { s: r.status, d } }
const ok = (c, m) => { if (!c) { console.log('✘ ' + m); process.exitCode = 1 } else console.log('✓ ' + m) }
;(async () => {
  const id = process.env.FICHA
  const b = await chromium.launch(); const erros = []
  const c = await b.newContext(devices['Pixel 7']); await c.addInitScript(i => localStorage.setItem('prg-aventureiro-selecionado-v1', i), J)
  const p = await c.newPage(); p.on('pageerror', e => erros.push(e.message))
  await p.goto(B + '/ficha?nuvem=' + id, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
  await p.locator('nav[aria-label="Seções da ficha"] button').filter({ hasText: /Atributos/ }).first().click(); await p.waitForTimeout(600)
  ok(await p.getByText('d4').count() > 5, 'vivências aparecem em d4')
  await p.locator('nav[aria-label="Seções da ficha"] button').filter({ hasText: /Árvore/ }).first().click(); await p.waitForTimeout(700)
  ok(await p.getByRole('tab', { name: /Árvore de Projeto N.O.V.A/ }).count() === 1, 'a árvore do autor aparece na ficha antiga')
  ok(await p.getByRole('button', { name: /Rede N.O.V.A/ }).count() === 1, 'com o visual de rede de circuitos')
  await p.locator('[data-tema-arvore] ol button').first().click(); await p.waitForTimeout(300)
  await p.getByRole('button', { name: /^Liberar/ }).click(); await p.waitForTimeout(600)
  await p.getByRole('checkbox', { name: 'Mostrar os futuros' }).check().catch(() => {})
  await p.locator('[data-tema-arvore] ol button').nth(1).click(); await p.waitForTimeout(300)
  ok(await semLado(p), 'sem rolagem para o lado')
  await p.getByRole('region', { name: 'Árvore do sistema' }).screenshot({ path: O + '/nova-arvore.png' })
  await p.waitForTimeout(2600)
  const r = await call(J, 'GET', 'fichas/' + id)
  ok(r.d.ficha?.dados?.arvore?.liberados?.length === 1, 'liberar salva na ficha')
  await c.close()
  // Construtor do dono
  const c2 = await b.newContext(devices['Pixel 7']); await c2.addInitScript(i => localStorage.setItem('prg-aventureiro-selecionado-v1', i), DONO)
  const p2 = await c2.newPage(); p2.on('pageerror', e => erros.push(e.message))
  await p2.goto(B + '/sistemas/criar?id=' + ID); await p2.waitForTimeout(2500)
  ok(await p2.getByText('Tudo certo').count() === 1, 'o construtor abre o N.O.V.A sem problemas')
  ok(await p2.getByLabel('Grau inicial das perícias').inputValue() === '4', 'construtor: vivências começam em d4')
  const ap = p2.getByRole('group', { name: /Aparência da ficha/ }); await ap.scrollIntoViewIfNeeded()
  await ap.getByLabel('Desenho da árvore').selectOption('opositores')
  await ap.screenshot({ path: O + '/construtor-aparencia.png' })
  await c2.close()
  ok(!erros.length, 'sem erros ' + erros.join(' | '))
  await b.close()
})()
async function semLado(p) { return p.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1) }
