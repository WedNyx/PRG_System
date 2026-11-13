# D&D 2024 — etapa 2: origens, linhagens e revisão do mestre

## Referências
- SRD 5.2.1, Character Origins e Character Creation: https://www.dndbeyond.com/srd
- Regras públicas 2024 — Character Origins: https://www.dndbeyond.com/sources/dnd/br-2024/character-origins
- Licença do material do SRD: Creative Commons Attribution 4.0: https://creativecommons.org/licenses/by/4.0/

As descrições na plataforma são resumos próprios. Suplementos comerciais não são reproduzidos.

## Implementado nesta etapa da PR #45
- O Guia do Mestre da ficha agora identifica escolhas de espécie **não concluídas**, com base no catálogo SRD da própria plataforma.
- Elfo, Gnomo e Tiferino solicitam o atributo de conjuração dos poderes de linhagem/legado (Inteligência, Sabedoria ou Carisma).
- Humano e Tiferino têm escolha de tamanho (Pequeno ou Médio).
- Humano pode selecionar a perícia concedida por Habilidoso entre as 18 perícias, e a ficha aplica a proficiência como mínimo, sem somar duas vezes.
- Alerta recebido por Humano Versátil só concede bônus à Iniciativa **enquanto o personagem for Humano**; Criminoso mantém Alerta por antecedente.
- O Guia do Mestre marca o antecedente como **revisão necessária** mesmo se o nome estiver registrado, pois os aumentos de atributo +2/+1 ou +1/+1/+1, equipamento e ferramentas ainda não possuem confirmação individual na ficha.
- O guia sinaliza que magias concedidas por espécie ainda precisam de conferência manual; não promete aplicação automática inexistente.
- O título e a atribuição do sistema foram atualizados de SRD 5.2 para **SRD 5.2.1**.

## Regras e responsabilidades do mestre
1. Escolher quais fontes são permitidas na campanha. O SRD 5.2.1 oferece nove espécies abertas; Aasimar do Livro do Jogador comercial não integra o catálogo aberto completo.
2. Depois de escolher a espécie, verificar todas as escolhas da aba Árvore que aparecem para ela (linhagem, legado, ancestralidade, perícia, talento ou tamanho).
3. Conferir bônus do antecedente e comprovar que foram distribuídos apenas entre os três atributos indicados no livro, sem duplicar aumentos vindos de outras edições.
4. Revisar proficiências de ferramentas, equipamentos iniciais e talentos de origem. A seleção de antecedente não significa que todos esses detalhes já foram verificados.
5. Para magias de linhagem ou legado, conferir o atributo de conjuração escolhido e as magias disponíveis no nível; as magias raciais ainda não são inseridas automaticamente no módulo de conjuração.
6. Confirmar informações de suplementos comerciais diretamente na obra autorizada. A plataforma não deve inventar efeitos para espécies e antecedentes fora do SRD.

## Testes incluídos
- Elfo precisa registrar linhagem, perícia de Sentidos Aguçados e atributo de conjuração antes de o Guia marcar a espécie como registrada.
- Humano precisa decidir tamanho, proficiência de Habilidoso e talento de Versátil.
- O servidor rejeita atributo de conjuração inexistente (ex.: Força) ao salvar a escolha.
- Trocar de Humano para Elfo mantém escolhas históricas, mas **remove o bônus de Iniciativa** e a proficiência de Habilidoso que dependiam da espécie anterior.
- Antecedente continua indicado como revisão até haver registro separado de seus aumentos, ferramentas e equipamento.

## Pendências da etapa 3
- Incluir campos explícitos para confirmar os três aumentos do antecedente, com validação de limites e origem.
- Associar o atributo de conjuração das magias raciais ao cálculo de ataque/CD sem interferir no atributo da classe.
- Inserir magias raciais por fonte e uso, respeitando recursos e descanso e evitando duplicação.
- Exibir tamanho e deslocamento efetivos quando a espécie mudar e respeitar vantagens/condições.
- Conferir todos os benefícios SRD 5.2.1 linha a linha com testes de cenário antes da mesclagem.
