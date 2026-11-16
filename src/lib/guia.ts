/**
 * Conteúdo do Guia da plataforma (/guia). As fotos ficam em public/guia/ e são capturas da própria plataforma,
 * com dados de demonstração. Para tirar fotos novas: scripts/tela/guia.cjs (v0.35.5).
 * O guia é dividido em capítulos; as “trilhas” dizem por onde começar (jogador, mestre ou quem cria sistemas)
 * e as “dúvidas comuns” respondem os problemas que mais aparecem.
 */
export type FotoGuia = { arquivo: string; legenda: string; larga?: boolean }
export type TopicoGuia = { id: string; capitulo: string; icone: string; titulo: string; resumo: string; fotos?: FotoGuia[]; passos: string[]; dica?: string; quem?: 'todos' | 'mestre' | 'admin' }

export const CAPITULOS: { id: string; icone: string; titulo: string; resumo: string }[] = [
  { id: 'comeco', icone: '🌙', titulo: 'Primeiros passos', resumo: 'Perfil, Central, avisos e aparência.' },
  { id: 'ficha', icone: '📜', titulo: 'Personagem e ficha', resumo: 'Criar e preencher a ficha, inventário, poderes e árvore.' },
  { id: 'campanha', icone: '🏰', titulo: 'Campanha', resumo: 'Criar, convidar o grupo e abrir a sessão.' },
  { id: 'mesa', icone: '🗺️', titulo: 'Mesa virtual', resumo: 'Mapa, tokens, chat, dados, combate e música.' },
  { id: 'mestre', icone: '🎩', titulo: 'Ferramentas do mestre', resumo: 'Paredes, névoa e luz, biblioteca, tabelas e mundo.' },
  { id: 'sistemas', icone: '📚', titulo: 'Sistemas de RPG', resumo: 'Sistemas prontos e como criar o seu.' },
  { id: 'conta', icone: '🔒', titulo: 'Sua conta', resumo: 'Senha, cópia da ficha, apagar perfil e novidades.' },
]

/** Por onde começar: um caminho curto para cada tipo de pessoa (aponta para os tópicos). */
export const TRILHAS: { id: string; icone: string; titulo: string; para: string; passos: { texto: string; topico: string }[] }[] = [
  { id: 'jogador', icone: '⚔️', titulo: 'Vou jogar', para: 'Recebi um convite do mestre', passos: [
    { texto: 'Abra o convite e crie o seu perfil', topico: 'primeiros-passos' },
    { texto: 'Crie o personagem na campanha e preencha a ficha', topico: 'fichas' },
    { texto: 'Pegue armas e itens prontos no Arsenal', topico: 'arsenal' },
    { texto: 'Equipe a arma: ela aparece nas ações rápidas', topico: 'acoes-rapidas' },
    { texto: 'Entre na mesa, ande com o token e role no chat', topico: 'mesa' },
    { texto: 'No combate: atacar e terminar o turno', topico: 'combate' },
  ] },
  { id: 'mestre', icone: '👑', titulo: 'Vou mestrar', para: 'Quero montar uma campanha', passos: [
    { texto: 'Crie a campanha e convide o grupo', topico: 'campanhas' },
    { texto: 'Monte a cena: mapa, tamanho e tokens', topico: 'painel-mestre' },
    { texto: 'Desenhe paredes, portas e janelas', topico: 'paredes' },
    { texto: 'Névoa, escuridão e luz', topico: 'nevoa-luz' },
    { texto: 'Abra a sessão quando o grupo chegar', topico: 'sessao' },
    { texto: 'Conduza o combate e as decisões de ataque', topico: 'combate' },
  ] },
  { id: 'criador', icone: '✍️', titulo: 'Vou criar um sistema', para: 'Tenho o meu próprio RPG', passos: [
    { texto: 'Veja como os sistemas funcionam', topico: 'sistemas' },
    { texto: 'Siga o exemplo do primeiro sistema', topico: 'primeiro-sistema' },
    { texto: 'Abra o construtor e monte o seu', topico: 'construtor' },
    { texto: 'Pratique a rolagem personalizada no tutorial', topico: 'construtor' },
  ] },
]

/** Problemas que mais aparecem, com a resposta curta e onde ler mais. */
export const DUVIDAS: { pergunta: string; resposta: string; topico?: string }[] = [
  { pergunta: 'Não consigo entrar na mesa.', resposta: 'A mesa só abre quando o mestre toca em “▶ Abrir sessão”. Deixe a mesa aberta: você entra sozinho quando ele abrir.', topico: 'sessao' },
  { pergunta: 'Meu token não anda.', resposta: 'Uma parede, janela ou porta fechada está no caminho (o token anda em linha reta), ou o mestre travou os tokens. Para contornar, mova em etapas ou abra a porta.', topico: 'paredes' },
  { pergunta: 'A ficha não soma nada sozinha.', resposta: 'É de propósito: a ficha segue o modelo do sistema e você e o mestre digitam os números. As rolagens usam o que está escrito.', topico: 'fichas' },
  { pergunta: 'Minha arma não aparece nas ações rápidas.', resposta: 'Ela precisa estar equipada e ter um dano ou uma rolagem pronta. Edite o item e adicione “Acerto” e “Dano”.', topico: 'acoes-rapidas' },
  { pergunta: 'Não ouço a música da mesa.', resposta: 'O navegador às vezes bloqueia o som: toque em “🔊 Ouvir a música da mesa”. O volume do mini player é só seu.', topico: 'musica' },
  { pergunta: 'O mapa está todo escuro.', resposta: 'A cena tem escuridão e você só vê o que a luz ou a visão do seu personagem alcança. Peça uma tocha ao mestre (luz no token).', topico: 'nevoa-luz' },
  { pergunta: 'Esqueci a senha do perfil.', resposta: 'Use o código de recuperação em “Esqueci a senha”. Sem o código, só o administrador apaga a senha.', topico: 'senha' },
]

