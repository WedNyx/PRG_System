// v0.36.6: Ordem com a estética da PR #68, fundo de cada sistema, roteiro da ficha oficial, Mapa da árvore (React Flow),
// mesa organizada (Mestre em partes, Som com Trilha e Mesa de som) e arrastar para reordenar (dnd-kit).
// Uso: NODE_PATH=$(npm root -g) node scripts/tela/fichas-mesa.cjs <pasta>  (servidor local em :3000, banco de teste).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium, devices } = require('playwright')
const B = 'http://localhost:3000', M = '11111111-1111-4111-8111-111111111111', J = '22222222-2222-4222-8222-222222222222'
const O = process.argv[2] || '.'
const call = async (q, metodo, c, body) => { const r = await fetch(B + '/api/prg/' + c, { method: metodo, headers: { 'content-type': 'application/json', 'x-prg-aventureiro': q, origin: B }, body: body && JSON.stringify(body) }); let d = {}; try { d = await r.json() } catch {} return { s: r.status, d } }
const ok = (c, m) => { if (!c) { console.log('✘ ' + m); process.exitCode = 1 } else console.log('✓ ' + m) }
const DISP = [['celular', devices['Pixel 7']], ['computador', { viewport: { width: 1366, height: 860 } }]]
const semLado = async p => { const w = p.viewportSize().width; return p.evaluate(w => document.documentElement.scrollWidth - innerWidth <= 1 && innerWidth <= w + 1, w) }

