# Etapa 5 — Talentos de origem, grimório e árvore Híbrida

**PR #45 (rascunho)** — D&D 2024 / SRD 5.2.1, com opções comerciais do Livro do Jogador 2024 (PHB) previamente liberadas pelo mestre.

## Fontes
- SRD 5.2.1, regras abertas: https://www.dndbeyond.com/srd (CC BY 4.0)
- Magic Initiate, regras oficiais de 2024: https://www.dndbeyond.com/feats/1789162-magic-initiate
- Resumo público dos talentos e antecedentes do PHB 2024: https://www.dndbeyond.com/posts/1785-the-backgrounds-and-origin-feats-in-the-2024
- Dados comerciais sem reprodução do texto completo do PHB.

## Feito nesta etapa

1. As **três magias** de Iniciado em Magia escolhidas no antecedente são derivadas de `dndAntecedente`, e ficam em seção própria dentro do Grimório (`MagiasOrigemDnd2024`). **Não** são inseridas em `dndMagias` e não consomem o limite de truques/magias preparadas da classe.
2. A tela usa o **atributo escolhido no talento** (INT, SAB ou CAR) para CD, ataque e expressões que precisem desse modificador, inclusive quando o personagem tiver uma classe com outro atributo de conjuração.
3. A magia de **1º nível** tem um uso gratuito por descanso longo, controlado pelo recurso `magia_origem_gratis`. Quando existem espaços de classe ou de Pacto, o jogador também pode usar esses espaços. Os dois caminhos descontam **seus próprios recursos**, sem consumir ambos.
4. Os usos da magia de origem são restaurados no **descanso longo**, mas não no curto.
5. O efeito fica indisponível se o antecedente for alterado ou se o registro estiver incompleto. **Não** apaga as escolhas anteriores.
6. A ficha oferece um painel de **talentos de origem** na Árvore Híbrida e na aba Habilidades, com efeitos, usos e orientações: Alerta, Robusto, Sortudo, Habilidoso, Iniciado em Magia, Atacante Selvagem, Artesão, Curandeiro, Músico e Brigão de Taverna.
7. Sortudo possui um botão explícito para **gastar um Ponto de Sorte**, vinculado ao recurso existente. Seu benefício na rolagem (Vantagem/Desvantagem) ainda precisa de integração à central de dados, portanto o botão só registra o gasto e orienta o jogador/mestre a resolver a rolagem.
8. O Guia do Mestre agora distingue **magias de classe**, **magias do talento de antecedente** e **magias da espécie**; não considera Iniciado em Magia como concluído antes das escolhas.
9. Ao registrar um antecedente na criação inicial, o uso gratuito de Iniciado em Magia ou os Pontos de Sorte são preenchidos; ao trocar de antecedente depois, não são reabastecidos por simples edição (o descanso longo recupera usos).

## O que não é fingido como implementação

- *Iniciado em Magia pelo Humano Versátil* ainda não possui seu próprio formulário de três magias e atributo. O Guia do Mestre sinaliza a pendência. É necessário registro separado para permitir o talento repetível em listas distintas.
- *Magias de linhagens ou legados das espécies* ainda não entram automaticamente no Grimório.
- As regras completas de *Atacante Selvagem, Curandeiro, Artesão, Músico e Brigão de Taverna* dependem de ações específicas no módulo de combate, inventário, descanso ou grupo. O painel só apresenta orientações concisas, não concede modificadores indevidos.
- *Sortudo* gasta recurso, mas a rolagem de Vantagem/Desvantagem será integrada posteriormente.
- O uso de magias cujo efeito não é dano/cura requer a resolução narrativa/condicional indicada no SRD.
- A integração ao **grimório** é uma projeção de `dndAntecedente`, não uma cópia independente que possa ser deletada/esquecida ao trocar de classe.
- A árvore automática oficial e os hexágonos personalizados continuam separados: o mestre pode conceder habilidades próprias sem sobrescrever a origem oficial.

## Critérios de teste
- Registrou antecedente mágico: três magias aparecem sem consumir limite da classe.
- Mago com Iniciado em Magia (Clérigo): CD/ataque do talento usam atributo registrado, e não a INT da classe.
- Conjurar 1 vez sem espaço desconta `magia_origem_gratis`; descanso curto não repõe, longo repõe.
- Conjurar com espaço desconta apenas o espaço escolhido.
- Troca de antecedente esconde magias e recurso, mas preserva registro para auditoria.
- Sortudo usa apenas bônus por proficiência; origem duplicada não concede usos adicionais.
- Revisar na interface e em ambiente de homologação antes de qualquer mesclagem.

**Sem merge e sem deploy automático na `main`.**
