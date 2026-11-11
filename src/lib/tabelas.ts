/**
 * Tabelas do mestre: listas de resultados para rolar na hora (nomes, encontros, tesouros…).
 * Um resultado pode ter dados ({2d6} vira um número) e puxar outra tabela ([[id]]), o que permite
 * geradores combinados como “NPC completo”. Funções puras (tabelas.test.ts); o sorteio vale no servidor.
 */
import { rolarExpressao } from './dice'

export type Tabela = { id: string; nome: string; icone: string; linhas: string[]; pronta?: boolean }
export const LIM_TABELAS = { tabelas: 60, linhas: 200, linha: 300, nome: 60 }
const ICONES_TABELA = ['🎲', '🍺', '👤', '🎭', '🤫', '🌲', '🛤️', '🏙️', '💰', '🌦️', '📜', '❗', '⚔️', '🔮', '🐉', '🗝️', '🧭', '🕯️']
export { ICONES_TABELA }

const t = (id: string, nome: string, icone: string, linhas: string[]): Tabela => ({ id, nome, icone, linhas, pronta: true })
/** Tabelas que vêm com a plataforma (texto próprio). */
export const TABELAS_PRONTAS: Tabela[] = [
  t('npc-completo', 'NPC completo', '🧑', ['[[nomes]] — [[personalidade]]. Segredo: [[segredo]].']),
  t('missao-completa', 'Missão completa', '📜', ['[[gancho]] Complicação: [[complicacao]]. Recompensa: [[tesouro]].']),
  t('nomes', 'Nome de personagem', '👤', ['Bruna', 'Tavik', 'Odelia', 'Jorn', 'Mirae', 'Caspian', 'Ilka', 'Doran', 'Selene', 'Fausto', 'Yara', 'Bento', 'Nadir', 'Quíron', 'Amara', 'Teodoro', 'Lis', 'Rurik', 'Celeste', 'Otávio', 'Zaira', 'Hamon', 'Valquíria', 'Elias']),
  t('personalidade', 'Personalidade de NPC', '🎭', ['gentil, mas mente sobre o passado', 'desconfiado e curioso demais', 'fala alto e ri de tudo', 'calado; anota tudo num caderninho', 'orgulhoso e quer ser admirado', 'medroso, mas leal até o fim', 'sarcástico com todo mundo', 'sonhador, sempre distraído', 'educado demais, quase assustador', 'apressado; nunca termina uma frase', 'supersticioso: vê presságios em tudo', 'generoso com estranhos, duro com a família']),
  t('segredo', 'Segredo de NPC', '🤫', ['deve dinheiro ao barão', 'é um espião de outro reino', 'viu o crime e ficou calado', 'é herdeiro perdido de uma casa nobre', 'tem uma maldição que esconde com luvas', 'roubou o anel que está usando', 'conversa à noite com algo no poço', 'já foi aventureiro e fugiu de uma batalha', 'trabalha para o vilão sem saber']),
  t('taverna', 'Nome de taverna', '🍺', ['O Javali Risonho', 'A Lua Torta', 'Caneca de Ferro', 'O Último Dragão', 'Pena & Barril', 'O Corvo Cansado', 'A Bota Furada', 'Três Velas', 'O Anão Dançarino', 'Estrela do Porto', 'O Gato de Duas Caudas', 'A Ponte Quebrada']),
  t('rumor', 'Rumor na taverna', '🗣️', ['Dizem que o moinho velho mói ossos à meia-noite.', 'Um mercador pagou em moedas que ninguém reconhece.', 'O poço da praça secou de um dia para o outro.', 'A filha do prefeito sumiu e ninguém procura.', 'Há luzes no cemitério toda lua cheia.', 'Um caçador voltou da floresta sem sombra.', 'O templo está comprando prata, muita prata.', 'Alguém viu um dragão pequeno roubando galinhas.']),
  t('gancho', 'Gancho de missão', '❗', ['Uma carta selada chega por engano para um dos heróis.', 'Um velho pede ajuda para recuperar o diário do filho.', 'A ponte da estrada principal caiu durante a noite.', 'Um bando de goblins exige pedágio na trilha.', 'A guarda oferece recompensa por um ladrão mascarado.', 'Uma criança jura que o pai virou lobo.', 'O sino da torre toca sozinho há três noites.', 'Um mago contrata escolta até ruínas proibidas.']),
  t('complicacao', 'Complicação', '⚠️', ['o contratante está mentindo', 'um rival chegou primeiro', 'começa uma tempestade', 'alguém do grupo é reconhecido como inimigo', 'o caminho está bloqueado', 'há um traidor entre os aliados', 'o alvo pede ajuda contra o verdadeiro vilão', 'o tempo é menor do que parecia']),
  t('tesouro', 'Tesouro', '💰', ['{3d6} moedas de ouro', '{2d10} moedas de prata e uma gema azul', 'anel com um brasão desconhecido', 'mapa rasgado pela metade', 'poção de cura que cheira a canela', 'adaga com runas que brilham no escuro', 'carta selada endereçada a um dos heróis', 'chave de ferro sem fechadura conhecida', '{1d4} pergaminhos em branco e tinta de lula']),
  t('encontro-floresta', 'Encontro na floresta', '🌲', ['{1d4} lobos famintos', 'um urso protegendo os filhotes', 'uma árvore que sussurra nomes', 'bandidos disfarçados de guardas', 'um altar coberto de flores frescas', 'silêncio total: nem os pássaros cantam', 'uma fada presa numa teia', 'caçadores atrás do mesmo rastro']),
  t('encontro-estrada', 'Encontro na estrada', '🛤️', ['mercadores com a carroça atolada', 'um mensageiro ferido', 'peregrinos indo ao templo', 'um posto de pedágio que não existia ontem', '{1d6} goblins armando uma emboscada', 'um cavaleiro desafiando quem passa', 'um corpo com um bilhete na mão', 'um mascate vendendo “mapas do tesouro”']),
  t('encontro-cidade', 'Encontro na cidade', '🏙️', ['um batedor de carteiras esbarra no grupo', 'uma briga de taverna sai para a rua', 'um pregador anuncia o fim do mundo', 'a guarda revista todo mundo', 'um nobre procura guarda-costas', 'uma criança vende informações', 'um incêndio no mercado', 'alguém segue o grupo a distância']),
  t('clima', 'Clima', '🌦️', ['garoa fina e névoa', 'sol forte, sem vento', 'tempestade chegando', 'neve fora de época', 'vento quente e poeira', 'noite clara de lua cheia', 'neblina tão densa que não se vê a própria mão', 'calor abafado antes da chuva']),
  t('item-curioso', 'Item curioso', '🔮', ['um espelho que mostra o ontem', 'uma bússola que aponta para o que você mais quer', 'um dado que sempre cai 3', 'uma pena que escreve sozinha', 'um sino sem badalo que ainda toca', 'um mapa que muda quando ninguém olha', 'uma moeda com duas caras', 'uma vela que queima para baixo']),
  t('combate', 'Complicação no combate', '⚔️', ['o chão começa a ceder', 'reforços inimigos chegam em {1d4} rodadas', 'uma tocha cai e o fogo se espalha', 'um inocente fica no meio da luta', 'o líder inimigo tenta fugir', 'chuva forte: ataques à distância ficam difíceis', 'um dos inimigos se rende e pede ajuda', 'a luz se apaga de repente']),
]

