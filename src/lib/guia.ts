/**
 * Conteúdo do Guia da plataforma (/guia). As fotos ficam em public/guia/ e são capturas
 * da própria plataforma, com dados de demonstração (ao mudar telas, vale tirar fotos novas).
 */
export type TopicoGuia = { id: string; icone: string; titulo: string; resumo: string; foto?: string; legenda?: string; passos: string[]; dica?: string; quem?: 'todos' | 'mestre' | 'admin' }

export const GUIA: TopicoGuia[] = [
  {
    id: 'perfil', icone: '🌙', titulo: 'Entrar com o seu perfil', foto: 'portal.jpg', legenda: 'Portal dos aventureiros',
    resumo: 'O portal é a porta de entrada: cada pessoa do grupo tem um perfil com nome e foto.',
    passos: ['Toque na sua foto para entrar.', 'Ainda não tem perfil? Toque em “+ Criar perfil”, escolha um nome e uma foto (dá para arrastar e dar zoom).', 'Para trocar de perfil depois, use “Trocar aventureiro” no menu.'],
  },
  {
    id: 'central', icone: '🏠', titulo: 'A Central e o menu', foto: 'central.jpg', legenda: 'Menu lateral da Central',
    resumo: 'Na Central ficam suas fichas, campanhas, sistemas e o histórico.',
    passos: ['No celular, toque em ☰ (canto de cima, à esquerda) para abrir o menu.', 'Use “Início”, “Fichas”, “Campanhas”, “Sistemas de RPG” e “Histórico” para navegar.', 'O botão “Guia”, ao lado da sua foto, abre esta página.'],
  },
  {
    id: 'editar-perfil', icone: '✏️', titulo: 'Mudar nome e foto', foto: 'editar-perfil.jpg', legenda: 'Janela “Editar perfil”',
    resumo: 'Cada pessoa muda o próprio nome e a própria foto.',
    passos: ['No menu, toque em “Editar perfil” (ou na sua foto, no canto de cima).', 'Toque em “📷 Trocar foto”, ajuste o recorte e toque em “Usar esta foto”.', 'Mude o nome se quiser e toque em “Salvar”. Todo mundo verá a mudança.'],
  },
  {
    id: 'tema', icone: '🎨', titulo: 'Tema da plataforma',
    resumo: 'O tema principal é o Céu estrelado. Também existe a Noite clássica, mais lisa.',
    passos: ['No menu, toque em “Tema” para alternar entre Céu estrelado e Noite clássica.', 'A escolha vale para este aparelho.'],
  },
  {
    id: 'sistemas', icone: '📚', titulo: 'Sistemas de RPG e guia do mestre', foto: 'sistemas.jpg', legenda: 'Sistemas com o guia do mestre aberto',
    resumo: 'A plataforma tem fichas prontas para vários sistemas, que calculam as regras sozinhas.',
    passos: ['Abra “Sistemas de RPG” no menu. Escolha entre “Sistemas publicados” (RPGs já existentes) e “Sistemas autorais” (criados por jogadores).', 'Toque em “📖 Guia do mestre” para ver como criar a ficha naquele sistema e o que a ficha calcula sozinha.', 'Toque em “Criar ficha” para começar um personagem.'],
    dica: 'Sistemas com selo “Estrutura de ficha” são comerciais: a ficha organiza os campos e as regras ficam com o seu livro.',
  },
  {
    id: 'fichas', icone: '📜', titulo: 'Criar e preencher fichas', foto: 'ficha.jpg', legenda: 'Ficha com menu por seções',
    resumo: 'As fichas ficam salvas na nuvem e abrem no celular ou no computador.',
    passos: ['Em “Fichas”, toque em “Nova ficha” e escolha o sistema.', 'Use o menu de seções (Principal, Atributos e perícias, Habilidades, Equipamentos, Anotações e Guia de criação).', 'Toque no dado ao lado de uma perícia para rolar. Em fichas de campanha, a rolagem vai para o chat da mesa.', 'Para jogar numa campanha, use “Enviar para campanha” na lista de fichas.'],
    dica: 'A seção “📖 Guia de criação”, dentro da ficha, mostra o passo a passo daquele sistema.',
  },
  {
    id: 'inventario', icone: '🎒', titulo: 'Inventário e poderes', foto: 'inventario.jpg', legenda: 'Inventário com carga e itens equipados',
    resumo: 'Itens e poderes organizados, que somam sozinhos na ficha.',
    passos: ['Na ficha, abra “🎒 Inventário” e toque em “Novo item”: escolha o tipo, o peso, a rolagem de dano e os bônus quando equipado (ex.: escudo → CA +2).', 'Toque em “Equipar” para o bônus entrar na ficha. Use + e − para a quantidade; consumíveis têm o botão “Usar”.', 'A barra de carga mostra o peso total e o limite do sistema. Anote as moedas na carteira.', 'Em “🌌 Poderes e habilidades”, crie magias e técnicas com custo (ex.: 3 PM), usos até descansar e rolagem. “Usar” desconta o recurso e rola; “Descansar” recupera os usos.'],
    dica: 'O mestre monta itens e poderes na “Biblioteca” (aba Diário da mesa) e entrega em “Recompensas”: eles chegam prontos na ficha.',
  },
  {
    id: 'campanhas', icone: '🏰', titulo: 'Criar campanha e convidar o grupo', foto: 'campanha.jpg', legenda: 'Painel da campanha do mestre', quem: 'mestre',
    resumo: 'O mestre cria a campanha, gera um convite e aprova quem entra.',
    passos: ['Em “Campanhas”, toque em “Criar campanha”, dê um nome e escolha o sistema.', 'Abra a campanha e toque em “Gerar convite (7 dias)”. Envie o link ou o código para o grupo.', 'Quem usar o convite aparece em pedidos: toque em “Aceitar”.', 'Em “Permissões por área da ficha”, escolha o que os jogadores podem mudar sozinhos e o que precisa da sua aprovação.'],
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
    passos: ['Na campanha, toque em “🗺️ Abrir mesa virtual”.', 'As ferramentas ficam no canto de baixo: mover, régua, marcar ponto e desenhar.', 'Arraste o seu token para movê-lo. O mestre decide quem pode mexer em cada token.', 'Toque em “Só o mapa” para esconder o painel e ver o mapa maior.'],
  },
  {
    id: 'rolagens', icone: '🎲', titulo: 'Chat e rolagens', foto: 'mesa-chat.jpg', legenda: 'Chat com rolagens',
    resumo: 'Todas as rolagens são feitas no servidor e aparecem para o grupo com cada dado que caiu.',
    passos: ['Na aba “Chat”, toque em um dado rápido (d4 a d100) ou escreva uma expressão como 2d6+3.', 'Escolha quem vê: todos, só o mestre ou só você.', 'Toque em “Histórico” para procurar rolagens antigas por pessoa, personagem ou tipo.'],
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
    id: 'mestre', icone: '🎩', titulo: 'Painel do mestre na mesa', foto: 'mesa-mestre.jpg', legenda: 'Aba Mestre', quem: 'mestre',
    resumo: 'Cenas, mapas, névoa e controle dos tokens.',
    passos: ['Crie cenas e escolha o tamanho do mapa (Pequeno, Médio, Grande, Enorme).', 'Envie imagens do aparelho, recorte com ✂️ e monte o mapa juntando várias imagens.', 'Ligue a névoa e revele partes do mapa com o pincel ou por área.', 'Trave todos os tokens da cena quando precisar.'],
  },
  {
    id: 'admin', icone: '🔒', titulo: 'Gerenciar perfis (administrador)', foto: 'portal-admin.jpg', legenda: 'Senha do administrador', quem: 'admin',
    resumo: 'Só quem sabe a senha de administrador pode remover perfis da plataforma.',
    passos: ['No portal, toque em “🔒 Gerenciar perfis” e digite a senha.', 'Toque na 🗑 de um perfil para removê-lo. As fichas e playlists dele também são apagadas.', 'Um perfil que é mestre de alguma campanha só pode ser removido depois que essas campanhas forem excluídas.'],
    dica: 'A senha fica na Vercel, na variável PRG_ADMIN_SENHA. Para trocar, mude a variável e faça um Redeploy.',
  },
  {
    id: 'novidades', icone: '✨', titulo: 'Novidades e versão',
    resumo: 'Cada atualização ganha um número de versão e uma lista do que mudou.',
    passos: ['No menu, toque em “Novidades” para ver o que mudou em cada versão.', 'No portal, “↻ Verificar atualização” recarrega a página com a versão mais nova.'],
  },
]
