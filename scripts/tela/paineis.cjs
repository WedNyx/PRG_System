// Ficha de cada sistema com a faixa e a parte própria do jogo (v0.35.9), no celular. Marca algo em cada painel e confere se salvou.
// Uso: NODE_PATH=$(npm root -g) node scripts/tela/paineis.cjs <pasta> (servidor local em :3000, banco de teste).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium, devices } = require('playwright')
const B = 'http://localhost:3000', J = '22222222-2222-4222-8222-222222222222', O = process.argv[2] || '.'
const call = async (q, m, c, body) => { const r = await fetch(B + '/api/prg/' + c, { method: m, headers: { 'content-type': 'application/json', 'x-prg-aventureiro': q, origin: B }, body: body && JSON.stringify(body) }); let d = {}; try { d = await r.json() } catch {} return { s: r.status, d } }
const ok = (c, m) => { if (!c) { console.log('✘ ' + m); process.exitCode = 1 } else console.log('✓ ' + m) }
// [nome, sistema, rótulo de um botão para marcar (ou null), o que conferir nos dados salvos]
const SIS = [
  ['dnd', 'dnd5e-srd', 'Falhas contra a morte: 2', d => d.marcas?.ms_f === 2],
  ['pf2e', 'pf2e', 'Ação 2', d => d.marcas?.acoes === 2],
  ['fate', 'fate-core', 'Estresse físico: caixa 2', d => d.marcas?.estresse_fisico_2 === 1],
  ['blades', 'blades', 'Estresse: 4', d => d.recursos?.estresse?.atual === 4],
  ['brp', 'brp', null, null], ['coc', 'call-of-cthulhu', null, null],
  ['faroeste', 'faroeste-arcano', null, null],
  ['ordem', 'ordem-paranormal', null, null], ['t20', 'tormenta20', null, null],
  ['morkborg', 'mork-borg', 'Presságios: 2', d => d.recursos?.pressagios?.atual === 2],
  ['assimilacao', 'assimilacao', 'Mais Determinação', d => (d.recursos?.determinacao?.atual ?? 0) >= 1],
]
;(async () => {
  const b = await chromium.launch(); const erros = []
  const c = await b.newContext(devices['Pixel 7']); await c.addInitScript(i => { try { localStorage.setItem('prg-aventureiro-selecionado-v1', i) } catch {} }, J)
  for (const [nome, sistema, botao, conferir] of SIS) {
    const r = await call(J, 'POST', 'fichas', { sistema, dados: { nome: 'Teste ' + nome } }); const id = r.d.ficha?.id
    const p = await c.newPage(); p.on('pageerror', e => erros.push(nome + ': ' + e.message))
    await p.goto(B + '/ficha?nuvem=' + id, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2200)
    if (botao) { const bt = p.getByRole('button', { name: botao }).first(); await bt.scrollIntoViewIfNeeded(); await bt.click(); await p.waitForTimeout(2600) }
    if (nome === 'coc' || nome === 'brp') { await p.locator('nav[aria-label="Seções da ficha"] button').nth(1).click(); await p.waitForTimeout(600); await p.getByRole('checkbox').first().check(); await p.waitForTimeout(2600) }
    await p.screenshot({ path: `${O}/${nome}.png`, fullPage: true })
    const painel = p.locator('[data-painel-sistema]'); if (await painel.count() && await painel.first().isVisible()) { await painel.first().scrollIntoViewIfNeeded(); await painel.first().screenshot({ path: `${O}/${nome}-painel.png` }) }
    if (conferir) { const g = await call(J, 'GET', 'fichas/' + id); ok(conferir(g.d.ficha?.dados ?? {}), nome + ': a marcação salvou') }
    if (nome === 'coc') { const g = await call(J, 'GET', 'fichas/' + id); ok(Object.keys(g.d.ficha?.dados?.marcas ?? {}).some(k => k.startsWith('exp_')), 'coc: marca de experiência salvou') }
    ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 1, nome + ': sem rolagem para o lado')
    await p.close()
  }
  ok(!erros.length, 'sem erros na página ' + erros.join(' | '))
  await b.close()
})()
