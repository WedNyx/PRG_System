# Patch independente — Ordem Paranormal (modelo básico)

## Implementado
- Visualização específica dos cinco atributos em cinco **hexágonos**, em anel e com centro identificado. Não altera o banco de dados, o identificador das fichas nem as rolagens já existentes.
- Inputs numéricos acessíveis e responsivos (teclado, toque e leitura de tela), com visualização somente leitura respeitada.
- Contagem de pontos por NEX (9 na criação; +1 em 20%, 50%, 80% e 95%) e avisos para origens, trilhas a partir de NEX 10% e marcos de NEX.
- Testes novos para layout declarativo, limites e valores calculados de PV, PE, Sanidade, Defesa e DT.

## Já existia no motor e foi preservado
- Agilidade, Força, Intelecto, Presença e Vigor, de 0 a 5.
- Combatente, Especialista e Ocultista; PV/PE/Sanidade por classe e NEX; Defesa, Esquiva, Bloqueio, DT e perícias.
- Testes em parada de d20: atributo N rola Nd20, mantém o maior; 0 rola 2d20 e mantém o menor.
- Suporte a inventário, recursos, rolagem em campanha, Árvore e permissões mestre/jogador.

## A implementar em patches próprios de conteúdo (não declarar 100%)
- Catálogo conferido de origens, trilhas e poderes específicos, com escolhas condicionais por NEX.
- Rituais, elementos, círculos, custos e resultados condicionais das habilidades.
- Equipamento, armas e críticos específicos por categoria/arma; treino de perícias por progressão e poderes.
- QA autenticado em banco de teste, testes físicos Android/iOS e correção de divergências identificadas.

Regras e estrutura foram mantidas separadas de textos integrais de livros comerciais.
Este patch não inclui transcrição ou imagens oficiais dos livros.
