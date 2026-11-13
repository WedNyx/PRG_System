# Changelog — PRG System

Também aparece no site em /novidades. Ao atualizar: aumente a versão no package.json e acrescente a entrada em src/lib/versoes.ts e aqui.

## v0.33.6 — Progressão de D&D 2024 (2026-11-12)
- ✅ Qualidade: teste novo de dispositivos (11 telas em celular pequeno, celular, iPhone, tablet em pé e deitado, computador e tela grande) que confere rolagem para o lado, erros e acessibilidade; nenhuma tela rola para o lado nem dá erro. Correções de acessibilidade: a faixa de barras de vida da ficha agora dá para rolar pelo teclado, os números das barras ficaram maiores para o dedo, a lista do chat da mesa ficou certa para leitores de tela e o botão de esconder o aviso da sessão cresceu. O GitHub agora roda todos os testes, os tipos, o lint dos módulos novos e o build em toda PR, e há um passo a passo de deploy com checagem rápida da produção.
- 🔎 Revisão dos outros sistemas: as fórmulas de Pathfinder 2e, Tormenta20, Ordem Paranormal, BRP, Fate, Blades, Faroeste Arcano, RPG PUNK e Assimilação foram conferidas nos níveis 1, 5 e 20 (nenhum cálculo vazio ou quebrado) e todas as fichas foram abertas no celular e no computador, aba por aba, sem rolagem para o lado nem erro na tela. Todas as fichas (menos a livre e as autorais) ganharam a “Conferência da ficha” na aba Principal: o que falta escolher (classe, raça, cartilha…), atributos ainda no valor inicial, limites da criação passados e PV sem máximo, com “Ir” para a aba certa. A ajuda da aba de atributos agora explica certo cada caso (valor que já é o bônus, pontos que viram dados ou Instintos de Assimilação), e o guia da ficha livre não cita mais Assimilação como sistema que falta.
- 📚 Livros e fontes da campanha de D&D: em Editar campanha, o mestre marca os livros que a mesa usa. O SRD 5.2.1 vem sempre, com as regras; Livro do Jogador (2024), Guia do Mestre (2024) e Manual dos Monstros (2025) entram só pelo nome, e dá para anotar outros suplementos. Com o Livro do Jogador liberado, a escolha de subclasse ganha as outras 3 de cada classe (36 no total), a espécie ganha o Aasimar e o antecedente ganha mais 12, todos marcados com 📕; a Árvore mostra em que níveis a subclasse do livro ganha características (“consulte o livro”), sem nenhum texto do livro na plataforma. Opções de livro não liberado não aparecem, e o servidor recusa se alguém tentar escolher (o mestre pode tudo; fichas avulsas também). A ficha mostra as fontes liberadas na aba Árvore.
- 🧰 Guia do mestre de D&D 2024 interativo: “Ferramentas do mestre” (no Guia do mestre do D&D e na aba Mestre da mesa) monta encontros pelo orçamento de XP do SRD 5.2.1 (grupo puxado das fichas da campanha, dificuldade Baixa, Moderada ou Alta, criaturas por Nível de Desafio, barra com as faixas, avisos de muitas criaturas, ND acima do grupo e fichas demais, e “Dar XP ao grupo” em um toque), tem as CDs típicas e como funciona o d20, XP e níveis com patamares e a tabela de XP e proficiência por ND, as 15 condições, as ações do turno e os descansos, e confere as fichas do grupo. Cada ficha de D&D ganhou a “Conferência da ficha” na aba Principal: classe, espécie, antecedente, atributos, requisitos de multiclasse, escolhas pendentes, magias acima ou abaixo do limite, PV, armadura e XP para subir de nível, com “Ir” para a aba certa.
- 🌳 Árvore de habilidades: o mestre agora pode dar exceções. “Conceder sem custo” libera um hexágono sem gastar pontos, sem requisitos e sem nível mínimo (aparece com 🎁, e só o mestre retira — o servidor confere). Hexágonos podem ter nível mínimo (“libera a partir do nível 5”). A árvore guarda um histórico das últimas 40 mudanças (liberar, devolver, conceder, criar, editar, excluir, pontos) com “Desfazer” em cada uma, e o botão “Desfazer” no topo volta a última. Em campanhas de D&D, o mestre escolhe na aba Árvore o modo só daquela ficha (Híbrido, Automático ou Manual) ou deixa seguir a campanha; antes a exceção ficava salva mas a ficha não usava.
- 👥 Multiclasse de D&D 2024: na aba Árvore, “Classes” mostra cada classe com o seu nível e o nível total. O “+” sobe um nível naquela classe, e “Multiclasse” pega o 1º nível de uma classe nova, avisando o que se ganha ao entrar e os requisitos (13 no atributo principal da classe nova e das atuais; o servidor confere, e o mestre pode liberar mesmo assim). A proficiência usa o nível total; as características, as subclasses, os talentos e os recursos (fúrias, foco, surto…) usam o nível de cada classe; as salvaguardas vêm só da classe inicial; os PV dos outros níveis usam a média do dado de cada classe; e só uma Defesa sem Armadura vale. Os espaços de magia seguem a tabela de Conjurador Multiclasse (Paladino e Patrulheiro contam metade, arredondando para cima; o Pacto do Bruxo fica à parte), e cada classe prepara as próprias magias como se fosse única, com o atributo dela: na janela de magias você escolhe por qual classe preparar. A Árvore separa as características por classe.
- ✨ Magias de D&D 2024: as 339 magias do SRD 5.2.1 com nome em português, escola, tempo de conjuração, alcance (em metros), componentes, duração, Concentração e Ritual, um resumo do efeito e o texto original em “Detalhes”. Na aba Poderes, “Adicionar magias” busca por nome (português ou inglês), filtra pela lista da classe e por nível e respeita a tabela: truques e magias preparadas até o limite, só níveis com espaço de magia, Arcana Mística do Bruxo, Segredos Mágicos do Bardo, truque a mais do Taumaturgo e do Mágico e os truques do Guerreiro Abençoado e do Guerreiro Druídico (nova opção do Estilo de Luta). Magias de subclasse, talento ou item entram como “extra”, fora do limite. Cada magia mostra o botão de ataque, o dano ou a cura já crescendo com o espaço escolhido (e os truques nos níveis 5, 11 e 17), e “Conjurar” gasta o espaço de magia. O servidor confere as magias novas; no modo Manual não há limites.
- ⚙️ Efeitos automáticos de D&D 2024, sem contar nada duas vezes: proficiência nas salvaguardas da classe e nas perícias do antecedente e das escolhas (aparecem com ✔ e a origem; se você também marcar, não soma de novo), recursos da classe pela tabela (Fúrias, Inspiração de Bardo, Canalizar Divindade, Forma Selvagem, Retomar o Fôlego, Surto de Ação, Indomável, Foco, Feitiçaria, Cura pelas Mãos, Marca do Caçador, espaços de magia e de Pacto), Defesa sem Armadura e Resiliência Dracônica na CA e nos PV, Alerta na Iniciativa, Pau para Toda Obra e deslocamento com os bônus da classe. Recursos que a sua classe não tem nem aparecem. No modo Manual tudo isso fica desligado.
- 📚 Catálogo completo do SRD 5.2.1 na aba Árvore: as 12 classes do nível 1 ao 20, com a subclasse aberta de cada uma (as características dela aparecem quando é escolhida), as 9 espécies com traços e escolhas (linhagem élfica e gnômica, ancestral dracônico e gigante, legado ínfero, talento do Humano) e os 4 antecedentes com atributos, talento de origem, perícias, ferramenta e equipamento.
- ✋ Escolhas de verdade: Estilo de Luta, Ordem Divina, Ordem Primal, Golpes Abençoados, Fúria Elemental, Presa do Caçador e outras viraram seletores; Aumento de Atributo e Dádiva Épica agora pedem a escolha do talento (antes apareciam como “Adquirida”). A ficha avisa quantas escolhas estão pendentes.
- 📊 A Árvore mostra a tabela da classe no nível atual (fúrias, dado de inspiração, truques, magias preparadas, espaços de magia, pontos de foco…) e agrupa as características por nível, com os próximos níveis escondidos até você pedir.
- 🌳 D&D 2024 — modo de progressão da campanha: o mestre escolhe Híbrido (padrão), Automático ou Manual em Editar campanha. Na aba Árvore da ficha aparecem os marcos oficiais com selos de Adquirida, Escolha pendente e Futura.
- 🛡️ O servidor confere a escolha de subclasse: só a partir do nível 3, da classe certa e de uma opção existente. Um nível pedido pelo jogador e ainda não aprovado não libera escolhas.
- Armadura pesada não usa mais a Destreza na CA (nem quando ela é negativa).
- Campanhas antigas continuam iguais e passam a usar o modo Híbrido. Trocar o modo não apaga as exceções feitas para uma ficha.
- 🪟 Janelas da ficha e da mesa (novo poder, novo item, descanso, passar item, árvore, combate, biblioteca e outras) agora abrem centralizadas por cima de tudo e rolam por dentro. Antes, dentro de um cartão com efeito de vidro, a janela ficava presa e cortada no celular, e não dava para chegar nos outros campos.
- 📱 Ajustes para celular: o campo do código de convite cabe inteiro e as janelas não grudam mais no rodapé.
- Banco: migração 027 (coluna config_progressao em prg_campanhas). O site funciona sem ela, com o modo Híbrido, até ser aplicada.

