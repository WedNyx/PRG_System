# Changelog — PRG System

Também aparece no site em /novidades. Ao atualizar: aumente a versão no package.json e acrescente a entrada em src/lib/versoes.ts e aqui.

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
