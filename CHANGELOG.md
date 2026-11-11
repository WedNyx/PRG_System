# Changelog — PRG System

Também aparece no site em /novidades. Ao atualizar: aumente a versão no package.json e acrescente a entrada em src/lib/versoes.ts e aqui.

## v0.32.0 — Passar itens e capas dos sistemas (2026-11-11)
- 🎁 Passar item: na ficha de campanha, toque em “Passar” no item, escolha o personagem e a quantidade. O item sai da sua ficha e entra na outra na hora, e o chat da mesa avisa.
- Quem recebe ganha um aviso. Itens iguais empilham; o item chega desequipado. O mestre também passa itens de e para NPCs (esses avisos ficam só para o mestre).
- Se o mestre travou o inventário de uma das fichas, a troca não acontece.
- 🖼️ Capas dos sistemas: cada sistema da plataforma ganhou uma ilustração própria no clima do jogo (fantasia, cidade sombria, faroeste arcano, tempestade, investigação…). As capas aparecem nos cartões e na hora de escolher o sistema.
- Sistemas autorais: o autor envia a capa no construtor (em “Sobre o sistema”). Sem imagem, o sistema ganha uma capa de constelação com uma cor só dele.
- As capas são desenhos da plataforma, não as capas oficiais dos livros.

## v0.31.0 — Senha do perfil (2026-11-11)
- 🔒 Senha do perfil (opcional): em Editar perfil → “Senha do perfil”, crie uma senha. Daí em diante, só entra no seu perfil quem souber a senha. Não precisa de e-mail.
- Cada aparelho fica lembrado por 30 dias depois de digitar a senha. Em “Aparelhos lembrados” dá para ver onde você está conectado e desconectar todos.
- No portal, perfis com senha aparecem com 🔒 e pedem a senha antes de entrar. Trocar a senha desconecta os outros aparelhos.
- Esqueceu a senha? O administrador (com a senha de administrador) toca no 🔑 do perfil para apagar a senha, e você cria outra.
- Segurança: a senha fica guardada só embaralhada (scrypt), o servidor confere em todas as ações, e 5 erros seguidos travam as tentativas por 10 minutos.
- Migração 023: senha do perfil e aparelhos lembrados.

## v0.30.0 — Tabelas do mestre e subir de nível guiado (2026-11-11)
- 🎲 Tabelas do mestre (aba “Tabelas” na mesa, só para o mestre): role na hora nomes, personalidade e segredo de NPC, tavernas, rumores, ganchos, complicações, tesouros, encontros, clima e itens curiosos. “NPC completo” e “Missão completa” juntam várias tabelas num resultado só.
- “Rolar” mostra o resultado no chat para todos; “Só eu” fica visível só para o mestre. O sorteio é feito no servidor.
- Crie as tabelas da sua campanha: um resultado por linha, com {1d6} para rolar números e [[código]] para puxar outra tabela.
- ⬆️ Subir de nível guiado: ao subir, abre uma janela com tudo o que o nível deu. Se o sistema dá pontos de atributo, dá para distribuir ali mesmo com + e −; se dá pontos da árvore, um botão leva direto para a árvore.
- A ficha avisa quando sobram pontos de atributo para distribuir (e quando há pontos demais depois de descer de nível).
- Migração 022: tabelas da campanha.

## v0.29.1 — Estrelinhas sonhadoras como tema principal (2026-11-11)
- Estrelinhas sonhadoras agora é o tema principal da plataforma. O Céu estrelado saiu; quem estava com ele passa para as Estrelinhas sozinho.

## v0.29.0 — Temas para escolher (2026-11-11)
- 🎨 Nova aba Temas (menu → Temas): 8 fundos para escolher com prévia, e o tema muda na hora: Céu estrelado, Estrelinhas sonhadoras, Nuvens de algodão, Lua cheia, Céu carmesim, Grimório celestial, Prisma e Noite clássica.
- Cada tema com imagem tem duas versões, uma em pé para o celular e outra deitada para o computador, recortadas e ajustadas para cada tela (sem marca d’água).
- Corrigido: no celular (principalmente iPhone), o fundo esticava pela página inteira e ficava borrado. Agora ele fica parado atrás do conteúdo, nítido, em qualquer tela.
- Grimório celestial e Prisma são desenhos próprios da plataforma, inspirados nas referências.

