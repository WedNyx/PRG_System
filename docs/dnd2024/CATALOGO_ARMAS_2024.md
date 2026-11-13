# D&D 2024 — catálogo de 38 armas e rolagens de dano/crítico

## Fonte e escopo

A tabela principal de 38 armas (10 simples corpo a corpo, 4 simples à distância, 18 marciais corpo a corpo e 6 marciais à distância) é adaptada do **System Reference Document 5.2.1 (SRD 5.2.1)**, Wizards of the Coast LLC, https://www.dndbeyond.com/srd, distribuído sob CC BY 4.0. Referência pública: https://www.dndbeyond.com/sources/dnd/br-2024/equipment.

O catálogo aparece **somente nas fichas do sistema `dnd5e-srd`**, aba **Inventário**. Os demais sistemas mantêm seu editor genérico de itens.

## Fluxo
1. Inventário → **Catálogo de armas (38)**.
2. Pesquise por nome, tipo, propriedade ou maestria; filtre entre as quatro categorias.
3. **Adicionar à ficha** cria um item real com nome, dano base, tipo de dano, propriedades, maestria, peso em kg, custo de referência e alcance convertido de pés para metros.
4. Armas do catálogo têm dois botões: **Dano** e **Crítico**. Ambos passam por `rolar` da ficha, de modo que a rolagem também segue a integração existente de campanha/histórico.
5. O dano usa Força para armas corpo a corpo, Destreza para à distância e escolha de Força/Destreza para Acuidade. Armas versáteis permitem selecionar uma ou duas mãos.
6. O ataque adicional com arma Leve pode ser marcado explicitamente: nesse ataque não entra modificador positivo do atributo (o negativo permanece).
7. Crítico dobra **somente os dados** (ex.: 1d8+3 → 2d8+3, 2d6+4 → 4d6+4). Encantamento +1 a +3 é somado uma vez e pode ser configurado no editor do item. Zarabatana tem dano **fixo de 1**; não há dado para dobrar.
8. O item continua suportando quantidade, equipado, carga, fotos, edição, permissões da campanha e transferência entre personagens. O catálogo não apaga nem transforma itens personalizados existentes.

## Limites seguros
- As **Maestrias** `Cleave`, `Graze`, `Nick`, `Push`, `Sap`, `Slow`, `Topple` e `Vex` são identificadas, **não executadas automaticamente**: é obrigatório que a classe/talento conceda Maestria e o mestre confirme o efeito.
- Atacar contra CA, acerto com vantagem/desvantagem, proficiência com a arma, multiclasse, munição, disparos/recarga, propriedades situacionais e efeitos de talentos/condições devem ser validados pelo mestre. Os botões lançam **dano**, não verificam automaticamente se o ataque acertou.
- Bônus automáticos de características como Ataque Furtivo, Ira, Golpe Brutal e estilos de luta não são presumidos, para evitar dano em dobro.
- Armas mágicas individuais, variantes com dados adicionais, armas improvisadas e golpes desarmados podem ser criados no editor manual, sem serem confundidos com as 38 linhas da tabela.
- A escolha de Acuidade/Versátil/ataque adicional é local à interface de rolagem e não altera o registro permanente do item; as opções podem ser escolhidas novamente na próxima sessão.
- O comprimento das armas em pesos em quilogramas usa aproximação (1 lb = 0,45359237 kg).

## Verificação antes do merge
Testes de catálogo (38 sem duplicação, dados e maestria), expressões de crítico, acuidade/versátil, mão secundária, persistência, autorização do servidor pelos mecanismos existentes de Inventário e transferência. Conferir **Vitest, TypeScript, lint, build e Vercel Preview**, além da homologação visual usando uma ficha de mestre e de jogador.

**PR separada, sem integração automática na `main`.**
