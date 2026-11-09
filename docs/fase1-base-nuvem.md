# Fase 1 — Base na nuvem (campanhas, convites e fichas sincronizadas)

## O que entra
- **Campanhas no servidor** (`prg_campanhas`): criar, editar, estados *planejada / ativa / pausada / encerrada*.
- **Participantes** (`prg_campanha_membros`): mestre, co-mestre e jogador; várias campanhas por aventureiro.
- **Convites por código ou link** (`prg_convites`): 8 caracteres sem ambiguidade, validade (1–30 dias), limite de usos, revogação. Renovar = gerar outro e revogar o antigo.
- **Pedidos de participação** (`prg_solicitacoes`): quem usa o convite pede para entrar; o mestre aceita ou recusa.
- **Gerenciar participantes**: promover a co-mestre, remover, sair da campanha (fichas da campanha são arquivadas, não apagadas), exceções de permissão por jogador (gravadas; passam a valer na Fase 2).
- **Fichas independentes na nuvem** (`prg_fichas`): a Ficha V8 continua igual; a página `/ficha-v8?nuvem=<id>` sincroniza com controle de versão.
  - Salva ~1,5 s depois de cada alteração.
  - Sem internet: guarda no aparelho e envia quando voltar.
  - Editou em dois aparelhos ao mesmo tempo: aparece o aviso de conflito com as opções "usar a da nuvem" ou "manter a deste aparelho".
- **Importação** dos rascunhos de campanha e das fichas locais, com confirmação. As cópias locais nunca são apagadas.
- Aba **Fichas de campanhas** na Central, agrupada por aventura (fica preenchida quando a Fase 2 permitir enviar fichas ao mestre).

## Decisão de identidade (confirmada pelo dono)
Nesta fase **não há senha, PIN nem passkey**. O aventureiro escolhido no portal é enviado no cabeçalho `x-prg-aventureiro`.
Isso **não prova identidade**: alguém que saiba o ID de um perfil consegue agir como ele. As regras do servidor (só mestre gerencia, só o dono salva a ficha etc.) evitam bagunça acidental, não ataques deliberados. Aceitável para grupo de amigos. A proteção opcional (item 1.5 do roadmap) pode ser adicionada depois sem refazer esta base.

## Segurança
- Todas as tabelas novas têm RLS ligado **sem políticas** e `revoke all` de `anon`/`authenticated`: o navegador não acessa nada direto. Só a API (service role, no servidor).
- Requisições que alteram dados exigem `Origin` do próprio site.
- Tabelas antigas (`campaigns`, `profiles`, fichas do login por e-mail) **não são alteradas**.
- Limites: 50 campanhas por mestre, 10 convites ativos por campanha, 100 fichas por aventureiro, ficha até 500 KB.

## Como ativar (ambiente de teste primeiro)
1. No Supabase (projeto de teste/branch), rode `supabase/migrations/005_base_nuvem.sql`. Ele inclui o catálogo de aventureiros e é idempotente.
2. Na Vercel (Preview), configure:
   - `PRG_SHARED_PROFILES=true`
   - `NEXT_PUBLIC_PRG_SHARED_PROFILES=true`
   - `SUPABASE_URL` (ou `NEXT_PUBLIC_SUPABASE_URL`)
   - `SUPABASE_SERVICE_ROLE_KEY`, que **só pode existir no servidor e nunca pode ter o prefixo `NEXT_PUBLIC_`**
3. Teste com dois aparelhos: criar campanha → gerar convite → abrir link no outro aparelho → aceitar → abrir/editar ficha nos dois.
4. Com a flag desligada, tudo continua como antes (armazenamento local).

## Testes feitos
- `npm test`: 36 testes unitários (13 novos de validação, convites, permissões e fichas).
- Teste ponta a ponta contra Postgres 16 + PostgREST reais, com a migração aplicada, em 40 cenários. Entre eles:
  - permissões de mestre, jogador e intruso
  - convite esgotado e revogado
  - pedido duplicado
  - conflito de versão da ficha
  - Origin ausente
- Navegador (Playwright): ficha editada no "celular" aparece no "computador"; conflito detectado; fluxo de convite completo no celular, sem erros de JavaScript.
- Não testado: o Supabase real deste projeto (falta acesso) e a unificação com as campanhas antigas do login por e-mail. A unificação está planejada para a Fase 1b, porque depende de decidir como ligar contas antigas a aventureiros.

## Sistemas de RPG (motor de modelos)
- `src/lib/sistemas/`: formato de sistema (`tipos.ts`), avaliador de fórmulas seguro (`formula.ts`, sem `eval`), cálculo da ficha (`calculo.ts`) e catálogo (`catalogo.ts`).
- Modelos: Lunethernnyis automático (só regras aprovadas; avisos de limite de criação), D&D 5e SRD 5.2 (CC-BY-4.0), Pathfinder 2e Remaster (ORC), Fate Core (CC-BY-3.0), Blades in the Dark (CC-BY-3.0), Basic Roleplaying (ORC), Ordem Paranormal e Tormenta20 (somente estrutura, sem texto dos livros) e Ficha livre.
- Créditos exigidos pelas licenças aparecem no fim de cada ficha.
- Página `/ficha?nuvem=<id>` (ou `?local=<id>` sem nuvem): salva automaticamente, detecta conflito de versão, rolagem 1d20 ao tocar na perícia.
- O mesmo formato será usado pelo construtor de sistemas autorais.

