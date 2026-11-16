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
  it('armas', 'Espada longa', 'arma', 1.5, { dano: '1d8', iconeBiblioteca: 'espada' }),
  it('armas', 'Adaga', 'arma', 0.5, { dano: '1d4', alcance: 6, descricao: 'Leve; dá para arremessar.', iconeBiblioteca: 'lamina' }),
  it('armas', 'Machado de batalha', 'arma', 2, { dano: '1d8', iconeBiblioteca: 'machado' }),
  it('armas', 'Martelo de guerra', 'arma', 2.5, { dano: '1d8', iconeBiblioteca: 'martelo' }),
  it('armas', 'Lança', 'arma', 1.5, { dano: '1d6', alcance: 3, iconeBiblioteca: 'lanca' }),
  it('armas', 'Arco curto', 'arma', 1, { dano: '1d6', alcance: 24, iconeBiblioteca: 'arco' }),
  it('armas', 'Cajado', 'arma', 2, { dano: '1d6', iconeBiblioteca: 'varinha' }),
  it('armas', 'Lâmina do Crepúsculo', 'arma', 1.5, { magico: true, dano: '1d8+1d6', raridade: 'raro', descricao: 'Brilha em roxo quando a lua aparece.', iconeBiblioteca: 'espada' }),
  it('protecao', 'Escudo de madeira', 'armadura', 3, { descricao: 'Ajuste o bônus de defesa do seu sistema em “Bônus”.', iconeBiblioteca: 'escudo' }),
  it('protecao', 'Armadura de couro', 'armadura', 5, { descricao: 'Leve e silenciosa.', iconeBiblioteca: 'armadura' }),
  it('protecao', 'Cota de malha', 'armadura', 15, { descricao: 'Pesada; protege bem.', iconeBiblioteca: 'armadura' }),
  it('protecao', 'Elmo de ferro', 'armadura', 1.5, { iconeBiblioteca: 'elmo' }),
  it('consumiveis', 'Poção de cura', 'consumivel', 0.5, { dano: '2d4+2', descricao: 'Cura a vida pela rolagem.', iconeBiblioteca: 'pocao' }),
  it('consumiveis', 'Poção de cura maior', 'consumivel', 0.5, { dano: '4d4+4', raridade: 'incomum', iconeBiblioteca: 'pocao' }),
  it('consumiveis', 'Antídoto', 'consumivel', 0.2, { descricao: 'Acaba com o veneno.', iconeBiblioteca: 'pocao' }),
  it('consumiveis', 'Elixir de energia', 'consumivel', 0.5, { dano: '1d6', descricao: 'Recupera um pouco do recurso de magia ou energia.', iconeBiblioteca: 'pocao' }),
  it('consumiveis', 'Pergaminho de luz', 'consumivel', 0.1, { descricao: 'Ao ler, ilumina o lugar por uma hora.', iconeBiblioteca: 'pergaminho' }),
  it('aventura', 'Tocha', 'equipamento', 0.5, { descricao: 'Ilumina por uma hora.', iconeBiblioteca: 'candelabro' }),
  it('aventura', 'Corda (15 m)', 'equipamento', 5, { iconeBiblioteca: 'mochila' }),
  it('aventura', 'Kit de primeiros socorros', 'equipamento', 1, { descricao: 'Ajuda a estabilizar quem caiu.', iconeBiblioteca: 'mochila' }),
  it('aventura', 'Diário de viagem', 'equipamento', 0.5, { iconeBiblioteca: 'livro' }),
  it('aventura', 'Chave antiga', 'equipamento', 0.1, { descricao: 'Ninguém sabe o que ela abre.', iconeBiblioteca: 'chave' }),
  it('tesouros', 'Bolsa de moedas', 'tesouro', 0.5, { descricao: 'Escreva o valor na carteira.', iconeBiblioteca: 'mochila' }),
  it('tesouros', 'Rubi lapidado', 'tesouro', 0, { raridade: 'incomum', iconeBiblioteca: 'gema' }),
  it('tesouros', 'Anel de prata lunar', 'tesouro', 0, { magico: true, raridade: 'raro', descricao: 'Fica frio na presença de magia.', iconeBiblioteca: 'anel' }),
  it('tesouros', 'Amuleto da estrela cadente', 'tesouro', 0, { magico: true, raridade: 'epico', descricao: 'Uma vez por dia, o portador pode rolar de novo um teste.', iconeBiblioteca: 'amuleto' }),
  pd('poderes', 'Raio arcano', 'magia', { expressao: '1d10', alcance: 36, descricao: 'Um feixe de energia contra um alvo.' }),
  pd('poderes', 'Bola de fogo', 'magia', { expressao: '8d6', alcance: 45, usosMax: 1, descricao: 'Explode numa área; todos ali sofrem o dano.' }),
  pd('poderes', 'Toque curativo', 'magia', { expressao: '1d8+2', usosMax: 3, descricao: 'Cura um aliado que você toca.' }),
  pd('poderes', 'Escudo arcano', 'magia', { usosMax: 2, recarga: 'curto', descricao: 'Uma barreira rápida contra um golpe.' }),
  pd('poderes', 'Golpe poderoso', 'tecnica', { expressao: '2d6', usosMax: 2, recarga: 'curto', descricao: 'Um ataque com toda a força.' }),
  pd('poderes', 'Segundo fôlego', 'habilidade', { expressao: '1d10', usosMax: 1, recarga: 'curto', descricao: 'Recupera vida no meio do combate.' }),
  pd('poderes', 'Furtividade nas sombras', 'talento', { descricao: 'Vantagem para se esconder em lugares escuros.' }),
  pd('poderes', 'Grito de guerra', 'habilidade', { usosMax: 1, descricao: 'Os aliados próximos ganham coragem até o fim da cena.' }),
]
