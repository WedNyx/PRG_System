# D&D — edição-base e suplementos selecionados por campanha e ficha

**PR #49 · atualizado em 14/11/2026 · em revisão (não mesclar automaticamente)**

## Requisito do grupo
O **mestre junto com o jogador** escolhe os livros de D&D usados para a criação do personagem. A edição-base é uma decisão da campanha (mestre) e deve ser apresentada explicitamente na ficha. O jogador pode escolher os suplementos liberados dentro da campanha. Cada item exibe título original, **ano**, edição e compatibilidade.

### Diferenças das versões

| Campo / regra | Player’s Handbook (2014) — 5e | Player’s Handbook (2024) — 5.5e |
|---|---|---|
| Base | D&D 5e de 2014 | D&D 5e revisado, de 2024 |
| Raças | Raça + sub-raça (inclui Meio-Elfo e Meio-Orc) | Espécie com linhagens/legados quando aplicáveis |
| Antecedente | Perícias, ferramentas/idiomas, característica narrativa | Perícias, ferramenta, **aumentos de atributos** e talento de origem |
| Aumentos iniciais de atributo | Raça / sub-raça | Antecedente |
| Automação atual | SRD 5.1: aumentos raciais guiados, perícias e salvaguardas básicas, recursos de classes e espaços básicos; **progressão avançada e escolhas de subclasses continuam manuais** | SRD 5.2.1: bônus, progressão, magias, usos e descansos já implementados; regras situacionais são conferidas com o mestre |
| Regras pagas | Referência ao livro, preenchimento manual | Referência ao livro, preenchimento manual |

**O SRD 5.2.1 não é o livro de 2014.** Desabilitamos seus efeitos, grimório, magias raciais, descanso automático, talentos de origem e progressão visual revisada nas fichas 2014. O formulário 2014 oferece seletores específicos de raças, sub-raças e antecedentes e facilita anotações manuais. Não convertemos atributos, magias, proficiências ou inventário existentes silenciosamente quando muda a edição.

**Importante:** o suporte 2014 tem agora **automação parcial verificável com motor próprio SRD 5.1 (CC BY 4.0)**. Fichas novas podem registrar os seis valores-base antes da raça; só então o sistema aplica aumentos raciais automaticamente. Fichas antigas sem esses valores ficam intactas, pois seus atributos podem já incluir bônus raciais. A árvore mostra o progresso das doze classes por nível, marcando o que está automatizado e o que exige livro/mestre. Não está implementada a totalidade das subclasses, talentos, magias de classe e decisões de 2014.

### Passos de interface

1. Criar/editar campanha D&D → **Livros e edição** → escolher explicitamente um dos dois livros-base (radio).
2. Mestre libera suplementos no catálogo pesquisável, agrupado por **regras, cenários, aventuras, mestre e referências**. Cada livro mostra título original, edição e ano. É possível anotar conteúdos caseiros à parte, sem misturá-los com fontes oficiais.
3. Jogador abre a ficha da campanha → **Principal → Livros desta ficha**. A edição-base aparece fixada e os suplementos disponíveis são somente os permitidos pelo mestre. Na ficha avulsa o dono escolhe a base.
4. Depois de escolher, a ficha guarda em `dndLivros: { base: 'phb2014'|'phb2024', suplementos: string[] }`. O jogador pode alterar seus suplementos sem mudar a edição-base de campanha.
5. Ao mudar a edição-base na campanha que já possui fichas, a interface exibe aviso para revisar fichas existentes e atualizar sua escolha. Não há conversão destrutiva automática.

### Segurança, dados e compatibilidade

- `config_progressao.baseLivro` persistido no registro da campanha; o servidor verifica edição e suplementos também **após** aplicar regras de permissão e aprovação.
- A seleção da ficha é uma alteração da categoria `identidade`; respeita o modelo de controle mestre/jogador.
- Livros desconhecidos, duplicados, incompatíveis com a versão ou não liberados são rejeitados no servidor.
- Suplementos existentes em fichas legadas podem permanecer no registro após mudanças de permissão, para evitar apagamento silencioso, mas **não habilitam novas escolhas incompatíveis**.
- Fichas antigas sem `dndLivros` continuam com padrão 2024. Em campanhas que selecionam 2014, a edição-base obrigatória do mestre prevalece na interface e nas validações.
- Itens, fotos, atributos e habilidades personalizados dos demais sistemas não são alterados.
- A escolha do PHB 2014 como **legado opcional** dentro de campanha 2024 não troca a edição-base.

