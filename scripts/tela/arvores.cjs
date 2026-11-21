// Árvore de cada sistema (v0.36.2): Yggdrasil por sistema no celular, anotar a escolha de um marco e salvar.
// Uso: NODE_PATH=$(npm root -g) node scripts/tela/arvores.cjs <pasta> (servidor local; migrações 035 e 036 aplicadas para Opositores e Marcas).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium, devices } = require('playwright')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs')
const B = 'http://localhost:3000', O = process.argv[2] || '.', J = '22222222-2222-4222-8222-222222222222'
const call = async (q, m, c, body) => { const r = await fetch(B + '/api/prg/' + c, { method: m, headers: { 'content-type': 'application/json', 'x-prg-aventureiro': q, origin: B }, body: body && JSON.stringify(body) }); let d = {}; try { d = await r.json() } catch {} return { s: r.status, d } }
const ok = (c, m) => { if (!c) { console.log('✘ ' + m); process.exitCode = 1 } else console.log('✓ ' + m) }
const CASOS = [
  ['ordem', 'ordem-paranormal', { campos: { nex: '35%', classe: 'Combatente', trilha: 'Aniquilador', origem: 'Militar' } }, true],
  ['pf2e', 'pf2e', { campos: { nivel: 5, classe: 'Guerreiro', ancestralidade: 'Anão', antecedente: 'Guarda' } }, true],
  ['t20', 'tormenta20', { campos: { nivel: 4, classe: 'Arcanista', raca: 'Elfo', origem: 'Acólito', divindade: 'Wynna' } }, true],
  ['faroeste', 'faroeste-arcano', { campos: { nivel_pistoleiro: 3, nivel_rastreador: 1 } }, true],
  ['fate', 'fate-core', {}, false],
  ['blades', 'blades', { campos: { cartilha: 'Lâmina' } }, false],
  ['coc', 'call-of-cthulhu', {}, false],
  ['morkborg', 'mork-borg', {}, false],
  ['opositores', 'autoral-7b3c9e215a4d4f6b8c2e1d9f0a6b3e57', { campos: { nivel: 4 } }, true],
  ['marcas', 'autoral-5d1e8a3c7f2b4c6d9e0a3b8f1c2d4e6a', JSON.parse(fs.readFileSync('presets/fichas/marcas/hawkins.json', 'utf8')).dados, true],
  ['livre', 'livre', {}, false],
]
;(async () => {
  const b = await chromium.launch(); const erros = []
  for (const [nome, sistema, dados, comMedida] of CASOS) {
    const r = await call(J, 'POST', 'fichas', { sistema, dados: { nome: 'Árvore ' + nome, ...dados } }); const id = r.d.ficha?.id
    ok(!!id, nome + ': ficha criada')
    const c = await b.newContext(devices['Pixel 7']); await c.addInitScript(i => localStorage.setItem('prg-aventureiro-selecionado-v1', i), J)
    const p = await c.newPage(); p.on('pageerror', e => erros.push(nome + ': ' + e.message))
    await p.goto(B + '/ficha?nuvem=' + id, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
    await p.locator('nav[aria-label="Seções da ficha"] button').filter({ hasText: /Árvore/ }).first().click(); await p.waitForTimeout(700)
    const arv = p.getByRole('region', { name: 'Árvore do sistema' })
    if (nome === 'livre') { ok(await p.getByRole('tab', { name: /Habilidades adicionais do mestre/ }).count() === 1, 'livre: só o ramo do mestre'); await c.close(); continue }
    ok(await arv.count() === 1, nome + ': árvore do sistema aparece')
    if (await p.getByRole('checkbox', { name: 'Mostrar os futuros' }).count()) await p.getByRole('checkbox', { name: 'Mostrar os futuros' }).check()
    void comMedida
    const no = p.locator('[data-tema-arvore] ol button').last()
    ok(await no.count() === 1, nome + ': Yggdrasil com marcos')
    await no.click(); await p.waitForTimeout(300)
    const campo = p.getByRole('textbox', { name: 'O que você escolheu aqui' })
    if (await campo.count()) { await campo.fill('Escolha de teste'); await p.waitForTimeout(2600)
      const g = await call(J, 'GET', 'fichas/' + id); ok(Object.entries(g.d.ficha?.dados?.marcas ?? {}).some(([k, v]) => k.startsWith('arv_') && v === 'Escolha de teste'), nome + ': a escolha anotada salva') }
    ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1), nome + ': sem rolagem para o lado')
    await arv.screenshot({ path: `${O}/arvore-${nome}.png` })
    await p.getByRole('button', { name: '☷ Lista' }).click(); await p.waitForTimeout(300)
    ok(await p.locator('ol[aria-label^="Lista de"] li').count() > 0, nome + ': modo lista')
    await c.close()
  }
  ok(!erros.length, 'sem erros ' + erros.join(' | '))
  await b.close()
})()
