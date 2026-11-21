// Marcas (sistema autoral do JOJO) e as partes extras da ficha (v0.36.0).
// Uso: NODE_PATH=$(npm root -g) node scripts/tela/marcas.cjs <pasta> (servidor local; perfil JOJO dc89533a-… e migração 036 aplicada).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium, devices } = require('playwright')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs')
const B = 'http://localhost:3000', O = process.argv[2] || '.'
const JOJO = 'dc89533a-e8ed-47bc-a841-32ac2da6b0c1', J = '22222222-2222-4222-8222-222222222222', ID = 'autoral-5d1e8a3c7f2b4c6d9e0a3b8f1c2d4e6a'
const call = async (q, m, c, body) => { const r = await fetch(B + '/api/prg/' + c, { method: m, headers: { 'content-type': 'application/json', 'x-prg-aventureiro': q, origin: B }, body: body && JSON.stringify(body) }); let d = {}; try { d = await r.json() } catch {} return { s: r.status, d } }
const ok = (c, m) => { if (!c) { console.log('✘ ' + m); process.exitCode = 1 } else console.log('✓ ' + m) }
const preset = n => JSON.parse(fs.readFileSync('presets/fichas/marcas/' + n + '.json', 'utf8')).dados
;(async () => {
  let r = await call(J, 'POST', 'sistemas', { acao: 'salvar', uuid: '5d1e8a3c-7f2b-4c6d-9e0a-3b8f1c2d4e6a', definicao: { nome: 'X', atributos: [{ nome: 'X' }] } })
  ok(r.s === 403, 'outro perfil não edita o sistema do JOJO')
  r = await call(JOJO, 'GET', 'sistemas/' + ID); ok(r.d.meu === true && r.d.sistema?.extras?.length === 4, 'o JOJO é o dono e as quatro partes extras estão ligadas')
  const ids = {}
  for (const n of ['hawkins', 'lucy', 'tiamat', 'karloy-o-esquecido']) { r = await call(J, 'POST', 'fichas', { sistema: ID, dados: preset(n) }); ids[n] = r.d.ficha?.id; ok(!!ids[n], 'cria a ficha pronta ' + n) }
  r = await call(J, 'GET', 'fichas/' + ids.hawkins); ok(r.d.ficha?.dados?.marcasPoder?.[0]?.habilidades?.length === 10 && r.d.ficha?.dados?.formas?.length === 2, 'o servidor guarda marcas e formas')
  const b = await chromium.launch(); const erros = []
  const abrir = async (opts, fid) => {
    const c = await b.newContext(opts); await c.addInitScript(i => localStorage.setItem('prg-aventureiro-selecionado-v1', i), J)
    const p = await c.newPage(); p.on('pageerror', e => erros.push(e.message))
    await p.goto(B + '/ficha?nuvem=' + fid, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500); return { c, p }
  }
  const aba = async (p, nome) => { await p.locator('nav[aria-label="Seções da ficha"] button[aria-label="' + nome + '"]').click(); await p.waitForTimeout(700) }
  const semLado = async (p, m) => ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 1, m + ': sem rolagem para o lado')
  // Hawkins: marcas, usar, transformar, em jogo agora
  {
    const { c, p } = await abrir(devices['Pixel 7'], ids.hawkins)
    await aba(p, 'Marcas'); await p.screenshot({ path: O + '/hawkins-marcas.png', fullPage: true }); await semLado(p, 'Hawkins/Marcas')
    ok(await p.locator('li.ficha-poder').count() === 10, 'Hawkins: 10 níveis da Marca do Lobo')
    await p.getByRole('button', { name: 'Usar (−3)' }).click(); await p.waitForTimeout(400)
    ok(await p.getByRole('spinbutton', { name: /Essência \(PE\)/ }).inputValue() === '41', 'Usar a onda sônica tira 3 de essência')
    await aba(p, 'Transformações'); await p.getByRole('button', { name: 'Transformar (−7)' }).click(); await p.waitForTimeout(500)
    await p.screenshot({ path: O + '/hawkins-formas.png', fullPage: true }); await semLado(p, 'Hawkins/Transformações')
    await aba(p, 'Principal'); ok(await p.getByText('Transformado em').count() === 1, 'o Principal mostra a forma ativa')
    const resumo = p.getByRole('region', { name: 'Em jogo agora' }); await resumo.scrollIntoViewIfNeeded(); await resumo.screenshot({ path: O + '/hawkins-em-jogo.png' })
    await p.waitForTimeout(2500); await c.close()
    r = await call(J, 'GET', 'fichas/' + ids.hawkins)
    ok(r.d.ficha?.dados?.recursos?.pe?.atual === 34 && r.d.ficha?.dados?.marcas?.forma_ativa === 'hwformlb' && r.d.ficha?.dados?.marcas?.u_hwlobo04 === 1, 'salva: essência 44 − 3 − 7 = 34, forma ativa e 1 uso')
  }
  // Lucy: três marcas e a Rainha Demônio, em três telas
  for (const [disp, opts] of [['celular', devices['Pixel 7']], ['celular-pequeno', { viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true }], ['computador', { viewport: { width: 1280, height: 900 } }]]) {
    const { c, p } = await abrir(opts, ids.lucy)
    await aba(p, 'Marcas'); if (disp !== 'celular-pequeno') await p.screenshot({ path: `${O}/lucy-marcas-${disp}.png`, fullPage: true }); await semLado(p, 'Lucy/Marcas ' + disp)
    await aba(p, 'Transformações'); if (disp === 'celular') await p.screenshot({ path: O + '/lucy-formas.png', fullPage: true }); await semLado(p, 'Lucy/Transformações ' + disp)
    await aba(p, 'Efeitos'); await p.getByRole('button', { name: 'Efeito', exact: true }).click(); await p.getByRole('textbox', { name: 'Efeito' }).last().fill('Molhado'); await p.getByRole('spinbutton', { name: 'Turnos que faltam' }).last().fill('3')
    await semLado(p, 'Lucy/Efeitos ' + disp)
    if (disp === 'celular') await p.screenshot({ path: O + '/lucy-efeitos.png', fullPage: true })
    await p.waitForTimeout(2500); await c.close()
  }
  // Tiamat: invocar o urso
  {
    const { c, p } = await abrir(devices['Pixel 7'], ids.tiamat)
    await aba(p, 'Invocações'); await p.getByRole('button', { name: 'Invocar (−7)' }).first().click(); await p.waitForTimeout(500)
    await p.screenshot({ path: O + '/tiamat-invocacoes.png', fullPage: true }); await semLado(p, 'Tiamat/Invocações')
    await aba(p, 'Marcas'); await p.screenshot({ path: O + '/tiamat-marcas.png', fullPage: true })
    await aba(p, 'Principal'); await p.screenshot({ path: O + '/tiamat-principal.png', fullPage: true })
    await p.waitForTimeout(2500); await c.close()
    r = await call(J, 'GET', 'fichas/' + ids.tiamat); ok(r.d.ficha?.dados?.recursos?.pe?.atual === 14 && r.d.ficha?.dados?.marcas?.ia_tminvurs === true, 'invocar o urso tira 7 de essência e fica em campo')
  }
  // Karloy: poderes de sempre
  {
    const { c, p } = await abrir(devices['Pixel 7'], ids['karloy-o-esquecido'])
    await aba(p, 'Outros poderes'); ok(await p.getByText('Morte Profunda').count() >= 1, 'Karloy: poderes continuam em Outros poderes')
    await p.screenshot({ path: O + '/karloy-poderes.png', fullPage: true }); await c.close()
  }
  // Construtor do JOJO
  {
    const c = await b.newContext(devices['Pixel 7']); await c.addInitScript(i => localStorage.setItem('prg-aventureiro-selecionado-v1', i), JOJO)
    const p = await c.newPage(); p.on('pageerror', e => erros.push(e.message))
    await p.goto(B + '/sistemas/criar?id=' + ID); await p.waitForTimeout(2500)
    ok(await p.getByText('Tudo certo').count() === 1, 'o construtor abre o sistema do JOJO sem problemas')
    const extras = p.getByRole('group', { name: /Partes extras/ })
    await extras.scrollIntoViewIfNeeded(); ok(await extras.getByRole('checkbox', { checked: true }).count() === 4, 'as quatro partes extras aparecem ligadas no construtor')
    await extras.screenshot({ path: O + '/construtor-extras.png' }); await c.close()
  }
  ok(!erros.length, 'sem erros ' + erros.join(' | '))
  await b.close()
})()
