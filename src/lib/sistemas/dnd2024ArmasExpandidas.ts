/**
 * Índice expandido de referências de armas para D&D 5e.
 * Os nomes e o livro de origem são metadados bibliográficos; regras de suplementos
 * pagos NÃO são reproduzidas nem aplicadas automaticamente sem ficha preenchida.
 *
 * Escopo: armas adicionais do DMG 2024, três armas de cenário e nomes
 * levantados até 13/11/2026 nos índices de livros e D&D Beyond.
 * A lista é extensa mas NÃO pode ser considerada exaustiva de toda a 5e.
 */
export type ClasseReferenciaDnd = 'moderna' | 'futurista' | 'cenario' | 'magica' | 'indice'
export type ReferenciaArmaDnd = {
  id: string; nome: string; livro: string; edicao: string; classe: ClasseReferenciaDnd
  /** Dano base confirmado para armas não mágicas; as mágicas exigem consultar o livro. */
  dano?: string; tipoDano?: string; armaBase?: string
  /** Índice externo precisa conferir editora, edição e fonte exata. */
  conferida: boolean; propriedades?: string
}
type Livro = { livro: string; edicao?: string; nomes: string; classe?: ClasseReferenciaDnd; conferida?: boolean }
const normal = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const REGISTROS: Livro[] = [
  { livro: 'Guia do Mestre 2024', edicao: '2024', classe: 'moderna', conferida: true,
    nomes: 'Rifle automático|Rifle de caça|Revólver|Pistola semiautomática|Escopeta' },
  { livro: 'Guia do Mestre 2024', edicao: '2024', classe: 'futurista', conferida: true,
    nomes: 'Rifle de antimatéria|Pistola laser|Rifle laser' },
  { livro: 'Tomb of Annihilation', nomes: 'Yklwa', classe: 'cenario', conferida: true },
  { livro: 'Eberron: Rising from the Last War', nomes: 'Double-Bladed Scimitar', classe: 'cenario', conferida: true },
  { livro: 'Dragonlance: Shadow of the Dragon Queen', nomes: 'Hoopak', classe: 'cenario', conferida: true },

  { livro: 'Dungeon Master’s Guide 2014 / 2024', edicao: '2014/2024',
    nomes: 'Ammunition +1/+2/+3|Weapon +1/+2/+3|Javelin of Lightning|Sword of Vengeance|Trident of Fish Command|Weapon of Warning|Berserker Axe|Dagger of Venom|Dragon Slayer|Flame Tongue|Giant Slayer|Mace of Disruption|Mace of Smiting|Mace of Terror|Sun Blade|Sword of Life Stealing|Sword of Wounding|Vicious Weapon|Arrow of Slaying|Dancing Sword|Dwarven Thrower|Frost Brand|Nine Lives Stealer|Oathbow|Scimitar of Speed|Sword of Sharpness|Blackrazor|Defender|Hammer of Thunderbolts|Holy Avenger|Luck Blade|Moonblade|Sword of Answering|Vorpal Sword|Wave|Whelm|Axe of the Dwarvish Lords|Sword of Kas' },
  { livro: 'Xanathar’s Guide to Everything', nomes: 'Moon-Touched Sword|Unbreakable Arrow|Walloping Ammunition' },
  { livro: 'Tasha’s Cauldron of Everything', nomes: 'Moon Sickle|Devotee’s Censer' },
  { livro: 'Eberron: Rising from the Last War', nomes: 'Armblade|Dyrrn’s Tentacle Whip' },
  { livro: 'Explorer’s Guide to Wildemount',
    nomes: 'Acheron Blade|Corpse Slayer|Needle of Mending|Weapon of Certain Death|Bloodaxe|Duskcrusher|Blade of Broken Mirrors|Grovelthrash|Lash of Shadows|Mace of the Black Crown|Ruin’s Wake|Silken Spite|The Bloody End|Will of the Talon' },
  { livro: 'Mythic Odysseys of Theros',
    nomes: 'Two-Birds Sling|Sling Bullets of Althemone|Akmon, Hammer of Purphoros|Dekella, Bident of Thassa|Ephixis, Bow of Nylea|Khrusor, Spear of Heliod|Mastix, Whip of Erebos' },
  { livro: 'Fizban’s Treasury of Dragons',
    nomes: 'Dragon’s Wrath Weapon|Crystal Blade|Dragon Wing Bow|Dragonlance|Flail of Tiamat|Topaz Annihilator' },
  { livro: 'Bigby Presents: Glory of the Giants',
    nomes: 'Lash of Immolation|Lucent Destroyer|Bloodshed Blade|Thunderbuss|Longbow of the Healing Hearth|Reaper’s Scream|Adze of Annam' },
  { livro: 'The Book of Many Things',
    nomes: 'Bloodrage Greataxe|Dried Leech|Sling of Giant Felling|Winged Ammunition|Bow of Conflagration|Glimmering Moonbow|Grasping Whip|Ruinous Flail|Starshot Crossbow|Baleful Talon|Bloodseeker Ammunition|Bow of Melodies|Fate Cutter Shears|Fool’s Blade|Forcebreaker Weapon|Hammer of Runic Focus|Stonemaker War Pick|Tidecaller Trident|Weapon of Throne’s Command|Sword of the Planes' },
  { livro: 'Princes of the Apocalypse',
    nomes: 'Seeker Dart|Storm Boomerang|Drown|Ironfang|Orcsplitter|Tinderstrike|Windvane' },
  { livro: 'Curse of Strahd',
    nomes: 'Blood Spear|Saint Markovia’s Thighbone|Sunsword|Crusader’s Shortsword|Yester Hill Axe' },
  { livro: 'Baldur’s Gate: Descent into Avernus',
    nomes: 'Hellfire Weapon|Fane-Eater|Matalotok|Blade of Avernus|Sword of Zariel' },
  { livro: 'Waterdeep: Dungeon of the Mad Mage', nomes: 'Dagger of Blindsight|Tearulai' },
  { livro: 'Waterdeep: Dragon Heist', nomes: 'Azuredge' },
  { livro: 'Tales from the Yawning Portal', nomes: 'Shatterspike|Spear of Backbiting|Waythe' },
  { livro: 'Tomb of Annihilation', nomes: 'Bookmark' },
  { livro: 'Out of the Abyss', nomes: 'Dawnbringer' },
  { livro: 'Storm King’s Thunder', nomes: 'Gurt’s Greataxe' },
  { livro: 'Van Richten’s Guide to Ravenloft', nomes: 'Nepenthe' },
  { livro: 'Guildmasters’ Guide to Ravnica', nomes: 'Sunforger|Sword of the Paruns|Rakdos Riteknife' },
  { livro: 'Lost Laboratory of Kwalish', nomes: 'Gambler’s Blade|Blade of the Medusa|Polymorph Blade' },
  { livro: 'Phandelver and Below: The Shattered Obelisk', nomes: 'Flayer Slayer|Luminous War Pick' },
  { livro: 'Candlekeep Mysteries', nomes: 'Serpent’s Fang' },
  { livro: 'Tyranny of Dragons', nomes: 'Dragontooth Dagger|Hazirawn' },
  { livro: 'The Wild Beyond the Witchlight', nomes: 'Woodcutter’s Axe|Steel|Snicker-Snack' },
  { livro: 'Sleeping Dragon’s Wake', nomes: 'Bonecounter' },
  { livro: 'Infernal Machine Rebuild', nomes: 'Ruinblade' },
  { livro: 'Critical Role: Call of the Netherdeep', nomes: 'Ruidium Weapon' },
  { livro: 'Dragonlance: Shadow of the Dragon Queen', nomes: 'Dragonlance' },

  { livro: 'Arcana Unleashed: Deadfall', edicao: '2026', nomes: 'Life-Sapping Blade|Thayan Sword|Trick Weapon' },
  { livro: 'Ravenloft: The Horrors Within', edicao: '2026', nomes: 'Ebonbane' },
  { livro: 'D&D: World of Warcraft (acesso antecipado 2026)', edicao: '2026',
    nomes: 'Ashbringer|Doomhammer|Frostmourne|Light’s Vengeance|Shadowmourne|Shalamayne|Sulfuras, Hand of Ragnaros|Twin Blades of Azzinoth' },

  { livro: 'Índice D&D Beyond — fonte individual a conferir', classe: 'indice', conferida: false,
    nomes: 'Adamantine Weapon|Silvered Weapon|Enspelled Weapon|Wave-Swept Weapon|Blade of the Guardian|Winter’s Dark Bite|Witchlight Vane|Wand of Orcus|Shadow’s Edge|Shadowfang|Energy Bow|Greater Silver Sword|Elven Thrower|Executioner’s Axe|Lightbringer|Hew|Javelin of Backbiting|Goading Ammunition|Sniper’s Bracelet|Dazzling Weapon|Bloodvenom Blade|Poison Soaked Kukri|Thunderous Greatclub|Revenant Double-Bladed Scimitar|Vicious Rapier +1|Climber’s Ammunition|Dispelling Ammunition|Yklwa +1/+2/+3|Boomerang +1/+2/+3' },
]
const DADOS_EXTRA: Record<string, { dano: string; tipoDano: string }> = {
  'Rifle automático': { dano: '2d8', tipoDano: 'Perfurante' },
  'Rifle de caça': { dano: '2d10', tipoDano: 'Perfurante' },
  'Revólver': { dano: '2d8', tipoDano: 'Perfurante' },
  'Pistola semiautomática': { dano: '2d6', tipoDano: 'Perfurante' },
  'Escopeta': { dano: '2d8', tipoDano: 'Perfurante' },
  'Rifle de antimatéria': { dano: '6d8', tipoDano: 'Necrótico' },
  'Pistola laser': { dano: '3d6', tipoDano: 'Radiante' },
  'Rifle laser': { dano: '3d8', tipoDano: 'Radiante' },
  Yklwa: { dano: '1d8', tipoDano: 'Perfurante' },
  'Double-Bladed Scimitar': { dano: '2d4', tipoDano: 'Cortante' },
}
/** Associação exclusivamente ao modelo de arma-base, NÃO às propriedades mágicas. */
const BASES_CONHECIDAS: Record<string, string> = {
  'Dwarven Thrower': 'martelo-guerra', 'Oathbow': 'arco-longo', 'Scimitar of Speed': 'cimitarra',
  'Dagger of Venom': 'adaga', 'Sun Blade': 'espada-longa', 'Mace of Disruption': 'maca',
  'Mace of Smiting': 'maca', 'Mace of Terror': 'maca', 'Flail of Tiamat': 'mangual',
  'Dyrrn’s Tentacle Whip': 'chicote', 'Bloodrage Greataxe': 'machado-grande',
  'Dragontooth Dagger': 'adaga', 'Gurt’s Greataxe': 'machado-grande',
  'Doomhammer': 'martelo-guerra', 'Storm Boomerang': 'dardo',
  'Greater Silver Sword': 'espada-grande', 'Tidecaller Trident': 'tridente',
}

