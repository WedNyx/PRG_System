// Repaginação (v0.36.5): Central em 5 destinos, busca universal, Meu perfil por assunto, modos da ficha e Mesa de Som.
// Uso: NODE_PATH=$(npm root -g) node scripts/tela/repaginacao.cjs <pasta>  (servidor local em :3000, banco de teste).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium, devices } = require('playwright')
const B = 'http://localhost:3000', M = '11111111-1111-4111-8111-111111111111', J = '22222222-2222-4222-8222-222222222222'
const O = process.argv[2] || '.'
const call = async (q, metodo, c, body) => { const r = await fetch(B + '/api/prg/' + c, { method: metodo, headers: { 'content-type': 'application/json', 'x-prg-aventureiro': q, origin: B }, body: body && JSON.stringify(body) }); let d = {}; try { d = await r.json() } catch {} return { s: r.status, d } }
const ok = (c, m) => { if (!c) { console.log('✘ ' + m); process.exitCode = 1 } else console.log('✓ ' + m) }
const DISP = [['celular', devices['Pixel 7']], ['computador', { viewport: { width: 1366, height: 820 } }]]
// No celular, conteúdo largo demais “aumenta” a tela (innerWidth cresce): confere também contra a largura do aparelho.
const semLado = async p => { const w = p.viewportSize().width; return p.evaluate(w => document.documentElement.scrollWidth - innerWidth <= 1 && innerWidth <= w + 1, w) }

