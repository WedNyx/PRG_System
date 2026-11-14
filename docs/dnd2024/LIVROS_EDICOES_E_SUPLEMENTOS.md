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
