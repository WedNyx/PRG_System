/**
 * Acervo completo do Game-Icons (v0.35.3): os 4.170 ícones do pacote game-icons-transparent (CC BY 3.0),
 * copiados para public/icones/gi no build (scripts/icones-game-icons.mjs). O item guarda `gi:autor/nome`.
 * A licença pede o crédito “Icons made by {autor}”: a ficha mostra o autor do ícone escolhido.
 */
export const PREFIXO_GI = 'gi:'
const ID_GI = /^gi:([a-z0-9-]{2,40})\/([a-z0-9-]{1,80})$/
export const ehIconeGi = (v: unknown): v is string => typeof v === 'string' && ID_GI.test(v)
export const urlIconeGi = (id: string) => { const m = ID_GI.exec(id); return m ? `/icones/gi/${m[1]}/${m[2]}.svg` : null }
export const partesIconeGi = (id: string) => { const m = ID_GI.exec(id); return m ? { autor: m[1], nome: m[2] } : null }
export const nomeLegivel = (nome: string) => nome.replace(/-/g, ' ')

export type IndiceGi = { total: number; autores: Record<string, string>; icones: [string, string][] }
let cache: Promise<IndiceGi> | null = null
/** Índice dos ícones (nomes e autores), baixado uma vez quando alguém abre a busca. */
export function carregarIndiceGi(): Promise<IndiceGi> {
  cache ??= fetch('/icones/gi/indice.json').then(r => { if (!r.ok) throw new Error('Não foi possível carregar os ícones.'); return r.json() as Promise<IndiceGi> })
    .catch(e => { cache = null; throw e })
  return cache
}

/** Temas para filtrar (os nomes dos ícones estão em inglês). */
export const TEMAS_GI: { id: string; nome: string; re: RegExp | null }[] = [
  { id: 'todos', nome: 'Todos', re: null },
  { id: 'armas', nome: 'Armas brancas', re: /sword|axe|dagger|spear|mace|hammer|blade|bow|arrow|flail|halberd|scythe|whip|katana|knife|club|sabre|saber|rapier|lance|trident|sickle|morning-star|glaive|crossbow|sling|shuriken/ },
  { id: 'fogo', nome: 'Armas de fogo', re: /pistol|revolver|rifle|gun|shotgun|bullet|musket|cannon|grenade|ammo|cartridge|sniper|bazooka|mortar|dynamite|blunderbuss|flintlock|uzi|mp5|ak47|winchester|colt|derringer/ },
  { id: 'scifi', nome: 'Ficção científica', re: /laser|ray-gun|plasma|robot|spaceship|space|alien|android|cyborg|ufo|rocket|energy|satellite|astronaut|mech|droid|teleport|hologram|circuit|blaster|battery|atom/ },
  { id: 'protecao', nome: 'Proteção', re: /armor|shield|helmet|breastplate|gauntlet|boot|cloak|chain-mail|visor|greaves|vest|bracer|cuirass|mask/ },
  { id: 'consumo', nome: 'Poções e comida', re: /potion|flask|vial|bottle|elixir|pill|herb|bread|meat|drink|mushroom|syringe|medical|bandage|first-aid|apple|cheese|wine|beer/ },
  { id: 'magia', nome: 'Magia', re: /magic|spell|wand|staff|rune|crystal|book|scroll|orb|grimoire|pentagram|sparkl|aura|portal|totem|tome|enchant|witch|wizard/ },
  { id: 'terror', nome: 'Terror', re: /skull|ghost|zombie|vampire|blood|coffin|grave|demon|bone|tentacle|haunt|corpse|cultist|devil|reaper|tombstone|chainsaw|evil|cthulhu/ },
  { id: 'tesouro', nome: 'Tesouros', re: /coin|gem|ring|amulet|crown|chest|gold|necklace|jewel|diamond|ruby|emerald|treasure|money|purse|trophy|pearl/ },
  { id: 'aventura', nome: 'Aventura', re: /rope|torch|key|lantern|backpack|map|compass|tent|lockpick|tool|bag|lamp|candle|pickaxe|shovel|spyglass|whistle|hourglass/ },
  { id: 'faroeste', nome: 'Faroeste', re: /cowboy|revolver|horse|saddle|lasso|cactus|wanted|sheriff|winchester|colt|stetson|spur|wagon|dynamite|bandit|saloon|derringer/ },
  { id: 'criaturas', nome: 'Criaturas', re: /dragon|wolf|spider|beast|monster|bear|snake|bat|griffin|troll|orc|goblin|ogre|wyvern|kraken|hydra|lion|eagle|raven|rat|slime|golem|unicorn|minotaur/ },
]

