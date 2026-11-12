/**
 * Conteúdo do Guia da plataforma (/guia). As fotos ficam em public/guia/ e são capturas
 * da própria plataforma, com dados de demonstração (ao mudar telas, vale tirar fotos novas).
 */
export type TopicoGuia = { id: string; icone: string; titulo: string; resumo: string; foto?: string; legenda?: string; passos: string[]; dica?: string; quem?: 'todos' | 'mestre' | 'admin' }

export const GUIA: TopicoGuia[] = [
  {
    id: 'perfil', icone: '🌙', titulo: 'Entrar com o seu perfil', foto: 'portal.jpg', legenda: 'Portal dos aventureiros',
    resumo: 'O portal é a porta de entrada: cada pessoa do grupo tem um perfil com nome e foto.',
    passos: ['Primeiro escolha o seu grupo: 🌙 Lunethernnyis (quem é do servidor) ou 🧭 De Fora (convidados e outros grupos). O aparelho lembra a escolha; “Trocar grupo” volta aos cartões.', 'Toque na sua foto para entrar.', 'Ainda não tem perfil? Toque em “+ Criar perfil”, escolha um nome, uma foto (dá para arrastar e dar zoom) e o seu grupo.', 'Para trocar de perfil depois, use “Trocar aventureiro” no menu.'],
  },
  {
    id: 'central', icone: '🏠', titulo: 'A Central e o menu', foto: 'central.jpg', legenda: 'Menu lateral da Central',
    resumo: 'Na Central ficam suas fichas, campanhas, sistemas e o histórico.',
    passos: ['No celular, toque em ☰ (canto de cima, à esquerda) para abrir o menu.', 'Use “Início”, “Fichas”, “Campanhas”, “Sistemas de RPG” e “Histórico” para navegar.', 'O botão “Guia”, ao lado da sua foto, abre esta página.'],
  },
  {
    id: 'editar-perfil', icone: '✏️', titulo: 'Mudar nome e foto', foto: 'editar-perfil.jpg', legenda: 'Janela “Editar perfil”',
    resumo: 'Cada pessoa muda o próprio nome e a própria foto.',
    passos: ['No menu, toque em “Editar perfil” (ou na sua foto, no canto de cima).', 'Toque em “📷 Trocar foto”, ajuste o recorte e toque em “Usar esta foto”.', 'Mude o nome se quiser e toque em “Salvar”. Todo mundo verá a mudança.', 'Ali também dá para trocar de grupo (Lunethernnyis ou De Fora). Os perfis antigos começaram em Lunethernnyis.'],
  },
  {
    id: 'avisos', icone: '🔔', titulo: 'Avisos (sininho)', foto: 'avisos.jpg', legenda: 'Lista de avisos',
    resumo: 'O sininho no topo mostra o que aconteceu enquanto você não estava olhando. Tudo fica dentro da plataforma: nada vai por e-mail.',
    passos: ['O número vermelho no 🔔 mostra quantos avisos você ainda não leu. Avisos novos também aparecem num balão rápido.', 'Toque num aviso para ir direto ao lugar certo (a ficha, a campanha ou a mesa).', 'Jogadores recebem: entrada aceita, ficha aprovada/recusada/ajustes, recompensas, sessão começando, papel novo, anotações e resumos do diário.', 'O mestre recebe: pedidos para entrar, fichas e playlists enviadas e pedidos de alteração de ficha.', 'Use “Ler todos” e “Apagar os já lidos” para organizar. Avisos com mais de 60 dias somem sozinhos.'],
  },
  {
    id: 'tema', icone: '🎨', titulo: 'Aparência: tema e personalização',
    resumo: 'Escolha um dos 11 temas (cada um muda o fundo e as cores da plataforma) ou personalize com a sua foto e as suas cores.',
    passos: ['No menu (☰), toque em “🎨 Aparência”.', 'Toque no tema que quiser: Estrelinhas sonhadoras (o padrão), Nuvens de algodão, Lua cheia, Céu carmesim, Grimório celestial, Prisma, Floresta encantada, Fundo do mar, Taverna, Sombrio ou Noite clássica. O fundo e as cores mudam na hora.', 'Em “Foto de fundo”, escolha uma imagem da sua galeria; use “Escurecer” e “Desfocar” para o texto continuar fácil de ler.', 'Em “Cor principal” e “Cartões”, escolha as cores, a claridade e a transparência dos quadros. “Do tema” volta às cores do tema.', 'Em “Texto”, escolha a fonte dos títulos e o tamanho das letras.', 'Fica salvo no seu perfil e vale em qualquer aparelho. “Voltar ao padrão do tema” desfaz tudo.'],
  },
  {
    id: 'sistemas', icone: '📚', titulo: 'Sistemas de RPG e guia do mestre', foto: 'sistemas.jpg', legenda: 'Sistemas com o guia do mestre aberto',
    resumo: 'A plataforma tem fichas prontas para vários sistemas, que calculam as regras sozinhas.',
    passos: ['Abra “Sistemas de RPG” no menu. Escolha entre “Sistemas publicados” (RPGs já existentes) e “Sistemas autorais” (criados por jogadores).', 'Toque em “📖 Guia do mestre” para ver como criar a ficha naquele sistema e o que a ficha calcula sozinha.', 'Toque em “Criar ficha” para começar um personagem.'],
    dica: 'Sistemas com selo “Estrutura de ficha” são comerciais: a ficha organiza os campos e as regras ficam com o seu livro.',
  },
  {
    id: 'construtor', icone: '✍️', titulo: 'Criar o seu próprio sistema', foto: 'construtor.jpg', legenda: 'Construtor com a prévia da ficha',
    resumo: 'Monte um sistema de RPG do zero (ou a partir de um da plataforma) e use nas suas campanhas.',
    passos: ['Em “Sistemas de RPG” → “Sistemas autorais”, toque em “Abrir o construtor”.', 'Comece com o exemplo simples ou copie a estrutura de um sistema da plataforma.', 'Em “Campos de identidade”, use o tipo “Lista de opções” para Classe, Espécie, Origem…: cada opção tem descrição e bônus automáticos (ex.: Guerreiro dá +1 Força).', 'Monte as seções: identidade, atributos, valores calculados (com fórmulas), perícias, recursos, espaços de texto e regras.', 'Em “Como se rola”, escolha 🎲 Rolagem personalizada para usar um modelo pronto (vantagem, pool de dados, sucessos, Fate…) ou montar a fórmula com VALOR (o número do atributo/perícia). Use “Rolar teste” para conferir.', 'Em “📈 Progressão por nível”, toque em “Ativar” e diga quanto se ganha em cada nível (ex.: +1 ponto da árvore e +5 de vida por nível). Cada coluna vira a variável prog_nome nas fórmulas, como Vida máxima = 10 + prog_vida.', 'Tabela por classe: com uma “Lista de opções” de classes, use “🔗 Uma tabela para cada opção de…” na progressão. Cada classe fica com a sua tabela, e a ficha usa só a da classe escolhida. Para multiclasse, crie “Segunda classe” e “Nível 2”.', 'Coluna “💪 Pontos de atributo”: na ficha, ao tocar em “Subir de nível”, abre uma janela com o que o nível deu e botões + e − para colocar os pontos nos atributos (respeitando o máximo).', 'Em “🌠 Árvore de habilidades padrão”, monte os hexágonos (custo, requisitos, bônus e habilidades). Toda ficha nova do sistema já começa com essa árvore; os pontos do nível entram sozinhos.', 'As fórmulas usam os nomes que aparecem em “na fórmula” (ex.: 10 + FOR * 2). Toque numa fórmula e depois numa variável para inserir. Se algo estiver errado, o aviso amarelo explica o quê.', 'Use “Prévia” para testar a ficha na hora. Toque em “Salvar”: já dá para criar fichas (só você, enquanto for rascunho).', 'Quando estiver pronto, “Publicar para todos”: ele aparece nos Sistemas autorais com “✍️ Criado por” e o seu nome, e pode ser escolhido nas campanhas.'],
    dica: 'Dá para editar depois: as fichas existentes passam a usar a versão nova. Um sistema com fichas não pode ser excluído, só voltar a rascunho.',
  },
  {
    id: 'primeiro-sistema', icone: '🧪', titulo: 'Exemplo: o seu primeiro sistema',
    resumo: 'Um exemplo completo, do zero, para quem nunca montou um sistema. Siga os passos e copie os valores.',
    passos: [
      '1. Abra “Sistemas de RPG” → “Sistemas autorais” → “Abrir o construtor” e escolha “Exemplo simples”. Dê o nome “Lâminas da Névoa”.',
      '2. Atributos: deixe Força, Agilidade e Mente, de 0 a 5. Na fórmula, eles viram FOR, AGI e MEN.',
      '3. Campos de identidade: o exemplo já traz “Classe” (Guerreiro, Batedor, Sábio) e “Espécie” (Humano, Elfo) como Lista de opções. Toque numa opção para mudar a descrição ou o bônus. Ex.: Guerreiro → +1 em Força e +2 em Luta.',
      '4. Valores calculados: Vida máxima = 10 + FOR * 2 + nivel * 3. Defesa = 10 + AGI. Toque na fórmula e depois numa variável da lista para não errar o nome.',
      '5. Perícias: Luta (Força), Furtividade (Agilidade) e Conhecimento (Mente). Graus: Destreinado 0, Treinado 2, Mestre 4. Total = MOD + TREINO.',
      '6. Recursos: Vida, com máximo “vida_max”. Assim a vida da ficha acompanha a Vida máxima.',
      '7. Opcional: “📈 Progressão por nível” → Ativar. Cada nível dá +1 ponto da árvore e +5 de vida. Troque a Vida máxima para 10 + FOR * 2 + prog_vida.',
      '8. Opcional: “🌠 Árvore padrão” → “+ Hexágono”: “Golpe Pesado”, custo 1, efeito habilidade 1d8. Ligue outros hexágonos a ele.',
      '9. Toque em “Prévia”: escolha a classe Guerreiro e veja a Força e a Luta subirem sozinhas. Depois “Salvar” e “Criar ficha” para testar de verdade.',
    ],
    dica: 'Travou? O aviso amarelo no topo diz exatamente o que está errado (por exemplo, um nome de variável que não existe).',
  },
  {
    id: 'fichas', icone: '📜', titulo: 'Criar e preencher fichas', foto: 'ficha.jpg', legenda: 'Ficha com menu por seções',
    resumo: 'As fichas ficam salvas na nuvem e abrem no celular ou no computador.',
    passos: ['Em “Fichas”, toque em “Nova ficha” e escolha o sistema.', 'Toque no quadro ao lado do nome para colocar a imagem do personagem: ela aparece no cartão da ficha.', 'Use o menu de seções (Principal, Atributos e perícias, Habilidades, Equipamentos, Anotações e Guia de criação).', 'Toque no dado ao lado de uma perícia para rolar: os dados 3D caem no meio da tela e o total aparece grande. Em fichas de campanha, a rolagem também vai para o chat da mesa.', 'Para jogar numa campanha, use “Enviar para campanha” na lista de fichas.'],
    dica: 'A seção “📖 Guia de criação”, dentro da ficha, mostra o passo a passo daquele sistema.',
  },
  {
    id: 'inventario', icone: '🎒', titulo: 'Inventário e poderes', foto: 'inventario.jpg', legenda: 'Inventário com carga e itens equipados',
    resumo: 'Itens e poderes organizados, que somam sozinhos na ficha.',
    passos: ['Na ficha, abra “🎒 Inventário” e toque em “Novo item”: escolha o tipo, o peso, a rolagem de dano e os bônus quando equipado (ex.: escudo → CA +2).', 'No topo do editor fica a ⚒️ Forja: escolha a forma do desenho, as cores e a raridade (a moldura brilha do Raro para cima). “🎲 Surpreenda-me” sorteia tudo e “✨ Sugerir um nome” dá ideias.', '📷 No editor, “Escolher foto” usa uma imagem da sua galeria no lugar do desenho. Marque “✨ Item mágico” para ele ir para a ala dos mágicos. As abas no topo do inventário separam armas, armaduras, consumíveis, equipamento, tesouros e mágicos.', 'Toque em “Equipar” para o bônus entrar na ficha. Use + e − para a quantidade; consumíveis têm o botão “Usar”.', 'A barra de carga mostra o peso total e o limite do sistema. Anote as moedas na carteira.', 'Em campanha, toque em “🎁 Passar” no item para dar a outro personagem: escolha quem recebe e quantos. Vai na hora, e o chat avisa.', 'Em “🌌 Poderes e habilidades”, crie magias e técnicas com custo (ex.: 3 PM), usos até descansar e rolagem. “Usar” desconta o recurso e rola.', '🌙 Descansar (em Valores e recursos ou em Poderes): o descanso curto recupera os poderes marcados “descanso curto” e pode curar a vida com um número ou dados (ex.: 1d8+2); o longo enche a vida e os recursos e recupera todos os usos. Em campanha, o mestre pode dar o descanso para o grupo todo em Mestre → Controles da mesa.'],
    dica: 'O mestre monta itens e poderes na “Biblioteca” (aba Diário da mesa) e entrega em “Recompensas”: eles chegam prontos na ficha.',
  },
  {
    id: 'arvore', icone: '🌠', titulo: 'Árvore de habilidades',
    resumo: 'Hexágonos ligados que o personagem libera com pontos, cada um com bônus ou habilidades novas.',
    passos: ['Na ficha, abra “🌠 Árvore de habilidades”. Para começar rápido, toque em “Começar com um exemplo”.', 'Toque em “Montar árvore” para criar hexágonos: nome, descrição, custo em pontos, cor, o que precisa liberar antes e os efeitos automáticos (bônus ou habilidade nova com dados).', 'No modo montar, arraste os hexágonos para organizar. Para ligar, escolha um, toque em “Ligar” e depois no hexágono que depende dele.', 'Fora do modo montar, toque num hexágono e em “Liberar”: gasta os pontos, acende o caminho e a habilidade aparece em “Poderes e habilidades”.', 'Ganhou pontos? Use + no modo montar, ou o mestre entrega em “Recompensas” (campo 🌠 Pontos da árvore).'],
    dica: 'Os hexágonos com a borda piscando já podem ser liberados. “Devolver pontos” desfaz, desde que nenhum outro dependa dele.',
  },
  {
    id: 'campanhas', icone: '🏰', titulo: 'Criar campanha e convidar o grupo', foto: 'campanha.jpg', legenda: 'Painel da campanha do mestre', quem: 'mestre',
    resumo: 'O mestre cria a campanha, gera um convite e aprova quem entra.',
    passos: ['Em “Campanhas”, toque em “Criar campanha”, dê um nome e escolha o sistema.', 'Dentro da campanha, toque em “🖼️ Colocar capa” para escolher a imagem do cartão.', 'Abra a campanha e toque em “Gerar convite (7 dias)”. Envie o link ou o código para o grupo.', 'Quem usar o convite aparece em pedidos: toque em “Aceitar”.', 'Em “Permissões por área da ficha”, escolha o que os jogadores podem mudar sozinhos e o que precisa da sua aprovação.'],
  },
  {
    id: 'sessao', icone: '🎬', titulo: 'Abrir a sessão, jogadores e espectadores', quem: 'mestre',
    resumo: 'A mesa só abre quando o mestre começa a sessão. Cada participante é jogador ou espectador.',
    passos: ['Na campanha (ou no topo da mesa), toque em “▶ Abrir sessão”. Só então jogadores e espectadores conseguem entrar.', 'Ao terminar, toque em “⏹ Encerrar sessão”: todo mundo sai da mesa e a música para. O histórico continua disponível.', 'Em “Participantes”, escolha o papel de cada pessoa: Jogador, Espectador ou Co-mestre.', 'Espectadores assistem ao mapa, ouvem a música e conversam no chat, mas não rolam dados nem mexem em tokens, fichas ou playlists.', 'No chat, cada papel tem uma cor: 👑 mestre em dourado, ⚔️ jogadores em azul e 👁️ espectadores em verde.'],
    dica: 'Quem estiver com a mesa aberta enquanto a sessão está fechada entra sozinho assim que o mestre abrir.',
  },
  {
    id: 'mesa', icone: '🗺️', titulo: 'Mesa virtual: mapa e tokens', foto: 'mesa.jpg', legenda: 'Mesa com mapa, tokens e ferramentas',
    resumo: 'A mesa mostra o mapa da cena, os tokens e as ferramentas, tudo ao vivo para o grupo.',
    passos: ['Na campanha, toque em “🗺️ Abrir mesa virtual”.', 'As ferramentas ficam no canto de baixo: mover, régua, marcar ponto e desenhar.', 'Arraste o seu token para movê-lo. O mestre decide quem pode mexer em cada token.', 'O painel tem 5 grupos: 💬 Chat, ⚔️ Jogo (Fichas, Iniciativa e Tokens), 🎵 Música, 📖 Diário e 👑 Mestre (Controles, Biblioteca e Tabelas). Embaixo das abas, uma linha explica o que cada parte faz.', 'O botão ao lado do sino esconde o painel para ver o mapa maior. No celular, “⋯” guarda o Mundo, o Histórico de rolagens, o som dos dados e as Dicas.'],
  },
  {
    id: 'rolagens', icone: '🎲', titulo: 'Chat e rolagens', foto: 'mesa-chat.jpg', legenda: 'Chat com rolagens',
    resumo: 'Todas as rolagens são feitas no servidor e aparecem para o grupo com cada dado que caiu.',
    passos: ['Na aba “Chat”, toque em um dado rápido (d4 a d100) ou escreva uma expressão como 2d6+3 (também vale 2d20kh1, 6d6s5 para contar sucessos e 4dF). Os dados rolam no meio da tela para todos, com o total bem grande; toque para fechar.', 'Escolha quem vê: todos, só o mestre ou só você.', 'Toque em “Histórico” para procurar rolagens antigas por pessoa, personagem ou tipo.'],
  },
  {
    id: 'musica', icone: '🎵', titulo: 'Música na mesa', foto: 'mesa-musica.jpg', legenda: 'Aba Música com playlists',
    resumo: 'Cada pessoa monta playlists; o mestre escolhe o que toca para todo mundo.',
    passos: ['Na aba “Música”, crie uma playlist e adicione músicas por link do YouTube, link de áudio ou arquivo do aparelho.', 'Jogadores: toque em “Enviar ao mestre”.', 'Mestre: em “Recebidas”, as playlists aparecem com o nome de quem enviou. Toque em ▶ para tocar para a mesa.', 'Só o mestre controla a música: ⏮ anterior, ⏪ −10 s, ⏸ pausar/continuar, ⏩ +10 s, ⏭ próxima, 🔁 loop e ⏹ parar. Sem loop, a próxima da playlist começa sozinha.', 'O volume no mini player do mapa é só seu (cada pessoa ajusta o próprio). Se o navegador bloquear o som, toque em “🔊 Ouvir a música da mesa”.'],
  },
  {
    id: 'diario', icone: '📖', titulo: 'Diário: sessões, anotações e recompensas', foto: 'mesa-diario.jpg', legenda: 'Aba Diário',
    resumo: 'Organize a campanha entre as sessões.',
    passos: ['Sessões: o mestre escreve a preparação (só ele vê) e publica o resumo para o grupo.', 'Anotações: escolha quem vê (só você, você e o mestre, toda a campanha ou uma pessoa).', 'Recompensas (mestre): dê XP, itens e moedas direto nas fichas.'],
  },
  {
    id: 'combate', icone: '⚔️', titulo: 'Combate: fichas na mesa e ataques',
    resumo: 'Os personagens e NPCs entram na mesa pela ficha e atacam com as armas e poderes dela.',
    passos: ['Na mesa, abra a aba “Jogo → Fichas”. O mestre vê todas (jogadores e NPCs); o jogador vê as dele.', 'Toque numa ficha e em “📍 Colocar na mesa”: o token já vem com o nome, a imagem e a vida da ficha.', 'Toque no seu token e em “⚔️ Atacar”. Escolha a arma ou o poder (o alcance aparece em vermelho no mapa), toque em “Escolher o alvo no mapa” e no inimigo.', 'Toque em “⚔️ Atacar!”: o ataque é rolado contra a Defesa do alvo e, se acertar, o dano aparece em seguida, no meio da tela. Poderes descontam o custo (PM, esforço…) sozinhos.', 'Mestre: em “Mestre → Controles”, em “⚔️ Regras de combate”, escolha se o dano sai automaticamente ou se você confirma (aplicar, metade ou anular) no chat.', 'Mestre: em “Jogo → Iniciativa”, toque em “⚔️ Preparar combate”, marque quem luta e role a iniciativa de todos de uma vez (com o bônus da ficha). Use “Próximo turno” para passar a vez: o token da vez ganha um anel dourado e o jogador recebe um aviso com o botão “⚔️ Sua vez: atacar”. Quando terminar, o jogador toca em “✅ Terminar meu turno”.', 'Condições: toque no token e marque, por exemplo, ☠️ Envenenado. Embaixo, escolha quantas rodadas dura. A contagem desce no fim de cada turno daquele token, o número aparece em cima dele no mapa e o chat avisa quando acaba. Use “Sem limite” para tirar na mão.', 'Dano por turno: Queimando, Envenenado e Sangrando já causam dano no começo do turno de quem tem a condição. No campo 💥 ao lado, mude o dano (ex.: 1d6, 2d4+1, 3) ou deixe vazio para não causar dano. O chat mostra o dano e a vida que sobrou.', 'À beira da morte: quem chega a 0 de vida cai e rola um teste contra a morte (d20) no começo do turno — as bolinhas aparecem embaixo do token. 3 sucessos estabiliza, 3 falhas morre, cura levanta. Em “Mestre → Controles” dá para desligar ou ligar ⚠️ Medidas desesperadas (o jogador troca falhas futuras por ações extras).'],
    dica: 'Para dar alcance a uma arma ou poder, edite o item ou o poder na ficha e preencha “Alcance (m)”. Sem alcance, vale corpo a corpo (1,5 m).',
  },
  {
    id: 'mundo', icone: '🌍', titulo: 'Mundo da campanha', quem: 'todos',
    resumo: 'Mapa-múndi com alfinetes, páginas de lugares e personagens e a teia de relações.',
    passos: ['Na mesa (ou na lista de campanhas), toque em “🌍 Mundo”.', 'Mestre: em “🗺️ Mapa”, envie a imagem do mapa. Toque em “Marcar lugar” e depois no mapa para criar um alfinete com nome, ícone, descrição e imagem. Arraste os alfinetes para ajustar.', 'Em “📖 Páginas”, crie personagens, facções, perigos, segredos e relíquias. Procure e filtre por tipo.', 'Em “🕸️ Relações”, ligue quem é aliado, inimigo, rival, família, amor ou quem serve a quem. Arraste para organizar.', 'Marque “🙈 Só o mestre vê” em páginas e ligações secretas: os jogadores só descobrem quando você mostrar.', 'Jogadores: toque nos alfinetes e nas pessoas da teia para ler tudo o que o mestre revelou.'],
  },
  {
    id: 'primeiros-passos', icone: '✨', titulo: 'Primeiros passos (para quem foi convidado)', quem: 'todos',
    resumo: 'Do link de convite até a primeira rolagem na mesa.',
    passos: ['Abra o link de convite que o mestre mandou. Se ainda não tem perfil, toque em “Ir para o portal”, crie o seu (só o apelido e, se quiser, uma foto) e toque nele: você volta sozinho para o convite.', 'Toque em “Pedir para entrar” e espere o mestre aceitar.', 'Na Central, o “✨ Comece por aqui” mostra o que falta: criar o personagem na campanha, entrar na mesa e, se quiser, criar uma senha.', 'Na mesa, as dicas da primeira vez explicam o básico. O botão “❔ Dicas” mostra de novo quando quiser.'],
    dica: 'Não precisa de e-mail. A senha é opcional, mas protege o seu perfil.',
  },
  {
    id: 'senha', icone: '🔒', titulo: 'Senha do perfil e código de recuperação', quem: 'todos',
    resumo: 'Opcional: proteja o seu perfil para ninguém mais entrar nele. Se esquecer a senha, use o código de recuperação.',
    passos: ['Na Central, toque na sua foto no topo (ou no menu → “Editar perfil”).', 'Em “🔒 Senha do perfil”, toque em “Criar senha”, digite duas vezes (6 a 72 caracteres) e salve.', 'Aparece o seu código de recuperação (ex.: K7QM-2XPB-9RTD-W4HN). Guarde num lugar seguro: ele aparece só uma vez.', 'No portal, o seu perfil passa a mostrar 🔒. Em outro aparelho, a plataforma pede a senha uma vez e lembra dele por 30 dias.', 'Esqueceu a senha? Na janela da senha, toque em “Esqueci a senha”, digite o código e escolha uma senha nova (ou deixe vazio para ficar sem senha). Você recebe um código novo.', 'Perdeu o código? Com a senha, gere outro em Editar perfil. Sem os dois, só o administrador consegue apagar a senha.'],
    dica: 'Não existe recuperação por e-mail. Use uma senha que você lembre e que não use em outros sites.',
  },
  {
    id: 'apagar-perfil', icone: '🗑️', titulo: 'Apagar o meu perfil', quem: 'todos',
    resumo: 'Apaga o seu perfil e tudo dele, de vez. Os personagens das campanhas podem ficar com o mestre.',
    passos: ['Quer guardar algum personagem? Abra a ficha e toque em ⬇️ “Baixar”.', 'Na Central, abra “Editar perfil” e, no fim, toque em “Apagar perfil…”.', 'Se você for mestre de alguma campanha, a janela mostra quais e pede para marcar que elas serão apagadas junto.', 'Escolha se os seus personagens nas campanhas de outros mestres ficam com eles, como NPC, escreva o nome do perfil e confirme.'],
    dica: 'Não dá para desfazer. Fichas baixadas podem ser importadas de novo num perfil novo.',
  },
  {
    id: 'ficha-arquivo', icone: '💾', titulo: 'Baixar e importar ficha', quem: 'todos',
    resumo: 'Guarde uma cópia do personagem num arquivo e traga de volta quando quiser.',
    passos: ['Abra a ficha e toque em ⬇️ “Baixar” no topo: o celular ou o computador salva um arquivo .json.', 'Para trazer de volta, vá em Central → Fichas → Avulsas e toque em “Importar ficha”.', 'A ficha importada vira uma ficha avulsa nova; a original não muda. Para usar numa campanha, envie para a campanha normalmente.'],
    dica: 'Serve de backup e para levar o personagem para outro perfil. Fichas de sistemas criados por outra pessoa só importam se o sistema estiver publicado.',
  },
  {
    id: 'biblioteca', icone: '📚', titulo: 'Biblioteca da campanha', quem: 'mestre',
    resumo: 'Itens e poderes prontos para entregar com um toque.',
    passos: ['Na mesa, abra a aba “Mestre → Biblioteca” (só o mestre vê).', 'Em “✨ Prontos para usar”, toque em + para copiar um item ou poder da plataforma, ou em “Todos” para um grupo inteiro.', 'Em “Da campanha”, crie os seus com “Novo item” ou “Novo poder” (com a forja, raridade, dano e bônus) e use ⧉ para fazer variações.', 'Toque em “🎁 Dar”, marque quem recebe (jogadores e NPCs) e a quantidade. Vai direto para as fichas, e o chat avisa se você quiser.'],
    dica: 'XP, moedas e pontos da árvore continuam em Diário → Recompensas.',
  },
  {
    id: 'rolagens', icone: '🎲', titulo: 'Histórico de rolagens', quem: 'todos',
    resumo: 'Encontre qualquer rolagem e veja o resumo da sessão.',
    passos: ['Na mesa, toque em “Histórico” no chat (ou em Central → Histórico e escolha a campanha).', 'Escolha o período (esta sessão, hoje, 7 dias ou tudo) e o tipo: dados, ataques, mensagens ou avisos da mesa.', 'Filtre por pessoa, personagem ou texto (ex.: “Furtividade”), ou toque em “🎯 Só críticos” / “💀 Só falhas”.', 'O resumo mostra críticos, falhas, maior dano, maior rolagem e a média do d20 de cada personagem.'],
    dica: 'Os dados da mesa são rolados no servidor: o histórico mostra exatamente o que saiu.',
  },
  {
    id: 'tabelas', icone: '🎲', titulo: 'Tabelas do mestre', quem: 'mestre',
    resumo: 'Role na hora um nome, um encontro, um rumor ou um tesouro.',
    passos: ['Na mesa, abra a aba “Mestre → Tabelas” (só o mestre vê).', 'As prontas já vêm com a plataforma: nomes, personalidade e segredo de NPC, tavernas, rumores, ganchos, complicações, tesouros, encontros, clima e itens curiosos. “NPC completo” e “Missão completa” juntam várias de uma vez.', 'Toque em “Rolar” para mostrar o resultado no chat para todos, ou em “Só eu” para ver sozinho (fica marcado 🔒 no chat).', 'Em “Nova tabela”, crie as suas: um resultado por linha. Escreva {1d6} para rolar um número e [[código]] para puxar um resultado de outra tabela (ex.: [[nomes]], o ferreiro).', 'As tabelas ficam salvas na campanha; edite ou apague quando quiser.'],
  },
  {
    id: 'mestre', icone: '🎩', titulo: 'Painel do mestre na mesa', foto: 'mesa-mestre.jpg', legenda: 'Mestre → Controles', quem: 'mestre',
    resumo: 'Cenas, mapas, névoa e controle dos tokens.',
    passos: ['Crie cenas e escolha o tamanho do mapa (Pequeno, Médio, Grande, Enorme).', 'Envie imagens do aparelho, recorte com ✂️ e monte o mapa juntando várias imagens.', 'Ligue a névoa e revele partes do mapa com o pincel ou por área.', 'Trave todos os tokens da cena quando precisar.'],
  },
  {
    id: 'admin', icone: '🔒', titulo: 'Gerenciar perfis (administrador)', foto: 'portal-admin.jpg', legenda: 'Senha do administrador', quem: 'admin',
    resumo: 'Só quem sabe a senha de administrador pode remover perfis e ver a saúde da plataforma.',
    passos: ['No portal, toque em “🔒 Gerenciar perfis” e digite a senha.', 'Toque na 🗑 de um perfil para removê-lo. As fichas e playlists dele também são apagadas.', 'Um perfil que é mestre de alguma campanha só pode ser removido depois que essas campanhas forem excluídas.', 'Em “🩺 Saúde da plataforma e cópias de segurança” você vê se o banco está no ar, os erros inesperados registrados e as cópias diárias. Dá para guardar uma cópia na hora ou baixar o arquivo para guardar no seu computador.'],
    dica: 'A senha fica na Vercel, na variável PRG_ADMIN_SENHA. Para trocar, mude a variável e faça um Redeploy.',
  },
  {
    id: 'novidades', icone: '✨', titulo: 'Novidades e versão',
    resumo: 'Cada atualização ganha um número de versão e uma lista do que mudou.',
    passos: ['No menu, toque em “Novidades” para ver o que mudou em cada versão.', 'No portal, “↻ Verificar atualização” recarrega a página com a versão mais nova.'],
  },
]