## v0.28.0 — Mundo da campanha (2026-11-10)
- 🌍 Mundo da campanha (botão “🌍 Mundo” na mesa e nas campanhas): o mestre envia o mapa-múndi e toca em “Marcar lugar” para pôr alfinetes. Cada alfinete abre uma página com imagem, descrição e relações.
- Páginas de lugares, personagens, facções, perigos, segredos e relíquias, com 32 ícones. Dá para procurar e filtrar por tipo, e o mestre arrasta os alfinetes para ajustar.
- 🕸️ Teia de relações: quem é aliado, inimigo, rival, família, amor, quem serve a quem e conhecidos, cada um com uma cor e texto na linha (ex.: “quer o trono”). O mestre arrasta para organizar; tocar abre a página.
- 🙈 “Só o mestre vê” em páginas e ligações: os jogadores só descobrem quando o mestre mostrar (o servidor esconde de verdade).
- O mapa tem zoom suave, os alfinetes ficam do mesmo tamanho em qualquer zoom e “Ver no mapa” acende o lugar. Os jogadores veem as mudanças sem recarregar.
- Migração 021: mundo da campanha.

## v0.27.0 — Forja de itens (2026-11-10)
- ⚒️ Forja de itens: no editor de item, escolha entre 19 formas desenhadas pela plataforma (espada, adaga, machado, martelo, lança, arco, cajado, escudo, armadura, elmo, poção, pergaminho, livro, tocha, chave, anel, amuleto, gema e bolsa de moedas), a cor principal, a cor do detalhe (ou qualquer cor) e a raridade.
- Raridades com moldura colorida: Comum, Incomum, Raro, Épico, Lendário e Único. Do Raro para cima o item brilha, e Lendário e Único ganham uma faísca.
- “🎲 Surpreenda-me” sorteia forma, cores e raridade combinando com o tipo do item; “✨ Sugerir um nome” cria nomes como “Lâmina do Crepúsculo”.
- Itens que já existem ganham arte sozinhos, pelo nome e pelo tipo (uma “Adaga” vira adaga, um “Elixir” vira poção…).
- A arte aparece no inventário, na biblioteca do mestre e na mesa: na escolha da arma ao atacar e na aba Fichas.

## v0.26.0 — À beira da morte e barras vivas (2026-11-10)
- À beira da morte: quando a vida chega a 0, o personagem cai e faz um teste contra a morte (d20) sozinho no começo de cada turno. 10+ é sucesso, 9 ou menos é falha, 1 conta duas falhas e 20 levanta com 1 de vida.
- 3 sucessos deixam estável; 3 falhas, morreu (⚰️). Dano em quem está caído conta falha (crítico conta duas), e qualquer cura levanta e zera a contagem.
- As bolinhas de sucesso e falha aparecem embaixo do token no mapa e na janela do token. O dono pode rolar na hora, e o mestre ajusta na mão (+✅, +❌, estabilizar, zerar).
- Regra opcional ⚠️ Medidas desesperadas (aba Mestre → Regras de combate): de pé, o jogador aceita 1 falha futura (fugir, correr o dobro ou +5 num d20) ou 3 (ataque extra ou recuperar uma magia). As falhas entram na conta quando ele cair.
- Barras melhores: o pedaço perdido fica claro e some devagar, a barra treme, o número sobe (−5 / +3) e a barra pulsa quando passa de 25% para baixo. Mini-barras de PV, PE e Sanidade no topo da ficha.
- Migração 020: estado “à beira da morte” nos tokens.

