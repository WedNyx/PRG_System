# Etapa 7 — Magias de espécies e linhagens (D&D 2024)

**PR em revisão**. Esta etapa parte da PR #45 já mesclada na `main` e não altera o banco nem publica a nova versão automaticamente.

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
- **Alto Elfo:** a opção de substituir Prestidigitação por outro truque de Mago após descanso longo ainda é anotada com o mestre, não é um formulário automático nesta etapa.
- **Gnomo das Rochas:** fabricação e duração de engenhocas permanecem sob controle do mestre, sem adicionar itens automaticamente.
- Magias narrativas, áreas e condições não executam efeitos automáticos no mapa/combate. O Grimório informa quando a resolução exige o mestre.
- Testar a interface com papéis de jogador/mestre, permissões de campanha e persistência antes do merge; testes de unidade/tipos/build não substituem homologação.

**Não mesclar sem conferir a CI e os testes de uso com mestre e jogador.**
