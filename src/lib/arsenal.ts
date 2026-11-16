/**
 * Arsenal pronto (v0.35.3): itens genéricos por estilo de jogo, para quem quer achar rápido.
 * Não seguem nenhum livro: os dados são sugestões neutras e o mestre ajusta como quiser.
 * Cada item usa um ícone do acervo Game-Icons (gi:autor/nome, conferido no teste).
 */
import type { CategoriaItem, Item, RolagemItem } from './sistemas/inventario'

export type EstiloArsenal = 'medieval' | 'faroeste' | 'moderno' | 'scifi' | 'terror'
export type ItemArsenal = { nome: string; categoria: CategoriaItem; icone: string; peso: number; dano?: string; alcance?: number; rolagens?: RolagemItem[]; descricao: string }

export const ESTILOS_ARSENAL: { id: EstiloArsenal; nome: string; icone: string }[] = [
  { id: 'medieval', nome: 'Medieval e fantasia', icone: 'gi:lorc/broadsword' },
  { id: 'faroeste', nome: 'Faroeste', icone: 'gi:delapouite/revolver' },
  { id: 'moderno', nome: 'Moderno', icone: 'gi:sbed/rifle' },
  { id: 'scifi', nome: 'Ficção científica', icone: 'gi:sbed/laser-gun' },
  { id: 'terror', nome: 'Terror', icone: 'gi:delapouite/chainsaw' },
]

const a = (nome: string, icone: string, peso: number, dano: string, descricao: string, extra: Partial<ItemArsenal> = {}): ItemArsenal =>
  ({ nome, categoria: 'arma', icone: 'gi:' + icone, peso, dano, descricao, ...extra })
const i = (nome: string, categoria: CategoriaItem, icone: string, peso: number, descricao: string, extra: Partial<ItemArsenal> = {}): ItemArsenal =>
  ({ nome, categoria, icone: 'gi:' + icone, peso, descricao, ...extra })