export const ARMAS_DND_EXPANDIDAS: ReferenciaArmaDnd[] = REGISTROS.flatMap((g) =>
  g.nomes.split('|').map(nome => {
    const dados = DADOS_EXTRA[nome]
    const base = BASES_CONHECIDAS[nome]
    return {
      id: 'ref-' + normal(g.livro).slice(0, 35) + '-' + normal(nome).slice(0, 65),
      nome, livro: g.livro, edicao: g.edicao ?? '5e (legado)', classe: g.classe ?? 'magica',
      conferida: g.conferida !== false && (g.classe !== 'indice'),
      ...(dados ? { dano: dados.dano, tipoDano: dados.tipoDano } : {}),
      ...(base ? { armaBase: base } : {}),
    }
  }))
export const referenciaArmaDndPorId = (valor: unknown): ReferenciaArmaDnd | null =>
  typeof valor === 'string' ? ARMAS_DND_EXPANDIDAS.find(x => x.id === valor) ?? null : null
export const LIVROS_ARMAS_DND = Array.from(new Set(ARMAS_DND_EXPANDIDAS.map(x => x.livro))).sort((a, b) => a.localeCompare(b))
export const totalArmasDndCatalogo = (qtdBasicas: number) => qtdBasicas + ARMAS_DND_EXPANDIDAS.length