/** Palavras em português → inglês, para a busca (os nomes dos ícones estão em inglês). */
export const PT_EN: Record<string, string> = {
  espada: 'sword', machado: 'axe', adaga: 'dagger', faca: 'knife', lanca: 'spear', arco: 'bow', flecha: 'arrow', martelo: 'hammer', maca: 'mace', chicote: 'whip', foice: 'scythe', besta: 'crossbow',
  pistola: 'pistol', revolver: 'revolver', rifle: 'rifle', espingarda: 'shotgun', bala: 'bullet', canhao: 'cannon', granada: 'grenade', dinamite: 'dynamite', municao: 'ammo',
  laser: 'laser', robo: 'robot', nave: 'spaceship', alienigena: 'alien', foguete: 'rocket', energia: 'energy',
  armadura: 'armor', escudo: 'shield', elmo: 'helm', capacete: 'helmet', bota: 'boot', manto: 'cloak', luva: 'glove', mascara: 'mask',
  pocao: 'potion', frasco: 'flask', garrafa: 'bottle', erva: 'herb', pao: 'bread', carne: 'meat', cogumelo: 'mushroom', remedio: 'pill', seringa: 'syringe',
  magia: 'magic', feitico: 'spell', varinha: 'wand', cajado: 'staff', runa: 'rune', cristal: 'crystal', livro: 'book', pergaminho: 'scroll', orbe: 'orb', bruxa: 'witch', mago: 'wizard',
  caveira: 'skull', cranio: 'skull', fantasma: 'ghost', zumbi: 'zombie', vampiro: 'vampire', sangue: 'blood', caixao: 'coffin', tumulo: 'grave', demonio: 'demon', osso: 'bone', tentaculo: 'tentacle', motosserra: 'chainsaw',
  moeda: 'coin', joia: 'jewel', anel: 'ring', amuleto: 'amulet', coroa: 'crown', bau: 'chest', ouro: 'gold', colar: 'necklace', diamante: 'diamond', tesouro: 'treasure', bolsa: 'purse', trofeu: 'trophy',
  corda: 'rope', tocha: 'torch', chave: 'key', lanterna: 'lantern', mochila: 'backpack', mapa: 'map', bussola: 'compass', barraca: 'tent', vela: 'candle', picareta: 'pickaxe', pa: 'shovel', luneta: 'spyglass', ampulheta: 'hourglass',
  cavalo: 'horse', sela: 'saddle', laco: 'lasso', cacto: 'cactus', xerife: 'sheriff', chapeu: 'hat', carroca: 'wagon',
  dragao: 'dragon', lobo: 'wolf', aranha: 'spider', urso: 'bear', cobra: 'snake', morcego: 'bat', grifo: 'griffin', ogro: 'ogre', rato: 'rat', corvo: 'raven', leao: 'lion', aguia: 'eagle', unicornio: 'unicorn',
  fogo: 'fire', gelo: 'ice', raio: 'lightning', veneno: 'poison', luz: 'light', sombra: 'shadow', agua: 'water', terra: 'earth', vento: 'wind', olho: 'eye', mao: 'hand', coracao: 'heart',
}
const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Filtra o índice pela busca (português ou inglês) e pelo tema. */
export function buscarIconesGi(indice: IndiceGi, busca: string, tema = 'todos'): [string, string][] {
  const termos = semAcento(busca).trim().split(/\s+/).filter(Boolean).map(t => PT_EN[t] ?? t)
  const re = TEMAS_GI.find(t => t.id === tema)?.re ?? null
  return indice.icones.filter(([, n]) => (!re || re.test(n)) && termos.every(t => n.includes(t)))
}