## v0.33.5 — Chat separado na mesa (2026-11-12)
- 💬 Chat separado na mesa: a aba Chat agora tem “Conversa”, só com as mensagens do grupo, e “Dados e mesa”, com as rolagens, ataques, turnos e avisos. Cada uma mostra quantas novidades chegaram na outra, e os dados para rolar ficam em “Dados e mesa” (o /r da conversa continua funcionando).

## v0.33.4 — Cartões ilustrados e Assimilação na mesa (2026-11-12)
- 🃏 Cartões dos sistemas no estilo ilustrado, com as capas novas de todos os sistemas (artes do Wed): a ilustração fica à direita e se funde com o fundo, com título grande, selos, descrição e os botões “Guia do mestre” e “Criar ficha” por cima. Cada sistema ganhou a sua cor na borda brilhante e no botão de criar ficha (vermelho no D&D, azul no Pathfinder, verde no BRP, âmbar no Faroeste…).
- 🧬 Assimilação na mesa virtual: o ataque rola o Instinto em d6 e a aptidão em d10 (escolha a dupla, como Reação + Armas), mantém o melhor dado e acerta com pelo menos 1 Sucesso. O dano das armas em d10 conta um ponto por símbolo e desce pelos níveis de Saúde (do 6 ao 1); a cura enche de volta. A ordem do combate usa a Reação em d6. No chat e no histórico, as rolagens de Assimilação aparecem com os dados e os símbolos (Sucesso, Adaptação e Pressão), em vez da soma dos números.