## v0.25.0 — Barras de vida, esforço e sanidade (2026-11-10)
- Fichas: PV, PE, Sanidade, Mana e os outros recursos viraram barras grossas e coloridas, no estilo das fichas de Ordem Paranormal: vida vermelha, sanidade azul, esforço laranja, mana anil.
- Botões dos lados da barra: ‹ › mudam 1 e « » mudam 5. Toque no número para digitar o valor ou, quando o sistema não calcula sozinho, o máximo.

## v0.24.0 — Dano por turno e dados certos (2026-11-10)
- Dano por turno: Queimando (1d6), Envenenado (1d4) e Sangrando (1d4) já entram causando dano. Na janela do token, o campo 💥 de cada condição muda o dano (ex.: 2d4+1 ou 3) ou tira, se ficar vazio.
- O dano é rolado no começo do turno de quem tem a condição e sai da vida dele (ou da ficha ligada). O chat mostra os dados e a vida que sobrou, e a condição continua até as rodadas acabarem.
- Corrigido: fichas novas começavam com a vida em 0, então o dano não tinha de onde sair. Agora vida, mana e afins começam cheias quando o sistema calcula o máximo.
- Janela do token: botão “❤️ Vida cheia” e aviso quando a ficha ligada está sem vida preenchida.
- Dados 3D: o d100 agora cai como dois dados (dezenas + unidades) e mostra o número certo. Os dados assentam mais rápido e tremem menos no fim.
- Cartão da rolagem: o bônus aparece separado (ex.: dado 13 e +5 = 18) e os dados descartados (vantagem, 4d6kh3) aparecem riscados, para o número do dado bater com o total.
- Tokens colocados na mesa sem posição entram na casa livre mais perto do meio (antes ficavam um em cima do outro, e tocar num pegava o outro).
- Migração 019: dano por turno das condições.

## v0.23.1 — Zoom suave no mapa (2026-11-10)
- Zoom do mapa da mesa e da árvore de habilidades com a rodinha do mouse ficou suave: cada clique aproxima ou afasta só um pouco, mirando onde está o mouse. Antes, um movimento pequeno pulava do zoom mínimo ao máximo.

## v0.23.0 — Condições com duração e toque no celular (2026-11-10)
- Corrigido: no celular, tocar num token (para abrir a janela dele ou escolher o alvo do ataque) abria e fechava na hora. Agora o toque funciona.
- Escolher o alvo funciona com qualquer ferramenta do mapa selecionada, e o token não sai do lugar enquanto você mira.
- Condições com duração: na janela do token, cada condição pode durar de 1 a 10 rodadas (ou sem limite). A contagem desce no fim do turno daquele token, e o chat avisa quando ela acaba.
- O número de rodadas aparece em cima do token no mapa e na lista de iniciativa. Quando chega a vez de alguém, o chat mostra as condições dele.
- Novas condições: 🩸 Sangrando, 🔥 Queimando, 🐌 Lento e ⛓️ Paralisado.
- O jogador pode tocar em “✅ Terminar meu turno” quando é a vez dele, sem esperar o mestre.
- Migração 018: duração das condições nos tokens.

## v0.22.0 — Classe com a sua tabela de níveis (2026-11-10)
- A classe escolhida define a tabela de níveis: numa “Lista de opções” (Classe), cada opção pode ter a sua “📈 Tabela de níveis”. Na ficha, só vale a tabela da classe escolhida.
- Construtor, em “Progressão por nível”: botão “🔗 Uma tabela para cada opção de…”. Ele cria uma tabela para Guerreiro, Mago… (começando igual à atual) e já liga tudo.
- Multiclasse: crie “Segunda classe” e “Nível 2” e diga que o nível dessa escolha fica em “Nível 2”. A ficha soma as duas tabelas.
- Na ficha, o cartão de progressão mostra a classe escolhida e o nível dela, e avisa quando ainda falta escolher a classe.

