// Fotos do Guia da plataforma (public/guia/*.jpg), com dados de demonstração, no tamanho de um celular.
// Uso: NODE_PATH=$(npm root -g) node scripts/tela/guia.cjs <pasta-das-fotos> [só-estas,fotos]
// Servidor local em :3000 com o banco de teste limpo (ver scripts/e2e/LEIA-ME.md). Depois de conferir,
// copie as fotos para public/guia/. As imagens do mapa de demonstração ficam em scripts/tela/guia-demo/.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium } = require('playwright')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path')
const B = 'http://localhost:3000', O = process.argv[2] || '.', SO = process.argv[3] ? process.argv[3].split(',') : null
const M = '11111111-1111-4111-8111-111111111111', J = '22222222-2222-4222-8222-222222222222', N = '33333333-3333-4333-8333-333333333333'
// Imagens “da nuvem” servidas pelo próprio teste (o endereço segue o formato do armazenamento da plataforma).
const NUVEM = 'https://demo.supabase.co/storage/v1/object/public/prg-mesa/demo/'
const DEMO = path.join(__dirname, 'guia-demo')
const call = async (q, metodo, c, body) => { const r = await fetch(B + '/api/prg/' + c, { method: metodo, headers: { 'content-type': 'application/json', 'x-prg-aventureiro': q, origin: B }, body: body && JSON.stringify(body) }); let d = {}; try { d = await r.json() } catch {} if (r.status >= 400) console.log('  API', metodo, c, r.status, JSON.stringify(d).slice(0, 160)); return d }
const mesa = (q, cid, b) => call(q, 'POST', 'mesa/' + cid, b)

