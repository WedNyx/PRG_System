# Etapa 7 — Magias de espécies e linhagens (D&D 2024)

**Etapa 7 ampliada para finalização, em revisão na PR #47.** Parte da PR #45 já mesclada na `main` e não altera o banco nem publica a nova versão automaticamente.

## Fonte e distinção
SRD 5.2.1, licenciado sob CC BY 4.0: https://www.dndbeyond.com/srd

As magias de espécie são projeções de `campos.especie` e `dndEscolhas`, independentes das magias preparadas da classe (`dndMagias`) e de Iniciado em Magia do antecedente ou do Humano Versátil. Sem linhagem e atributo definidos, o sistema não cria poderes presumidos.

## Implementação
- **Elfo:** Drow (Luzes Dançantes, Fogo das Fadas no nível 3, Escuridão no nível 5); Alto Elfo (Prestidigitação, Detectar Magia no nível 3, Passo Nebuloso no nível 5); Elfo da Floresta (Arte Druídica, Passos Longos no nível 3, Passos sem Pegadas no nível 5).
- **Tiferino:** todos recebem Taumaturgia, além dos truques e das magias de níveis 3 e 5 de seu legado Abissal, Ctônico ou Infernal.
- **Gnomo da Floresta:** Ilusão Menor e Falar com Animais no nível 1; usos de Falar com Animais sem espaço = bônus de proficiência por descanso longo.
- **Gnomo das Rochas:** Consertar e Prestidigitação, sem consumo de espaços; as engenhocas permanecem como mecânica situacional.
- **Truques** não consomem usos gratuitos. **Magias de nível 3 e 5 da espécie** têm contadores separados, uma conjuração gratuita para cada uma por descanso longo (Elfo e Tiferino). Depois da carga gratuita, podem usar espaços de classe/Pacto compatíveis, sem gastar as duas fontes.
- Escolhas de espécie determinam atributo INT/SAB/CAR, CD, ataque e expressões de dano/cura em painel próprio no **Grimório**. Magias de origem não contam no limite de preparação da classe.
- A escolha inicial de uma linhagem/legado que habilita novos recursos preenche seus usos conforme o mecanismo já existente ao desbloquear recursos por nível. Ao mudar para outra espécie, os máximos não aplicáveis caem a zero sem apagar o histórico.
- Descanso curto não recupera essas conjurações, mas descanso longo recupera os usos e ajusta o máximo segundo o nível e a proficiência.
- Guia do Mestre identifica falta de linhagem/legado ou atributo e só passa a etapa de magia depois das escolhas válidas; a revisão final segue obrigatória.
- O modo manual da ficha continua sem automatizar efeitos de progressão, conforme a opção do mestre.

## Critérios de teste
- Elfos Drow, Alto e Floresta: truque inicial, magia no nível 3, segunda no nível 5.
- Tiferinos Abissal, Ctônico e Infernal: Taumaturgia + legado, níveis corretos.
- Gnomo da Floresta: usos de Falar com Animais pela proficiência (ex.: +4 no nível 9).
- Gnomo das Rochas: dois truques, sem contadores gratuitos.
- Alteração de espécie, descanso curto/descanso longo, slots de classe e três fontes mágicas coexistem sem contaminar `dndMagias`.

## Limites explícitos
- **Alto Elfo:** o seletor de truques do Mago é apresentado no descanso longo. Sem concluir o descanso, o truque não muda. As fichas antigas continuam com Prestidigitação até escolherem outro truque.
- **Gnomo das Rochas:** permite registrar/desmontar até três engenhocas e anotar o efeito de Prestidigitação. CA 5, 1 PV, criação de 10 minutos e duração de 8 horas de tempo fictício são apresentados. A ficha não expira engenhocas usando relógio real nem as transforma automaticamente em itens de inventário.
- Magias narrativas, áreas e condições não executam efeitos automáticos no mapa/combate. O Grimório informa quando a resolução exige o mestre.
- Testar a interface com papéis de jogador/mestre, permissões de campanha e persistência antes do merge; testes de unidade/tipos/build não substituem homologação.