const ID = /^[a-z0-9-]{1,40}$/
export function lerTabelas(v: unknown): Tabela[] {
  const vistos = new Set(TABELAS_PRONTAS.map(x => x.id))
  return (Array.isArray(v) ? v : []).slice(0, LIM_TABELAS.tabelas).flatMap(x => {
    const o = x && typeof x === 'object' ? x as Record<string, unknown> : {}
    const nome = typeof o.nome === 'string' ? o.nome.trim().slice(0, LIM_TABELAS.nome) : ''
    if (!nome || typeof o.id !== 'string' || !ID.test(o.id) || vistos.has(o.id)) return []
    vistos.add(o.id)
    const linhas = (Array.isArray(o.linhas) ? o.linhas : []).flatMap(l => typeof l === 'string' && l.trim() ? [l.trim().slice(0, LIM_TABELAS.linha)] : []).slice(0, LIM_TABELAS.linhas)
    if (!linhas.length) return []
    return [{ id: o.id, nome, icone: typeof o.icone === 'string' && ICONES_TABELA.includes(o.icone) ? o.icone : '🎲', linhas }]
  })
}

/** Sorteia um resultado: rola os {dados} e resolve as [[outras tabelas]] (até 3 níveis). */
export function rolarTabela(id: string, todas: Tabela[], sorte: () => number = Math.random, nivel = 0): string {
  const tab = todas.find(x => x.id === id)
  if (!tab || !tab.linhas.length) return '?'
  let r = tab.linhas[Math.floor(sorte() * tab.linhas.length)] ?? tab.linhas[0]
  r = r.replace(/\{([0-9d+\-]{1,20})\}/gi, (_, e) => String(rolarExpressao(e)?.total ?? e))
  if (nivel < 3) r = r.replace(/\[\[([a-z0-9-]{1,40})\]\]/g, (_, outra) => rolarTabela(outra, todas, sorte, nivel + 1))
  return r
}
/** Texto da linha → id de tabela nova (ex.: “Nomes élficos” → “nomes-elficos”). */
export const idDeTabela = (nome: string) => nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'tabela'
