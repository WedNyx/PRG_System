// Homologação das fichas de todos os sistemas (v0.34.7): cada sistema (e o D&D 2014) em celular pequeno, celular e computador,
// abrindo TODAS as seções da ficha. Confere rolagem para o lado, erros na tela, falhas 5xx e acessibilidade (axe-core).
// Uso: NODE_PATH=$(npm root -g) node scripts/tela/sistemas.cjs <pasta-das-fotos>  (servidor local em :3000, banco de teste). Ver scripts/e2e/LEIA-ME.md.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium, devices } = require('playwright')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path'), fs = require('fs')
const B = 'http://localhost:3000', J = '22222222-2222-4222-8222-222222222222'
const O = process.argv[2] || '.'
const AXE = fs.readFileSync(path.join(__dirname, '../../node_modules/axe-core/axe.min.js'), 'utf8')
const call = async (q, metodo, c, body) => { const r = await fetch(B + '/api/prg/' + c, { method: metodo, headers: { 'content-type': 'application/json', 'x-prg-aventureiro': q, origin: B }, body: body && JSON.stringify(body) }); let d = {}; try { d = await r.json() } catch {} return { s: r.status, d } }
const SISTEMAS = [
  ['dnd2024', 'dnd5e-srd', { nome: 'Lyra 2024', campos: { classe: 'Mago', nivel: 5, especie: 'Elfo', antecedente: 'Sábio' } }],
  ['dnd2014', 'dnd5e-srd', { nome: 'Borin 2014', dndLivros: { base: 'phb2014', suplementos: [] }, campos: { classe: 'Guerreiro', nivel: 3, especie: 'Anão', subraca2014: 'Anão da Colina', antecedente: 'Soldado' } }],
  ['pf2e', 'pf2e', { nome: 'Valeros' }], ['fate', 'fate-core', { nome: 'Cynere' }], ['blades', 'blades', { nome: 'Silver' }],
  ['brp', 'brp', { nome: 'Investigadora' }], ['coc', 'call-of-cthulhu', { nome: 'Harvey' }], ['faroeste', 'faroeste-arcano', { nome: 'Jesse' }], ['ordem', 'ordem-paranormal', { nome: 'Arthur', campos: { classe: 'Combatente', nex: 25 } }],
  ['t20', 'tormenta20', { nome: 'Nix' }], ['morkborg', 'mork-borg', { nome: 'Karg' }], ['assimilacao', 'assimilacao', { nome: 'Rato' }], ['livre', 'livre', { nome: 'Livre' }],
]
const DISPOSITIVOS = [
  ['celular-pequeno', { viewport: { width: 360, height: 640 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }],
  ['celular', devices['Pixel 7']],
  ['computador', { viewport: { width: 1280, height: 800 } }],
]

;(async () => {
  const fichas = []
  for (const [nome, sistema, dados] of SISTEMAS) {
    const r = await call(J, 'POST', 'fichas', { sistema, dados })
    if (r.s !== 201 && r.s !== 200) { console.log('✘ criar ' + nome + ': ' + JSON.stringify(r.d).slice(0, 160)); continue }
    fichas.push([nome, r.d.ficha.id])
  }
  const b = await chromium.launch()
  const relatorio = []; let problemas = 0
  for (const [disp, opts] of DISPOSITIVOS) {
    const ctx = await b.newContext(opts)
    await ctx.addInitScript(i => { try { localStorage.setItem('prg-aventureiro-selecionado-v1', i) } catch {} }, J)
    for (const [nome, id] of fichas) {
      const p = await ctx.newPage(); const erros = []
      p.on('pageerror', e => erros.push('erro: ' + e.message.slice(0, 120)))
      p.on('response', x => { if (x.status() >= 500) erros.push('HTTP ' + x.status() + ' ' + x.url().replace(B, '')) })
      const secoes = []
      try {
        await p.goto(B + '/ficha?nuvem=' + id, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2000)
        const abas = await p.locator('nav[aria-label="Seções da ficha"] button').allInnerTexts()
        for (let i = 0; i < abas.length; i++) {
          await p.locator('nav[aria-label="Seções da ficha"] button').nth(i).click({ timeout: 4000 }); await p.waitForTimeout(500)
          const larg = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
          await p.addScriptTag({ content: AXE })
          const axe = await p.evaluate(async () => { const r = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'], rules: { 'color-contrast': { enabled: false } } }); return r.violations.filter(v => v.impact === 'critical' || v.impact === 'serious').map(v => `${v.id}(${v.nodes.length})`) })
          const rotulo = abas[i].split('\n')[0].trim().slice(0, 24)
          if (larg > 0 || axe.length) secoes.push(`${rotulo}:${larg > 0 ? ` +${larg}px` : ''}${axe.length ? ' ' + axe.join(',') : ''}`)
          if (disp === 'celular') await p.screenshot({ path: `${O}/${nome}-${i}.png` })
        }
        const ruim = secoes.length || erros.length
        if (ruim) problemas++
        relatorio.push(`${ruim ? '✘' : '✔'} ${disp.padEnd(15)} ${nome.padEnd(12)} ${abas.length} seções${secoes.length ? ' · ' + secoes.join(' | ') : ''}${erros.length ? ' · ' + [...new Set(erros)].slice(0, 2).join(' | ') : ''}`)
      } catch (e) { problemas++; relatorio.push(`✘ ${disp.padEnd(15)} ${nome.padEnd(12)} falhou: ${String(e.message).split('\n')[0].slice(0, 140)}`) }
      await p.close()
    }
    await ctx.close()
  }
  await b.close()
  console.log(relatorio.join('\n'))
  console.log(problemas ? `\n${problemas} ficha(s) com problema` : '\nTodas as fichas certas em todos os dispositivos!')
  process.exit(problemas ? 1 : 0)
})()
