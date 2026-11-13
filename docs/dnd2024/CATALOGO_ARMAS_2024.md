# PR #48 — Arsenal expandido e inventário D&D 2024 (13/11/2026)

## Estado e delimitação
Este trabalho **apenas altera a branch da PR #48**, sem mesclar na `main` ou afetar a produção.

- **38 armas básicas** com dados completos do SRD 5.2.1 e rolagem de dano/crítico.
- **196 referências adicionais** de livros, suplementos, aventuras e catálogos, entre elas:
  - 5 armas modernas e 3 futuristas do Dungeon Master's Guide 2024;
  - 3 armas de cenários (Yklwa, Double-Bladed Scimitar e Hoopak);
  - um índice amplo de armas mágicas e variantes de **mais de 30 fontes/livros**, incluindo 2025–2026, Eberron, Dragonlance, Wildemount, Theros, Ravenloft, Forgotten Realms, Arcana Unleashed: Deadfall e D&D: World of Warcraft;
  - entradas do D&D Beyond cuja **fonte individual ainda precisa de conferência**.
- **234 entradas** ao todo. Uma entrada é um registro bibliográfico/variante, e não necessariamente um modelo único; `Dragonlance` é referenciada por dois livros, algumas entradas são munições, e versões `+1/+2/+3` são agrupadas. A pesquisa **não é comprovadamente exaustiva** de toda a 5ª edição.

### Referências e licenças
O System Reference Document 5.2.1 de Wizards of the Coast LLC está em [D&D Beyond](https://www.dndbeyond.com/srd) sob **CC BY 4.0**. A tabela principal é replicada/adaptada com atribuição.
Conteúdo de livros pagos é **índice com nomes e fontes**; o aplicativo **não reproduz** regras pagas, descrições narrativas nem efeitos mágicos exclusivos. O jogador pode vincular manualmente um dos 38 modelos abertos, preencher dados ou consultar a fonte legalmente adquirida. Sem dano conhecido, os botões de dados ficam indisponíveis até configurar.

Fontes públicas consultadas:
- [Equipamentos SRD 2024](https://www.dndbeyond.com/sources/dnd/br-2024/equipment)
- [Armas mágicas no D&D Beyond](https://www.dndbeyond.com/magic-items?filter-search=&filter-type=9)
- [Índice comunitário por obra (secundário, pendente de confirmação individual)](https://dnd5e.wikidot.com/wondrous-items:weapon)
- [D&D: World of Warcraft](https://www.dndbeyond.com/sources/dnd/wow)
- [Arcana Unleashed: Deadfall](https://www.dndbeyond.com/sources/dnd/aud)

## Design e fluxo de inventário D&D
1. Ficha D&D → **Inventário** → **Arsenal (234)**.
2. Busca por nome, classe de arma, dano ou livro, filtros por básica, moderna, futurista, cenário, mágica e fonte a conferir; seletor de obra.
3. Lista paginada em lotes de 40 para não travar celulares.
4. Adicionar uma arma básica cria um `Item` comum do inventário, preservando quantidade, equipado, carga, bônus, arte, foto, transferência, permissões e rolagem na mesa.
5. Armas mágicas e suplementos criam `Item` com referência estável à obra (`armaRefDnd`), preservada ao editar, normalizar fichas antigas e transferir entre personagens.
6. É possível escolher manualmente um **modelo de arma básica** para usar as rolagens abertas sem afirmar que os efeitos únicos do suplemento são automáticos.
7. A interface do editor de D&D ganhou prévia, campos de nome/peso/tipo prioritários, aparência recolhível, formulário mobile com maior área útil e botão Salvar fixo; a Forja permanece personalizável.
8. Busca no inventário por nome, descrição e livro; 10 novos desenhos SVG de famílias de armas (besta, rifle, pistola, chicote, tridente, mangual, alabarda, cimitarra, foice, lâmina radiante) e paletas diferentes para relíquias por nome, sem hotlinks para imagens protegidas.
9. As outras fichas continuam com o editor genérico por enquanto; a refatoração futura será feita **por sistema**, não globalmente.

## Dano e crítico
- Armas da tabela SRD 2024: dano base + atributo de acordo com Força, Destreza ou Acuidade; opção Versátil, ataque adicional com arma Leve, bônus mágico +1/+2/+3.
- Crítico dobra **somente a quantidade de dados**, mantendo modificadores fixos.
- Armas modernas e futuristas: dados de dano pesquisados, com atributo de dano selecionável na ficha.
- Armas especiais e personalizadas: crítico avulso apenas quando há expressão de dano válida; não inventa dados para suplementos.
- Maestrias, ataque contra CA, proficiência, condições, consumo de munições, dano adicional de classe ou efeitos mágicos **não são automáticos**. O mestre deve aplicar as regras relevantes.

## Checklist antes do merge
- [ ] Testes Vitest de catálogo, críticos, normalização e migração de itens antigos
- [ ] TypeScript
- [ ] Lint bloqueante
- [ ] Build GitHub Actions
- [ ] Vercel Preview
- [ ] Validar no celular: Novo item → nome/tipo/peso primeiro → Personalizar aparência → Salvar
- [ ] Validar arma de 2024, arma de fogo, item mágico com e sem modelo físico
- [ ] Validar rolagens na ficha e em campanhas, e permissões do mestre/jogador
- [ ] Verificar manualmente exatidão da fonte de cada entrada de índice (essas NÃO devem ter efeitos especiais automáticos)

**A PR #47 (magias de espécies) permanece independente.**