;(async () => {
  let r = await call(M, 'POST', 'campanhas', { nome: 'Crônicas da Lua', sistema: 'dnd5e-srd', modeloPadrao: 'C' }); const cid = r.d.campanha.id
  r = await call(M, 'POST', `campanhas/${cid}/convites`, {}); await call(J, 'POST', 'convites/' + r.d.convite.codigo, {})
  r = await call(M, 'GET', 'campanhas/' + cid); for (const s of r.d.solicitacoes) await call(M, 'POST', `campanhas/${cid}/solicitacoes/${s.id}`, { decisao: 'aceitar' })
  await call(M, 'POST', 'mesa/' + cid, { acao: 'sessao', aberta: true })
  r = await call(M, 'POST', 'mesa/' + cid, { acao: 'cena_criar', nome: 'Taverna', grid_cols: 14, grid_rows: 10 }); const cena = r.d.cena.id
  r = await call(M, 'GET', 'mesa/' + cid); if (!r.d.cenaAtiva) await call(M, 'POST', 'mesa/' + cid, { acao: 'cena_ativar', cenaId: cena })
  const fid = (await call(J, 'POST', 'fichas', { sistema: 'dnd5e-srd', dados: { nome: 'Lyra Nyx', campos: { classe: 'Mago', nivel: 3, especie: 'Elfo', antecedente: 'Sábio' } } })).d.ficha.id

  const b = await chromium.launch(); const erros = []
  const contexto = async (opts, id) => {
    const c = await b.newContext(opts)
    await c.addInitScript(i => { try { localStorage.setItem('prg-aventureiro-selecionado-v1', i); for (const x of ['mestre', 'jogador', 'espectador']) localStorage.setItem('prg-dicas-mesa-v1-' + x, '1') } catch {} }, id)
    const p = await c.newPage(); p.on('pageerror', e => erros.push(e.message)); p.on('dialog', d => d.accept()); return { c, p }
  }
  for (const [disp, opts] of DISP) {
    const { c, p } = await contexto(opts, J)
    await p.goto(B + '/central', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
    ok(await p.evaluate(() => !document.documentElement.dataset.tema), `${disp}: tema padrão é a Noite lunar`)
    ok(await p.evaluate(() => getComputedStyle(document.body).fontFamily.includes('Inter')), `${disp}: corpo em Inter`)
    const navNome = disp === 'celular' ? 'Atalhos da Central' : 'Navegação da Central'
    const destinos = await p.getByRole('navigation', { name: navNome }).getByRole('button').allInnerTexts()
    ok(destinos.length === 5, `${disp}: cinco destinos (${destinos.map(x => x.split('\n')[0]).join(', ')})`)
    ok(await semLado(p), `${disp}: Início sem rolagem para o lado`)
    await p.screenshot({ path: `${O}/${disp}-1-inicio.png` })
    // Busca universal
    if (disp === 'computador') await p.keyboard.press('Control+k'); else await p.getByRole('button', { name: 'Buscar', exact: true }).first().click()
    const busca = p.getByRole('dialog', { name: 'Buscar na plataforma' })
    await busca.waitFor({ timeout: 3000 }).catch(() => {})
    ok(await busca.isVisible(), `${disp}: a busca abre`)
    await busca.getByRole('combobox').fill('lua'); await p.waitForTimeout(900)
    const achados = await busca.getByRole('option').allInnerTexts()
    ok(achados.some(t => t.includes('Crônicas da Lua')) && achados.some(t => t.includes('Mesa: Crônicas da Lua')), `${disp}: busca acha campanha e mesa (${achados.length})`)
    await busca.getByRole('combobox').fill('jogabilidade'); await p.waitForTimeout(300)
    await p.screenshot({ path: `${O}/${disp}-2-busca.png` })
    await p.keyboard.press('Enter'); await p.waitForTimeout(700)
    ok(await p.getByRole('tab', { name: /Jogabilidade/ }).getAttribute('aria-selected') === 'true', `${disp}: Enter na busca abre Perfil › Jogabilidade`)
    const dados3d = p.getByRole('switch', { name: /Dados 3D/ })
    await dados3d.click(); await p.waitForTimeout(200)
    ok(await p.evaluate(() => JSON.parse(localStorage.getItem('prg-preferencias-v1') || '{}').dados3d === false), `${disp}: desligar Dados 3D fica salvo no aparelho`)
    await dados3d.click()
    await p.screenshot({ path: `${O}/${disp}-3-jogabilidade.png`, fullPage: disp === 'celular' })
    await p.getByRole('tab', { name: /Aparência/ }).click(); await p.waitForTimeout(500)
    await p.getByRole('button', { name: /Reduzir movimento/ }).click(); await p.waitForTimeout(300)
    ok(await p.evaluate(() => document.documentElement.dataset.movimento === 'reduzido'), `${disp}: Reduzir movimento vale na hora`)
    await p.getByRole('button', { name: /Reduzir movimento/ }).click(); await p.waitForTimeout(900)
    // Personagens e Ferramentas
    await p.getByRole('navigation', { name: navNome }).getByRole('button', { name: /Personagens/ }).click(); await p.waitForTimeout(600)
    await p.getByRole('tab', { name: /Criar ficha/ }).click(); await p.waitForTimeout(900)
    ok(await p.getByText(/D&D|Dungeons/).count() > 0, `${disp}: Personagens › Criar ficha mostra os sistemas`)
    await p.getByRole('navigation', { name: navNome }).getByRole('button', { name: /Ferramentas/ }).click(); await p.waitForTimeout(600)
    ok(await p.getByRole('link', { name: /Criar sistema de RPG/ }).count() === 1, `${disp}: Ferramentas lista as ferramentas`)
    ok(await semLado(p), `${disp}: Ferramentas sem rolagem para o lado`)
    await p.screenshot({ path: `${O}/${disp}-4-ferramentas.png` })
    if (disp === 'computador') {
      await p.getByRole('button', { name: 'Recolher o menu lateral' }).first().click(); await p.waitForTimeout(500)
      const largura = (await p.getByRole('complementary', { name: 'Menu da Central' }).boundingBox()).width
      ok(largura < 90, `computador: o menu lateral recolhe (${Math.round(largura)} px)`)
      await p.screenshot({ path: `${O}/${disp}-5-menu-recolhido.png` })
      await p.getByRole('button', { name: 'Abrir o menu lateral' }).first().click()
    }
    // Links antigos continuam valendo
    await p.goto(B + '/central?secao=historico', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800)
    ok(await p.getByRole('tab', { name: /Histórico de rolagens/ }).getAttribute('aria-selected') === 'true', `${disp}: link antigo ?secao=historico abre Ferramentas › Histórico`)
    // Ficha: modos
    await p.goto(B + '/ficha?nuvem=' + fid, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2800)
    const modos = p.getByRole('radiogroup', { name: 'Modo da ficha' })
    ok(await modos.getByRole('radio').count() === 3, `${disp}: ficha com 3 modos`)
    ok(await p.getByRole('navigation', { name: 'Passos da criação' }).isVisible(), `${disp}: Criação mostra os passos`)
    await p.screenshot({ path: `${O}/${disp}-6-ficha-criacao.png` })
    await modos.getByRole('radio', { name: /Jogo/ }).click(); await p.waitForTimeout(500)
    const ordem = await p.evaluate(() => { const a = document.querySelector('.ficha-acoes-rapidas')?.getBoundingClientRect().top ?? 0, r = document.querySelector('.ficha-recursos-gerais')?.getBoundingClientRect().top ?? 0, i = document.querySelector('.ficha-identidade')?.getBoundingClientRect().top ?? 0; return { a, r, i } })
    ok(ordem.i < ordem.a && ordem.a < ordem.r, `${disp}: Jogo põe ações rápidas antes dos recursos`)
    await p.screenshot({ path: `${O}/${disp}-7-ficha-jogo.png` })
    await modos.getByRole('radio', { name: /Consulta/ }).click(); await p.waitForTimeout(500)
    ok(await p.locator('input[placeholder="Ex.: Lyra Nyx"]').isDisabled(), `${disp}: Consulta deixa a ficha só de leitura`)
    await modos.getByRole('radio', { name: /Criação/ }).click(); await p.waitForTimeout(300)
    ok(await semLado(p), `${disp}: ficha sem rolagem para o lado`)
    await c.close()
  }
  // Mesa de Som: o mestre toca, o jogador recebe
  for (const [disp, opts] of DISP) {
    const m = await contexto(opts, M), j = await contexto(opts, J)
    for (const x of [m, j]) await x.p.addInitScript(() => {
      window.__sons = []
      const AC = window.AudioContext; window.AudioContext = class extends AC { createBufferSource() { window.__sons.push('fonte'); return super.createBufferSource() } createOscillator() { window.__sons.push('osc'); return super.createOscillator() } }
    })
    await m.p.goto(B + '/mesa?campanha=' + cid, { waitUntil: 'domcontentloaded' }); await j.p.goto(B + '/mesa?campanha=' + cid, { waitUntil: 'domcontentloaded' }); await m.p.waitForTimeout(4000)
    await m.p.getByRole('button', { name: /^Som/ }).first().click(); await m.p.waitForTimeout(400)
    await m.p.getByRole('tab', { name: /Mesa de som/ }).click(); await m.p.waitForTimeout(500)
    ok(await m.p.getByRole('button', { name: /^Tocar / }).count() >= 20, `${disp}: mestre vê os efeitos da Mesa de Som`)
    await m.p.screenshot({ path: `${O}/${disp}-8-mesa-de-som.png` })
    // O servidor local de testes não tem o tempo real do Supabase: aqui o som é conferido no aparelho do mestre
    // (ele também ouve o que toca). Entre aparelhos, os comandos vão pelo mesmo canal da régua e das áreas.
    const sons = () => m.p.evaluate(() => window.__sons.length)
    let antes = await sons()
    await m.p.getByRole('button', { name: 'Tocar Espadas' }).click(); await m.p.waitForTimeout(800)
    ok(await sons() > antes, `${disp}: tocar um efeito gera o som (espadas)`)
    await m.p.getByRole('tab', { name: /Cenas/ }).click(); await m.p.waitForTimeout(300)
    await m.p.getByRole('button', { name: /Tempestade/ }).click(); await m.p.waitForTimeout(800)
    ok(await m.p.getByText(/Tocando agora/).first().innerText().then(t => /Tempestade/.test(t) && /Chuva/.test(t) && /Vento/.test(t)), `${disp}: a cena Tempestade liga chuva e vento`)
    await m.p.screenshot({ path: `${O}/${disp}-9-cenas.png` })
    await m.p.getByRole('tab', { name: /Ambiente/ }).click(); await m.p.waitForTimeout(300)
    ok(await m.p.getByRole('button', { name: 'Desligar Chuva' }).getAttribute('aria-pressed') === 'true', `${disp}: a aba Ambiente mostra a chuva ligada`)
    await m.p.getByRole('button', { name: /Silenciar/ }).click(); await m.p.waitForTimeout(2200)
    ok(await m.p.getByText('🔈 Nenhum ambiente tocando.').count() >= 1, `${disp}: Silenciar desliga o ambiente`)
    await m.p.getByRole('checkbox', { name: /Sons de susto/ }).uncheck(); await m.p.waitForTimeout(200)
    await m.p.getByRole('tab', { name: /Efeitos/ }).click()
    antes = await sons()
    await m.p.getByRole('button', { name: 'Tocar Explosão' }).click(); await m.p.waitForTimeout(600)
    ok(await sons() === antes, `${disp}: com “Sons de susto” desligado, a explosão não toca`)
    await m.p.getByRole('button', { name: 'Tocar Moedas' }).click(); await m.p.waitForTimeout(600)
    ok(await sons() > antes, `${disp}: os outros efeitos continuam tocando`)
    await m.p.getByRole('checkbox', { name: /Sons de susto/ }).check()
    // Jogador: vê o que toca e ajusta só o próprio som
    await j.p.getByRole('button', { name: /^Som/ }).first().click(); await j.p.waitForTimeout(300)
    await j.p.getByRole('tab', { name: /^Sons/ }).click(); await j.p.waitForTimeout(500)
    ok(await j.p.getByRole('slider', { name: 'Volume dos sons da mesa' }).count() === 1 && await j.p.getByRole('button', { name: /^Tocar / }).count() === 0, `${disp}: jogador tem o próprio volume e não toca efeitos`)
    await j.p.screenshot({ path: `${O}/${disp}-10-sons-jogador.png` })
    for (const x of [m, j]) { ok(await semLado(x.p), `${disp}: mesa sem rolagem para o lado`); await x.c.close() }
  }
  ok(!erros.length, 'sem erros na página ' + erros.join(' | '))
  await b.close()
})()