## v0.33.3 — Dois sistemas novos (2026-11-12)
- 🩸 Novo sistema: RPG PUNK — MÖRK BORG (estrutura). Agilidade, Presença, Força e Resistência de −3 a +6, testes de d20 contra CD 12 ao tocar no valor, as seis classes opcionais (com dado de PV, Presságios e prata na descrição), armadura que muda a CD da defesa e dos testes de Agilidade, carga de Força + 8 itens e listas para armas e pergaminhos.
- 🧬 Novo sistema: Assimilação RPG (estrutura). Origens, Geração, Propósitos, os seis Instintos, Conhecimentos e Práticas, o cabo de guerra entre Determinação e Assimilação, Pressões e os seis níveis de Saúde calculados por Potência e Resolução. A ficha avisa se passar dos pontos da criação.
- 🎲 Dados de Assimilação: a ficha monta a pilha (d6 do Instinto + d10 do Conhecimento ou Prática), rola e mostra Sucessos, Adaptações e Pressões em cada dado, com ícones próprios da plataforma (pegada no d6, broto no d10 e esporo no d12). Toque para escolher os mantidos (a ficha sugere os melhores). Gastar Determinação, ativar as Origens e Agir por Instinto (tudo vira d12) mantêm mais dados, até 4, e os pontos gastos saem da ficha. Tem também o Teste de Assimilação (1d10 + 1d12 por nível, que anota as Pressões) e a rolagem de dano. Na campanha, os dados vão para o chat da mesa.
- 🖼️ Os dois sistemas novos já chegam com capa própria.

