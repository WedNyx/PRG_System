/**
 * Histórico de versões mostrado em /novidades. A versão atual é a do package.json.
 * Ao publicar uma atualização: aumente "version" no package.json e adicione uma entrada no topo.
 */
export type Versao = { versao: string; data: string; titulo: string; itens: string[] }

export const VERSOES: Versao[] = [
  {
    versao: '0.8.1', data: '2026-11-09', titulo: 'Sistemas publicados e autorais',
    itens: [
      'Sistemas de RPG separados em duas abas: “Sistemas publicados” (RPGs já existentes) e “Sistemas autorais” (criados por jogadores).',
      'Lunethernnyis deixou de ser o destaque: agora fica junto dos outros autorais, e as listas de escolha mostram primeiro os sistemas publicados.',
      'Campanhas novas não vêm mais com um sistema escolhido: o mestre escolhe na lista.',
    ],
  },
  {
    versao: '0.8.0', data: '2026-11-09', titulo: 'Céu estrelado, perfis e guias',
    itens: [
      'Novo tema principal “Céu estrelado” (céu roxo com nuvens, estrelas e lua). A “Noite clássica” continua disponível no menu “Tema”.',
      'Editar perfil: cada pessoa muda o próprio nome e foto pelo menu da Central (ou tocando na própria foto).',
      'Gerenciar perfis protegido por senha de administrador (configurada na Vercel): só quem sabe a senha remove perfis da plataforma.',
      'Guia da plataforma com fotos: botão “Guia” ao lado da foto de perfil, explicando cada parte e como fazer cada coisa.',
      'Guia do mestre em cada sistema de RPG (na lista de sistemas e dentro da ficha): passo a passo de criação e o que a ficha calcula sozinha.',
      'Fichas revisadas: D&D 5e com CA por armadura e limite de Destreza e PV pela média; Pathfinder 2e com PV e CA pelas regras; pirâmide de perícias do Fate; pontos de ação do Blades; modificador de dano do BRP.',
    ],
  },
  {
    versao: '0.7.0', data: '2026-11-09', titulo: 'Música na mesa',
    itens: [
      'Nova aba 🎵 Música na mesa: cada pessoa cria e organiza as próprias playlists (links do YouTube, links de áudio ou arquivos de até 15 MB).',
      'Jogadores enviam playlists ao mestre (e podem cancelar o envio). O mestre vê as recebidas separadas pelo nome de quem enviou.',
      'O mestre escolhe a música e ela toca para todo mundo da sessão, no mesmo ponto da música, com botões de 🔁 Loop e ⏹ Parar.',
      'Mini player no canto do mapa com volume e “mudo” só para você, e botão “🔊 Ouvir a música da mesa” quando o navegador bloquear o som.',
      'Busca de músicas no YouTube direto na aba (quando a chave da API do YouTube estiver configurada).',
    ],
  },
  {
    versao: '0.6.1', data: '2026-11-09', titulo: 'Tamanho do mapa e recorte de imagens',
    itens: [
      'O mestre escolhe o tamanho do mapa (Pequeno, Médio, Grande, Enorme ou personalizado), vendo quantos metros ele tem.',
      '✂️ Recortar: escolha qual parte da imagem entra no mapa, arrastando o quadro e puxando os cantos.',
      '⛶ Esticar uma imagem para ocupar o mapa inteiro, e lista das imagens do mapa com miniaturas.',
      'Mapas enviados ao criar a cena já podem ser recortados; cenas antigas podem virar editáveis.',
    ],
  },
  {
    versao: '0.6.0', data: '2026-11-09', titulo: 'Mapas montados, tokens controlados e diário do mestre',
    itens: [
      'Monte o mapa juntando várias imagens enviadas do aparelho: arraste e mude o tamanho de cada pedaço.',
      'Névoa com pincel (1×1, 3×3, 5×5), revelar/esconder uma área inteira de uma vez e botões “Revelar tudo” e “Esconder tudo”.',
      'Tokens com imagem e tamanho (até 4×4). O mestre escolhe quem move cada um (o dono, todos ou só o mestre) e pode travar todos os tokens da cena.',
      'Jogadores colocam o próprio token na mesa, mesmo sem ficha aprovada.',
      'Rolagens com painel grande mostrando cada dado que caiu e o total.',
      'Rolagens feitas nas fichas de campanha (Ficha V8 e outros sistemas) aparecem no chat da mesa; dá para rolar em segredo para o mestre.',
      'Aba “Diário” na mesa: sessões com preparação secreta do mestre e resumo publicado para os jogadores.',
      'Anotações privadas, só para o mestre, para toda a campanha ou para uma pessoa.',
      'Recompensas: o mestre dá XP, itens e moedas direto nas fichas, com registro no histórico e aviso no chat.',
    ],
  },
  {
    versao: '0.5.0', data: '2026-11-08', titulo: 'Mesa virtual e ajustes',
    itens: [
      'Mesa virtual nas campanhas: cenas com mapa, névoa de guerra, tokens, régua, marcações e desenhos.',
      'Chat e rolagens feitas no servidor, com visibilidade para todos, só o mestre ou privada.',
      'Histórico permanente de rolagens com busca por jogador, personagem e tipo.',
      'Iniciativa com turnos e rodadas, controlada pelo mestre.',
      'Sistema da campanha escolhido numa lista; “Nova ficha” pergunta o sistema.',
      'Fichas dos outros sistemas com menu por seções; Ficha V8 volta para o início.',
    ],
  },
  {
    versao: '0.4.0', data: '2026-11-08', titulo: 'Fichas nas campanhas e permissões do mestre',
    itens: [
      'Enviar uma cópia da ficha ao mestre, que aprova, recusa ou pede ajustes.',
      'Permissões por área valendo no servidor, com exceções por jogador e travas.',
      'Pedidos de alteração com antes e depois, histórico da ficha e registro de decisões.',
      'NPCs do mestre e criação de ficha junto com o jogador; aviso de pendências.',
    ],
  },
  {
    versao: '0.3.0', data: '2026-11-08', titulo: 'Sistemas de RPG',
    itens: [
      'Fichas que calculam sozinhas: Lunethernnyis automático, D&D 5e, Pathfinder 2e, Fate, Blades in the Dark, BRP e Faroeste Arcano.',
      'Ordem Paranormal e Tormenta20 como estrutura de ficha, mais a Ficha livre.',
      'Importar para a nuvem as fichas e campanhas salvas no navegador.',
    ],
  },
  {
    versao: '0.2.0', data: '2026-11-08', titulo: 'Base na nuvem',
    itens: [
      'Campanhas no servidor com convites por código ou link e pedidos de entrada.',
      'Participantes, co-mestres, estados da campanha e várias campanhas por aventureiro.',
      'Fichas sincronizadas entre celular e computador, com modo sem internet.',
    ],
  },
  {
    versao: '0.1.0', data: '2026-11-01', titulo: 'Primeira versão',
    itens: ['Portal de aventureiros, Central e Ficha V8 de Lunethernnyis salva no navegador.'],
  },
]
