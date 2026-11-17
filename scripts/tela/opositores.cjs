// Lunethernnyis: Opositores (sistema autoral do Wed) e os atributos em lua minguante (v0.35.8).
// Uso: NODE_PATH=$(npm root -g) node scripts/tela/opositores.cjs <pasta> (servidor local; perfil do Wed 973e945f-… e migração 035 aplicada).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium, devices } = require('playwright')
const B = 'http://localhost:3000', O = process.argv[2] || '.'
const W = '973e945f-f64f-4d94-98fd-31ad2eff4526', J = '22222222-2222-4222-8222-222222222222', ID = 'autoral-7b3c9e215a4d4f6b8c2e1d9f0a6b3e57'
const call = async (q, m, c, body) => { const r = await fetch(B + '/api/prg/' + c, { method: m, headers: { 'content-type': 'application/json', 'x-prg-aventureiro': q, origin: B }, body: body && JSON.stringify(body) }); let d = {}; try { d = await r.json() } catch {} return { s: r.status, d } }
const ok = (c, m) => { if (!c) { console.log('✘ ' + m); process.exitCode = 1 } else console.log('✓ ' + m) }
;(async () => {
  let r = await call(J, 'POST', 'sistemas', { acao: 'salvar', uuid: '7b3c9e21-5a4d-4f6b-8c2e-1d9f0a6b3e57', definicao: { nome: 'X', atributos: [{ nome: 'X' }] } })
  ok(r.s === 403, 'outro perfil não edita')
  r = await call(W, 'GET', 'sistemas/' + ID); ok(r.d.meu === true && r.d.sistema?.visualAtributos === 'lua', 'o Wed é o dono e a lua está ligada')
  r = await call(J, 'POST', 'fichas', { sistema: ID, dados: { nome: 'Tetsuya' } }); const fid = r.d.ficha?.id
  ok(!!fid, 'jogador cria ficha')
  const b = await chromium.launch(); const erros = []
  for (const [disp, opts] of [['celular', devices['Pixel 7']], ['celular-pequeno', { viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true }], ['computador', { viewport: { width: 1280, height: 900 } }]]) {
    const c = await b.newContext(opts); await c.addInitScript(i => localStorage.setItem('prg-aventureiro-selecionado-v1', i), J)
    const p = await c.newPage(); p.on('pageerror', e => erros.push(e.message))
    await p.goto(B + '/ficha?nuvem=' + fid, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
    await p.locator('nav[aria-label="Seções da ficha"] button').nth(1).click(); await p.waitForTimeout(800)
    const lua = p.getByRole('group', { name: 'Atributos na lua minguante' })
    ok(await lua.getByRole('spinbutton').count() === 7, disp + ': sete atributos na lua')
    if (disp === 'celular') { await lua.getByRole('spinbutton', { name: 'Potência' }).fill('3'); await p.waitForTimeout(300); await lua.getByRole('button', { name: 'Rolar Potência' }).click(); await p.waitForTimeout(1600); await p.keyboard.press('Escape'); await p.waitForTimeout(600) }
    await lua.scrollIntoViewIfNeeded(); await lua.screenshot({ path: `${O}/lua-${disp}.png` })
    ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 1, disp + ': sem rolagem para o lado')
    await c.close()
  }
  await new Promise(x => setTimeout(x, 2500))
  r = await call(J, 'GET', 'fichas/' + fid); ok(r.d.ficha?.dados?.atributos?.POT === 3, 'mudar o atributo na lua salva')
  const c = await b.newContext(devices['Pixel 7']); await c.addInitScript(i => localStorage.setItem('prg-aventureiro-selecionado-v1', i), W)
  const p = await c.newPage(); p.on('pageerror', e => erros.push(e.message))
  await p.goto(B + '/sistemas/criar?id=' + ID); await p.waitForTimeout(2500)
  ok(await p.getByText('Tudo certo').count() === 1, 'o construtor abre o sistema do Wed sem problemas')
  await p.getByRole('button', { name: /Atributos/ }).first().click(); await p.waitForTimeout(400)
  await p.screenshot({ path: O + '/construtor.png' })
  ok(!erros.length, 'sem erros ' + erros.join(' | '))
  await b.close()
})()