## v0.33.2 — Sua conta nas suas mãos (2026-11-12)
- 🗝️ Código de recuperação: ao criar a senha do perfil você recebe um código (como ABCD-EFGH-JKLM-NPQR). Guarde num lugar seguro: se esquecer a senha, toque em “Esqueci a senha”, digite o código e escolha outra, sem precisar do administrador. Cada código vale uma vez; dá para gerar um novo em Editar perfil.
- 🗑️ Apagar o próprio perfil: em Editar perfil → “Apagar perfil…”. Você escolhe se os personagens das campanhas de outros mestres ficam com eles como NPC e confirma digitando o nome do perfil. Se você for mestre de alguma campanha, ela vai junto (a janela avisa quais).
- 👑 O mestre pode excluir a própria campanha (no fim da campanha, em Central → Campanhas), digitando o nome dela para confirmar.
- ⬇️ Baixar e importar fichas: na ficha, toque em “Baixar” para guardar um arquivo .json do personagem. Em Central → Fichas, “Importar ficha” traz o arquivo de volta como ficha nova (serve para backup ou para passar a ficha para outro perfil).
- Banco: migração 026 (coluna senha_recuperacao_hash em prg_public_adventurers).

## v0.33.1 — Temas novos e visual revisado (2026-11-12)
- 🌲 Quatro temas novos que mudam a plataforma inteira: Floresta encantada (verde, com riacho e arco de runas), Fundo do mar (turquesa, com ruínas submersas e águas-vivas), Taverna (âmbar, com lareira e velas) e Sombrio (roxo e vermelho, com castelo sob a lua vermelha). Agora são 11 temas em Central → Aparência.
- 💎 Prisma ganhou imagem nova: o dado de cristal que divide a luz num arco-íris de dados.
- 🔍 Revisão do visual nas telas que faltavam (Guia, Tutoriais, Novidades, Sistemas, criar sistema, convite, histórico, rolagens, Mundo e janelas) em todos os temas.
- A janela de Editar perfil agora acompanha as cores do tema (antes ficava sempre roxa).
- Mundo sem mapa: o aviso ganhou um cartão, para ler bem sobre qualquer fundo.
- Prisma: os botões e destaques voltaram a ter cor (antes ficavam cinza demais).

## v0.33.0 — Fichas de acordo com as regras, parte 2 (2026-11-11)
- 📜 Fichas de acordo com as regras, parte 2: Fate, Blades in the Dark, BRP e Faroeste Arcano.
- 🎲 Fate: agora rola 4dF + perícia ao tocar no valor. Escada até Fantástico (+6), recarga que desconta as façanhas extras, consequência suave extra com Vigor ou Vontade Excepcional e caixas de estresse que começam vazias.
- 🗡️ Blades in the Dark: cartilha, herança e antecedente em lista. As ações rolam um d6 por ponto e a ficha diz o resultado (sucesso total, com custo, falha ou crítico); a resistência mostra quanto custa de estresse. Escolha da carga da missão, armaduras e estresse, trauma e XP começando em zero.
- 🔎 BRP: a ficha nova já vem com o valor-base de cada perícia (50 perícias, por categoria), Carisma no lugar de Aparência, Educação, ferimento grave, bônus de experiência, Charme e Saber. O teste mostra crítico, especial, sucesso, falha e desastre, e o nível de poder avisa o máximo das perícias.
- 🤠 Faroeste Arcano: XP para o próximo nível e dano contusivo que some no descanso.
- Marcadores (estresse, exaustão, trauma, Morrendo…) agora começam vazios e não mostram aviso de “zerado”.

## v0.32.10 — Fichas de acordo com as regras, parte 1 (2026-11-11)
- 📜 Fichas revisadas sistema por sistema, seguindo as regras de cada um (parte 1 de 2): Tormenta20, Ordem Paranormal, D&D 5e e Pathfinder 2e.
- ⚔️ Tormenta20: escolha raça e classe na lista. A ficha calcula PV e PM pela classe e pelo nível, Defesa (armadura pesada não soma Destreza), CD das magias e espaços de carga, e avisa se passar das perícias treinadas.
- 🩸 Ordem Paranormal: escolha a classe e o NEX. PV, PE, Sanidade, limite de PE por turno, DT dos rituais e Defesa (também com Esquiva) saem sozinhos. Os testes agora rolam um d20 por ponto do atributo e ficam com o maior, inclusive ataques e iniciativa na mesa.
- 🐉 D&D 5e (regras de 2024): classe, espécie e antecedente em lista com o que cada um dá; Dado de Vida pela classe, CD e ataque de magia, XP, Inspiração Heroica e Exaustão.
- 🗡️ Pathfinder 2e: ancestralidade e classe em lista (16 ancestralidades e 23 classes) com PV automáticos, atributo-chave, CD de classe, CD e ataque de magia, Pontos de Foco, Morrendo e Ferido.
- PV, PM, PE e Sanidade calculados são só a sugestão: se você digitar outro máximo na barra, ele passa a valer.