### Catálogo

`src/lib/sistemas/dndLivros.ts` identifica livros de 2014 a novembro de 2026 (suplementos, cenários, aventuras, DMG, MM e parceiros publicados no ecossistema oficial de D&D). É um índice inicial de fontes relevantes, **não um índice exaustivo de todas as publicações**. Livros que só mudam material de mestre/monstros são identificados e não geram poderes de personagem automaticamente.

As entradas comerciais são **metadados de referência**, não conteúdo transcrito. A licença CC BY 4.0 das regras abertas só cobre SRD 5.1 e SRD 5.2.1, não as partes comerciais dos livros.

Fontes de consulta:
- https://www.dndbeyond.com/srd
- https://www.dndbeyond.com/sources/dnd/phb-2014
- https://www.dndbeyond.com/sources/dnd/phb-2024
- https://www.dndbeyond.com/marketplace

### Critérios de aceite
- [ ] CI Vitest integral, TypeScript, lint e build verde
- [ ] Preview da Vercel sem erro de compilação
- [ ] Mestre cria campanha D&D 2014, jogador abre e enxerga seleção **bloqueada** da edição, 9 raças legadas e sub-raças/antecedentes 2014
- [ ] Mestre cria campanha D&D 2024, jogador vê progressão SRD 5.2.1, com atributos pelo antecedente
- [ ] Jogador tenta suplemento não liberado: bloqueio de UI e API
- [ ] Jogador seleciona suplemento liberado, salva, fecha e reabre ficha
- [ ] Mudar edição em campanha existente não apaga itens, fotos nem notas; UI avisa incompatibilidades
- [ ] Mesma sequência em Android e computador com mestre e jogador separados
- [ ] Para automação integral 2014, completar escolhas de subclasses, talentos, magias de classe, multiclasses e efeitos situacionais do SRD 5.1; o núcleo de atributos e classes está implementado nesta PR.

**Não mesclar na `main` até homologação manual e revisão de regras com o grupo.**


## Complemento: arsenal por publicação, ícones e árvore de características

### Arsenal por livro

- **Livro do Jogador (2014) — 5e:** catálogo PHB/SRD 5.1 com IDs de arma distintos (`2014-...`), para evitar converter silenciosamente dados de itens de 2024. Mostra propriedades antigas, sem Maestria de Armas; inclui Rede (sem dano), Lança de Cavalaria 1d12, Tridente 1d6 (versátil 1d8).
- **Livro do Jogador (2024) — 5e revisado:** mantém 38 armas SRD 5.2.1, com Maestria, dados de dano e crítico próprios.
- **Suplementos autorizados:** cada livro aparece como seu próprio arsenal, quando o mestre o libera e o jogador o seleciona na ficha. Itens mágicos comerciais são apenas referências bibliográficas: não inventamos encantamentos ou dano. O livro ainda pode ser consultado e o jogador preenche características manuais.
- Na ficha de D&D há botão **Arsenais por livro**; filtro por tipo, busca e seletor de publicação, com layout responsivo.
- Itens já guardados de outra edição ficam preservados, mas a interface avisa incompatibilidade e impede rolagem automática usando os dados da edição errada até revisar o modelo de arma. A foto do item permanece.

### Ícones, foto e raridade
- Para fichas D&D, **Forja removida do editor e da prévia**. Apenas Game-Icons por nome/tipo, com 43 ícones SVG atribuídos à biblioteca Game-Icons, Lorc e Delapouite (CC BY 3.0); 11 novos ícones adicionais de espadas, adagas, tridente, lança, machado, maça, revólver etc.
- Ícones aparecem de forma sugerida de acordo com a categoria e, no seletor, com ordem de preferência por versão 2014/2024. A seção **Ver todos os ícones** permite escolher livremente outro desenho.
- **Foto personalizada continua disponível** para player via galeria do celular/arquivos do computador e mantém prioridade sobre a arte sugerida. Retirar a foto volta ao ícone, sem apagar o item.
- A Forja permanece disponível para outros sistemas de RPG que já usavam esse recurso; não foi removida globalmente.