## v0.21.0 — Grupos de perfis e classes para escolher (2026-11-10)
- Portal com grupos: antes dos perfis aparecem dois cartões, 🧭 De Fora e 🌙 Lunethernnyis. Cada um mostra só os perfis do seu grupo, e o aparelho lembra a escolha (“Trocar grupo” volta aos cartões).
- Todos os perfis que já existiam estão em Lunethernnyis. Cada pessoa pode trocar o próprio grupo em “Editar perfil”; perfis novos escolhem o grupo ao serem criados.
- Construtor: novo tipo de campo “Lista de opções” para Classe, Espécie, Origem… Cada opção tem descrição e bônus automáticos (ex.: Guerreiro → +1 Força, +2 Luta).
- Na ficha, o jogador escolhe a opção numa lista, vê a descrição e os bônus, e eles já entram nos cálculos.
- O “Exemplo simples” do construtor agora vem com Classe (Guerreiro, Batedor, Sábio) e Espécie (Humano, Elfo).
- Guia: novo tópico “🧪 Exemplo: o seu primeiro sistema”, um passo a passo com valores prontos para quem está começando.
- Migração 017: coluna “grupo” nos perfis.

## v0.20.0 — Árvore padrão e progressão por nível (2026-11-10)
- Construtor de sistemas: nova seção “🌠 Árvore de habilidades padrão”. Monte os hexágonos uma vez e toda ficha nova do sistema já começa com eles.
- Fichas que já existem trazem a árvore com “🌠 Usar a árvore do sistema”, ou “🔄 Atualizar” quando o autor mudar algo (o que já foi liberado continua).
- Construtor: nova seção “📈 Progressão por nível”. Diga quanto se ganha em cada nível (pontos da árvore, vida, pontos de atributo ou o que quiser) e a ficha soma sozinha.
- Na ficha: botão “Subir de nível” mostra o que o personagem ganhou; os pontos do nível entram direto na árvore.
- Cada coluna da progressão vira a variável prog_nome nas fórmulas (ex.: Vida máxima = 10 + prog_vida). Dá para ter mais de uma classe (multiclasse).
- Sistemas do catálogo com progressão (como D&D 5e) agora podem ser usados como modelo no construtor.

## v0.19.0 — Preparar combate (2026-11-11)
- Preparar combate (aba Iniciativa → ⚔️ Preparar combate): marque quem luta (todos, só jogadores, só NPCs) e role a iniciativa de todos de uma vez, com o bônus da ficha (Destreza, Agilidade ou “Iniciativa”) ou o que o mestre escrever.
- A ordem de turnos já vem organizada (maior primeiro; empate: maior bônus) e o chat anuncia o começo do combate e de quem é a vez.
- “Próximo turno” passa a vez e conta as rodadas; “🏳️ Encerrar” termina o combate.
- O token da vez ganha um anel dourado no mapa. O jogador recebe um aviso quando chega a vez dele e um botão “⚔️ Sua vez: atacar” no topo.
- A lista de iniciativa mostra a imagem e a vida de cada um, com atalho para atacar na vez.

## v0.18.0 — Combate na mesa (2026-11-11)
- Combate na mesa: toque no seu token e em “⚔️ Atacar”, escolha a arma ou o poder da ficha, mire no alvo (o alcance aparece no mapa) e ataque. O ataque é rolado contra a Defesa do alvo e o dano aparece em seguida, com os dados no meio da tela.
- Regras de combate (aba Mestre): o dano sai automaticamente ou o mestre confirma no chat, com “Aplicar”, “Metade” ou “Anular”.
- Tokens a partir das fichas: o token entra com nome, imagem e vida da ficha, e a vida fica sempre igual à da ficha (dano na mesa muda a ficha).
- Poderes descontam o custo sozinhos (PM, esforço…) e não deixam usar sem recurso suficiente.
- Nova aba “📜 Fichas” na mesa: o mestre vê todas as fichas da campanha (jogadores e NPCs) com vida, defesa e ataques, abre a ficha e coloca na mesa. O jogador vê as dele.
- Itens e poderes ganharam o campo “Alcance (m)”.
- Migração 016: prg_campanhas.combate e prg_mesa_eventos.dados (tipo 'ataque').