## v0.32.9 — Plataforma mais bonita e do seu jeito (2026-11-11)
- 🎨 Cada tema agora muda as cores da plataforma inteira, não só o fundo: Lua cheia fica azul, Céu carmesim fica vermelho, Nuvens de algodão fica rosa, Grimório celestial fica anil e Prisma fica prateado.
- 🪟 Visual novo: cartões de vidro que deixam o fundo aparecer desfocado, sombras mais suaves, botões com brilho e títulos com letra de fantasia. O texto também ganhou uma letra mais bonita e legível.
- ✨ Central → Aparência: personalize do seu jeito — foto de fundo da sua galeria (com ajuste para escurecer e desfocar), cor principal, cor, claridade e transparência dos cartões, fonte dos títulos (Fantasia, Elegante ou Simples) e tamanho do texto.
- ☁️ A aparência fica salva no seu perfil: vale no celular e no computador, e cada pessoa do grupo pode ter a sua. Tudo muda na hora, e “Voltar ao padrão do tema” desfaz.
- Banco: migração 025_visual_perfil.sql (coluna visual no perfil).

## v0.32.8 — Ficha organizada e ajuda nas telas (2026-11-11)
- 📜 Ficha com topo novo: o nome do personagem, o sistema e se a ficha é avulsa ou de campanha, com um selo colorido mostrando se já salvou (verde) ou se ainda está salvando (amarelo).
- ❔ Botão “Ajuda” na ficha com o passo a passo: menu, salvar, rolar dados, vida e recursos, inventário e o que muda numa campanha.
- Cada parte da ficha começa com uma linha explicando para que serve, e no fim há um atalho “Próxima parte →”.
- 📱 No celular, os campos curtos (nível, números) ficam lado a lado, a barra de vida não é mais cortada (“CA” no lugar de “Classe de Armadura”) e o menu da ficha acompanha a parte escolhida.
- ❔ Ajuda também no Portal (escolher e criar perfil) e no Histórico de rolagens em tela cheia.

## v0.32.7 — Central e menus (2026-11-11)
- 🧭 Central reorganizada: o menu lateral mostra seu perfil no topo, cada seção com uma descrição curta e os atalhos separados em “Conta” (Editar perfil, Temas, Trocar aventureiro) e “Ajuda” (Guia, Tutoriais, Novidades).
- 📱 No celular, uma barra fixa embaixo leva direto para Início, Fichas, Campanhas, Sistemas e Rolagens — sem precisar abrir o menu.
- ❔ Cada seção da Central tem um título com explicação e um botão “Como funciona?” com o passo a passo.
- ↩️ “Continuar de onde parou” no Início: suas campanhas (com botão para a Mesa) e as últimas fichas mexidas, a um toque.
- 📜 Fichas com nomes mais claros: “Avulsas” (só suas) e “Em campanhas”.

## v0.32.6 — Mesa organizada (2026-11-11)
- 🗺️ Mesa reorganizada: o painel agora tem 5 grupos — 💬 Chat, ⚔️ Jogo (Fichas, Iniciativa e Tokens), 🎵 Música, 📖 Diário e 👑 Mestre (Controles, Biblioteca e Tabelas) — em vez de 10 abas espremidas.
- ❔ Cada parte do painel tem uma linha explicando para que serve, e a ferramenta escolhida no mapa mostra o nome e o que fazer (ex.: “Régua: arraste para medir a distância”).
- Barra de cima mais limpa: nome da campanha com a cena e a vez do combate embaixo; no celular, Mundo, Histórico de rolagens, som e Dicas ficam no menu “⋯”.
- Em Mestre → Controles, as cenas e o mapa vêm primeiro, depois as regras de combate e o descanso do grupo.

