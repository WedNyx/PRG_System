# D&D — edição-base e suplementos selecionados por campanha e ficha

**PR #49 · 13/11/2026 · em revisão (não mesclar automaticamente)**

## Requisito do grupo
O **mestre junto com o jogador** escolhe os livros de D&D usados para a criação do personagem. A edição-base é uma decisão da campanha (mestre) e deve ser apresentada explicitamente na ficha. O jogador pode escolher os suplementos liberados dentro da campanha. Cada item exibe título original, **ano**, edição e compatibilidade.

### Diferenças das versões

| Campo / regra | Player’s Handbook (2014) — 5e | Player’s Handbook (2024) — 5.5e |
|---|---|---|
| Base | D&D 5e de 2014 | D&D 5e revisado, de 2024 |
| Raças | Raça + sub-raça (inclui Meio-Elfo e Meio-Orc) | Espécie com linhagens/legados quando aplicáveis |
| Antecedente | Perícias, ferramentas/idiomas, característica narrativa | Perícias, ferramenta, **aumentos de atributos** e talento de origem |
| Aumentos iniciais de atributo | Raça / sub-raça | Antecedente |
| Automação atual | Guia assistido, **não automatiza as características de 2014**, para não misturar regras | SRD 5.2.1: bônus, progressão, magias, usos e descansos implementados |
| Regras pagas | Referência ao livro, preenchimento manual | Referência ao livro, preenchimento manual |

**O SRD 5.2.1 não é o livro de 2014.** Desabilitamos seus efeitos, grimório, magias raciais, descanso automático, talentos de origem e progressão visual revisada nas fichas 2014. O formulário 2014 oferece seletores específicos de raças, sub-raças e antecedentes e facilita anotações manuais. Não convertemos atributos, magias, proficiências ou inventário existentes silenciosamente quando muda a edição.

**Importante:** o suporte 2014 está em **modo assistido/manual** até construir o motor próprio baseado no SRD 5.1 (CC BY 4.0). O usuário NÃO deve supor que a criação, os valores de atributo ou os poderes 2014 são calculados automaticamente. Recursos genéricos da ficha continuam disponíveis. A separação evita aplicar inadvertidamente valores de 2024 na 5e original.

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
- [ ] Se a mesa precisar das regras completas de 2014, a próxima etapa é implementar **motor legado SRD 5.1** separadamente antes de considerar automação completa

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
- Em 2014, gera os hexágonos da raça, sub-raça, classe e antecedente conhecidos **como referências para conferência manual** até existir motor SRD 5.1 separado. Não aplica habilidades 2024.
- Hexágonos oficiais são uma **visualização derivada e sem custo**. Não são gravados na árvore personalizável nem alteram diretamente proficiências, atributos ou poderes. Isso evita bônus duplicados. Os hexágonos extras do mestre aparecem no mesmo quadro, mas sua edição e liberação são feitas no editor abaixo e seguem as permissões de campanha.
- **Poderes e Habilidades Extras** registra habilidades manuais, magias preparadas e escolhas adicionais do jogador. Magias naturais do antecedente, espécie ou Humano Versátil têm seus módulos de uso no painel da Árvore, sem desaparecer do sistema de recursos.
- A biblioteca de feitiços segue SRD 5.2.1; fichas D&D 2014 usam campo manual até possuir implementação 2014 própria.

### Testes
- `src/lib/sistemas/dndArsenaisArvore.test.ts`: diferenças 2014/2024, críticos, compatibilidade de fontes e ausência de duplicação de hexágonos.
- `src/lib/iconesRpg.test.ts`: catálogo ampliado e sugestões sem ícones externos não autorizados.
- Homologação manual: em desktop e celular, simular mestre e player escolhendo bases 2014/2024 e suplementos, criando armamentos e testando críticos; conferindo foto personalizada, hexágonos adquiridos, pendentes e futuros, além de poderes caseiros.
- **Nenhum merge automático.** Revisar CI e prévia Vercel antes de aprovar.
