/**
 * Histórico de versões mostrado em /novidades. A versão atual é a do package.json.
 * Ao publicar uma atualização: aumente "version" no package.json e adicione uma entrada no topo.
 */
export type Versao = { versao: string; data: string; titulo: string; itens: string[] }

export const VERSOES: Versao[] = [
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