export const GUIA: TopicoGuia[] = [
  {
    capitulo: 'comeco', id: 'perfil', icone: '🌙', fotos: [{ arquivo: 'portal.jpg', legenda: 'Portal: escolha o seu perfil' }], titulo: 'Entrar com o seu perfil',
    resumo: 'O portal é a porta de entrada: cada pessoa do grupo tem um perfil com nome e foto.',
    passos: ['Primeiro escolha o seu grupo: 🌙 Lunethernnyis (quem é do servidor) ou 🧭 De Fora (convidados e outros grupos). O aparelho lembra a escolha; “Trocar grupo” volta aos cartões.', 'Toque na sua foto para entrar.', 'Ainda não tem perfil? Toque em “+ Criar perfil”, escolha um nome, uma foto (dá para arrastar e dar zoom) e o seu grupo.', 'Para trocar de perfil depois, use “Trocar aventureiro” no menu.'],
  },
  {
    capitulo: 'comeco', id: 'central', icone: '🏠', titulo: 'A Central e o menu', fotos: [{ arquivo: 'menu.jpg', legenda: 'Menu da Central (☰)' }],
    resumo: 'Na Central ficam suas fichas, campanhas, sistemas e o histórico. Embaixo, no celular, uma barra leva a cada parte.',
    passos: ['No celular, toque em ☰ (canto de cima, à esquerda) para abrir o menu, ou use a barra de baixo (Início, Fichas, Campanhas, Sistemas e Rolagens).', 'No menu ficam também “Editar perfil”, “Aparência”, “Trocar aventureiro”, este Guia, os Tutoriais práticos e as Novidades.', 'O botão “Guia”, ao lado do sininho, abre esta página de qualquer lugar da Central.'],
  },
  {
    capitulo: 'comeco', id: 'editar-perfil', icone: '✏️', fotos: [{ arquivo: 'editar-perfil.jpg', legenda: 'Janela “Editar perfil”' }], titulo: 'Mudar nome e foto',
    resumo: 'Cada pessoa muda o próprio nome e a própria foto.',
    passos: ['No menu, toque em “Editar perfil” (ou na sua foto, no canto de cima).', 'Toque em “📷 Trocar foto”, ajuste o recorte e toque em “Usar esta foto”.', 'Mude o nome se quiser e toque em “Salvar”. Todo mundo verá a mudança.', 'Ali também dá para trocar de grupo (Lunethernnyis ou De Fora). Os perfis antigos começaram em Lunethernnyis.'],
  },
  {
    capitulo: 'comeco', id: 'avisos', icone: '🔔', fotos: [{ arquivo: 'avisos.jpg', legenda: 'Avisos (sininho)' }], titulo: 'Avisos (sininho)',
    resumo: 'O sininho no topo mostra o que aconteceu enquanto você não estava olhando. Tudo fica dentro da plataforma: nada vai por e-mail.',
    passos: ['O número vermelho no 🔔 mostra quantos avisos você ainda não leu. Avisos novos também aparecem num balão rápido.', 'Toque num aviso para ir direto ao lugar certo (a ficha, a campanha ou a mesa).', 'Jogadores recebem: entrada aceita, ficha aprovada/recusada/ajustes, recompensas, sessão começando, papel novo, anotações e resumos do diário.', 'O mestre recebe: pedidos para entrar, fichas e playlists enviadas e pedidos de alteração de ficha.', 'Use “Ler todos” e “Apagar os já lidos” para organizar. Avisos com mais de 60 dias somem sozinhos.'],
  },
  {
    capitulo: 'comeco', id: 'tema', icone: '🎨', fotos: [{ arquivo: 'aparencia.jpg', legenda: 'Aparência: temas, fundo, cores e letras' }], titulo: 'Aparência: tema e personalização',
    resumo: 'Escolha um dos 11 temas (cada um muda o fundo e as cores da plataforma) ou personalize com a sua foto e as suas cores.',
    passos: ['No menu (☰), toque em “🎨 Aparência”.', 'Toque no tema que quiser: Estrelinhas sonhadoras (o padrão), Nuvens de algodão, Lua cheia, Céu carmesim, Grimório celestial, Prisma, Floresta encantada, Fundo do mar, Taverna, Sombrio ou Noite clássica. O fundo e as cores mudam na hora.', 'Em “Foto de fundo”, escolha uma imagem da sua galeria; use “Escurecer” e “Desfocar” para o texto continuar fácil de ler.', 'Em “Cor principal” e “Cartões”, escolha as cores, a claridade e a transparência dos quadros. “Do tema” volta às cores do tema.', 'Em “Texto”, escolha a fonte dos títulos e o tamanho das letras.', 'Fica salvo no seu perfil e vale em qualquer aparelho. “Voltar ao padrão do tema” desfaz tudo.'],
  },
  {
    capitulo: 'comeco', id: 'primeiros-passos', icone: '✨', fotos: [{ arquivo: 'central.jpg', legenda: 'Central com o “Comece por aqui”' }], titulo: 'Primeiros passos (para quem foi convidado)', quem: 'todos',
    resumo: 'Do link de convite até a primeira rolagem na mesa.',
    passos: ['Abra o link de convite que o mestre mandou. Se ainda não tem perfil, toque em “Ir para o portal”, crie o seu (só o apelido e, se quiser, uma foto) e toque nele: você volta sozinho para o convite.', 'Toque em “Pedir para entrar” e espere o mestre aceitar.', 'Na Central, o “✨ Comece por aqui” mostra o que falta: criar o personagem na campanha, entrar na mesa e, se quiser, criar uma senha.', 'Na mesa, as dicas da primeira vez explicam o básico. O botão “❔ Dicas” mostra de novo quando quiser.'],
    dica: 'Não precisa de e-mail. A senha é opcional, mas protege o seu perfil.',
  },
  {
    capitulo: 'ficha', id: 'fichas', icone: '📜', titulo: 'Criar e preencher a ficha', fotos: [{ arquivo: 'ficha.jpg', legenda: 'Ficha: resumo da vida no topo e o menu de seções' }],
    resumo: 'A ficha fica salva na nuvem e abre no celular ou no computador. Ela segue o modelo do sistema e você preenche tudo do seu jeito.',
    passos: ['Numa campanha, toque em “Criar ficha”: ela já vem no sistema do mestre. Fora de campanha, use “Fichas” → “Nova ficha” e escolha o sistema.', 'Toque no quadro “Imagem”, ao lado do nome, para colocar o retrato do personagem.', 'O menu de seções separa a ficha: ❤️ Principal (dados, valores e recursos), ✨ Atributos e perícias, 🌌 Poderes e habilidades, 🎒 Inventário e 📜 Anotações e regras.', 'Nada é calculado: digite os atributos, os modificadores, a CA/Defesa, o total de cada perícia e o máximo de cada recurso. O que você digita é o que vale.', 'Toque no dado ao lado de um atributo ou perícia para rolar com o número digitado. Os dados 3D caem no meio da tela; em ficha de campanha, a rolagem também vai para o chat da mesa.', 'Enquanto aparece “Criação livre”, tudo o que você muda salva na hora. Ao terminar, toque em “Terminei a criação”: depois disso, atributos e perícias passam a pedir aprovação do mestre (se ele quiser).'],
    dica: 'A barra do topo mostra a vida e os recursos principais em qualquer seção da ficha.',
  },
  {
    capitulo: 'ficha', id: 'acoes-rapidas', icone: '⚡', titulo: 'Ações rápidas', fotos: [{ arquivo: 'acoes-rapidas.jpg', legenda: 'Ações rápidas no fim da seção Principal' }],
    resumo: 'No fim da seção Principal ficam as armas e itens equipados e os poderes com dados. Um toque rola.',
    passos: ['Equipe uma arma no Inventário (botão “Equipar”). Ela aparece nas ações rápidas com o dano e as rolagens prontas dela.', 'Poderes com rolagem (ex.: Bola de fogo 8d6) também aparecem ali.', 'Toque num botão (🎲 Acerto, 🎲 Dano…) para rolar. “Rolar tudo” rola todos os botões daquele item em sequência.', 'Numa campanha, a rolagem aparece para o grupo no chat da mesa.'],
    dica: 'Os números das rolagens são os que você escreveu no item (ex.: Acerto 1d20+6). Mudou o bônus? Edite o item.',
  },
  {
    capitulo: 'ficha', id: 'inventario', icone: '🎒', titulo: 'Inventário e poderes', fotos: [{ arquivo: 'inventario.jpg', legenda: 'Inventário com carga, carteira e abas por tipo' }, { arquivo: 'icones.jpg', legenda: 'Busca entre os 4.170 ícones do Game-Icons' }],
    resumo: 'Itens com ícone ou foto, raridade, peso, rolagens prontas e bônus; poderes com custo, usos e rolagem.',
    passos: ['Na ficha, abra “🎒 Inventário” e toque em “Novo item”: escolha o tipo, o peso, o dano e o alcance.', 'Em “🎲 Rolagens prontas”, adicione até 6 botões (Acerto, Dano, Crítico ou o nome que quiser) com os dados, como 1d20+5 ou 2d6+3.', 'Em “🎨 Ícone e raridade”, escolha um ícone sugerido ou toque em “🔎 Buscar entre todos os ícones do Game-Icons”: são 4.170, com busca em português (espada, pistola, poção, caveira…) e filtros por tema. A raridade colore a moldura (do Raro para cima o item brilha).', '📷 “Escolher foto” usa uma imagem da sua galeria no lugar do ícone. Marque “✨ Item mágico” para ele ir para a ala dos mágicos.', 'Toque em “Equipar” para ele ir para as ações rápidas. Use + e − para a quantidade; consumíveis têm o botão “Usar”. A barra de carga mostra o peso total, e a carteira guarda as moedas.', 'Em campanha, “🎁 Passar” dá o item a outro personagem (o chat avisa).', 'Em “🌌 Poderes e habilidades”, crie magias e técnicas com custo (ex.: 3 PM), usos até descansar e rolagem. “Usar” desconta e rola.', '🌙 Descanso: o curto recupera os poderes marcados “descanso curto” e pode curar com dados (ex.: 1d8+2); o longo enche a vida e os recursos. O mestre também pode dar o descanso para o grupo todo.'],
    dica: 'O mestre monta itens e poderes na Biblioteca da mesa e entrega com “🎁 Dar”: eles chegam prontos na ficha.',
  },
  {
    capitulo: 'ficha', id: 'arsenal', icone: '📦', titulo: 'Arsenal pronto', fotos: [{ arquivo: 'arsenal.jpg', legenda: 'Arsenal pronto: estilos e busca' }],
    resumo: 'Itens prontos em cinco estilos para achar rápido: medieval e fantasia, faroeste, moderno, ficção científica e terror.',
    passos: ['No Inventário, toque em “📦 Arsenal pronto”.', 'Escolha o estilo nas abas ou busque em todos (ex.: “pistola”, “poção”, “escudo”).', 'Toque em “Adicionar”: uma cópia entra no inventário, com ícone, dados sugeridos, alcance e peso. Adicione quantos quiser.', 'Depois edite o que precisar: dano, rolagens, peso, ícone ou foto.'],
    dica: 'Os dados são sugestões neutras, sem regra de nenhum livro. Combine com o mestre. O mestre também tem o Arsenal na Biblioteca da mesa.',
  },
  {
    capitulo: 'ficha', id: 'arvore', icone: '🌠', titulo: 'Árvore de habilidades',
    resumo: 'Hexágonos ligados que o personagem libera com pontos, cada um com bônus ou habilidades novas.',
    passos: ['Na ficha, abra “🌠 Árvore de habilidades”. Para começar rápido, toque em “Começar com um exemplo”.', 'Toque em “Montar árvore” para criar hexágonos: nome, descrição, custo em pontos, cor, o que precisa liberar antes e os efeitos automáticos (bônus ou habilidade nova com dados).', 'No modo montar, arraste os hexágonos para organizar. Para ligar, escolha um, toque em “Ligar” e depois no hexágono que depende dele.', 'Fora do modo montar, toque num hexágono e em “Liberar”: gasta os pontos, acende o caminho e a habilidade aparece em “Poderes e habilidades”.', 'Ganhou pontos? Use + no modo montar, ou o mestre entrega em “Recompensas” (campo 🌠 Pontos da árvore).'],
    dica: 'Os hexágonos com a borda piscando já podem ser liberados. “Devolver pontos” desfaz, desde que nenhum outro dependa dele.',
  },
  {
    capitulo: 'campanha', id: 'campanhas', icone: '🏰', fotos: [{ arquivo: 'campanha.jpg', legenda: 'Cartão da campanha do mestre' }], titulo: 'Criar campanha e convidar o grupo', quem: 'mestre',
    resumo: 'O mestre cria a campanha, gera um convite e aprova quem entra.',
    passos: ['Em “Campanhas”, toque em “Criar campanha”, dê um nome e escolha o sistema.', 'Dentro da campanha, toque em “🖼️ Colocar capa” para escolher a imagem do cartão.', 'Abra a campanha e toque em “Gerar convite (7 dias)”. Envie o link ou o código para o grupo.', 'Quem usar o convite aparece em pedidos: toque em “Aceitar”.', 'Em “Permissões por área da ficha”, escolha o que os jogadores podem mudar sozinhos e o que precisa da sua aprovação.'],
  },
  {
    capitulo: 'campanha', id: 'sessao', icone: '🎬', titulo: 'Abrir a sessão, jogadores e espectadores', quem: 'mestre',
    resumo: 'A mesa só abre quando o mestre começa a sessão. Cada participante é jogador ou espectador.',
    passos: ['Na campanha (ou no topo da mesa), toque em “▶ Abrir sessão”. Só então jogadores e espectadores conseguem entrar.', 'Ao terminar, toque em “⏹ Encerrar sessão”: todo mundo sai da mesa e a música para. O histórico continua disponível.', 'Em “Participantes”, escolha o papel de cada pessoa: Jogador, Espectador ou Co-mestre.', 'Espectadores assistem ao mapa, ouvem a música e conversam no chat, mas não rolam dados nem mexem em tokens, fichas ou playlists.', 'No chat, cada papel tem uma cor: 👑 mestre em dourado, ⚔️ jogadores em azul e 👁️ espectadores em verde.'],
    dica: 'Quem estiver com a mesa aberta enquanto a sessão está fechada entra sozinho assim que o mestre abrir.',
  },
  {
    capitulo: 'campanha', id: 'diario', icone: '📖', fotos: [{ arquivo: 'mesa-diario.jpg', legenda: 'Diário: sessões, anotações e recompensas' }], titulo: 'Diário: sessões, anotações e recompensas',
    resumo: 'Organize a campanha entre as sessões.',
    passos: ['Sessões: o mestre escreve a preparação (só ele vê) e publica o resumo para o grupo.', 'Anotações: escolha quem vê (só você, você e o mestre, toda a campanha ou uma pessoa).', 'Recompensas (mestre): dê XP, itens e moedas direto nas fichas.'],
  },
  {
    capitulo: 'mesa', id: 'mesa', icone: '🗺️', titulo: 'Mesa virtual: mapa e tokens', fotos: [{ arquivo: 'mesa.jpg', legenda: 'Mesa no computador: mapa, tokens e o painel ao lado', larga: true }, { arquivo: 'mesa-celular.jpg', legenda: 'Mesa no celular: o painel fica embaixo' }],
    resumo: 'A mesa mostra o mapa da cena, os tokens e as ferramentas, tudo ao vivo para o grupo.',
    passos: ['Na campanha, toque em “🗺️ Abrir mesa virtual”. Se a sessão estiver fechada, espere o mestre abrir.', 'Para colocar o seu personagem, abra “Jogo → Fichas” e toque em “📍 Colocar na mesa”.', 'Arraste o seu token para andar. Ele anda em linha reta e para nas paredes e portas fechadas; para contornar, mova em etapas. Portas abrem e fecham com um toque no 🚪.', 'As ferramentas ficam no canto de baixo do mapa: ✋ mover, 📏 régua (mede a distância), 📍 marcar um ponto para todos, ✏️ desenhar e 🔥 área de efeito (escolha a forma e o tamanho, toque e arraste para mirar).', 'O painel tem 5 grupos: 💬 Chat, ⚔️ Jogo (Fichas, Iniciativa e Tokens), 🎵 Música, 📖 Diário e 👑 Mestre. Embaixo das abas, uma linha explica o que cada parte faz.', 'O botão ao lado do sino esconde o painel para ver o mapa maior. No celular, “⋯” guarda o Mundo, o Histórico de rolagens, o som dos dados e as Dicas.'],
    dica: 'Use dois dedos para aproximar e afastar o mapa no celular.',
  },
  {
    capitulo: 'mesa', id: 'rolagens', icone: '🎲', titulo: 'Chat e rolagens', fotos: [{ arquivo: 'mesa-chat.jpg', legenda: 'Chat na aba Dados' }],
    resumo: 'Todas as rolagens são feitas no servidor e aparecem para o grupo com cada dado que caiu.',
    passos: ['O chat tem quatro abas: 💬 Conversa (só mensagens), 🎲 Dados (rolagens fora do combate), ⚔️ Combate (ataques, turnos e dano) e 🎩 Mestre (rolagens e tabelas do mestre). O número vermelho mostra o que chegou numa aba fechada.', 'Escreva uma expressão como 2d6+3 (também vale 2d20kh1, 6d6s5 para contar sucessos e 4dF) ou /r 1d20+2 na conversa. Os dados rolam no meio da tela para todos, com o total bem grande.', 'Escolha quem vê: todos, só o mestre ou só você. E em nome de quem fala: você ou o seu personagem.', 'Toque em “Histórico” para procurar rolagens antigas.'],
  },
  {
    capitulo: 'mesa', id: 'combate', icone: '⚔️', titulo: 'Combate: iniciativa, ataques e decisões', fotos: [{ arquivo: 'combate.jpg', legenda: 'Jogo → Iniciativa durante o combate' }],
    resumo: 'Os personagens e NPCs atacam com as armas e poderes da ficha; o mestre conduz os turnos e decide os ataques.',
    passos: ['Mestre: em “Jogo → Iniciativa”, toque em “⚔️ Preparar combate”, marque quem luta e role a iniciativa de todos de uma vez. “Próximo turno” passa a vez; o token da vez ganha um anel dourado.', 'Jogador: na sua vez, aparece “⚔️ Sua vez: atacar”. Escolha a arma ou o poder (o alcance aparece no mapa), toque em “Escolher o alvo no mapa” e no inimigo, e depois em “⚔️ Atacar!”. Ao acabar, toque em “✅ Terminar meu turno”.', 'Decisões do mestre: cada ataque aparece num aviso próprio sobre o mapa, separado do chat, com quem atacou quem, a rolagem e o dano. O mestre escolhe aplicar, metade ou anular. (Em “Mestre → Controles → Regras de combate” dá para deixar o dano automático.)', '💥 “Dano em vários” aplica o mesmo dano a vários alvos, como numa bola de fogo.', 'Condições: toque no token e marque, por exemplo, ☠️ Envenenado, com quantas rodadas dura. Queimando, Envenenado e Sangrando causam dano no começo do turno.', 'À beira da morte: quem chega a 0 de vida rola testes contra a morte no começo do turno (3 sucessos estabiliza, 3 falhas morre, cura levanta).'],
    dica: 'Para dar alcance a uma arma ou poder, edite na ficha e preencha “Alcance (m)”. Sem alcance, vale corpo a corpo (1,5 m).',
  },
  {
    capitulo: 'mesa', id: 'musica', icone: '🎵', fotos: [{ arquivo: 'mesa-musica.jpg', legenda: 'Música: playlists recebidas dos jogadores' }], titulo: 'Música na mesa',
    resumo: 'Cada pessoa monta playlists; o mestre escolhe o que toca para todo mundo.',
    passos: ['Na aba “Música”, crie uma playlist e adicione músicas por link do YouTube, link de áudio ou arquivo do aparelho.', 'Jogadores: toque em “Enviar ao mestre”.', 'Mestre: em “Recebidas”, as playlists aparecem com o nome de quem enviou. Toque em ▶ para tocar para a mesa.', 'Só o mestre controla a música: ⏮ anterior, ⏪ −10 s, ⏸ pausar/continuar, ⏩ +10 s, ⏭ próxima, 🔁 loop e ⏹ parar. Sem loop, a próxima da playlist começa sozinha.', 'O volume no mini player do mapa é só seu (cada pessoa ajusta o próprio). Se o navegador bloquear o som, toque em “🔊 Ouvir a música da mesa”.'],
  },
  {
    capitulo: 'mesa', id: 'historico', icone: '🎲', titulo: 'Histórico de rolagens', quem: 'todos',
    resumo: 'Encontre qualquer rolagem e veja o resumo da sessão.',
    passos: ['Na mesa, toque em “Histórico” no chat (ou em Central → Histórico e escolha a campanha).', 'Escolha o período (esta sessão, hoje, 7 dias ou tudo) e o tipo: dados, ataques, mensagens ou avisos da mesa.', 'Filtre por pessoa, personagem ou texto (ex.: “Furtividade”), ou toque em “🎯 Só críticos” / “💀 Só falhas”.', 'O resumo mostra críticos, falhas, maior dano, maior rolagem e a média do d20 de cada personagem.'],
    dica: 'Os dados da mesa são rolados no servidor: o histórico mostra exatamente o que saiu.',
  },
  {
    capitulo: 'mestre', id: 'painel-mestre', icone: '🎩', titulo: 'Painel do mestre: cenas e mapa', fotos: [{ arquivo: 'mesa-mestre.jpg', legenda: 'Mestre → Controles' }], quem: 'mestre',
    resumo: 'Cenas, tamanho e imagens do mapa, tokens e as regras do grupo.',
    passos: ['Em “Mestre → Controles”, crie cenas e escolha o tamanho do mapa (Pequeno, Médio, Grande, Enorme, Região ou Mundo, ou digite colunas × linhas).', 'Envie imagens do aparelho, recorte com ✂️ e monte o mapa juntando várias imagens (ferramenta 🗂 Montar mapa).', 'Crie tokens de NPC pela ficha (Jogo → Fichas) ou soltos (Jogo → Tokens), com vida, luz e quem pode mover.', 'Trave todos os tokens da cena quando precisar.', '“🎩 Ferramentas do mestre” (D&D) ajudam com XP, CDs, níveis e condições.'],
  },
  {
    capitulo: 'mestre', id: 'paredes', icone: '🧱', titulo: 'Paredes, portas e janelas', fotos: [{ arquivo: 'mesa-paredes.jpg', legenda: 'Ferramenta Paredes: tipo, forma, grade, 👻 e apagar', larga: true }], quem: 'mestre',
    resumo: 'Desenhe no mapa onde ficam as paredes, portas e janelas. Ninguém atravessa, e a luz para nelas.',
    passos: ['Na mesa, toque na ferramenta 🧱 (Paredes, portas e janelas).', 'Escolha o tipo: 🧱 Parede (ninguém passa, a luz não atravessa), 🚪 Porta (abre e fecha com um toque; você pode trancar) ou 🪟 Janela (ninguém passa, mas a luz e a visão atravessam).', 'Escolha a forma: Linha, À mão livre, Retângulo, Círculo ou Triângulo. Arraste no mapa para desenhar.', 'O botão da grade liga e desliga o encaixe nos cantos da grade. Desligado, a parede fica exatamente onde você desenhou (bom para seguir o desenho do mapa) e gruda na ponta de uma parede que já existe.', 'Para apagar, escolha a borracha e toque na parede: a forma inteira sai. A 🗑 apaga todas.', 'Você também é bloqueado pelas paredes. Para pôr um token em qualquer lugar, ligue 👻 Atravessar paredes.'],
    dica: 'Os jogadores não veem as linhas: só sentem a parede quando o token para. Use “👓 Ver como jogador” para conferir.',
  },
  {
    capitulo: 'mestre', id: 'nevoa-luz', icone: '🌫️', titulo: 'Névoa, escuridão, luz e visão', fotos: [{ arquivo: 'mesa-escuro.jpg', legenda: 'O que a jogadora vê numa masmorra escura com tocha', larga: true }], quem: 'mestre',
    resumo: 'Esconda partes do mapa, deixe a cena escura e faça cada personagem ver só o que a luz e os olhos dele alcançam.',
    passos: ['Ligue a névoa da cena em Mestre → Controles. Revele com o pincel, por retângulo ou crie “Partes com névoa” que abrem e fecham com um toque.', '“Escuridão da cena” vai de claro a breu. A partir da metade, cada personagem só vê o que alguma luz ilumina ou o que a visão no escuro dele alcança.', 'Luz: toque no token e dê uma luz (tocha, lanterna, magia) com raio de luz forte e penumbra. A luz para nas paredes e portas fechadas.', 'Visão dos personagens: ligue e a névoa se abre pelo que os personagens enxergam. Em cada token dá para definir até onde ele vê e a visão no escuro (elfo, anão…).', 'Use “👓 Ver como jogador” para conferir o que o grupo está vendo.'],
  },
  {
    capitulo: 'mestre', id: 'biblioteca', icone: '📚', titulo: 'Biblioteca da campanha', quem: 'mestre',
    resumo: 'Itens e poderes prontos para entregar com um toque.',
    passos: ['Na mesa, abra a aba “Mestre → Biblioteca” (só o mestre vê).', 'Em “✨ Prontos para usar”, toque em + para copiar um item ou poder da plataforma, ou em “Todos” para um grupo inteiro.', 'Em “Da campanha”, crie os seus com “Novo item” ou “Novo poder” (com ícone ou foto, raridade, dano e bônus) e use ⧉ para fazer variações.', 'Toque em “🎁 Dar”, marque quem recebe (jogadores e NPCs) e a quantidade. Vai direto para as fichas, e o chat avisa se você quiser.'],
    dica: 'XP, moedas e pontos da árvore continuam em Diário → Recompensas.',
  },
  {
    capitulo: 'mestre', id: 'tabelas', icone: '🎲', titulo: 'Tabelas do mestre', quem: 'mestre',
    resumo: 'Role na hora um nome, um encontro, um rumor ou um tesouro.',
    passos: ['Na mesa, abra a aba “Mestre → Tabelas” (só o mestre vê).', 'As prontas já vêm com a plataforma: nomes, personalidade e segredo de NPC, tavernas, rumores, ganchos, complicações, tesouros, encontros, clima e itens curiosos. “NPC completo” e “Missão completa” juntam várias de uma vez.', 'Toque em “Rolar” para mostrar o resultado no chat para todos, ou em “Só eu” para ver sozinho (fica marcado 🔒 no chat).', 'Em “Nova tabela”, crie as suas: um resultado por linha. Escreva {1d6} para rolar um número e [[código]] para puxar um resultado de outra tabela (ex.: [[nomes]], o ferreiro).', 'As tabelas ficam salvas na campanha; edite ou apague quando quiser.'],
  },
  {
    capitulo: 'mestre', id: 'mundo', icone: '🌍', fotos: [{ arquivo: 'mundo.jpg', legenda: 'Mundo: mapa com alfinetes' }], titulo: 'Mundo da campanha', quem: 'todos',
    resumo: 'Mapa-múndi com alfinetes, páginas de lugares e personagens e a teia de relações.',
    passos: ['Na mesa (ou na lista de campanhas), toque em “🌍 Mundo”.', 'Mestre: em “🗺️ Mapa”, envie a imagem do mapa. Toque em “Marcar lugar” e depois no mapa para criar um alfinete com nome, ícone, descrição e imagem. Arraste os alfinetes para ajustar.', 'Em “📖 Páginas”, crie personagens, facções, perigos, segredos e relíquias. Procure e filtre por tipo.', 'Em “🕸️ Relações”, ligue quem é aliado, inimigo, rival, família, amor ou quem serve a quem. Arraste para organizar.', 'Marque “🙈 Só o mestre vê” em páginas e ligações secretas: os jogadores só descobrem quando você mostrar.', 'Jogadores: toque nos alfinetes e nas pessoas da teia para ler tudo o que o mestre revelou.'],
  },
  {
    capitulo: 'sistemas', id: 'sistemas', icone: '📚', titulo: 'Sistemas de RPG', fotos: [{ arquivo: 'sistemas.jpg', legenda: 'Sistemas publicados' }],
    resumo: 'A plataforma tem fichas no modelo de vários sistemas (D&D, Tormenta20, Ordem Paranormal, Pathfinder e outros) e os sistemas criados pelos jogadores.',
    passos: ['Abra “Sistemas” na barra de baixo (ou no menu). Escolha entre “Sistemas publicados” (RPGs que já existem) e “Sistemas autorais” (criados por jogadores).', 'Toque em “📖 Guia do mestre” para ver como criar a ficha naquele sistema.', 'Toque em “Criar ficha” para começar um personagem. A ficha nasce avulsa; depois dá para levar a uma campanha.', 'Cada sistema tem o próprio visual na ficha: cores, letras e o jeito de mostrar atributos e perícias.'],
    dica: 'As fichas seguem o modelo de cada sistema, mas não fazem as contas: o jogador e o mestre digitam os valores. Sistemas comerciais trazem só a estrutura da ficha; as regras ficam com o seu livro.',
  },
  {
    capitulo: 'sistemas', id: 'construtor', icone: '✍️', fotos: [{ arquivo: 'construtor.jpg', legenda: 'Começo do construtor de sistemas' }], titulo: 'Criar o seu próprio sistema',
    resumo: 'Monte um sistema de RPG do zero (ou a partir de um da plataforma) e use nas suas campanhas.',
    passos: ['Em “Sistemas de RPG” → “Sistemas autorais”, toque em “Abrir o construtor”.', 'Comece com o exemplo simples ou copie a estrutura de um sistema da plataforma.', 'Em “Campos de identidade”, use o tipo “Lista de opções” para Classe, Espécie, Origem…: cada opção tem descrição e bônus automáticos (ex.: Guerreiro dá +1 Força).', 'Monte as seções: identidade, atributos, valores calculados (com fórmulas), perícias, recursos, espaços de texto e regras.', 'Em “Como se rola”, escolha 🎲 Rolagem personalizada para usar um modelo pronto (vantagem, pool de dados, sucessos, Fate…) ou montar a fórmula com VALOR (o número do atributo/perícia). Use “Rolar teste” para conferir.', 'Em “📈 Progressão por nível”, toque em “Ativar” e diga quanto se ganha em cada nível (ex.: +1 ponto da árvore e +5 de vida por nível). Cada coluna vira a variável prog_nome nas fórmulas, como Vida máxima = 10 + prog_vida.', 'Tabela por classe: com uma “Lista de opções” de classes, use “🔗 Uma tabela para cada opção de…” na progressão. Cada classe fica com a sua tabela, e a ficha usa só a da classe escolhida. Para multiclasse, crie “Segunda classe” e “Nível 2”.', 'Coluna “💪 Pontos de atributo”: na ficha, ao tocar em “Subir de nível”, abre uma janela com o que o nível deu e botões + e − para colocar os pontos nos atributos (respeitando o máximo).', 'Em “🌠 Árvore de habilidades padrão”, monte os hexágonos (custo, requisitos, bônus e habilidades). Toda ficha nova do sistema já começa com essa árvore; os pontos do nível entram sozinhos.', 'As fórmulas usam os nomes que aparecem em “na fórmula” (ex.: 10 + FOR * 2). Toque numa fórmula e depois numa variável para inserir. Se algo estiver errado, o aviso amarelo explica o quê.', 'Use “Prévia” para testar a ficha na hora. Toque em “Salvar”: já dá para criar fichas (só você, enquanto for rascunho).', 'Quando estiver pronto, “Publicar para todos”: ele aparece nos Sistemas autorais com “✍️ Criado por” e o seu nome, e pode ser escolhido nas campanhas.'],
    dica: 'Dá para editar depois: as fichas existentes passam a usar a versão nova. Um sistema com fichas não pode ser excluído, só voltar a rascunho.',
  },
  {
    capitulo: 'sistemas', id: 'primeiro-sistema', icone: '🧪', titulo: 'Exemplo: o seu primeiro sistema',
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
    capitulo: 'conta', id: 'senha', icone: '🔒', titulo: 'Senha do perfil e código de recuperação', quem: 'todos',
    resumo: 'Opcional: proteja o seu perfil para ninguém mais entrar nele. Se esquecer a senha, use o código de recuperação.',
    passos: ['Na Central, toque na sua foto no topo (ou no menu → “Editar perfil”).', 'Em “🔒 Senha do perfil”, toque em “Criar senha”, digite duas vezes (6 a 72 caracteres) e salve.', 'Aparece o seu código de recuperação (ex.: K7QM-2XPB-9RTD-W4HN). Guarde num lugar seguro: ele aparece só uma vez.', 'No portal, o seu perfil passa a mostrar 🔒. Em outro aparelho, a plataforma pede a senha uma vez e lembra dele por 30 dias.', 'Esqueceu a senha? Na janela da senha, toque em “Esqueci a senha”, digite o código e escolha uma senha nova (ou deixe vazio para ficar sem senha). Você recebe um código novo.', 'Perdeu o código? Com a senha, gere outro em Editar perfil. Sem os dois, só o administrador consegue apagar a senha.'],
    dica: 'Não existe recuperação por e-mail. Use uma senha que você lembre e que não use em outros sites.',
  },
  {
    capitulo: 'conta', id: 'ficha-arquivo', icone: '💾', titulo: 'Baixar e importar ficha', quem: 'todos',
    resumo: 'Guarde uma cópia do personagem num arquivo e traga de volta quando quiser.',
    passos: ['Abra a ficha e toque em ⬇️ “Baixar” no topo: o celular ou o computador salva um arquivo .json.', 'Para trazer de volta, vá em Central → Fichas → Avulsas e toque em “Importar ficha”.', 'A ficha importada vira uma ficha avulsa nova; a original não muda. Para usar numa campanha, envie para a campanha normalmente.'],
    dica: 'Serve de backup e para levar o personagem para outro perfil. Fichas de sistemas criados por outra pessoa só importam se o sistema estiver publicado.',
  },
  {
    capitulo: 'conta', id: 'apagar-perfil', icone: '🗑️', titulo: 'Apagar o meu perfil', quem: 'todos',
    resumo: 'Apaga o seu perfil e tudo dele, de vez. Os personagens das campanhas podem ficar com o mestre.',
    passos: ['Quer guardar algum personagem? Abra a ficha e toque em ⬇️ “Baixar”.', 'Na Central, abra “Editar perfil” e, no fim, toque em “Apagar perfil…”.', 'Se você for mestre de alguma campanha, a janela mostra quais e pede para marcar que elas serão apagadas junto.', 'Escolha se os seus personagens nas campanhas de outros mestres ficam com eles, como NPC, escreva o nome do perfil e confirme.'],
    dica: 'Não dá para desfazer. Fichas baixadas podem ser importadas de novo num perfil novo.',
  },
  {
    capitulo: 'conta', id: 'novidades', icone: '✨', titulo: 'Novidades e versão',
    resumo: 'Cada atualização ganha um número de versão e uma lista do que mudou.',
    passos: ['No menu, toque em “Novidades” para ver o que mudou em cada versão.', 'No portal, “↻ Verificar atualização” recarrega a página com a versão mais nova.'],
  },
  {
    capitulo: 'conta', id: 'admin', icone: '🔒', titulo: 'Gerenciar perfis (administrador)', fotos: [{ arquivo: 'portal-admin.jpg', legenda: 'Senha do administrador' }], quem: 'admin',
    resumo: 'Só quem sabe a senha de administrador pode remover perfis e ver a saúde da plataforma.',
    passos: ['No portal, toque em “🔒 Gerenciar perfis” e digite a senha.', 'Toque na 🗑 de um perfil para removê-lo. As fichas e playlists dele também são apagadas.', 'Um perfil que é mestre de alguma campanha só pode ser removido depois que essas campanhas forem excluídas.', 'Em “🩺 Saúde da plataforma e cópias de segurança” você vê se o banco está no ar, os erros inesperados registrados e as cópias diárias. Dá para guardar uma cópia na hora ou baixar o arquivo para guardar no seu computador.'],
    dica: 'A senha fica na Vercel, na variável PRG_ADMIN_SENHA. Para trocar, mude a variável e faça um Redeploy.',
  },
]