async function semear() {
  let r = await call(M, 'POST', 'campanhas', { nome: 'A Torre Partida', sistema: 'dnd5e-srd', modeloPadrao: 'C' }); const cid = r.campanha.id
  r = await call(M, 'POST', `campanhas/${cid}/convites`, {}); await call(J, 'POST', 'convites/' + r.convite.codigo, { mensagem: 'Posso jogar com a Sol?' }); await call(N, 'POST', 'convites/' + r.convite.codigo, {})
  r = await call(M, 'GET', 'campanhas/' + cid); for (const s of r.solicitacoes) await call(M, 'POST', `campanhas/${cid}/solicitacoes/${s.id}`, { decisao: 'aceitar' })
  const ficha = async (quem, tipo, nome, jogadorId, preencher) => {
    const f = (await call(M, 'POST', `campanhas/${cid}/fichas`, { tipo, nome, sistema: 'dnd5e-srd', ...(jogadorId ? { jogadorId } : {}) })).ficha
    const g = (await call(M, 'GET', 'fichas/' + f.id)).ficha
    await call(M, 'PUT', 'fichas/' + f.id, { versao: g.versao, dados: preencher(g.dados) })
    return f.id
  }
  const uso = ids => ({ itens: Object.fromEntries(ids.map(([id, qtd, eq]) => [id, { qtd, equipado: eq }])), poderes: {}, carteira: '35 PO, 12 PP' })
  const fSol = await ficha(J, 'jogador', 'Sol', J, d => ({ ...d, nome: 'Sol',
    campos: { ...d.campos, classe: 'Guerreira', nivel: 5, especie: 'Humana', antecedente: 'Soldado' },
    atributos: { FOR: 17, DES: 14, CON: 15, INT: 10, SAB: 12, CAR: 8 },
    manual: { ...(d.manual ?? {}), mods: { FOR: 3, DES: 2, CON: 2, INT: 0, SAB: 1, CAR: -1 }, derivados: { ...(d.manual?.derivados ?? {}), ca: 18 } },
    recursos: { ...d.recursos, pv: { atual: 38, max: 44 } },
    itens: [
      { id: 'espada', nome: 'Espada longa', categoria: 'arma', peso: 1.5, dano: '1d8+3', bonus: [], iconeBiblioteca: 'gi:lorc/broadsword', raridade: 'incomum', rolagens: [{ nome: 'Acerto', expr: '1d20+6' }, { nome: 'Crítico', expr: '2d8+3' }] },
      { id: 'arco', nome: 'Arco longo', categoria: 'arma', peso: 1, dano: '1d8+2', alcance: 45, bonus: [], iconeBiblioteca: 'gi:delapouite/bow-arrow', rolagens: [{ nome: 'Acerto', expr: '1d20+5' }] },
      { id: 'escudo', nome: 'Escudo', categoria: 'armadura', peso: 3, bonus: [{ alvo: 'derivado:ca', valor: 2 }], iconeBiblioteca: 'gi:delapouite/roman-shield' },
      { id: 'cota', nome: 'Cota de malha', categoria: 'armadura', peso: 20, bonus: [], iconeBiblioteca: 'gi:delapouite/chest-armor' },
      { id: 'pocao', nome: 'Poção de cura', categoria: 'consumivel', peso: 0.25, dano: '2d4+2', bonus: [], iconeBiblioteca: 'gi:delapouite/health-potion' },
      { id: 'tocha', nome: 'Tocha', categoria: 'equipamento', peso: 0.5, bonus: [], iconeBiblioteca: 'gi:delapouite/torch' },
      { id: 'amuleto', nome: 'Amuleto da Lua', categoria: 'tesouro', peso: 0.1, bonus: [], iconeBiblioteca: 'gi:lorc/gem-pendant', raridade: 'lendario', magico: true },
    ],
    poderes: [{ id: 'folego', nome: 'Retomar o fôlego', tipo: 'habilidade', usosMax: 1, recarga: 'curto', expressao: '1d10+5', descricao: 'Recupera vida como ação bônus.' },
      { id: 'surto', nome: 'Surto de ação', tipo: 'habilidade', usosMax: 1, recarga: 'curto', descricao: 'Uma ação a mais no turno.' }],
    uso: uso([['espada', 1, true], ['arco', 1, true], ['escudo', 1, true], ['cota', 1, true], ['pocao', 3, false], ['tocha', 2, false], ['amuleto', 1, false]]) }))
  const fNix = await ficha(N, 'jogador', 'Nix', N, d => ({ ...d, nome: 'Nix', campos: { ...d.campos, classe: 'Maga', nivel: 5, especie: 'Elfa' },
    recursos: { ...d.recursos, pv: { atual: 22, max: 27 } }, poderes: [{ id: 'bola', nome: 'Bola de fogo', tipo: 'magia', expressao: '8d6', alcance: 45 }] }))
  const fOgro = await ficha(M, 'npc', 'Ogro', null, d => ({ ...d, nome: 'Ogro', recursos: { ...d.recursos, pv: { atual: 59, max: 59 } } }))
  // Mesa: masmorra com paredes, porta e janela, tokens, uma área e um combate.
  await mesa(M, cid, { acao: 'sessao', aberta: true })
  r = await mesa(M, cid, { acao: 'cena_criar', nome: 'Masmorra da Torre', grid_cols: 14, grid_rows: 10, mapa_url: NUVEM + 'masmorra.jpg' }); const cena = r.cena.id
  r = await call(M, 'GET', 'mesa/' + cid); if (!r.cenaAtiva) await mesa(M, cid, { acao: 'cena_ativar', cenaId: cena })
  const seg = (l, tipo = 'parede') => l.map(([x1, y1, x2, y2]) => ({ x1, y1, x2, y2, tipo }))
  await mesa(M, cid, { acao: 'parede_criar', cenaId: cena, paredes: [
    ...seg([[1, 1, 6, 1], [1, 1, 1, 6], [6, 1, 6, 3], [6, 4, 6, 6], [1, 6, 3, 6], [4, 6, 6, 6]]),
    ...seg([[9, 1, 13, 1], [13, 1, 13, 8], [9, 8, 13, 8], [9, 1, 9, 3], [9, 4, 9, 8]]),
    ...seg([[1, 8, 3, 8], [4, 8, 6, 8], [1, 8, 1, 10], [6, 8, 6, 10]]),
    ...seg([[9, 3, 9, 4]], 'porta'), ...seg([[13, 4, 13, 6]], 'janela')] })
  const tSol = (await mesa(J, cid, { acao: 'token_criar', cenaId: cena, fichaId: fSol })).token.id
  const tNix = (await mesa(N, cid, { acao: 'token_criar', cenaId: cena, fichaId: fNix })).token.id
  const tOgro = (await mesa(M, cid, { acao: 'token_criar', cenaId: cena, fichaId: fOgro })).token.id
  const tGob = (await mesa(M, cid, { acao: 'token_criar', cenaId: cena, nome: 'Goblin', hp_max: 7 })).token.id
  for (const [t, x, y] of [[tSol, 4, 3], [tNix, 2, 4], [tOgro, 10, 5], [tGob, 11, 2]]) await mesa(M, cid, { acao: 'token_mover', tokenId: t, x, y, atravessar: true })
  await mesa(M, cid, { acao: 'token_editar', tokenId: tSol, luz: { brilho: 6, penumbra: 6 } })
  await mesa(M, cid, { acao: 'area_criar', cenaId: cena, area: { forma: 'circulo', x: 11, y: 6, angulo: 0, metros: 3, nome: 'Bola de fogo', cor: '#f97316' } })
  // Chat: conversa e rolagens.
  await mesa(M, cid, { acao: 'evento', tipo: 'chat', texto: 'Vocês ouvem passos pesados atrás da porta…' })
  await mesa(J, cid, { acao: 'evento', tipo: 'chat', texto: 'Sol encosta o ouvido na porta.', personagem: 'Sol' })
  await mesa(J, cid, { acao: 'evento', tipo: 'rolagem', expressao: '1d20+3', texto: 'Percepção', personagem: 'Sol' })
  await mesa(N, cid, { acao: 'evento', tipo: 'rolagem', expressao: '8d6', texto: 'Bola de fogo', personagem: 'Nix' })
  await mesa(J, cid, { acao: 'evento', tipo: 'rolagem', expressao: '1d20+6', texto: 'Espada longa · Acerto', personagem: 'Sol' })
  await mesa(M, cid, { acao: 'combate_preparar', tokens: [{ tokenId: tSol }, { tokenId: tNix }, { tokenId: tOgro }, { tokenId: tGob }] })
  // Música, diário e mundo.
  r = await call(M, 'POST', `campanhas/${cid}/musica`, { acao: 'playlist_criar', nome: 'Masmorra' })
  const pl = r.playlist?.id
  if (pl) for (const [t, u] of [['Tambores na escuridão', 'https://www.youtube.com/watch?v=aaaaaaaaaaa'], ['Taverna da Lua', 'https://www.youtube.com/watch?v=bbbbbbbbbbb'], ['Batalha final', 'https://www.youtube.com/watch?v=ccccccccccc']]) await call(M, 'POST', `campanhas/${cid}/musica`, { acao: 'musica_adicionar', playlistId: pl, url: u, titulo: t })
  r = await call(J, 'POST', `campanhas/${cid}/musica`, { acao: 'playlist_criar', nome: 'Tema da Sol' })
  if (r.playlist) { await call(J, 'POST', `campanhas/${cid}/musica`, { acao: 'musica_adicionar', playlistId: r.playlist.id, url: 'https://www.youtube.com/watch?v=ddddddddddd', titulo: 'Juramento' }); await call(J, 'POST', `campanhas/${cid}/musica`, { acao: 'playlist_editar', id: r.playlist.id, enviada: true }) }
  await call(M, 'POST', `campanhas/${cid}/sessoes`, { numero: 1, titulo: 'A porta da torre', resumo: 'O grupo chegou à Torre Partida e encontrou a entrada da masmorra.', publicada: true })
  await call(M, 'POST', `campanhas/${cid}/sessoes`, { numero: 2, titulo: 'O ogro de guarda', preparacao: 'O ogro tem a chave da cripta.', publicada: false })
  await call(J, 'POST', `campanhas/${cid}/notas`, { titulo: 'Pistas da torre', texto: 'A runa da porta brilha com a lua.', visibilidade: 'campanha' })
  await call(M, 'POST', `campanhas/${cid}/recompensas`, { fichaIds: [fSol], xp: 300, moedas: '25 PO' })
  const g = (await call(M, 'GET', `campanhas/${cid}/mundo`)).mundo
  await call(M, 'PUT', `campanhas/${cid}/mundo`, { versao: g.versao, mundo: { mapa: NUVEM + 'mundo.jpg', paginas: [
    { id: 'torre', nome: 'Torre Partida', tipo: 'lugar', icone: '🗼', texto: 'Uma torre rachada ao meio por um raio antigo.', mapa: { x: 35, y: 40 }, teia: { x: 500, y: 120 } },
    { id: 'vila', nome: 'Vila do Rio', tipo: 'lugar', icone: '🏘️', texto: 'Onde o grupo descansa.', mapa: { x: 22, y: 62 }, teia: { x: 200, y: 380 } },
    { id: 'picos', nome: 'Picos Gelados', tipo: 'perigo', icone: '⛰️', mapa: { x: 70, y: 32 }, teia: { x: 820, y: 380 } },
    { id: 'lua', nome: 'Mestra da Lua', tipo: 'npc', icone: '🧙', texto: 'Guarda os segredos da torre.', teia: { x: 500, y: 560 } },
    { id: 'culto', nome: 'Culto do Eclipse', tipo: 'faccao', icone: '🛡️', teia: { x: 820, y: 120 } }],
  relacoes: [{ id: 'r1', de: 'lua', para: 'torre', tipo: 'serve' }, { id: 'r2', de: 'culto', para: 'lua', tipo: 'inimigo', rotulo: 'quer a chave' }, { id: 'r3', de: 'vila', para: 'lua', tipo: 'aliado' }] } })
  // Um sistema autoral (para a foto do construtor e dos sistemas).
  return { cid, cena, fSol, tSol }
}