## v0.17.0 — Tutoriais práticos (2026-11-10)
- Tutoriais práticos (/tutorial): 5 lições com missões que se marcam sozinhas: rolar dados, árvore de habilidades, rolagem personalizada, retrato e capa, mesa virtual.
- Campo de treino dentro do tutorial: dá para rolar dados, montar e liberar uma árvore e criar uma regra de rolagem sem mexer nas suas fichas.
- Barra de progresso e “lição concluída” com atalho para a próxima. O progresso fica guardado neste navegador.
- Atalhos: botão “🎓 Tutoriais práticos” no Guia e no menu da Central, e “Praticar no tutorial” nos tópicos do Guia.

## v0.16.1 — Dado 3D mostra o número certo (2026-11-10)
- Dados 3D agora caem exatamente no número sorteado: a face de cima do dado é a mesma do resultado (antes o 3D rolava por conta própria e podia mostrar outro número).
- O cartão com o total aparece quando os dados param de rolar.
- Dados que não existem em 3D (ex.: d1000) ou rolagens com mais de 20 dados aparecem só no cartão, sem dado “errado” na tela.

## v0.16.0 — Rolagem personalizada (2026-11-10)
- Rolagem personalizada no construtor de sistemas: em “Como se rola”, escolha 🎲 Rolagem personalizada e use um dos 12 modelos (vantagem, 2d6, pool de dados, contar sucessos, rola e mantém, Fate…) ou monte a sua fórmula.
- A fórmula usa VALOR no lugar do atributo/perícia em que a pessoa toca na ficha (ex.: 2d20kh1+VALOR, VALORd6s5). Botões ajudam a montar e dá para testar a rolagem na hora.
- Dados novos em qualquer rolagem (chat, poderes, itens): contar sucessos (6d6s5), dados Fate (4dF), rerrolar 1 (2d6r1) e explodir mantendo os maiores (5d10!kh2).
- As fichas do sistema rolam com a regra dele, com o resultado no meio da tela; em campanhas, o servidor rola e manda para o chat da mesa.

## v0.15.0 — Árvore de habilidades (2026-11-10)
- Árvore de habilidades em todas as fichas (menu da ficha → 🌠 Árvore de habilidades): hexágonos ligados num céu estrelado, com custo em pontos e pré-requisitos.
- Liberar um hexágono gasta pontos e acende o caminho; os que já podem ser liberados piscam a borda. “Devolver pontos” desfaz (se nenhum outro depender dele).
- Efeitos automáticos: bônus (atributo, valor calculado, perícia ou máximo de recurso) e habilidades novas, com dados, custo de uso e descrição, que aparecem sozinhas em “Poderes e habilidades”.
- “Montar árvore”: criar hexágonos, arrastar para organizar, ligar um ao outro e editar. Dá para começar com um exemplo pronto.
- Recompensas do mestre agora podem dar pontos de habilidade, que vão direto para a árvore das fichas.
- Nas campanhas, a árvore segue a regra da área “Habilidades” (livre, com aprovação ou só o mestre).

## v0.14.0 — Dados no centro e cartões com imagem (2026-11-10)
- Dados 3D no meio da tela: os dados caem numa área central e, quando param, aparece um cartão com o total bem grande e cada dado que caiu (crítico em dourado, falha em vermelho). Toque para fechar.
- Vale na mesa e também nas fichas: rolar um atributo, perícia, poder ou item mostra a rolagem no centro.
- Fichas em cartões com imagem: cada personagem pode ter um retrato (toque no quadro ao lado do nome, na ficha). Sem imagem, o cartão ganha uma cor própria.
- Campanhas em cartões com capa: o mestre coloca a capa dentro da campanha (🖼️ Colocar capa). O cartão mostra sessão acontecendo, estado, pendências e o botão direto para a mesa.
- Dentro da campanha, a capa aparece grande no topo, e a lista de fichas do mestre mostra o retrato de cada personagem.
- Imagens enviadas são diminuídas no aparelho antes de subir: mais rápido e sem gastar espaço à toa.
- Migração 015: coluna capa_url em prg_campanhas.

