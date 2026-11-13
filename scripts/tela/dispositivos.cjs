// Teste de dispositivos (v0.33.6): as telas principais em celular pequeno, celular, tablet (em pé e deitado) e computador.
// Confere rolagem para o lado, erros na tela, erros 5xx, botões pequenos demais para o dedo e acessibilidade (axe-core).
// Uso: NODE_PATH=$(npm root -g) node scripts/tela/dispositivos.cjs <pasta-das-fotos>  (servidor local em :3000, banco de teste). Ver scripts/e2e/LEIA-ME.md.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium, devices } = require('playwright')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path'), fs = require('fs')
const B = 'http://localhost:3000', M = '11111111-1111-4111-8111-111111111111', J = '22222222-2222-4222-8222-222222222222'
const O = process.argv[2] || '.'
const AXE = fs.readFileSync(path.join(__dirname, '../../node_modules/axe-core/axe.min.js'), 'utf8')
const call = async (q, metodo, c, body) => { const r = await fetch(B + '/api/prg/' + c, { method: metodo, headers: { 'content-type': 'application/json', 'x-prg-aventureiro': q, origin: B }, body: body && JSON.stringify(body) }); let d = {}; try { d = await r.json() } catch {} return { s: r.status, d } }
const DISPOSITIVOS = [
  ['celular-pequeno', { viewport: { width: 360, height: 640 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }],
  ['celular', devices['Pixel 7']],
  ['iphone', devices['iPhone 13']],
  ['tablet', devices['iPad Mini']],
  ['tablet-deitado', devices['iPad Mini landscape']],
  ['computador', { viewport: { width: 1280, height: 800 } }],
  ['tela-grande', { viewport: { width: 1920, height: 1080 } }],
]

;(async () => {
  // ---------- preparação (API) ----------
  let r = await call(M, 'POST', 'campanhas', { nome: 'Teste de Dispositivos', sistema: 'dnd5e-srd', modeloPadrao: 'C', configProgressao: { modo: 'hibrido', fontes: ['phb2024'] } }); const cid = r.d.campanha.id
  r = await call(M, 'POST', `campanhas/${cid}/convites`, {}); await call(J, 'POST', 'convites/' + r.d.convite.codigo, {})
  r = await call(M, 'GET', 'campanhas/' + cid); for (const s of r.d.solicitacoes) await call(M, 'POST', `campanhas/${cid}/solicitacoes/${s.id}`, { decisao: 'aceitar' })
  r = await call(M, 'POST', `campanhas/${cid}/fichas`, { tipo: 'jogador', jogadorId: J, sistema: 'dnd5e-srd', nome: 'Lyra' }); const fL = r.d.ficha.id
  r = await call(M, 'GET', 'fichas/' + fL)
  await call(M, 'PUT', 'fichas/' + fL, { versao: r.d.ficha.versao, dados: { ...r.d.ficha.dados, atributos: { FOR: 8, DES: 14, CON: 13, INT: 17, SAB: 12, CAR: 10 }, campos: { ...r.d.ficha.dados.campos, classe: 'Mago', nivel: 5, especie: 'Elfo', antecedente: 'Sábio' }, dndMagias: { 'fire-bolt': 'preparada', fireball: 'preparada' } } })
  await call(M, 'POST', 'mesa/' + cid, { acao: 'cena_criar', nome: 'Ponte', grid_cols: 12, grid_rows: 16 })
  r = await call(J, 'POST', 'fichas', { sistema: 'tormenta20', dados: { nome: 'Avulsa T20' } }); const fT = r.d.ficha.id

  // [nome, quem, url, aba para clicar (opcional)]
  const TELAS = [
    ['portal', M, '/portal'],
    ['central', M, '/central'],
    ['campanhas', M, '/central?secao=campanhas&campanha=' + cid],
    ['ficha-dnd', J, '/ficha?nuvem=' + fL],
    ['ficha-dnd-magias', J, '/ficha?nuvem=' + fL, /Poderes e habilidades/],
    ['ficha-dnd-arvore', J, '/ficha?nuvem=' + fL, /Árvore de habilidades/],
    ['ficha-t20', J, '/ficha?nuvem=' + fT, /Atributos e perícias/],
    ['mesa', M, '/mesa?campanha=' + cid],
    ['mestre-dnd', M, '/mestre/dnd?campanha=' + cid],
    ['guia', M, '/guia'],
    ['novidades', M, '/novidades'],
  ]
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })
  const relatorio = []; let problemas = 0
  for (const [disp, opts] of DISPOSITIVOS) {
    const ctxs = {}
    const ctx = async id => ctxs[id] ??= await b.newContext(opts).then(async c => { await c.addInitScript(i => { try { localStorage.setItem('prg-aventureiro-selecionado-v1', i); for (const p of ['mestre', 'jogador', 'espectador']) localStorage.setItem('prg-dicas-mesa-v1-' + p, '1') } catch {} }, id); return c })
    for (const [nome, quem, url, aba] of TELAS) {
      const p = await (await ctx(quem)).newPage(); const erros = []
      p.on('pageerror', e => erros.push('erro: ' + e.message.slice(0, 120)))
      p.on('response', x => { if (x.status() >= 500) erros.push('HTTP ' + x.status() + ' ' + x.url().replace(B, '')) })
      try {
        await p.goto(B + url, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2200)
        if (aba) { await p.getByRole('button', { name: aba }).first().click({ timeout: 4000 }); await p.waitForTimeout(700) }
        const larg = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        // Botões e links visíveis menores que 24×24 px (o mínimo do WCAG 2.2 para alvos de toque).
        const pequenos = await p.evaluate(() => [...document.querySelectorAll('button, a[href], [role=button], select, input:not([type=hidden])')].filter(e => {
          const r = e.getBoundingClientRect(); const st = getComputedStyle(e)
          return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && (r.width < 24 || r.height < 24) && !e.closest('svg') && e.getAttribute('aria-hidden') !== 'true'
        }).map(e => (e.getAttribute('aria-label') || e.textContent || e.tagName).trim().slice(0, 30)))
        await p.addScriptTag({ content: AXE })
        const axe = await p.evaluate(async () => { const r = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'], rules: { 'color-contrast': { enabled: false } } }); return r.violations.filter(v => v.impact === 'critical' || v.impact === 'serious').map(v => `${v.id}(${v.nodes.length})`) })
        await p.screenshot({ path: `${O}/${disp}-${nome}.png` })
        const ruim = larg > 0 || erros.length || axe.length
        if (ruim) problemas++
        relatorio.push(`${ruim ? '✘' : '✔'} ${disp.padEnd(15)} ${nome.padEnd(17)}${larg > 0 ? ` rolagem lateral +${larg}px` : ''}${erros.length ? ' ' + [...new Set(erros)].slice(0, 2).join(' | ') : ''}${axe.length ? ' acessibilidade: ' + axe.join(', ') : ''}${pequenos.length ? ` · ${pequenos.length} alvo(s) < 24px: ${[...new Set(pequenos)].slice(0, 4).join(', ')}` : ''}`)
      } catch (e) { problemas++; relatorio.push(`✘ ${disp.padEnd(15)} ${nome.padEnd(17)} falhou: ${String(e.message).split('\n')[0].slice(0, 120)}`) }
      await p.close()
    }
    for (const c of Object.values(ctxs)) await c.close()
  }
  await b.close()
  console.log(relatorio.join('\n'))
  console.log(problemas ? `\n${problemas} tela(s) com problema` : '\nTudo certo em todos os dispositivos!')
  process.exit(problemas ? 1 : 0)
})()