**Não mesclar sem conferir a CI e os testes de uso com mestre e jogador.**


## Entregas complementares para concluir a Etapa 7
- **Resumo de escolhas na aba Principal:** três cartões de Classe/Subclasse, Antecedente e Espécie, com benefícios adquiridos, opções registradas e pendências, e links para as abas corretas.
- **Progressão por origem:** filtros Tudo / Classe / Antecedente / Espécie, com contador de escolhas pendentes de cada grupo.
- **Escolhas de classe:** cada uma das 12 classes SRD tem seletores próprios para as perícias iniciais no 1º nível. Somente a classe inicial ganha essas escolhas completas; a multiclasse não as duplica. A lista de opções marca perícias já concedidas pelo antecedente ou por outro seletor, e o servidor recusa selecionar a mesma perícia em dois espaços. Proficiências válidas são calculadas na ficha.
- **Poderes e Habilidades da espécie:** os traços das nove espécies abertas aparecem em cards, sem criar cópias permanentes na lista de poderes manuais. Escolhas feitas (ancestral, linhagem, legado, proficiência) são refletidas. Benefícios passivos ficam informativos e poderes com cargas têm botões de uso.
- **Poderes limitados:** Conhecimento de Pedra do Anão, Arma de Sopro e Voo Dracônico, Ancestralidade/Forma Grande do Golias e Pico de Adrenalina/Resistência Implacável do Orc, conforme nível e proficiência. Os contadores são armazenados em `uso.poderes`, recuperados no descanso apropriado (Orc Adrenalina: curto/longo; demais: longo), sem apagar usos de poderes caseiros.
- **Magias raciais:** permanecem no Grimório com conjuração independente, níveis 1/3/5 e recuperação de usos grátis. Tiferino mostra resistência do legado; Elfo Drow e Floresta mostram seus detalhes visuais.
- **Alto Elfo:** `dnd_alto_elfo_truque` em `listas` guarda um truque válido da lista de Mago do SRD, escolhido apenas ao concluir um descanso longo na interface de descanso. Essa escolha substitui Prestidigitação na projeção do Grimório, sem mexer em magias preparadas de classe.
- **Gnomo das Rochas:** `dnd_gnomo_engenhocas` registra os até 3 dispositivos em `listas`; duração em tempo da história, removidos manualmente. A interface não inventa efeitos sem o jogador declarar qual Prestidigitação produz.
- **Espécies de fonte comercial:** aparecem como referências se a fonte estiver liberada, mas sem criar poderes pagos automaticamente.
- As estruturas de escolhas continuam separadas do catálogo e das artes de itens da PR #48.

## Critérios de homologação manual que ainda precisam ser confirmados
1. No celular, criar Guerreiro: 2 perícias iniciais sem repetição, antecedente e linhagem válidos; confirmar na aba Atributos a origem das proficiências.
2. No desktop, selecionar Anão, Draconato, Elfo (Drow/Alto/Floresta), Gnomo (Floresta/Rochas), Golias, Halfling, Humano, Orc e Tiferino; conferir os traços em Poderes.
3. Descansar como Alto Elfo: escolher truque novo, concluir descanso longo, reabrir Grimório; descanso curto não permite troca.
4. Registrar três engenhocas do Gnomo das Rochas, bloquear a quarta, retirar uma, salvar e reabrir. Validar duração pelo tempo da sessão.
5. Gastar poder racial do Orc e fazer descanso curto; gastar poder do Draconato e confirmar retorno só no longo.
6. Abrir ficha com múltiplas classes, mudar espécie e conferir que habilidades e poderes caseiros não são duplicados ou removidos.
7. Conferir permissões de edição para player/mestre, modo Manual/Híbrido/Automático e escrita na nuvem.

O status da CI e da Vercel deve ser conferido no commit final da PR #47, **sem mesclar automaticamente**.