export const ARSENAL: Record<EstiloArsenal, ItemArsenal[]> = {
  medieval: [
    a('Espada longa', 'lorc/broadsword', 1.5, '1d8', 'Lâmina reta de uma mão.'),
    a('Montante', 'delapouite/two-handed-sword', 3, '2d6', 'Espada grande, usada com as duas mãos.'),
    a('Adaga', 'lorc/plain-dagger', 0.5, '1d4', 'Leve e fácil de esconder; pode ser arremessada.', { alcance: 6 }),
    a('Machado de batalha', 'lorc/battle-axe', 2, '1d8', 'Machado de uma mão.'),
    a('Machado grande', 'delapouite/war-axe', 3.5, '1d12', 'Pesado, usado com as duas mãos.'),
    a('Lança', 'lorc/barbed-spear', 1.5, '1d6', 'Pode ser arremessada.', { alcance: 6 }),
    a('Alabarda', 'lorc/halberd', 3, '1d10', 'Haste longa: alcança um pouco mais longe.', { alcance: 3 }),
    a('Maça', 'delapouite/flanged-mace', 2, '1d6', 'Arma de impacto.'),
    a('Martelo de guerra', 'delapouite/warhammer', 2, '1d8', 'Arma de impacto pesada.'),
    a('Mangual', 'delapouite/flail', 1, '1d8', 'Bola com espinhos presa a uma corrente.'),
    a('Arco', 'delapouite/bow-arrow', 1, '1d8', 'Arma de disparo; precisa de flechas.', { alcance: 45 }),
    a('Besta', 'carl-olsen/crossbow', 2.5, '1d10', 'Dispara virotes; lenta para recarregar.', { alcance: 30 }),
    a('Funda', 'delapouite/sling', 0.1, '1d4', 'Arremessa pedras.', { alcance: 9 }),
    a('Cajado', 'lorc/wizard-staff', 2, '1d6', 'Bastão de madeira; serve de foco para magias.'),
    a('Varinha', 'lorc/crystal-wand', 0.2, '1d6', 'Foco mágico. Troque o dano pelo efeito da magia.', { alcance: 18 }),
    i('Escudo', 'armadura', 'delapouite/roman-shield', 3, 'Defesa extra enquanto empunhado.'),
    i('Armadura de couro', 'armadura', 'delapouite/leather-armor', 5, 'Leve e silenciosa.'),
    i('Cota de placas', 'armadura', 'delapouite/chest-armor', 20, 'Pesada e muito resistente.'),
    i('Elmo', 'armadura', 'lorc/visored-helm', 2, 'Protege a cabeça.'),
    i('Poção de cura', 'consumivel', 'delapouite/health-potion', 0.25, 'Recupera vida ao beber.', { dano: '2d4+2' }),
    i('Tocha', 'equipamento', 'delapouite/torch', 0.5, 'Ilumina por cerca de uma hora.'),
    i('Corda (15 m)', 'equipamento', 'delapouite/rope-coil', 5, 'Corda resistente.'),
    i('Mochila', 'equipamento', 'delapouite/backpack', 2, 'Carrega o equipamento.'),
    i('Pergaminho de magia', 'consumivel', 'lorc/scroll-unfurled', 0.1, 'Uma magia escrita, usada uma vez.'),
  ],
  faroeste: [
    a('Revólver', 'delapouite/revolver', 1.2, '2d6', 'Seis tiros antes de recarregar.', { alcance: 25 }),
    a('Revólver de cano longo', 'skoll/revolver', 1.4, '2d6', 'Mais preciso a distância.', { alcance: 35 }),
    a('Rifle de repetição', 'skoll/winchester-rifle', 3.5, '2d8', 'Rifle de alavanca.', { alcance: 90 }),
    a('Espingarda', 'sbed/shotgun', 3.5, '3d6', 'Devastadora de perto, fraca de longe.', { alcance: 15, rolagens: [{ nome: 'De longe', expr: '1d6' }] }),
    a('Escopeta de cano serrado', 'delapouite/sawed-off-shotgun', 2.5, '3d6', 'Curta, fácil de esconder, só funciona de perto.', { alcance: 6 }),
    a('Faca de caça', 'lorc/broad-dagger', 0.4, '1d4', 'Também serve para arremessar.', { alcance: 6 }),
    a('Machadinha', 'delapouite/hatchet', 0.8, '1d6', 'Ferramenta e arma.', { alcance: 6 }),
    i('Laço', 'arma', 'delapouite/lasso', 1, 'Prende e derruba; o mestre decide o teste.', { alcance: 9 }),
    a('Dinamite', 'delapouite/dynamite', 0.3, '3d6', 'Explode numa área. Pavio curto!', { alcance: 15 }),
    a('Chicote', 'lorc/whip', 1, '1d4', 'Alcança um pouco mais longe.', { alcance: 3 }),
    i('Munição (50)', 'equipamento', 'sbed/ammo-box', 1, 'Caixa de balas.'),
    i('Coldre', 'equipamento', 'delapouite/cowboy-holster', 0.5, 'Saque rápido.'),
    i('Chapéu', 'armadura', 'delapouite/outback-hat', 0.2, 'Protege do sol.'),
    i('Botas de cowboy', 'equipamento', 'delapouite/cowboy-boot', 1.5, 'Com esporas.'),
    i('Sela', 'equipamento', 'delapouite/saddle', 10, 'Para montar.'),
    i('Lampião', 'equipamento', 'lorc/lantern', 1, 'Ilumina e resiste ao vento.'),
    i('Cantil', 'consumivel', 'delapouite/water-bottle', 1, 'Água para a viagem.'),
    i('Uísque', 'consumivel', 'lorc/brandy-bottle', 1, 'Coragem líquida.'),
    i('Bandagens', 'consumivel', 'lorc/bandage-roll', 0.1, 'Primeiros socorros.', { dano: '1d4' }),
    i('Saco de ouro', 'tesouro', 'delapouite/gold-nuggets', 0.5, 'Pepitas de ouro.'),
  ],
  moderno: [
    a('Pistola', 'john-colburn/pistol-gun', 0.9, '2d6', 'Semiautomática.', { alcance: 25 }),
    a('Rifle', 'sbed/rifle', 4, '2d8', 'Rifle de assalto ou de caça.', { alcance: 100, rolagens: [{ nome: 'Rajada', expr: '3d8' }] }),
    a('Submetralhadora', 'skoll/m3-grease-gun', 3, '2d6', 'Disparo automático.', { alcance: 30, rolagens: [{ nome: 'Rajada', expr: '3d6' }] }),
    a('Metralhadora', 'skoll/machine-gun', 10, '2d10', 'Pesada; melhor apoiada.', { alcance: 120 }),
    a('Espingarda', 'sbed/shotgun', 3.5, '3d6', 'Devastadora de perto.', { alcance: 15, rolagens: [{ nome: 'De longe', expr: '1d6' }] }),
    a('Faca tática', 'lorc/broad-dagger', 0.3, '1d4', 'Lâmina de combate.'),
    a('Taco de beisebol', 'delapouite/baseball-bat', 1, '1d6', 'Improvisado, mas eficiente.'),
    a('Pé de cabra', 'delapouite/crowbar', 1.5, '1d6', 'Abre portas e cabeças.'),
    a('Granada', 'lorc/grenade', 0.4, '3d6', 'Explode numa área.', { alcance: 12 }),
    a('Coquetel molotov', 'lorc/molotov', 0.5, '2d6', 'Fogo numa área.', { alcance: 12 }),
    a('Lança-chamas', 'delapouite/flamethrower', 15, '3d6', 'Cone de fogo.', { alcance: 6 }),
    i('Colete à prova de balas', 'armadura', 'skoll/kevlar-vest', 4, 'Reduz o dano de tiros.'),
    i('Máscara de gás', 'armadura', 'lorc/gas-mask', 0.6, 'Protege de gases.'),
    i('Kit de primeiros socorros', 'consumivel', 'delapouite/first-aid-kit', 1, 'Trata ferimentos.', { dano: '1d6+2' }),
    i('Seringa de adrenalina', 'consumivel', 'lorc/syringe', 0.05, 'Um fôlego a mais.'),
    i('Munição', 'equipamento', 'sbed/ammo-box', 1, 'Carregadores extras.'),
    i('Lanterna', 'equipamento', 'delapouite/flashlight', 0.3, 'Ilumina um cone à frente.'),
    i('Celular', 'equipamento', 'delapouite/phone', 0.2, 'Quando tem sinal…'),
    i('Rádio', 'equipamento', 'delapouite/pocket-radio', 0.4, 'Comunicação com o grupo.'),
    i('Binóculos', 'equipamento', 'delapouite/binoculars', 0.8, 'Vê longe.'),
    i('Algemas', 'equipamento', 'lorc/handcuffs', 0.3, 'Prende alguém.'),
    i('Gazuas', 'equipamento', 'delapouite/lockpicks', 0.1, 'Abre fechaduras.'),
    i('Notebook', 'equipamento', 'delapouite/laptop', 2, 'Pesquisa e invasão.'),
  ],
  scifi: [
    a('Pistola laser', 'sbed/laser-gun', 0.8, '2d6', 'Feixe de energia.', { alcance: 30 }),
    a('Blaster', 'sbed/blaster', 1.2, '2d8', 'Disparos de plasma.', { alcance: 35 }),
    a('Arma de raios', 'lorc/ray-gun', 1, '2d6', 'Modelo antigo, ainda funciona.', { alcance: 25 }),
    a('Atordoador', 'delapouite/zat-gun', 0.7, '1d6', 'Atordoa em vez de matar; o mestre decide o efeito.', { alcance: 20 }),
    a('Espada de energia', 'lorc/energy-sword', 1, '2d8', 'Lâmina de energia.'),
    a('Canhão de plasma', 'lorc/plasma-bolt', 8, '4d6', 'Pesado e devastador.', { alcance: 60 }),
    a('Minigun', 'lorc/minigun', 18, '3d8', 'Chuva de projéteis.', { alcance: 60 }),
    a('Lança-mísseis', 'delapouite/missile-launcher', 12, '4d8', 'Explode numa área.', { alcance: 150 }),
    a('Granada de pulso', 'lorc/grenade', 0.4, '3d6', 'Explosão de energia numa área.', { alcance: 12 }),
    a('Faca vibratória', 'lorc/plain-dagger', 0.3, '1d6', 'Lâmina que vibra e corta quase tudo.'),
    i('Capacete espacial', 'armadura', 'delapouite/astronaut-helmet', 2, 'Oxigênio por algumas horas.'),
    i('Traje espacial', 'armadura', 'lorc/space-suit', 12, 'Protege do vácuo.'),
    i('Armadura de combate', 'armadura', 'lorc/armor-vest', 10, 'Placas leves de liga.'),
    i('Medkit', 'consumivel', 'sbed/medical-pack', 1, 'Nanorremédios.', { dano: '2d6' }),
    i('Estimulante', 'consumivel', 'lorc/syringe', 0.05, 'Reflexos acelerados por pouco tempo.'),
    i('Célula de energia', 'equipamento', 'delapouite/car-battery', 0.5, 'Recarrega armas de energia.'),
    i('Cartão de acesso', 'equipamento', 'delapouite/key-card', 0.01, 'Abre portas da estação.'),
    i('Tablet', 'equipamento', 'skoll/tablet', 0.5, 'Computador portátil.'),
    i('Olho cibernético', 'equipamento', 'delapouite/cyber-eye', 0, 'Implante de visão.'),
    i('Drone', 'equipamento', 'delapouite/robot-antennas', 2, 'Pequeno robô de apoio.'),
  ],
  terror: [
    a('Motosserra', 'delapouite/chainsaw', 6, '2d8', 'Barulhenta e brutal.'),
    a('Machete', 'lorc/machete', 1, '1d6', 'Abre caminho no mato.'),
    a('Cutelo', 'delapouite/cleaver', 0.8, '1d6', 'Faca de açougueiro.'),
    a('Machadinha', 'delapouite/hatchet', 0.8, '1d6', 'Para lenha… e outras coisas.'),
    a('Foice', 'lorc/scythe', 2.5, '2d4', 'Lâmina curva de haste longa.'),
    a('Revólver', 'delapouite/revolver', 1.2, '2d6', 'Poucas balas, use bem.', { alcance: 25 }),
    a('Espingarda', 'sbed/shotgun', 3.5, '3d6', 'Para o que não deveria se levantar.', { alcance: 15 }),
    a('Bala de prata', 'delapouite/silver-bullet', 0.01, '2d6', 'Contra criaturas que temem prata.', { alcance: 25 }),
    a('Estaca de madeira', 'delapouite/heart-stake', 0.5, '1d4', 'Para o coração de um vampiro.'),
    a('Bisturi', 'lorc/scalpel', 0.05, '1d3', 'Pequeno e afiado.'),
    i('Crucifixo', 'equipamento', 'delapouite/crucifix', 0.1, 'Fé contra o mal.'),
    i('Água benta', 'consumivel', 'delapouite/holy-water', 0.3, 'Queima criaturas profanas.', { dano: '2d6', alcance: 6 }),
    i('Alho', 'consumivel', 'delapouite/garlic', 0.1, 'Afasta vampiros, dizem.'),
    i('Sal', 'consumivel', 'lorc/salt-shaker', 0.2, 'Um círculo de sal protege.'),
    i('Velas', 'equipamento', 'delapouite/candles', 0.2, 'Luz fraca para rituais.'),
    i('Livro proibido', 'equipamento', 'delapouite/spell-book', 1.5, 'Ninguém deveria ler isto.'),
    i('Lanterna', 'equipamento', 'delapouite/flashlight', 0.3, 'A pilha sempre acaba na pior hora.'),
    i('Pé de cabra', 'equipamento', 'delapouite/crowbar', 1.5, 'Abre portas e caixões.', { dano: '1d6' }),
    i('Kit de primeiros socorros', 'consumivel', 'delapouite/first-aid-kit', 1, 'Trata ferimentos.', { dano: '1d6+2' }),
    i('Cartas de tarô', 'equipamento', 'caro-asercion/tarot-00-the-fool', 0.1, 'Mostram o que vem por aí.'),
  ],
}

/** Item do arsenal pronto para entrar no inventário (com id novo). */
export function itemDoArsenal(x: ItemArsenal, novoId: () => string): Item {
  return { id: novoId(), nome: x.nome, categoria: x.categoria, peso: x.peso, bonus: [], iconeBiblioteca: x.icone, descricao: x.descricao,
    ...(x.dano ? { dano: x.dano } : {}), ...(x.alcance ? { alcance: x.alcance } : {}), ...(x.rolagens?.length ? { rolagens: x.rolagens } : {}) }
}
