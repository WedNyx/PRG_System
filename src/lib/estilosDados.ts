/**
 * Aparência dos dados (v0.37.1): conjuntos prontos para escolher em Perfil › Aparência. Quem rola usa o seu,
 * e na mesa todo mundo vê os dados com a cara de quem rolou (3D e cartão do resultado).
 * Material do dice-box-threejs: 'glass' | 'metal' | 'wood' | 'plastic' | 'none'.
 * Texturas: as que vêm com o dice-box-threejs (licença MIT), copiadas em public/assets/dados3d/textures
 * (só as usadas aqui, ~330 KB, baixadas na hora da rolagem). O nome é a chave da lista de texturas da biblioteca.
 */
export type Material = 'glass' | 'metal' | 'wood' | 'plastic' | 'none'
export type Textura = 'marble' | 'stars' | 'astral' | 'dragon' | 'fire' | 'ice' | 'wood' | 'metal' | 'paper' | 'skulls' | 'cloudy_2' | 'glitter' | 'stainedglass' | 'lizard' | 'water' | 'speckles'
export type EstiloDado = { id: string; nome: string; descricao: string; fundo: string; numero: string; contorno: string; material: Material; textura?: Textura }

export const PASTA_DADOS3D = '/assets/dados3d/'
/** Arquivo da imagem de cada textura (para a vitrine 2D). */
export const ARQUIVO_TEXTURA: Record<Textura, string> = {
  marble: 'marble', stars: 'stars', astral: 'astral', dragon: 'dragon', fire: 'fire', ice: 'ice', wood: 'wood', metal: 'metal', paper: 'paper',
  skulls: 'skulls', cloudy_2: 'cloudy.alt', glitter: 'glitter', stainedglass: 'stainedglass', lizard: 'lizard', water: 'water', speckles: 'speckles',
}
export const imagemTextura = (t: Textura) => `${PASTA_DADOS3D}textures/${ARQUIVO_TEXTURA[t]}.webp`