## v0.13.1 — Mesa sem atraso (2026-11-10)
- Mesa sem atraso: o token acompanha o dedo/mouse na hora e fica onde você soltou, sem voltar nem pular enquanto o servidor salva.
- Desenhar sem atraso: o traço fica na tela assim que você solta, sem sumir e reaparecer.
- Os outros jogadores veem o token sendo arrastado e o traço sendo desenhado ao vivo, sem esperar o salvamento.
- Mapa mais leve: grade, névoa e desenhos não são redesenhados a cada movimento (melhora em celulares e mapas grandes).
- Cursor dos outros enviado com menos mensagens, para não congestionar o canal ao vivo.

## v0.13.0 — Segurança, cópias de segurança e saúde da plataforma (2026-11-09)
- O login antigo por e-mail saiu de vez (telas, código e banco de dados). A entrada é só pelo portal de perfis.
- Três funções antigas do banco que ficavam abertas foram removidas (handle_new_user, entrar_com_codigo, sou_membro_da_campanha), junto com as tabelas vazias do sistema antigo.
- Cópia de segurança automática todos os dias (Vercel Cron → pasta privada prg-backups no Supabase; ficam as últimas 14). O administrador também pode guardar ou baixar uma cópia na hora.
- Saúde da plataforma (área do administrador): banco no ar, versão publicada e os erros inesperados registrados (servidor e navegador), com detalhes.
- Tela amigável quando uma página quebra, com “Tentar de novo”; o erro é registrado automaticamente.
- Endereço público /api/prg/saude para checar se o site e o banco estão no ar.
- O importar/exportar sistemas por arquivo foi retirado, e a Ficha V8 não entra mais na plataforma nem por importação.

## v0.12.1 — Créditos do criador (2026-11-09)
- “✍️ Criado por” com o nome de quem fez o sistema, em destaque na lista de sistemas, na escolha de sistema e dentro das fichas.
- Lunethernnyis (ficha automática e Ficha V8) saiu da plataforma por enquanto, para revisão do autor. Fichas que já existiam continuam abrindo normalmente; não dá para criar novas.

## v0.12.0 — Construtor de sistemas autorais (2026-11-09)
- Construtor de sistemas autorais: monte seu próprio RPG com identidade, atributos, valores calculados por fórmula, perícias (por graus ou por número), recursos, espaços de texto, limites de criação, carga e lembretes de regras.
- Comece com um exemplo simples ou copiando a estrutura de um sistema da plataforma (os créditos de licença aberta vão junto).
- Prévia ao vivo da ficha e conferência das fórmulas: o construtor avisa, em português, qualquer variável que não existe ou conta com erro.
- Rascunho (só você vê e testa) ou publicado (aparece em “Sistemas autorais” para todos, com o seu nome). Fichas, campanhas, inventário, poderes e permissões funcionam igual aos outros sistemas.
- Os balões de aviso agora aparecem logo abaixo do topo, sem cobrir os botões.

## v0.11.0 — Avisos (notificações) (2026-11-09)
- Avisos dentro da plataforma (🔔 no topo da Central e da mesa), sem nada por e-mail: número de não lidos, balão quando chega algo novo e toque para ir direto ao lugar certo.
- Jogadores são avisados de: entrada aceita ou recusada, ficha aprovada/recusada/ajustes, ficha travada, recompensas, sessão começando, mudança de papel, anotações compartilhadas e resumos novos no diário.
- O mestre é avisado de: pedidos para entrar, fichas e playlists enviadas e pedidos de alteração de ficha.
- “Ler todos” e “Apagar os já lidos”; avisos com mais de 60 dias somem sozinhos.
- Links diretos para uma campanha na Central (usados pelos avisos).

