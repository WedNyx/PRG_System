// Paredes desenhadas no mapa (v0.35.4): linha, à mão livre, retângulo, círculo e triângulo, com e sem grade,
// no celular e no computador. Confere que viram paredes no servidor e que o token não atravessa.
// Uso: NODE_PATH=$(npm root -g) node scripts/tela/paredes.cjs <pasta-das-fotos>  (servidor local em :3000, banco de teste).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium, devices } = require('playwright')
const B = 'http://localhost:3000', M = '11111111-1111-4111-8111-111111111111', J = '22222222-2222-4222-8222-222222222222'
const O = process.argv[2] || '.'
const call = async (q, metodo, c, body) => { const r = await fetch(B + '/api/prg/' + c, { method: metodo, headers: { 'content-type': 'application/json', 'x-prg-aventureiro': q, origin: B }, body: body && JSON.stringify(body) }); let d = {}; try { d = await r.json() } catch {} return { s: r.status, d } }
const ok = (c, m) => { if (!c) { console.log('✘ ' + m); process.exitCode = 1 } else console.log('✓ ' + m) }
const DISPOSITIVOS = [['celular', devices['Pixel 7']], ['computador', { viewport: { width: 1280, height: 800 } }]]

;(async () => {
  const b = await chromium.launch()
  for (const [disp, opts] of DISPOSITIVOS) {
    let r = await call(M, 'POST', 'campanhas', { nome: 'Paredes ' + disp, sistema: 'tormenta20', modeloPadrao: 'C' }); const cid = r.d.campanha.id
    r = await call(M, 'POST', `campanhas/${cid}/convites`, {}); await call(J, 'POST', 'convites/' + r.d.convite.codigo, {})
    r = await call(M, 'GET', 'campanhas/' + cid); for (const s of r.d.solicitacoes) await call(M, 'POST', `campanhas/${cid}/solicitacoes/${s.id}`, { decisao: 'aceitar' })
    await call(M, 'POST', 'mesa/' + cid, { acao: 'sessao', aberta: true })
    r = await call(M, 'POST', 'mesa/' + cid, { acao: 'cena_criar', nome: 'Armazém', grid_cols: 10, grid_rows: 10 }); const cena = r.d.cena.id
    r = await call(M, 'GET', 'mesa/' + cid); if (!r.d.cenaAtiva) await call(M, 'POST', 'mesa/' + cid, { acao: 'cena_ativar', cenaId: cena })
    r = await call(M, 'POST', 'mesa/' + cid, { acao: 'token_criar', cenaId: cena, nome: 'Guarda', hp_max: 10 }); const tk = r.d.token.id
    await call(M, 'POST', 'mesa/' + cid, { acao: 'token_mover', tokenId: tk, x: 0, y: 3 })
    const ctx = await b.newContext(opts)
    await ctx.addInitScript(i => { try { localStorage.setItem('prg-aventureiro-selecionado-v1', i); for (const x of ['mestre', 'jogador', 'espectador']) localStorage.setItem('prg-dicas-mesa-v1-' + x, '1') } catch {} }, M)
    const p = await ctx.newPage(); const erros = []
    p.on('pageerror', e => erros.push(e.message)); p.on('dialog', d => d.accept())
    await p.goto(B + '/mesa?campanha=' + cid, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000)
    await p.getByRole('button', { name: /^Paredes, portas e janelas/ }).click(); await p.waitForTimeout(300)
    const mapa = p.locator('div.touch-none').first()
    const caixa = async () => { const bb = await mapa.boundingBox(); return { bb, c: bb.width / 10 } }
    const arrastar = async (pts) => {
      const { bb, c } = await caixa()
      await p.mouse.move(bb.x + pts[0][0] * c, bb.y + pts[0][1] * c); await p.mouse.down()
      for (const [x, y] of pts.slice(1)) await p.mouse.move(bb.x + x * c, bb.y + y * c, { steps: 6 })
      await p.mouse.up(); await p.waitForTimeout(700)
    }
    const forma = async f => { await p.getByRole('combobox', { name: 'Forma da parede' }).selectOption(f); await p.waitForTimeout(150) }
    const paredes = async () => (await call(M, 'GET', 'mesa/' + cid)).d.cenaAtiva.paredes ?? []
    // Linha encaixada na grade, de (3,1) a (3,7) (no celular, a barra de ferramentas cobre o pé do mapa).
    await forma('linha'); await arrastar([[3.1, 1.1], [3.05, 7.1]])
    let w = await paredes(); ok(w.length === 1 && w[0].x1 === 3 && w[0].y2 === 7, disp + ': linha encaixa na grade ' + JSON.stringify(w[0]))
    // Retângulo (caixote) sem grade.
    await p.getByRole('button', { name: 'Encaixar na grade' }).click()
    await forma('retangulo'); await arrastar([[5.3, 1.4], [7.6, 2.7]])
    w = await paredes(); const ret = w.filter(x => x.grupo); ok(ret.length === 4 && ret.every(x => x.grupo === ret[0].grupo) && Math.abs(ret[0].x1 - 5.3) < 0.15, disp + ': retângulo livre vira 4 paredes do mesmo grupo')
    // Janela em círculo e porta triangular.
    await p.getByRole('button', { name: 'Desenhar Janela' }).click(); await forma('circulo'); await arrastar([[7, 6], [8.2, 6]])
    await p.getByRole('button', { name: 'Desenhar Porta' }).click(); await forma('triangulo'); await arrastar([[4.4, 4.5], [5.8, 6.6]])
    // À mão livre (parede em zigue-zague).
    await p.getByRole('button', { name: 'Desenhar Parede' }).click(); await forma('livre'); await arrastar([[1.0, 2.8], [1.4, 2.0], [1.9, 2.8], [2.3, 2.0], [2.8, 2.8]])
    w = await paredes()
    ok(w.some(x => x.tipo === 'janela') && w.filter(x => x.tipo === 'janela').length >= 12, disp + ': círculo de janela')
    ok(w.filter(x => x.tipo === 'porta').length === 3, disp + ': porta em triângulo')
    const livres = w.filter(x => x.tipo === 'parede' && x.y1 > 1.8 && x.y2 > 1.8 && x.y1 < 3 && x.x1 < 2.95 && x.x2 < 2.95)
    ok(livres.length >= 3 && livres.length <= 12, disp + ': traço à mão livre simplificado em ' + livres.length + ' pedaços')
    await p.getByRole('button', { name: 'Mover' }).first().click().catch(() => {})
    await p.waitForTimeout(400)
    await p.screenshot({ path: `${O}/${disp}-1-formas.png` })
    // Mestre não atravessa a linha sem o 👻; com ele, atravessa.
    r = await call(M, 'POST', 'mesa/' + cid, { acao: 'token_mover', tokenId: tk, x: 6, y: 3 }); ok(r.s === 400, disp + ': o token não atravessa a linha')
    // Apagar: um toque num lado do retângulo tira o retângulo inteiro.
    await p.getByRole('button', { name: /^Paredes, portas e janelas/ }).click()
    await p.getByRole('button', { name: 'Apagar parede' }).click()
    { const { bb, c } = await caixa(); await p.mouse.click(bb.x + 6.4 * c, bb.y + 1.42 * c) } await p.waitForTimeout(800)
    w = await paredes(); ok(!w.some(x => x.grupo === ret[0].grupo), disp + ': apagar um lado tira o retângulo inteiro')
    await p.screenshot({ path: `${O}/${disp}-2-apagou.png` })
    ok(!erros.length, disp + ': sem erros na página ' + erros.join(' | '))
    await ctx.close()
  }
  await b.close()
})()