### Árvore de origem com hexágonos naturais
- Na aba **Árvore de Habilidades** do D&D existe agora o painel `ArvoreDndOficial` com hexágonos gerados a partir da ficha para **Classe/Subclasse, Espécie/Raça, Origem/Antecedente e Habilidades do Mestre**.
- Em 2024, a projeção usa diretamente os marcos SRD 5.2.1 e as escolhas do personagem, respeita níveis, sinaliza decisões pendentes, aceita visualizar níveis futuros e diferencia características comerciais (referência sem conceder efeitos pagos).
- Em 2014, gera hexágonos da raça, sub-raça, antecedente e **marcos das 12 classes** conforme nível. Marcadores básicos que já são calculados pelo motor 2014 ficam identificados como recebidos, enquanto subclasses e habilidades sem automação continuam como referência. Não aplica habilidades 2024.
- Hexágonos oficiais são uma **visualização derivada e sem custo**. Não são gravados na árvore personalizável nem alteram diretamente proficiências, atributos ou poderes. Isso evita bônus duplicados. Os hexágonos extras do mestre aparecem no mesmo quadro, mas sua edição e liberação são feitas no editor abaixo e seguem as permissões de campanha.
- **Poderes e Habilidades Extras** registra habilidades manuais, magias preparadas e escolhas adicionais do jogador. Magias naturais do antecedente, espécie ou Humano Versátil têm seus módulos de uso no painel da Árvore, sem desaparecer do sistema de recursos.
- A biblioteca de feitiços preparados ainda segue SRD 5.2.1 e é desabilitada nas fichas 2014; em 2014 a nova camada calcula **quantidade de espaços** da progressão básica (incluindo Pacto do Bruxo), mas **não** automatiza seleção e regras completas das magias legadas.

### Testes
- `src/lib/sistemas/dndArsenaisArvore.test.ts`: diferenças 2014/2024, críticos, compatibilidade de fontes e ausência de duplicação de hexágonos.
- `src/lib/iconesRpg.test.ts`: catálogo ampliado e sugestões sem ícones externos não autorizados.
- Homologação manual: em desktop e celular, simular mestre e player escolhendo bases 2014/2024 e suplementos, criando armamentos e testando críticos; conferindo foto personalizada, hexágonos adquiridos, pendentes e futuros, além de poderes caseiros.
- **Nenhum merge automático.** Revisar CI e prévia Vercel antes de aprovar.


## Motor de fidelidade D&D 2014 — implementação parcial no SRD 5.1

Código: `src/lib/sistemas/dnd2014Regras.ts` e `src/lib/sistemas/dnd2014Marcos.ts`.
- Atributos raciais das nove raças da criação 2014, sub-raças e opções condicionais; seleção de dois atributos no Meio-Elfo e Humano Variante com validação.
- Proteção contra duplicação de bônus: o usuário deve fornecer **valores antes da raça** para a automação entrar. Sem `dnd2014AtributosBase`, o sistema presume que os valores digitados já estão completos.
- Guias de classe inicial com suas **listas específicas de perícias 2014**, além dos dois espaços raciais do Meio-Elfo ou do único do Humano Variante. Perícias e salvaguardas concedidas são aplicadas apenas como proficiência mínima, não somadas com treinamento manual repetido.
- Recursos básicos de classe e tabelas abertas de espaços de magia aplicados pelo motor 2014, sem recorrer ao `efeitosDnd2024`. O 20º nível do Bárbaro é indicado como **Fúria ilimitada** na árvore; não cabe em contador de usos com máximo finito.
- A Árvore traz marcos principais das doze classes SRD por nível, distingue aquisição acompanhada automaticamente de *referências ainda manuais*. Hexágonos oficiais não concedem o mesmo bônus novamente.
- A API valida as escolhas novas antes e depois de avaliar permissões do mestre; os novos dados foram classificados em `atributos` e `pericias`.
- Esta implementação **não promete regras de livro comercial**. Suplementos continuam identificados individualmente como referência, até que regras licenciadas ou fornecidas pelo grupo sejam conferidas e implementadas.

**Ainda não concluído para afirmar fidelidade integral:** características avançadas e subclasses, magias aprendidas/preparadas específicas de 2014, progressão de multiclasse em 2014, talentos do livro e inúmeras regras condicionais. Revisar junto do SRD 5.1 e dos exemplares dos jogadores; preferir modo/manual onde a implementação não cobre a opção.

Testes: `src/lib/sistemas/dnd2014Regras.test.ts`, `src/lib/sistemas/dndLivros.test.ts`, `src/lib/sistemas/dndArsenaisArvore.test.ts`.
