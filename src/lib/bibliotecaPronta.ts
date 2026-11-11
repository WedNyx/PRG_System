/**
 * Biblioteca pronta (v0.32.4): itens e poderes genéricos da plataforma (texto próprio, sem regras de livros),
 * para o mestre copiar para a biblioteca da campanha com um toque. Os bônus ficam de fora porque cada sistema
 * tem os seus; o mestre ajusta depois, se quiser.
 */
import type { Item, Poder } from './sistemas/inventario'

export type Pronto = { tipo: 'item'; grupo: string; dados: Omit<Item, 'id'> } | { tipo: 'poder'; grupo: string; dados: Omit<Poder, 'id'> }

const it = (grupo: string, nome: string, categoria: Item['categoria'], peso: number, extra: Partial<Item> = {}): Pronto =>
  ({ tipo: 'item', grupo, dados: { nome, categoria, peso, bonus: [], ...extra } })
const pd = (grupo: string, nome: string, tipo: Poder['tipo'], extra: Partial<Poder> = {}): Pronto =>
  ({ tipo: 'poder', grupo, dados: { nome, tipo, ...extra } })

export const GRUPOS_PRONTOS = [
  { id: 'armas', nome: '⚔️ Armas' }, { id: 'protecao', nome: '🛡️ Proteção' }, { id: 'consumiveis', nome: '🧪 Consumíveis' },
  { id: 'aventura', nome: '🎒 Aventura' }, { id: 'tesouros', nome: '💎 Tesouros' }, { id: 'poderes', nome: '✨ Poderes' },
]