## v0.10.0 — Sessões, espectadores e música do mestre (2026-11-09)
- Sessão aberta/fechada: só o mestre abre a mesa (“▶ Abrir sessão”). Com a sessão fechada, ninguém além do mestre entra; quem estiver esperando entra sozinho quando ela abrir.
- “⏹ Encerrar sessão” tira todo mundo da mesa e para a música (o histórico continua disponível).
- Espectadores: o mestre escolhe em “Participantes” quem é jogador e quem é espectador. Espectadores assistem, ouvem a música e conversam no chat, sem mexer em nada.
- Cores no chat: 👑 mestre em dourado, ⚔️ jogadores em azul e 👁️ espectadores em verde.
- Música: só o mestre pausa, continua, volta/avança 10 s e passa para a anterior/próxima. Sem loop, a próxima da playlist começa sozinha. O vídeo do YouTube não aceita mais cliques; o volume continua individual.

## v0.9.0 — Inventário, poderes e biblioteca do mestre (2026-11-09)
- Inventário de verdade nas fichas: itens com tipo, quantidade, peso, dano e bônus. Item equipado soma sozinho na ficha (ex.: escudo +2 na CA, anel +1 numa resistência).
- Barra de carga com o limite de cada sistema (D&D, Pathfinder, Tormenta20 e Blades) e carteira para moedas.
- Poderes e magias com custo em recurso (PM, PE…), usos até descansar e rolagem: “Usar” desconta e rola; em campanha, a rolagem vai para o chat da mesa.
- Biblioteca do mestre (aba Diário da mesa): monte itens e poderes uma vez e entregue em Recompensas; eles chegam prontos na ficha.
- Recompensas de item e moedas agora entram no inventário e na carteira em vez de virar texto (na Ficha V8 continuam anotadas).

## v0.8.2 — Entrada animada nos perfis (2026-11-09)
- Animação ao escolher um perfil: a foto voa para o centro com um brilho e estrelas, mostra “Bem-vindo de volta” e mergulha na Central (toque para pular).
- A Central aparece suavemente depois da animação. Quem ativou “reduzir movimento” no aparelho entra direto, sem animação.

## v0.8.1 — Sistemas publicados e autorais (2026-11-09)
- Sistemas de RPG separados em duas abas: “Sistemas publicados” (RPGs já existentes) e “Sistemas autorais” (criados por jogadores).
- Lunethernnyis deixou de ser o destaque: agora fica junto dos outros autorais, e as listas de escolha mostram primeiro os sistemas publicados.
- Campanhas novas não vêm mais com um sistema escolhido: o mestre escolhe na lista.

## v0.8.0 — Céu estrelado, perfis e guias (2026-11-09)
- Novo tema principal “Céu estrelado” (céu roxo com nuvens, estrelas e lua). A “Noite clássica” continua disponível no menu “Tema”.
- Editar perfil: cada pessoa muda o próprio nome e foto pelo menu da Central (ou tocando na própria foto).
- Gerenciar perfis protegido por senha de administrador (configurada na Vercel): só quem sabe a senha remove perfis da plataforma.
- Guia da plataforma com fotos: botão “Guia” ao lado da foto de perfil, explicando cada parte e como fazer cada coisa.
- Guia do mestre em cada sistema de RPG (na lista de sistemas e dentro da ficha): passo a passo de criação e o que a ficha calcula sozinha.
- Fichas revisadas: D&D 5e com CA por armadura e limite de Destreza e PV pela média; Pathfinder 2e com PV e CA pelas regras; pirâmide de perícias do Fate; pontos de ação do Blades; modificador de dano do BRP.

## v0.7.0 — Música na mesa (2026-11-09)
- Nova aba 🎵 Música na mesa: cada pessoa cria e organiza as próprias playlists (links do YouTube, links de áudio ou arquivos de até 15 MB).
- Jogadores enviam playlists ao mestre (e podem cancelar o envio). O mestre vê as recebidas separadas pelo nome de quem enviou.
- O mestre escolhe a música e ela toca para todo mundo da sessão, no mesmo ponto da música, com botões de 🔁 Loop e ⏹ Parar.
- Mini player no canto do mapa com volume e “mudo” só para você, e botão “🔊 Ouvir a música da mesa” quando o navegador bloquear o som.
- Busca de músicas no YouTube direto na aba (quando a chave da API do YouTube estiver configurada).