## v0.32.5 — Histórico de rolagens e inventário com fotos (2026-11-11)
- 🎲 Histórico de rolagens novo: filtre por período (esta sessão, hoje, 7 dias, tudo), tipo (dados, ataques, mensagens, avisos da mesa), pessoa, personagem, texto e “só críticos” ou “só falhas”. Críticos e falhas aparecem destacados.
- 📊 Resumo da sessão: rolagens, ataques, acertos, críticos, falhas, maior dano e maior rolagem, e uma tabela por personagem com a média do d20 (quem está com sorte e quem está com azar).
- O histórico abre no chat da mesa, em tela cheia, e pela Central → Histórico, mesmo com a sessão fechada. Rolagens “só o mestre” continuam só para o mestre.
- 📷 Foto do item: no editor de item, escolha uma imagem da galeria do celular ou do computador; ela aparece no lugar do desenho (dá para voltar para o desenho da forja).
- ✨ Itens mágicos: marque “Item mágico” e ele vai para uma ala própria com brilho, sem deixar de ser arma, armadura etc.
- 🗂️ Abas no inventário: Todos, Armas, Armaduras, Consumíveis, Equipamento, Tesouros e Mágicos (só as que têm itens). Alguns sistemas usam nomes próprios, como “Proteções” e “Itens paranormais” em Ordem Paranormal ou “Itens arcanos” no Faroeste Arcano.

## v0.32.4 — Biblioteca da campanha (2026-11-11)
- 📚 Biblioteca na mesa: o mestre ganhou a aba “Biblioteca” (antes ficava escondida no Diário). Procure pelo nome, filtre por tipo e veja cada item com o desenho da forja e a cor da raridade.
- 🎁 Dar direto da biblioteca: escolha jogadores e NPCs e a quantidade; os itens iguais se juntam na ficha, o chat avisa (se quiser) e quem recebe ganha um aviso.
- ✨ Prontos para usar: 34 itens e poderes da plataforma (armas, proteção, poções, equipamento de aventura, tesouros e poderes) para copiar para a campanha com um toque, ou um grupo inteiro de uma vez.
- Duplicar uma entrada para fazer variações (ex.: “Espada +1” a partir da Espada longa).

## v0.32.3 — Descanso curto e longo (2026-11-11)
- 🌙 Descanso curto e longo: na ficha, o botão “🌙 Descansar” (em Valores e recursos e em Poderes) abre as duas opções.
- Descanso longo: vida e recursos voltam ao máximo, valores temporários (como PV temporários) zeram e todos os usos de poderes voltam.
- Descanso curto: voltam os usos dos poderes marcados “descanso curto” e dá para curar a vida com um número ou com dados (ex.: 1d8+2; na campanha a rolagem vai para o chat).
- No editor de poderes, escolha se os usos voltam no descanso curto ou só no longo.
- Mestre: na aba Mestre da mesa, “🌙 Descanso do grupo” dá o descanso curto ou longo para todos de uma vez (NPCs se marcar). O chat mostra o que cada um recuperou, e no longo quem estava caído levanta.

## v0.32.2 — Primeiros passos e mesa cheia (2026-11-11)
- ✨ Comece por aqui: quem acabou de chegar vê na Central os primeiros passos (entrar numa campanha, criar o personagem, entrar na mesa e, se quiser, criar uma senha), com o progresso e um botão para cada passo.
- Convite mais claro: quem abre o link sem perfil vê o passo a passo (criar perfil → volta sozinho para o convite → pedir para entrar). Depois do pedido, aparece o que dá para fazer enquanto o mestre aceita.
- ❔ Dicas da mesa: na primeira vez na mesa aparecem dicas rápidas para jogador, mestre ou espectador (tocar no token, atacar, terminar o turno, preparar combate…). O botão “❔ Dicas” mostra de novo.
- 👥 Mesa cheia: testamos 6 jogadores e o mestre agindo ao mesmo tempo e corrigimos o que aparecia: ataques juntos no mesmo alvo não perdem dano, o clique duplo do mestre não aplica dano duas vezes, “terminar turno” repetido passa só uma vez e vários personagens entrando juntos não ficam na mesma casa.
- Segurança e desempenho: revisão com o verificador do Supabase (tudo fechado para acesso direto) e índices novos para o banco responder mais rápido.
- Migração 024: dano em token numa operação só, casa livre para tokens novos e índices.

## v0.32.1 — Lua dinâmica (2026-11-11)
- 🌙 Lua dinâmica: a lua ao lado de “PRG System” (no portal e na Central) agora é a lua de hoje, na fase de verdade, calculada pela data e desenhada como se vê no Brasil.
- Toque nela para ver a fase, a porcentagem iluminada, quantos dias faltam para a lua cheia e as datas das próximas fases (nova, quarto crescente, cheia e quarto minguante).
- Cada fase traz uma frase de clima para a sessão (ex.: na lua cheia, cuidado com lobisomens), que aparece também nas boas-vindas da Central.

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
