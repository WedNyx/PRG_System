# D&D 5e (2014) — Etapa 1: divergências confirmadas

Referência: **Livro do Jogador de D&D 5e (2014), tradução em português fornecida para auditoria em 14/11/2026**. Esta nota compara fatos e opções de jogo, sem reproduzir trechos do livro protegido por direitos autorais. A automação geral continua baseada no SRD 5.1 e não substitui a leitura do PHB.

## Alterações confirmadas

| Área | Referência | Ajuste |
| --- | --- | --- |
| Clava Grande | Tabela de armas, p. impressa 151 (PDF p. 150) | Adiciona a propriedade **Pesada** e mantém **Duas mãos**, dano 1d8 e preço 2 PP. Somente 2014; 2024 não muda. |
| Lança Longa (Pique) | Tabela de armas, p. impressa 151 (PDF p. 150) | A tradução registra **4 kg**, enquanto herdar 18 lb da base 2024 gerava aproximadamente 8,165 kg. Campo `pesoKgLivro` ajusta apenas o cálculo e a exibição da versão 2014. Atenção: **conversão/edição divergente da fonte em inglês**; esta decisão segue exatamente a tradução enviada. |
| Forasteiro | Capítulo de antecedentes, p. impressa 137 (PDF p. 136) | Identifica a característica narrativa como **Andarilho**, sem modificar perícias Atletismo/Sobrevivência ou a forma de calcular a ficha. |
| Troca de raça | Capítulo 2, raças e sub-raças | Ao trocar a raça, valida a sub-raça restante mesmo quando o campo de sub-raça não foi editado. Rascunhos sem sub-raça continuam permitidos e sinalizados. |
| Multiclasse: subclasses | Cap. 6, pp. impressas 165–166 | Guarda subclasses de classes secundárias por ID de classe, verifica **nível daquela classe**, projeta na árvore e considera conjuração de Cavaleiro Arcano/Trapaceiro Arcano. |

## Compatibilidade

- `dnd2014Subclasse` **permanece** como escolha da classe inicial em fichas antigas.
- `dnd2014Subclasses` é um mapa **opcional** de classes secundárias; ausência não altera nenhuma ficha anterior.
- Uma classe secundária só tem subclasse ativa quando atingiu seu nível mínimo.
- O novo campo respeita a categoria **habilidades** das permissões da campanha, inclusive aprovação do mestre.
- Armas de 2014 continuam com IDs `2014-` e sem maestrias de arma 2024.
- Livro-base 2024 não pode editar os novos campos de 2014.
- As árvores projetam referências sem aplicar automaticamente os bônus das subclasses.

## Testes

- `src/lib/sistemas/dnd2014DivergenciasLivro.test.ts`: armas, antecedente, troca de raça, subclasses por classe, compatibilidade com fichas antigas, árvore e espaços de magia.
- `src/lib/nuvem/categorias.test.ts`: permissão **habilidades** para `dnd2014Subclasses`.
- Suite existente de progressão D&D 2014/2024 e build.
- Ainda devem ser testadas reabertura real, duas contas em banco de homologação e responsividade mobile antes do merge da PR #52.

## Fora do escopo desta etapa

Aplicação automática de talentos comerciais, preparação completa de magias, todas as habilidades de subclasses, equipamentos iniciais, condições situacionais e demais capítulos. Essas melhorias seguem para as etapas de progressão, magias e evolução, e **não** são declaradas como concluídas.
