/**
 * Histórico de versões mostrado em /novidades. A versão atual é a do package.json.
 * Ao publicar uma atualização: aumente "version" no package.json e adicione uma entrada no topo.
 */
export type Versao = { versao: string; data: string; titulo: string; itens: string[] }

export const VERSOES: Versao[] = [
  {
    versao: '0.24.0', data: '2026-11-10', titulo: 'Dano por turno e dados certos',
    itens: [
      'Dano por turno: Queimando (1d6), Envenenado (1d4) e Sangrando (1d4) já entram causando dano. Na janela do token, o campo 💥 de cada condição muda o dano (ex.: 2d4+1 ou 3) ou tira, se ficar vazio.',
      'O dano é rolado no começo do turno de quem tem a condição e sai da vida dele (ou da ficha ligada). O chat mostra os dados e a vida que sobrou, e a condição continua até as rodadas acabarem.',
      'Corrigido: fichas novas começavam com a vida em 0, então o dano não tinha de onde sair. Agora vida, mana e afins começam cheias quando o sistema calcula o máximo.',
      'Janela do token: botão “❤️ Vida cheia” e aviso quando a ficha ligada está sem vida preenchida.',
      'Dados 3D: o d100 agora cai como dois dados (dezenas + unidades) e mostra o número certo. Os dados assentam mais rápido e tremem menos no fim.',
      'Cartão da rolagem: o bônus aparece separado (ex.: dado 13 e +5 = 18) e os dados descartados (vantagem, 4d6kh3) aparecem riscados, para o número do dado bater com o total.',
      'Tokens colocados na mesa sem posição entram na casa livre mais perto do meio (antes ficavam um em cima do outro, e tocar num pegava o outro).',
      'Migração 019: dano por turno das condições.',
    ],
  },
  {
    versao: '0.23.1', data: '2026-11-10', titulo: 'Zoom suave no mapa',
    itens: [
      'Zoom do mapa da mesa e da árvore de habilidades com a rodinha do mouse ficou suave: cada clique aproxima ou afasta só um pouco, mirando onde está o mouse. Antes, um movimento pequeno pulava do zoom mínimo ao máximo.',
    ],
  },
  {
    versao: '0.23.0', data: '2026-11-10', titulo: 'Condições com duração e toque no celular',
    itens: [
      'Corrigido: no celular, tocar num token (para abrir a janela dele ou escolher o alvo do ataque) abria e fechava na hora. Agora o toque funciona.',
      'Escolher o alvo funciona com qualquer ferramenta do mapa selecionada, e o token não sai do lugar enquanto você mira.',
      'Condições com duração: na janela do token, cada condição pode durar de 1 a 10 rodadas (ou sem limite). A contagem desce no fim do turno daquele token, e o chat avisa quando ela acaba.',
      'O número de rodadas aparece em cima do token no mapa e na lista de iniciativa. Quando chega a vez de alguém, o chat mostra as condições dele.',
      'Novas condições: 🩸 Sangrando, 🔥 Queimando, 🐌 Lento e ⛓️ Paralisado.',
      'O jogador pode tocar em “✅ Terminar meu turno” quando é a vez dele, sem esperar o mestre.',
      'Migração 018: duração das condições nos tokens.',
    ],
  },
  {
    versao: '0.22.0', data: '2026-11-10', titulo: 'Classe com a sua tabela de níveis',
    itens: [
      'A classe escolhida define a tabela de níveis: numa “Lista de opções” (Classe), cada opção pode ter a sua “📈 Tabela de níveis”. Na ficha, só vale a tabela da classe escolhida.',
      'Construtor, em “Progressão por nível”: botão “🔗 Uma tabela para cada opção de…”. Ele cria uma tabela para Guerreiro, Mago… (começando igual à atual) e já liga tudo.',
      'Multiclasse: crie “Segunda classe” e “Nível 2” e diga que o nível dessa escolha fica em “Nível 2”. A ficha soma as duas tabelas.',
      'Na ficha, o cartão de progressão mostra a classe escolhida e o nível dela, e avisa quando ainda falta escolher a classe.',
    ],
  },
  {
    versao: '0.21.0', data: '2026-11-10', titulo: 'Grupos de perfis e classes para escolher',
    itens: [
      'Portal com grupos: antes dos perfis aparecem dois cartões, 🧭 De Fora e 🌙 Lunethernnyis. Cada um mostra só os perfis do seu grupo, e o aparelho lembra a escolha (“Trocar grupo” volta aos cartões).',
      'Todos os perfis que já existiam estão em Lunethernnyis. Cada pessoa pode trocar o próprio grupo em “Editar perfil”; perfis novos escolhem o grupo ao serem criados.',
      'Construtor: novo tipo de campo “Lista de opções” para Classe, Espécie, Origem… Cada opção tem descrição e bônus automáticos (ex.: Guerreiro → +1 Força, +2 Luta).',
      'Na ficha, o jogador escolhe a opção numa lista, vê a descrição e os bônus, e eles já entram nos cálculos.',
      'O “Exemplo simples” do construtor agora vem com Classe (Guerreiro, Batedor, Sábio) e Espécie (Humano, Elfo).',
      'Guia: novo tópico “🧪 Exemplo: o seu primeiro sistema”, um passo a passo com valores prontos para quem está começando.',
      'Migração 017: coluna “grupo” nos perfis.',
    ],
  },
  {
    versao: '0.20.0', data: '2026-11-10', titulo: 'Árvore padrão e progressão por nível',
    itens: [
      'Construtor de sistemas: nova seção “🌠 Árvore de habilidades padrão”. Monte os hexágonos uma vez e toda ficha nova do sistema já começa com eles.',
      'Fichas que já existem trazem a árvore com “🌠 Usar a árvore do sistema”, ou “🔄 Atualizar” quando o autor mudar algo (o que já foi liberado continua).',
      'Construtor: nova seção “📈 Progressão por nível”. Diga quanto se ganha em cada nível (pontos da árvore, vida, pontos de atributo ou o que quiser) e a ficha soma sozinha.',
      'Na ficha: botão “Subir de nível” mostra o que o personagem ganhou; os pontos do nível entram direto na árvore.',
      'Cada coluna da progressão vira a variável prog_nome nas fórmulas (ex.: Vida máxima = 10 + prog_vida). Dá para ter mais de uma classe (multiclasse).',
      'Sistemas do catálogo com progressão (como D&D 5e) agora podem ser usados como modelo no construtor.',
    ],
  },
  {
    versao: '0.19.0', data: '2026-11-11', titulo: 'Preparar combate',
    itens: [
      'Preparar combate (aba Iniciativa → ⚔️ Preparar combate): marque quem luta (todos, só jogadores, só NPCs) e role a iniciativa de todos de uma vez, com o bônus da ficha (Destreza, Agilidade ou “Iniciativa”) ou o que o mestre escrever.',
      'A ordem de turnos já vem organizada (maior primeiro; empate: maior bônus) e o chat anuncia o começo do combate e de quem é a vez.',
      '“Próximo turno” passa a vez e conta as rodadas; “🏳️ Encerrar” termina o combate.',
      'O token da vez ganha um anel dourado no mapa. O jogador recebe um aviso quando chega a vez dele e um botão “⚔️ Sua vez: atacar” no topo.',
      'A lista de iniciativa mostra a imagem e a vida de cada um, com atalho para atacar na vez.',
    ],
  },
  {
    versao: '0.18.0', data: '2026-11-11', titulo: 'Combate na mesa',
    itens: [
      'Combate na mesa: toque no seu token e em “⚔️ Atacar”, escolha a arma ou o poder da ficha, mire no alvo (o alcance aparece no mapa) e ataque. O ataque é rolado contra a Defesa do alvo e o dano aparece em seguida, com os dados no meio da tela.',
      'Regras de combate (aba Mestre): o dano sai automaticamente ou o mestre confirma no chat, com “Aplicar”, “Metade” ou “Anular”.',
      'Tokens a partir das fichas: o token entra com nome, imagem e vida da ficha, e a vida fica sempre igual à da ficha (dano na mesa muda a ficha).',
      'Poderes descontam o custo sozinhos (PM, esforço…) e não deixam usar sem recurso suficiente.',
      'Nova aba “📜 Fichas” na mesa: o mestre vê todas as fichas da campanha (jogadores e NPCs) com vida, defesa e ataques, abre a ficha e coloca na mesa. O jogador vê as dele.',
      'Itens e poderes ganharam o campo “Alcance (m)”.',
    ],
  },
  {
    versao: '0.17.0', data: '2026-11-10', titulo: 'Tutoriais práticos',
    itens: [
      'Tutoriais práticos (/tutorial): 5 lições com missões que se marcam sozinhas: rolar dados, árvore de habilidades, rolagem personalizada, retrato e capa, mesa virtual.',
      'Campo de treino dentro do tutorial: dá para rolar dados, montar e liberar uma árvore e criar uma regra de rolagem sem mexer nas suas fichas.',
      'Barra de progresso e “lição concluída” com atalho para a próxima. O progresso fica guardado neste navegador.',
      'Atalhos: botão “🎓 Tutoriais práticos” no Guia e no menu da Central, e “Praticar no tutorial” nos tópicos do Guia.',
    ],
  },
  {
    versao: '0.16.1', data: '2026-11-10', titulo: 'Dado 3D mostra o número certo',
    itens: [
      'Dados 3D agora caem exatamente no número sorteado: a face de cima do dado é a mesma do resultado (antes o 3D rolava por conta própria e podia mostrar outro número).',
      'O cartão com o total aparece quando os dados param de rolar.',
      'Dados que não existem em 3D (ex.: d1000) ou rolagens com mais de 20 dados aparecem só no cartão, sem dado “errado” na tela.',
    ],
  },
  {
    versao: '0.16.0', data: '2026-11-10', titulo: 'Rolagem personalizada',
    itens: [
      'Rolagem personalizada no construtor de sistemas: em “Como se rola”, escolha 🎲 Rolagem personalizada e use um dos 12 modelos (vantagem, 2d6, pool de dados, contar sucessos, rola e mantém, Fate…) ou monte a sua fórmula.',
      'A fórmula usa VALOR no lugar do atributo/perícia em que a pessoa toca na ficha (ex.: 2d20kh1+VALOR, VALORd6s5). Botões ajudam a montar e dá para testar a rolagem na hora.',
      'Dados novos em qualquer rolagem (chat, poderes, itens): contar sucessos (6d6s5), dados Fate (4dF), rerrolar 1 (2d6r1) e explodir mantendo os maiores (5d10!kh2).',
      'As fichas do sistema rolam com a regra dele, com o resultado no meio da tela; em campanhas, o servidor rola e manda para o chat da mesa.',
    ],
  },
  {
    versao: '0.15.0', data: '2026-11-10', titulo: 'Árvore de habilidades',
    itens: [
      'Árvore de habilidades em todas as fichas (menu da ficha → 🌠 Árvore de habilidades): hexágonos ligados num céu estrelado, com custo em pontos e pré-requisitos.',
      'Liberar um hexágono gasta pontos e acende o caminho; os que já podem ser liberados piscam a borda. “Devolver pontos” desfaz (se nenhum outro depender dele).',
      'Efeitos automáticos: bônus (atributo, valor calculado, perícia ou máximo de recurso) e habilidades novas, com dados, custo de uso e descrição, que aparecem sozinhas em “Poderes e habilidades”.',
      '“Montar árvore”: criar hexágonos, arrastar para organizar, ligar um ao outro e editar. Dá para começar com um exemplo pronto.',
      'Recompensas do mestre agora podem dar pontos de habilidade, que vão direto para a árvore das fichas.',
      'Nas campanhas, a árvore segue a regra da área “Habilidades” (livre, com aprovação ou só o mestre).',
    ],
  },
  {
    versao: '0.14.0', data: '2026-11-10', titulo: 'Dados no centro e cartões com imagem',
    itens: [
      'Dados 3D no meio da tela: os dados caem numa área central e, quando param, aparece um cartão com o total bem grande e cada dado que caiu (crítico em dourado, falha em vermelho). Toque para fechar.',
      'Vale na mesa e também nas fichas: rolar um atributo, perícia, poder ou item mostra a rolagem no centro.',
      'Fichas em cartões com imagem: cada personagem pode ter um retrato (toque no quadro ao lado do nome, na ficha). Sem imagem, o cartão ganha uma cor própria.',
      'Campanhas em cartões com capa: o mestre coloca a capa dentro da campanha (🖼️ Colocar capa). O cartão mostra sessão acontecendo, estado, pendências e o botão direto para a mesa.',
      'Dentro da campanha, a capa aparece grande no topo, e a lista de fichas do mestre mostra o retrato de cada personagem.',
      'Imagens enviadas são diminuídas no aparelho antes de subir: mais rápido e sem gastar espaço à toa.',
    ],
  },
  {
    versao: '0.13.1', data: '2026-11-10', titulo: 'Mesa sem atraso',
    itens: [
      'Mesa sem atraso: o token acompanha o dedo/mouse na hora e fica onde você soltou, sem voltar nem pular enquanto o servidor salva.',
      'Desenhar sem atraso: o traço fica na tela assim que você solta, sem sumir e reaparecer.',
      'Os outros jogadores veem o token sendo arrastado e o traço sendo desenhado ao vivo, sem esperar o salvamento.',
      'Mapa mais leve: grade, névoa e desenhos não são redesenhados a cada movimento (melhora em celulares e mapas grandes).',
      'Cursor dos outros enviado com menos mensagens, para não congestionar o canal ao vivo.',
    ],
  },
  {
    versao: '0.13.0', data: '2026-11-09', titulo: 'Segurança, cópias de segurança e saúde da plataforma',
    itens: [
      'O login antigo por e-mail saiu de vez (telas, código e banco de dados). A entrada é só pelo portal de perfis.',
      'Três funções antigas do banco que ficavam abertas foram removidas, junto com as tabelas vazias do sistema antigo.',
      'Cópia de segurança automática todos os dias, numa pasta privada (ficam as últimas 14). O administrador também pode guardar ou baixar uma cópia na hora.',
      'Saúde da plataforma (área do administrador): banco no ar, versão publicada e os erros inesperados registrados, com detalhes.',
      'Se uma tela quebrar, aparece um aviso amigável com “Tentar de novo”, e o erro é registrado automaticamente.',
      'O importar/exportar sistemas por arquivo foi retirado, e a Ficha V8 não entra mais na plataforma nem por importação.',
    ],
  },
  {
    versao: '0.12.1', data: '2026-11-09', titulo: 'Créditos do criador',
    itens: [
      '“✍️ Criado por” com o nome de quem fez o sistema, em destaque na lista de sistemas, na escolha de sistema e dentro das fichas.',
      'Lunethernnyis (ficha automática e Ficha V8) saiu da plataforma por enquanto, para revisão do autor. Fichas que já existiam continuam abrindo normalmente; não dá para criar novas.',
    ],
  },
  {
    versao: '0.12.0', data: '2026-11-09', titulo: 'Construtor de sistemas autorais',
    itens: [
      'Construtor de sistemas autorais: monte seu próprio RPG com identidade, atributos, valores calculados por fórmula, perícias (por graus ou por número), recursos, espaços de texto, limites de criação, carga e lembretes de regras.',
      'Comece com um exemplo simples ou copiando a estrutura de um sistema da plataforma (os créditos de licença aberta vão junto).',
      'Prévia ao vivo da ficha e conferência das fórmulas: o construtor avisa, em português, qualquer variável que não existe ou conta com erro.',
      'Rascunho (só você vê e testa) ou publicado (aparece em “Sistemas autorais” para todos, com o seu nome). Fichas, campanhas, inventário, poderes e permissões funcionam igual aos outros sistemas.',
      'Os balões de aviso agora aparecem logo abaixo do topo, sem cobrir os botões.',
    ],
  },
  {
    versao: '0.11.0', data: '2026-11-09', titulo: 'Avisos (notificações)',
    itens: [
      'Avisos dentro da plataforma (🔔 no topo da Central e da mesa), sem nada por e-mail: número de não lidos, balão quando chega algo novo e toque para ir direto ao lugar certo.',
      'Jogadores são avisados de: entrada aceita ou recusada, ficha aprovada/recusada/ajustes, ficha travada, recompensas, sessão começando, mudança de papel, anotações compartilhadas e resumos novos no diário.',
      'O mestre é avisado de: pedidos para entrar, fichas e playlists enviadas e pedidos de alteração de ficha.',
      '“Ler todos” e “Apagar os já lidos”; avisos com mais de 60 dias somem sozinhos.',
      'Links diretos para uma campanha na Central (usados pelos avisos).',
    ],
  },
  {
    versao: '0.10.0', data: '2026-11-09', titulo: 'Sessões, espectadores e música do mestre',
    itens: [
      'Sessão aberta/fechada: só o mestre abre a mesa (“▶ Abrir sessão”). Com a sessão fechada, ninguém além do mestre entra; quem estiver esperando entra sozinho quando ela abrir.',
      '“⏹ Encerrar sessão” tira todo mundo da mesa e para a música (o histórico continua disponível).',
      'Espectadores: o mestre escolhe em “Participantes” quem é jogador e quem é espectador. Espectadores assistem, ouvem a música e conversam no chat, sem mexer em nada.',
      'Cores no chat: 👑 mestre em dourado, ⚔️ jogadores em azul e 👁️ espectadores em verde.',
      'Música: só o mestre pausa, continua, volta/avança 10 s e passa para a anterior/próxima. Sem loop, a próxima da playlist começa sozinha. O vídeo do YouTube não aceita mais cliques; o volume continua individual.',
    ],
  },
  {
    versao: '0.9.0', data: '2026-11-09', titulo: 'Inventário, poderes e biblioteca do mestre',
    itens: [
      'Inventário de verdade nas fichas: itens com tipo, quantidade, peso, dano e bônus. Item equipado soma sozinho na ficha (ex.: escudo +2 na CA, anel +1 numa resistência).',
      'Barra de carga com o limite de cada sistema (D&D, Pathfinder, Tormenta20 e Blades) e carteira para moedas.',
      'Poderes e magias com custo em recurso (PM, PE…), usos até descansar e rolagem: “Usar” desconta e rola; em campanha, a rolagem vai para o chat da mesa.',
      'Biblioteca do mestre (aba Diário da mesa): monte itens e poderes uma vez e entregue em Recompensas; eles chegam prontos na ficha.',
      'Recompensas de item e moedas agora entram no inventário e na carteira em vez de virar texto (na Ficha V8 continuam anotadas).',
    ],
  },
  {
    versao: '0.8.2', data: '2026-11-09', titulo: 'Entrada animada nos perfis',
    itens: [
      'Animação ao escolher um perfil: a foto voa para o centro com um brilho e estrelas, mostra “Bem-vindo de volta” e mergulha na Central (toque para pular).',
      'A Central aparece suavemente depois da animação. Quem ativou “reduzir movimento” no aparelho entra direto, sem animação.',
    ],
  },
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
