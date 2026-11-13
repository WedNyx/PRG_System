# Etapa 3 — Criação guiada por antecedentes e Forasteiro legado

## Referências utilizadas
- SRD 5.2.1 (CC BY 4.0), criação de personagem e origens: https://www.dndbeyond.com/srd
- D&D 2024, regras abertas de compatibilidade com antecedentes antigos: https://www.dndbeyond.com/sources/dnd/br-2024/creating-a-character
- Lista oficial de antecedentes, com **Outlander** marcado como legado do PHB 2014: https://www.dndbeyond.com/backgrounds
- Livro do Jogador 2014: regras completas do Forasteiro (Outlander) e da característica Wanderer, obra comercial.

## Por que Forasteiro não aparecia?
Forasteiro (Outlander) pertence à edição **2014**, e não aos dezesseis antecedentes do PHB **2024**.
A compatibilidade 2024 permite usar origens antigas, mas elas devem receber as adaptações da regra atual: +2/+1 em atributos diferentes ou +1/+1/+1 em três atributos, além de um talento de origem caso não concedam um.

## Implementação na PR #45
- Fonte adicional **Livro do Jogador (2014) — legado** (`phb2014`) nas configurações de fontes da campanha. Sem liberação pelo mestre, jogadores não podem escolher Forasteiro em uma campanha D&D; fichas avulsas continuam podendo usar fontes.
- O seletor oferece **Forasteiro (2014)** separado dos **16 antecedentes de 2024** e seus quatro antecedentes SRD. Não modifica a lista oficial nem renomeia um antecedente diferente.
- Forasteiro recebe proficiência em **Atletismo e Sobrevivência**. A ficha orienta o registro de um instrumento musical, idioma, talento de origem pela compatibilidade e equipamento de 2014. **Viajante** permanece orientação narrativa, não concede valores inventados.
- Guia de Atributos disponível para **Acólito, Criminoso, Sábio, Soldado e Forasteiro**:
  - distribui **+2 e +1** em atributos elegíveis distintos, ou **+1 em três**;
  - aplica os aumentos somente quando a pessoa confirma a operação;
  - registra os aumentos já aplicados e recalcula por *diferença* se a pessoa reorganizar a distribuição;
  - não reexecuta o bônus ao apenas salvar, abrir ou selecionar o antecedente;
  - bloqueia valores fora de 1–20 e fontes não liberadas;
  - vincula os aumentos às permissões da categoria Atributos na campanha.
- Para os **outros 12 antecedentes comerciais do PHB 2024**, a ficha segue permitindo a escolha, mas não inventa quais atributos devem receber bônus; o mestre continua consultando a fonte.
- Equipamentos do SRD: seleção entre pacote e 50 PO. A decisão é registrada, **não duplica itens** no inventário.
- O Guia do Mestre mostra se a distribuição foi registrada, se falta confirmar ou se há conteúdo comercial pendente de revisão.

## Segurança e compatibilidade
- `dndAntecedente` armazena antecedente e distribuição aplicada. Atributos da ficha são os **valores finais**.
- Aplicação por `delta = novosPontos - antigosPontos` evita reaplicar três pontos quando houver um registro anterior.
- Fichas legadas que já somaram esses pontos manualmente exigem revisão antes de clicar em “Aplicar”. A interface avisa explicitamente.
- A API valida a distribuição **antes e depois** da aplicação das permissões de campanha.
- Ao trocar de antecedente, o registro antigo permanece como histórico até que a nova distribuição seja confirmada; o Guia do Mestre não marca o novo antecedente como concluído.
- Antecedentes comerciais PHB 2024 e fonte PHB 2014 não concedem automaticamente texto ou efeitos sem verificação.

## Pendências posteriores
1. Cadastro dos três atributos elegíveis e opções de talentos/ferramentas/equipamentos de **todos** os doze antecedentes comerciais do PHB 2024, mediante verificação das fontes originais.
2. Regras detalhadas das características de Viajante/Outlander, magias raciais e talentos de origem, sem reproduzir material comercial.
3. UI de confirmação de bônus já aplicados manualmente em fichas legadas, com migração assistida.
4. Testes end-to-end da ficha real com mestre/jogador, permissões da campanha e cópia em ambiente de homologação.
5. CI verde e revisão antes de mesclar. Nenhuma mudança de produção nesta etapa.