export const ESTILOS_DADOS: EstiloDado[] = [
  { id: 'ametista', nome: 'Ametista', descricao: 'Vidro roxo nublado, o padrão da plataforma', fundo: '#8b5cf6', numero: '#ffffff', contorno: '#2e1065', material: 'glass', textura: 'cloudy_2' },
  { id: 'lua', nome: 'Luar', descricao: 'Perolado com números roxos', fundo: '#f1ecff', numero: '#5b21b6', contorno: '#c4b5fd', material: 'plastic', textura: 'cloudy_2' },
  { id: 'marmore', nome: 'Mármore', descricao: 'Mármore branco com veios', fundo: '#f5f5f4', numero: '#1c1917', contorno: '#78716c', material: 'glass', textura: 'marble' },
  { id: 'estrelado', nome: 'Céu Estrelado', descricao: 'Azul-noite cheio de estrelas', fundo: '#3b5bdb', numero: '#fde68a', contorno: '#0b1437', material: 'none', textura: 'stars' },
  { id: 'astral', nome: 'Mar Astral', descricao: 'Nebulosa roxa e rosa', fundo: '#c084fc', numero: '#ffffff', contorno: '#3b0764', material: 'none', textura: 'astral' },
  { id: 'ouro', nome: 'Ouro', descricao: 'Metal dourado escovado', fundo: '#e0b030', numero: '#2b1d03', contorno: '#7a5a00', material: 'metal', textura: 'metal' },
  { id: 'prata', nome: 'Prata', descricao: 'Aço escovado', fundo: '#d6dbe3', numero: '#1f2430', contorno: '#6b7280', material: 'metal', textura: 'metal' },
  { id: 'cobre', nome: 'Cobre', descricao: 'Metal acobreado escovado', fundo: '#c8774a', numero: '#fff3e6', contorno: '#5c2a12', material: 'metal', textura: 'metal' },
  { id: 'fogo', nome: 'Chamas', descricao: 'Fogo vivo em metal', fundo: '#fbbf24', numero: '#3b0a00', contorno: '#7c2d12', material: 'metal', textura: 'fire' },
  { id: 'sangue', nome: 'Sangue', descricao: 'Mármore vermelho-escuro', fundo: '#be123c', numero: '#ffe4e6', contorno: '#3f0715', material: 'glass', textura: 'marble' },
  { id: 'esmeralda', nome: 'Esmeralda', descricao: 'Pedra verde com veios', fundo: '#10b981', numero: '#ecfdf5', contorno: '#022c22', material: 'glass', textura: 'marble' },
  { id: 'gelo', nome: 'Gelo', descricao: 'Cristal de gelo transparente', fundo: '#7dd3fc', numero: '#0c2a43', contorno: '#0369a1', material: 'glass', textura: 'ice' },
  { id: 'agua', nome: 'Água', descricao: 'Ondas azuis transparentes', fundo: '#0ea5e9', numero: '#ffffff', contorno: '#0c4a6e', material: 'glass', textura: 'water' },
  { id: 'vitral', nome: 'Vitral', descricao: 'Vidro colorido de catedral', fundo: '#60a5fa', numero: '#fff7ed', contorno: '#1e3a8a', material: 'glass', textura: 'stainedglass' },
  { id: 'dragao', nome: 'Escamas de Dragão', descricao: 'Escamas verdes em relevo', fundo: '#34d399', numero: '#fef9c3', contorno: '#064e3b', material: 'none', textura: 'dragon' },
  { id: 'lagarto', nome: 'Pele de Lagarto', descricao: 'Couro de réptil dourado', fundo: '#d9a441', numero: '#1c1203', contorno: '#5b3a0a', material: 'none', textura: 'lizard' },
  { id: 'caveira', nome: 'Caveiras', descricao: 'Osso com caveirinhas', fundo: '#f3ead8', numero: '#1a1a1a', contorno: '#57534e', material: 'none', textura: 'skulls' },
  { id: 'purpurina', nome: 'Purpurina', descricao: 'Rosa brilhante', fundo: '#f472b6', numero: '#ffffff', contorno: '#831843', material: 'none', textura: 'glitter' },
  { id: 'pergaminho', nome: 'Pergaminho', descricao: 'Papel antigo com tinta marrom', fundo: '#f1dfb8', numero: '#4a2a0a', contorno: '#8a6a3a', material: 'wood', textura: 'paper' },
  { id: 'madeira', nome: 'Carvalho', descricao: 'Madeira com veios', fundo: '#c08850', numero: '#2a1608', contorno: '#4a2c12', material: 'wood', textura: 'wood' },
  { id: 'obsidiana', nome: 'Obsidiana', descricao: 'Vidro negro com números dourados', fundo: '#141018', numero: '#fbbf24', contorno: '#000000', material: 'glass' },
  { id: 'neon', nome: 'Neon', descricao: 'Preto com números ciano', fundo: '#0b1020', numero: '#22d3ee', contorno: '#ec4899', material: 'plastic' },
  { id: 'osso', nome: 'Osso', descricao: 'Marfim salpicado', fundo: '#efe4c8', numero: '#3b2f22', contorno: '#9c8a68', material: 'plastic', textura: 'speckles' },
]
export const DADO_PADRAO = 'ametista'

export const ehEstiloDado = (id: unknown): id is string => ESTILOS_DADOS.some(e => e.id === id)
export const estiloDado = (id: unknown): EstiloDado => ESTILOS_DADOS.find(e => e.id === id) ?? ESTILOS_DADOS[0]

/** Configuração de cor do dice-box-threejs para um estilo. */
export const colorsetDe = (e: EstiloDado) => ({ name: 'prg-' + e.id, foreground: e.numero, background: e.fundo, outline: e.contorno, texture: e.textura ?? 'none', material: e.material })