;(async () => {
  const ficha = async (sistema, dados) => (await call(J, 'POST', 'fichas', { sistema, dados })).d.ficha.id
  const ids = {
    ordem: await ficha('ordem-paranormal', { nome: 'Arthur Cervero', campos: { classe: 'Combatente', nex: 25, origem: 'Policial' } }),
    pf2e: await ficha('pf2e', { nome: 'Valeros', campos: { nivel: 5 } }),
    t20: await ficha('tormenta20', { nome: 'Nix', campos: { nivel: 3 } }),
    fate: await ficha('fate-core', { nome: 'Cynere' }),
    coc: await ficha('call-of-cthulhu', { nome: 'Harvey Walters' }),
  }
  const b = await chromium.launch(); const erros = []
  const contexto = async (opts, id) => {
    const c = await b.newContext(opts)
    await c.addInitScript(i => { try { localStorage.setItem('prg-aventureiro-selecionado-v1', i); for (const x of ['mestre', 'jogador', 'espectador']) localStorage.setItem('prg-dicas-mesa-v1-' + x, '1') } catch {} }, id)
    const p = await c.newPage(); p.on('pageerror', e => erros.push(e.message)); p.on('dialog', d => d.accept()); return { c, p }
  }
  const secao = async (p, re) => { await p.locator('nav[aria-label="Seções da ficha"] button').filter({ hasText: re }).first().click(); await p.waitForTimeout(700) }

  for (const [disp, opts] of DISP) {
    const { c, p } = await contexto(opts, J)
    // ---- Ordem (PR #68)
    await p.goto(B + '/ficha?nuvem=' + ids.ordem, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2800)
    ok(await p.evaluate(() => getComputedStyle(document.querySelector('.ficha-fundo')).backgroundImage !== 'none'), `${disp}: Ordem tem o fundo próprio atrás da ficha`)
    ok(await p.locator('details.ficha-oficial').count() === 1, `${disp}: Criação mostra a ordem da ficha de papel`)
    await p.screenshot({ path: `${O}/${disp}-ordem-1-principal.png` })
    await secao(p, /Atributos/)
    ok(await p.locator('.hexatombe-atributos svg.hexatombe-sigilo').count() === 1 && await p.locator('.hexatombe-no input').count() === 5, `${disp}: Hexatombe com os 5 atributos`)
    ok(await p.locator('.ordem-testes-grid button').count() === 5, `${disp}: testes de atributo com os símbolos dos elementos`)
    ok(await p.locator('.ordem-pericias-lista .ficha-pericia').count() > 20, `${disp}: registro de perícias da Ordem`)
    await p.screenshot({ path: `${O}/${disp}-ordem-2-atributos.png`, fullPage: true })
    await secao(p, /Poderes/)
    ok(await p.getByRole('button', { name: /^Rituais/ }).count() === 1 && await p.locator('.ordem-filtros button').count() === 6, `${disp}: rituais com filtro por elemento`)
    await p.screenshot({ path: `${O}/${disp}-ordem-3-rituais.png`, fullPage: true })
    await secao(p, /Inventário/)
    ok(await p.getByRole('heading', { name: /Equipamentos do agente/ }).count() === 1, `${disp}: inventário operacional`)
    await p.getByRole('button', { name: /Arsenal da Ordem/ }).click(); await p.waitForTimeout(500)
    const arsenal = p.getByRole('dialog', { name: 'Arsenal pronto' })
    ok(await arsenal.getByText('Revólver').count() >= 1 && await arsenal.getByText(/Livro de Regras/).count() === 0, `${disp}: Arsenal da Ordem com estatísticas e sem texto do livro`)
    await arsenal.getByRole('button', { name: 'Adicionar Revólver ao inventário' }).click(); await p.waitForTimeout(500)
    await arsenal.getByRole('button', { name: 'Fechar arsenal' }).click(); await p.waitForTimeout(500)
    ok(await p.locator('.ordem-item').count() >= 1, `${disp}: arma entra no inventário com a ficha técnica`)
    await p.screenshot({ path: `${O}/${disp}-ordem-4-inventario.png`, fullPage: true })
    ok(await semLado(p), `${disp}: Ordem sem rolagem para o lado`)
    // ---- Mapa da árvore (React Flow) em vários sistemas
    for (const s of ['ordem', 'pf2e', 't20']) {
      await p.goto(B + '/ficha?nuvem=' + ids[s], { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
      await secao(p, /Árvore/)
      ok(await p.getByRole('tab', { name: /Mapa completo/ }).getAttribute('aria-selected') === 'true', `${disp}/${s}: a árvore abre no Mapa completo`)
      await p.locator('.react-flow__node').first().waitFor({ timeout: 8000 }).catch(() => {})
      const nos = await p.locator('.react-flow__node').count()
      ok(nos > 4 && await p.locator('.react-flow__minimap').count() === 1, `${disp}/${s}: mapa com ${nos} nós e minimapa`)
      await p.locator('.react-flow__node-marco button').first().click(); await p.waitForTimeout(500)
      ok(await p.getByText('O que você escolheu aqui').count() >= 1 || await p.locator('[data-mapa-arvore] ~ div').count() >= 1, `${disp}/${s}: tocar num marco abre o detalhe`)
      await p.screenshot({ path: `${O}/${disp}-arvore-${s}.png` })
      ok(await semLado(p), `${disp}/${s}: árvore sem rolagem para o lado`)
    }
    // ---- Arsenal de cada sistema, com o crítico do jogo
    for (const [s, arma, crit] of [['t20', 'Espada longa', /margem de ameaça/], ['coc', 'Revólver .45', /empalam/], ['pf2e', 'Espada longa', /dobra/]]) {
      await p.goto(B + '/ficha?nuvem=' + ids[s], { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
      await secao(p, /Inventário|Equipamento|Itens/)
      await p.getByRole('button', { name: /Arsenal do sistema/ }).click(); await p.waitForTimeout(500)
      const dlg = p.getByRole('dialog', { name: 'Arsenal pronto' })
      ok(await dlg.getByText(crit).count() >= 1 && await dlg.getByRole('tab', { name: /Genérico/ }).count() === 1, `${disp}/${s}: arsenal do sistema explica o crítico`)
      ok(await dlg.getByRole('heading', { name: arma, exact: true }).count() === 1, `${disp}/${s}: tem ${arma}`)
      await p.screenshot({ path: `${O}/${disp}-arsenal-${s}.png` })
      ok(await semLado(p), `${disp}/${s}: arsenal sem rolagem para o lado`)
      await dlg.getByRole('button', { name: `Adicionar ${arma} ao inventário` }).click(); await p.waitForTimeout(400)
      await dlg.getByRole('button', { name: 'Fechar arsenal' }).click(); await p.waitForTimeout(400)
      ok(await p.getByText(arma).count() >= 1, `${disp}/${s}: ${arma} entrou no inventário`)
    }
    // ---- Sugestões de origem (o campo continua livre)
    await p.goto(B + '/ficha?nuvem=' + ids.t20, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
    ok(await p.locator('datalist#sugestoes-divindade option').count() === 20 && await p.locator('datalist#sugestoes-origem option').count() > 30, `${disp}: Tormenta20 sugere origens e as 20 divindades`)
    await p.goto(B + '/ficha?nuvem=' + ids.fate, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2200)
    ok(await p.evaluate(() => getComputedStyle(document.querySelector('.ficha-fundo')).backgroundImage !== 'none'), `${disp}: Fate também tem fundo próprio`)
    await c.close()
  }

  // ---- Mesa: mestre organizado, Som unificado, arrastar
  let r = await call(M, 'POST', 'campanhas', { nome: 'Mesa organizada', sistema: 'ordem-paranormal', modeloPadrao: 'C' }); const cid = r.d.campanha.id
  await call(M, 'POST', 'mesa/' + cid, { acao: 'sessao', aberta: true })
  r = await call(M, 'POST', 'mesa/' + cid, { acao: 'cena_criar', nome: 'Mansão', grid_cols: 14, grid_rows: 10 })
  r = await call(M, 'GET', 'mesa/' + cid); if (!r.d.cenaAtiva) await call(M, 'POST', 'mesa/' + cid, { acao: 'cena_ativar', cenaId: r.d.cenas[0].id })
  await call(M, 'POST', 'mesa/' + cid, { acao: 'iniciativa', iniciativa: [{ id: 'a', nome: 'Alfa', valor: 20 }, { id: 'b', nome: 'Beta', valor: 15 }, { id: 'c', nome: 'Gama', valor: 10 }], turno: 0, rodada: 1 })
  r = await call(M, 'POST', `campanhas/${cid}/musica`, { acao: 'playlist_criar', nome: 'Suspense' }); const pl = r.d.playlist.id
  for (const t of ['Um', 'Dois', 'Tres']) await call(M, 'POST', `campanhas/${cid}/musica`, { acao: 'musica_adicionar', playlistId: pl, url: 'https://www.youtube.com/watch?v=dQw4w9WgXc' + t[0], titulo: t })
  for (const [disp, opts] of DISP) {
    const { c, p } = await contexto(opts, M)
    await p.goto(B + '/mesa?campanha=' + cid, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(4000)
    await p.getByRole('button', { name: /^Mestre/ }).first().click(); await p.waitForTimeout(500)
    const partes = await p.getByRole('tablist', { name: 'Mestre' }).getByRole('tab').allInnerTexts()
    ok(['Cenas e mapa', 'Névoa e luz', 'Combate e descanso', 'Biblioteca', 'Tabelas'].every(n => partes.some(x => x.includes(n))), `${disp}: Mestre em partes (${partes.join(', ')})`)
    ok(await p.getByRole('heading', { name: /Cenas/ }).count() >= 1, `${disp}: Cenas e mapa começa pelas cenas`)
    await p.screenshot({ path: `${O}/${disp}-mesa-1-mestre.png` })
    await p.getByRole('tab', { name: /Névoa e luz/ }).click(); await p.waitForTimeout(400)
    ok(await p.getByRole('button', { name: /névoa/i }).count() >= 1, `${disp}: Névoa e luz tem os controles da névoa`)
    await p.getByRole('tab', { name: /Combate e descanso/ }).click(); await p.waitForTimeout(400)
    await p.screenshot({ path: `${O}/${disp}-mesa-2-regras.png` })
    await p.getByRole('button', { name: /^Som/ }).first().click(); await p.waitForTimeout(500)
    const som = await p.getByRole('tablist', { name: 'Som' }).getByRole('tab').allInnerTexts()
    ok(som.some(x => x.includes('Trilha')) && som.some(x => x.includes('Mesa de som')), `${disp}: Som junta Trilha e Mesa de som`)
    // Playlist: arrastar com o teclado (alça → Espaço → ↓ ↓ → Espaço)
    await p.getByRole('button', { name: /Suspense/ }).first().click(); await p.waitForTimeout(400)
    const alca = p.getByRole('list', { name: 'Músicas de Suspense' }).getByRole('button', { name: 'Arrastar para mudar a ordem' }).first()
    await alca.focus(); await p.keyboard.press('Space'); await p.waitForTimeout(200); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(200); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(200); await p.keyboard.press('Space'); await p.waitForTimeout(1500)
    r = await call(M, 'GET', `campanhas/${cid}/musica`)
    const ordem = r.d.minhas.find(x => x.id === pl).musicas.map(m => m.titulo).join(',')
    ok(ordem !== (disp === 'celular' ? 'Um,Dois,Tres' : 'Dois,Tres,Um'), `${disp}: arrastar muda a ordem da playlist (${ordem})`)
    await p.screenshot({ path: `${O}/${disp}-mesa-3-trilha.png` })
    await p.getByRole('tab', { name: /Mesa de som/ }).click(); await p.waitForTimeout(400)
    await p.getByRole('tab', { name: /Meus/ }).click(); await p.waitForTimeout(300)
    ok(await p.getByLabel('Enviar áudio para a Mesa de Som').count() === 1, `${disp}: Mesa de Som aceita os áudios do mestre`)
    await p.screenshot({ path: `${O}/${disp}-mesa-4-meus-sons.png` })
    // Iniciativa: arrastar Gama para o topo
    await p.getByRole('button', { name: /^Jogo/ }).first().click(); await p.waitForTimeout(400)
    await p.getByRole('tab', { name: /Iniciativa/ }).click(); await p.waitForTimeout(500)
    const lista = p.getByRole('list', { name: 'Ordem do combate' })
    const antes = (await lista.locator('li').allInnerTexts()).map(t => t.match(/Alfa|Beta|Gama/)?.[0]).join(',')
    const ultima = lista.getByRole('button', { name: 'Arrastar para mudar a ordem' }).last()
    await ultima.focus(); await p.keyboard.press('Space'); await p.waitForTimeout(200); await p.keyboard.press('ArrowUp'); await p.waitForTimeout(200); await p.keyboard.press('ArrowUp'); await p.waitForTimeout(200); await p.keyboard.press('Space'); await p.waitForTimeout(1800)
    const depois = (await lista.locator('li').allInnerTexts()).map(t => t.match(/Alfa|Beta|Gama/)?.[0]).join(',')
    ok(depois !== antes, `${disp}: arrastar muda a ordem do combate (${antes} → ${depois})`)
    await p.screenshot({ path: `${O}/${disp}-mesa-5-iniciativa.png` })
    ok(await semLado(p), `${disp}: mesa sem rolagem para o lado`)
    await c.close()
  }
  ok(!erros.length, 'sem erros na página ' + erros.join(' | '))
  await b.close()
})()