## v0.6.1 — Tamanho do mapa e recorte de imagens (2026-11-09)
- O mestre escolhe o tamanho do mapa (Pequeno, Médio, Grande, Enorme ou personalizado), vendo quantos metros ele tem.
- ✂️ Recortar: escolha qual parte da imagem entra no mapa, arrastando o quadro e puxando os cantos.
- ⛶ Esticar uma imagem para ocupar o mapa inteiro, e lista das imagens do mapa com miniaturas.
- Mapas enviados ao criar a cena já podem ser recortados; cenas antigas podem virar editáveis.

## v0.6.0 — Mapas montados, tokens controlados e diário do mestre (2026-11-09)
- Monte o mapa juntando várias imagens enviadas do aparelho: arraste e mude o tamanho de cada pedaço.
- Névoa com pincel (1×1, 3×3, 5×5), revelar/esconder uma área inteira de uma vez e botões “Revelar tudo” e “Esconder tudo”.
- Tokens com imagem e tamanho (até 4×4). O mestre escolhe quem move cada um (o dono, todos ou só o mestre) e pode travar todos os tokens da cena.
- Jogadores colocam o próprio token na mesa, mesmo sem ficha aprovada.
- Rolagens com painel grande mostrando cada dado que caiu e o total.
- Rolagens feitas nas fichas de campanha (Ficha V8 e outros sistemas) aparecem no chat da mesa; dá para rolar em segredo para o mestre.
- Aba “Diário” na mesa: sessões com preparação secreta do mestre e resumo publicado para os jogadores.
- Anotações privadas, só para o mestre, para toda a campanha ou para uma pessoa.
- Recompensas: o mestre dá XP, itens e moedas direto nas fichas, com registro no histórico e aviso no chat.

## v0.5.0 — Mesa virtual e ajustes (2026-11-08)
- Mesa virtual nas campanhas: cenas com mapa, névoa de guerra, tokens, régua, marcações e desenhos.
- Chat e rolagens feitas no servidor, com visibilidade para todos, só o mestre ou privada.
- Histórico permanente de rolagens com busca por jogador, personagem e tipo.
- Iniciativa com turnos e rodadas, controlada pelo mestre.
- Sistema da campanha escolhido numa lista; “Nova ficha” pergunta o sistema.
- Fichas dos outros sistemas com menu por seções; Ficha V8 volta para o início.

## v0.4.0 — Fichas nas campanhas e permissões do mestre (2026-11-08)
- Enviar uma cópia da ficha ao mestre, que aprova, recusa ou pede ajustes.
- Permissões por área valendo no servidor, com exceções por jogador e travas.
- Pedidos de alteração com antes e depois, histórico da ficha e registro de decisões.
- NPCs do mestre e criação de ficha junto com o jogador; aviso de pendências.

## v0.3.0 — Sistemas de RPG (2026-11-08)
- Fichas que calculam sozinhas: Lunethernnyis automático, D&D 5e, Pathfinder 2e, Fate, Blades in the Dark, BRP e Faroeste Arcano.
- Ordem Paranormal e Tormenta20 como estrutura de ficha, mais a Ficha livre.
- Importar para a nuvem as fichas e campanhas salvas no navegador.

## v0.2.0 — Base na nuvem (2026-11-08)
- Campanhas no servidor com convites por código ou link e pedidos de entrada.
- Participantes, co-mestres, estados da campanha e várias campanhas por aventureiro.
- Fichas sincronizadas entre celular e computador, com modo sem internet.

## v0.1.0 — Primeira versão (2026-11-01)
- Portal de aventureiros, Central e Ficha V8 de Lunethernnyis salva no navegador.