# Fase 2 — Fichas em campanhas e permissões do mestre
- Migração `006` (APLICADA no Supabase em 08/11/2026): colunas de NPC/trava na ficha, `prg_alteracoes` (pedidos) e `prg_historico`.
- **Enviar ficha ao mestre**: cria uma CÓPIA ligada à campanha (`origem_id`); a original fica intacta. Mestre aprova, recusa ou pede ajuste (com motivo).
- **Evolução por campanha**: cada cópia evolui separada da original e das outras campanhas.
- **Permissões aplicadas no servidor** (`PUT /api/prg/fichas/:id`): cada parte da ficha é classificada numa área (identidade, PV, atributos, perícias, habilidades, equipamentos, nível, anotações).
  - Livre → salva.
  - Com aprovação → vira pedido de alteração.
  - Somente mestre ou área travada → ignorada e avisada.
  - Valem as exceções por jogador e as travas por ficha ou por área.
- **Pedidos de alteração**: o mestre vê antes → depois e aceita (aplica sobre a versão atual), recusa ou pede ajuste.
- **Histórico** por ficha (`/historico?ficha=`) e **registro de decisões** da campanha.
- **NPCs**: só mestre/co-mestre veem e editam; criar, duplicar, ocultar e excluir.
- **Criar ficha com o jogador**: o mestre cria a ficha já aprovada, pertencendo ao jogador.
- **Notificações ao mestre**: contador de pendências na lista de campanhas.
- Testes: `src/lib/nuvem/categorias.test.ts` + `scripts/e2e/` (40 + 46 cenários contra banco real).

# Fase 3 — Mesa virtual nas campanhas novas
- Migrações `007` + `007b` (APLICADAS em 08/11/2026): cenas, tokens, desenhos, eventos (chat/rolagens) e iniciativa; bucket `prg-mesa`.
- Página `/mesa?campanha=<id>`, com o botão "Abrir mesa virtual" na campanha. Reaproveita o `MapaGrid` e os dados 3D da mesa antiga.
- **Cenas** (mestre): criar com link ou imagem enviada (até 5 MB), tamanho da grade, mostrar para todos, névoa (revelar/esconder/cobrir de novo).
- **Tokens**:
  - O mestre cria tokens avulsos, de NPC ou de jogador, e pode deixá-los escondidos.
  - O jogador coloca na mesa e move o próprio personagem.
  - PV e condições podem ser mudados pelo dono do token e pelo mestre.
- **Chat e rolagens**:
  - Os dados são rolados NO SERVIDOR.
  - Visibilidade: todos, "só o mestre" (secreta) ou privada para alguém.
  - `/r 1d20+2` no chat também rola.
  - O histórico é permanente, com busca por jogador, tipo e personagem.
- **Iniciativa**: o mestre ordena, avança turno e rodada e adiciona os tokens rolando 1d20.
- **Tempo real**:
  - O canal Supabase Realtime (broadcast) só avisa que algo mudou; os dados sempre vêm da API, com as permissões aplicadas. Também leva ping, cursores e quem está online.
  - Sem Realtime, a tela atualiza a cada 4 s.
- A mesa antiga (`/mesa/[id]`, login por e-mail) foi mantida sem alterações.

# Ajustes de interface
- O sistema da campanha agora é escolhido numa lista, com a opção "Outro".
- "Nova ficha" pergunta o sistema antes de criar.
- A Ficha V8 volta para o início (`/central`).
- As fichas dos outros sistemas ganharam menu lateral por seções (Principal, Atributos e perícias, Habilidades, Equipamentos, Anotações) e uma barra fixa com PV e Defesa.

# v0.6.0 — Mapas montados, tokens controlados e diário do mestre
- Migração `008` (APLICADA): `prg_cenas.camadas` e `tokens_travados`; `prg_tokens.movimento` (dono/todos/mestre) e `tamanho`; tabelas `prg_sessoes` e `prg_notas`; histórico com tipo `recompensa`.
- Novo `MapaMesa`:
  - imagens em camadas, que o mestre arrasta, redimensiona e ordena;
  - névoa com pincel 1×1, 3×3 e 5×5, ou por área (retângulo);
  - tokens com tamanho de 1 a 4 células e indicação 🔒 quando estão travados.
- Movimento de tokens decidido no servidor (`podeMoverToken`): o mestre sempre pode; os jogadores seguem a regra do token e a trava da cena.
- O jogador pode criar até 3 tokens próprios por cena, mesmo sem ficha, e trocar a imagem deles. O upload de imagem foi liberado para todos os participantes.
- As rolagens aparecem num painel grande com cada dado e o total. As rolagens das fichas de campanha (Ficha V8 e genéricas) vão para o chat da mesa, com opção de rolagem secreta.
- Aba "Diário" na mesa:
  - sessões com preparação secreta e resumo publicado;
  - anotações privadas, só para o mestre, para a campanha ou para uma pessoa;
  - recompensas (XP, item, moedas) aplicadas direto nas fichas, com registro no histórico e aviso no chat.