export const PRONTOS: Pronto[] = [
  it('armas', 'Espada longa', 'arma', 1.5, { dano: '1d8', arte: { forma: 'espada', cor: '#cbd5e1', cor2: '#a78bfa' } }),
  it('armas', 'Adaga', 'arma', 0.5, { dano: '1d4', alcance: 6, descricao: 'Leve; dá para arremessar.', arte: { forma: 'adaga', cor: '#cbd5e1', cor2: '#ef4444' } }),
  it('armas', 'Machado de batalha', 'arma', 2, { dano: '1d8', arte: { forma: 'machado', cor: '#cbd5e1', cor2: '#78350f' } }),
  it('armas', 'Martelo de guerra', 'arma', 2.5, { dano: '1d8', arte: { forma: 'martelo', cor: '#94a3b8', cor2: '#f59e0b' } }),
  it('armas', 'Lança', 'arma', 1.5, { dano: '1d6', alcance: 3, arte: { forma: 'lanca', cor: '#cbd5e1', cor2: '#22c55e' } }),
  it('armas', 'Arco curto', 'arma', 1, { dano: '1d6', alcance: 24, arte: { forma: 'arco', cor: '#a16207', cor2: '#38bdf8' } }),
  it('armas', 'Cajado', 'arma', 2, { dano: '1d6', arte: { forma: 'cajado', cor: '#a78bfa', cor2: '#f59e0b' } }),
  it('armas', 'Lâmina do Crepúsculo', 'arma', 1.5, { magico: true, dano: '1d8+1d6', raridade: 'raro', descricao: 'Brilha em roxo quando a lua aparece.', arte: { forma: 'espada', cor: '#a78bfa', cor2: '#f59e0b' } }),
  it('protecao', 'Escudo de madeira', 'armadura', 3, { descricao: 'Ajuste o bônus de defesa do seu sistema em “Bônus”.', arte: { forma: 'escudo', cor: '#a16207', cor2: '#cbd5e1' } }),
  it('protecao', 'Armadura de couro', 'armadura', 5, { descricao: 'Leve e silenciosa.', arte: { forma: 'armadura', cor: '#78350f', cor2: '#fbbf24' } }),
  it('protecao', 'Cota de malha', 'armadura', 15, { descricao: 'Pesada; protege bem.', arte: { forma: 'armadura', cor: '#94a3b8', cor2: '#38bdf8' } }),
  it('protecao', 'Elmo de ferro', 'armadura', 1.5, { arte: { forma: 'elmo', cor: '#94a3b8', cor2: '#ef4444' } }),
  it('consumiveis', 'Poção de cura', 'consumivel', 0.5, { dano: '2d4+2', descricao: 'Cura a vida pela rolagem.', arte: { forma: 'pocao', cor: '#ef4444', cor2: '#fde68a' } }),
  it('consumiveis', 'Poção de cura maior', 'consumivel', 0.5, { dano: '4d4+4', raridade: 'incomum', arte: { forma: 'pocao', cor: '#dc2626', cor2: '#fbbf24' } }),
  it('consumiveis', 'Antídoto', 'consumivel', 0.2, { descricao: 'Acaba com o veneno.', arte: { forma: 'pocao', cor: '#22c55e', cor2: '#ffffff' } }),
  it('consumiveis', 'Elixir de energia', 'consumivel', 0.5, { dano: '1d6', descricao: 'Recupera um pouco do recurso de magia ou energia.', arte: { forma: 'pocao', cor: '#38bdf8', cor2: '#a78bfa' } }),
  it('consumiveis', 'Pergaminho de luz', 'consumivel', 0.1, { descricao: 'Ao ler, ilumina o lugar por uma hora.', arte: { forma: 'pergaminho', cor: '#78350f', cor2: '#fde68a' } }),
  it('aventura', 'Tocha', 'equipamento', 0.5, { descricao: 'Ilumina por uma hora.', arte: { forma: 'tocha', cor: '#f59e0b', cor2: '#78350f' } }),
  it('aventura', 'Corda (15 m)', 'equipamento', 5, { arte: { forma: 'bolsa', cor: '#a16207', cor2: '#78350f' } }),
  it('aventura', 'Kit de primeiros socorros', 'equipamento', 1, { descricao: 'Ajuda a estabilizar quem caiu.', arte: { forma: 'bolsa', cor: '#f3f4f6', cor2: '#ef4444' } }),
  it('aventura', 'Diário de viagem', 'equipamento', 0.5, { arte: { forma: 'livro', cor: '#78350f', cor2: '#fde68a' } }),
  it('aventura', 'Chave antiga', 'equipamento', 0.1, { descricao: 'Ninguém sabe o que ela abre.', arte: { forma: 'chave', cor: '#a16207', cor2: '#38bdf8' } }),
  it('tesouros', 'Bolsa de moedas', 'tesouro', 0.5, { descricao: 'Escreva o valor na carteira.', arte: { forma: 'bolsa', cor: '#a16207', cor2: '#fbbf24' } }),
  it('tesouros', 'Rubi lapidado', 'tesouro', 0, { raridade: 'incomum', arte: { forma: 'gema', cor: '#ef4444', cor2: '#ffffff' } }),
  it('tesouros', 'Anel de prata lunar', 'tesouro', 0, { magico: true, raridade: 'raro', descricao: 'Fica frio na presença de magia.', arte: { forma: 'anel', cor: '#cbd5e1', cor2: '#a78bfa' } }),
  it('tesouros', 'Amuleto da estrela cadente', 'tesouro', 0, { magico: true, raridade: 'epico', descricao: 'Uma vez por dia, o portador pode rolar de novo um teste.', arte: { forma: 'amuleto', cor: '#fbbf24', cor2: '#38bdf8' } }),
  pd('poderes', 'Raio arcano', 'magia', { expressao: '1d10', alcance: 36, descricao: 'Um feixe de energia contra um alvo.' }),
  pd('poderes', 'Bola de fogo', 'magia', { expressao: '8d6', alcance: 45, usosMax: 1, descricao: 'Explode numa área; todos ali sofrem o dano.' }),
  pd('poderes', 'Toque curativo', 'magia', { expressao: '1d8+2', usosMax: 3, descricao: 'Cura um aliado que você toca.' }),
  pd('poderes', 'Escudo arcano', 'magia', { usosMax: 2, recarga: 'curto', descricao: 'Uma barreira rápida contra um golpe.' }),
  pd('poderes', 'Golpe poderoso', 'tecnica', { expressao: '2d6', usosMax: 2, recarga: 'curto', descricao: 'Um ataque com toda a força.' }),
  pd('poderes', 'Segundo fôlego', 'habilidade', { expressao: '1d10', usosMax: 1, recarga: 'curto', descricao: 'Recupera vida no meio do combate.' }),
  pd('poderes', 'Furtividade nas sombras', 'talento', { descricao: 'Vantagem para se esconder em lugares escuros.' }),
  pd('poderes', 'Grito de guerra', 'habilidade', { usosMax: 1, descricao: 'Os aliados próximos ganham coragem até o fim da cena.' }),
]