;(async () => {
  const d = await semear()
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })
  const contexto = async (id, extra = {}) => {
    const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, ...extra })
    await c.addInitScript(i => { try { localStorage.setItem('prg-aventureiro-selecionado-v1', i); localStorage.setItem('prg-grupo-v1', 'lunethernnyis'); for (const p of ['mestre', 'jogador', 'espectador']) localStorage.setItem('prg-dicas-mesa-v1-' + p, '1') } catch {} }, id)
    await c.route(NUVEM + '**', rota => rota.fulfill({ path: path.join(DEMO, path.basename(new URL(rota.request().url()).pathname)) }))
    return c
  }
  const cM = await contexto(M), cJ = await contexto(J)
  // Telas largas (mapa inteiro) e telas altas (painel da mesa no celular).
  const pc = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false }
  const cMpc = await contexto(M, pc), cJpc = await contexto(J, pc), cMalto = await contexto(M, { viewport: { width: 390, height: 1000 } }), cJalto = await contexto(J, { viewport: { width: 390, height: 1000 } })
  const erros = []
  const foto = async (p, nome, opts = {}) => { await p.waitForTimeout(500); await p.screenshot({ path: path.join(O, nome), type: 'jpeg', quality: 72, ...opts }); console.log('✓', nome) }
  const pagina = async (c, url) => { const p = await c.newPage(); p.on('pageerror', e => erros.push(url + ': ' + e.message)); await p.goto(B + url, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500); return p }
  const clicar = (p, nome, n = 0) => p.getByRole('button', { name: nome }).nth(n).click({ timeout: 5000 })
  const passos = {
    'portal.jpg': async () => { const p = await pagina(cM, '/portal'); await foto(p, 'portal.jpg') },
    'central.jpg': async () => { const p = await pagina(cJ, '/central'); await foto(p, 'central.jpg') },
    'menu.jpg': async () => { const p = await pagina(cJ, '/central'); await clicar(p, /menu/i); await foto(p, 'menu.jpg') },
    'avisos.jpg': async () => { const p = await pagina(cJ, '/central'); await clicar(p, /^Avisos/); await foto(p, 'avisos.jpg') },
    'sistemas.jpg': async () => { const p = await pagina(cJ, '/central?secao=sistemas'); await foto(p, 'sistemas.jpg') },
    'construtor.jpg': async () => { const p = await pagina(cJ, '/sistemas/criar'); await foto(p, 'construtor.jpg') },
    'ficha.jpg': async () => { const p = await pagina(cJ, '/ficha?nuvem=' + d.fSol); await foto(p, 'ficha.jpg') },
    'acoes-rapidas.jpg': async () => { const p = await pagina(cJ, '/ficha?nuvem=' + d.fSol); await p.locator('section[aria-labelledby="titulo-acoes"]').scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, 160)); await foto(p, 'acoes-rapidas.jpg') },
    'inventario.jpg': async () => { const p = await pagina(cJ, '/ficha?nuvem=' + d.fSol); await p.locator('nav[aria-label="Seções da ficha"] button', { hasText: 'Inventário' }).click(); await p.waitForTimeout(600); await foto(p, 'inventario.jpg') },
    'arsenal.jpg': async () => { const p = await pagina(cJ, '/ficha?nuvem=' + d.fSol); await p.locator('nav[aria-label="Seções da ficha"] button', { hasText: 'Inventário' }).click(); await clicar(p, 'Arsenal pronto'); await p.waitForTimeout(500); await foto(p, 'arsenal.jpg') },
    'icones.jpg': async () => {
      const p = await pagina(cJ, '/ficha?nuvem=' + d.fSol); await p.locator('nav[aria-label="Seções da ficha"] button', { hasText: 'Inventário' }).click()
      await p.getByRole('button', { name: 'Editar Espada longa' }).click(); await p.getByText('🎨 Ícone e raridade').click(); await p.getByText('🔎 Buscar entre todos os ícones do Game-Icons').click(); await p.waitForTimeout(800)
      await p.getByRole('searchbox', { name: 'Buscar ícone' }).fill('espada'); await p.getByRole('searchbox', { name: 'Buscar ícone' }).scrollIntoViewIfNeeded(); await p.waitForTimeout(800); await foto(p, 'icones.jpg') },
    'campanha.jpg': async () => { const p = await pagina(cM, '/central?secao=campanhas&campanha=' + d.cid); await foto(p, 'campanha.jpg') },
    'mesa.jpg': async () => { const p = await pagina(cMpc, '/mesa?campanha=' + d.cid); await foto(p, 'mesa.jpg') },
    'mesa-celular.jpg': async () => { const p = await pagina(cJ, '/mesa?campanha=' + d.cid); await foto(p, 'mesa-celular.jpg') },
    'mesa-chat.jpg': async () => { const p = await pagina(cJalto, '/mesa?campanha=' + d.cid); await clicar(p, /^Chat$/); await p.getByRole('tab', { name: /Dados/ }).first().click().catch(() => {}); await foto(p, 'mesa-chat.jpg') },
    'combate.jpg': async () => { const p = await pagina(cMalto, '/mesa?campanha=' + d.cid); await clicar(p, /^Jogo$/); await p.getByRole('tab', { name: /Iniciativa/ }).first().click().catch(() => {}); await foto(p, 'combate.jpg') },
    'mesa-musica.jpg': async () => { const p = await pagina(cMalto, '/mesa?campanha=' + d.cid); await clicar(p, /^Música$/); await clicar(p, /^Recebidas/).catch(() => {}); await foto(p, 'mesa-musica.jpg') },
    'mesa-diario.jpg': async () => { const p = await pagina(cMalto, '/mesa?campanha=' + d.cid); await clicar(p, /^Diário$/); await foto(p, 'mesa-diario.jpg') },
    'mesa-mestre.jpg': async () => { const p = await pagina(cMalto, '/mesa?campanha=' + d.cid); await clicar(p, /^Mestre$/); await foto(p, 'mesa-mestre.jpg') },
    'mesa-paredes.jpg': async () => { const p = await pagina(cMpc, '/mesa?campanha=' + d.cid); await clicar(p, /^Paredes, portas e janelas/); await p.getByRole('combobox', { name: 'Forma da parede' }).selectOption('circulo'); await foto(p, 'mesa-paredes.jpg') },
    'editar-perfil.jpg': async () => { const p = await pagina(cJ, '/central'); await clicar(p, /menu/i); await clicar(p, /^Editar perfil/); await p.waitForTimeout(1800); await foto(p, 'editar-perfil.jpg') },
    'aparencia.jpg': async () => { const p = await pagina(cJ, '/central'); await clicar(p, /menu/i); await clicar(p, /^Aparência/); await p.waitForTimeout(600); await foto(p, 'aparencia.jpg') },
    'mesa-escuro.jpg': async () => {
      // Por último: muda a cena (escuridão e visão dos personagens) e mostra como o jogador vê.
      await mesa(M, d.cid, { acao: 'cena_editar', cenaId: d.cena, escuridao: 80, visao_dinamica: true, fog_ativo: true })
      const p = await pagina(cJpc, '/mesa?campanha=' + d.cid); await p.waitForTimeout(1500); await foto(p, 'mesa-escuro.jpg') },
    'mundo.jpg': async () => { const p = await pagina(cM, '/mundo?campanha=' + d.cid); await foto(p, 'mundo.jpg') },
    'tutorial.jpg': async () => { const p = await pagina(cJ, '/tutorial'); await foto(p, 'tutorial.jpg') },
  }
  for (const [nome, f] of Object.entries(passos)) {
    if (SO && !SO.includes(nome)) continue
    try { await f() } catch (e) { console.log('✘', nome, String(e.message).split('\n')[0].slice(0, 160)) }
  }
  console.log(erros.length ? 'Erros na página:\n' + erros.join('\n') : 'Sem erros na página.')
  await b.close()
})()
