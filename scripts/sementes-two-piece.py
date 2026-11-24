import json, math, sys
OUT = sys.argv[1]
def no(id, nome, x, y, cor, requer, icone=None, forma=None, tamanho=None, recurso='mp', descricao=''):
    n = {'id': id, 'nome': nome, 'custo': 0, 'cor': cor, 'x': round(x), 'y': round(y), 'requer': requer, 'efeitos': [], 'aberto': {'recurso': recurso} if recurso else {}}
    if descricao: n['descricao'] = descricao
    if icone: n['icone'] = icone
    if forma: n['forma'] = forma
    if tamanho: n['tamanho'] = tamanho
    return n
nos = [no('tp-centro', 'Personagem', 0, 0, '#e2e8f0', [], icone='⚓', tamanho='g', recurso=None,
          descricao='O começo de tudo. Cada caminho que sai daqui é uma divisão de poder: Classe, Raça, Fruta, Haki e Rokushiki.')]
del nos[0]['aberto']
def cadeia(prefixo, rotulo, qtd, angulo, cor, icone, raio0=150, passo=88, forma=None, recurso='mp', desc='', depois=None, raio_inicio=None, abertura=0.0):
    ant = depois or 'tp-centro'; ids = []
    for k in range(qtd):
        r = (raio_inicio or raio0) + k * passo
        a = math.radians(angulo + (abertura * (1 if k % 2 else -1) if abertura else 0))
        i = f'{prefixo}{k+1}'
        nos.append(no(i, f'{rotulo} {k+1}', r * math.cos(a), r * math.sin(a), cor, [ant], icone=icone, forma=forma, recurso=recurso,
                      descricao=desc))
        ant = i; ids.append(i)
    return ids
d = 'Espaço em aberto: depois de liberar, escreva a habilidade que você combinou com o mestre.'
cadeia('tp-classe-', 'Classe', 10, -90, '#a78bfa', '⚔', desc=d + ' Limite da Classe: 10 habilidades.', abertura=7)
cadeia('tp-raca-', 'Raça', 3, -18, '#34d399', '🧬', desc=d + ' Limite da Raça: 3 habilidades.')
cadeia('tp-fruta-', 'Fruta', 10, 54, '#f87171', '🍎', desc=d + ' A Fruta não tem limite fixo: se precisar de mais espaços, o mestre cria em “Editar a árvore e extras”.', abertura=7)
for j, (sub, nome, ic) in enumerate([('arm', 'Haki do Armamento', '🛡'), ('obs', 'Haki da Observação', '👁'), ('rei', 'Haki do Rei', '👑')]):
    cadeia(f'tp-haki-{sub}-', nome, 3, 126 + (j - 1) * 20, '#fbbf24', ic, recurso='em', desc=d + ' O Haki gasta EM (não MP). Limite: 3 por tipo de Haki.')
base = cadeia('tp-roku-', 'Rokushiki', 6, 198, '#38bdf8', '🥋', desc=d + ' Limite: 6 habilidades de Rokushiki.', abertura=6)
cadeia('tp-roku-evo-', 'Rokushiki — Evolução', 6, 198, '#22d3ee', '✦', raio_inicio=150 + 6 * 88, forma='losango', depois=base[-1], desc=d + ' Evolução do Rokushiki: mais 6 habilidades.', abertura=6)
assert len(nos) == 1 + 10 + 3 + 10 + 9 + 12, len(nos)

regras = [
 {'titulo': 'Sobre o sistema', 'texto': 'Two Piece é o sistema autoral do Raijin. O dado base é o d20.\n\nAtributos são contados em dados: um personagem com 3 de Força rola 3d20 nos testes de Força e fica com o maior. Cada perícia ligada ao teste soma +2.\n\nNão existem habilidades prontas: o mestre escolhe junto com cada jogador e vai balanceando. A árvore de habilidades mostra só quantas habilidades dá para ter em cada divisão de poder.'},
 {'titulo': 'Dado de acerto', 'texto': 'O dado de ataque depende da classe e da arma. Espada longa ou pesada e luta com os punhos usam Força. Ataques à distância, como magia ou armas de fogo, usam Inteligência.'},
 {'titulo': 'Desvios e bloqueios', 'texto': 'Existem 3 tipos de defesa:\n\n• Esquiva: a mais comum. Role os dados de Destreza; se o resultado for maior que o ataque, você desvia.\n\n• Bloqueio: usa um item, como um escudo, ou o próprio corpo (por exemplo, um ciborgue de metal). Role os dados de Força. Se der certo, bloqueia 100% do dano; se falhar, toma o dano todo.\n\n• Desvio técnico: só para espadachins e artistas marciais (atiradores não usam, porque é algo físico). É uma junção do bloqueio com a esquiva e se rola com apenas 1d20. Se der certo, o oponente perde o turno inteiro; se falhar, quem tentou perde o turno inteiro. Se for usado no fim do turno, no próximo o personagem não terá 1 ação: sobram só o movimento e o forçar ação (se ele usar a ação de ataque, também sofre alguma consequência). É o tipo de defesa mais arriscado e o mais recompensador.'},
 {'titulo': 'Contra-ataque', 'texto': '• Depois de desviar: depois de uma esquiva bem-sucedida contra uma ação normal, dá para contra-atacar com os dados de ataque normais. O oponente ainda pode tentar desviar. Não dá para contra-atacar o forçar ação.\n\n• Depois de bloquear: um bloqueio bem-sucedido também permite tentar um contra-ataque, com a mesma regra, só contra a ação normal do oponente.\n\n• Depois do desvio técnico: se der certo, o contra-ataque acerta com 100% de chance, sem rolar ataque. Role só o dano, mas antes role 1d20 para saber se foi crítico.'},
 {'titulo': 'Dano crítico e ponto fraco', 'texto': 'Se quem ataca tirar 20 puro no dado e o oponente não conseguir desviar, o ataque ganha mais 1 dado de dano.\n\nFalha crítica: quem tirar 1 no dado e não conseguir desviar de um ataque toma crítico (mais 1 dado de dano).'},
 {'titulo': 'Forçar ação e níveis de vida', 'texto': 'Quem usa o forçar ação e erra sofre alguma punição, que depende de quão feia foi a falha: o personagem ou o oponente podem levar dano. A punição vale só para ataques feitos no forçar ação; o que não é ataque (por exemplo, tomar uma poção para recuperar vida) não tem punição.\n\nNíveis de vida: quem ficar com menos de 20 de vida (19 ou menos) ganha 1 dado aleatório de desvantagem ligado aos atributos e perícias. Exemplo: caiu um dado de Força e o personagem tinha 3 dados de Força e 1 perícia ligada à Força — fica com −1 dado de Força e −1 no bônus da perícia (perícias dão +2).'},
 {'titulo': 'Ficha, status e poderes', 'texto': 'Atributos: Força, Inteligência, Vigor, Destreza, Carisma e Força de vontade.\n\nPerícias: cada jogador escolhe 5 perícias (crie em Atributos e perícias). Cada uma dá +2.\n\nStatus: PV (vida), MP, SN (Sanidade) e EM (energia do Haki).\n\nDivisões de poder: Classe, Fruta, Raça, Haki e Rokushiki.\n\nClasses: Espadachim, Combatente/Artista marcial e Atirador. Raças: Lunarian, Humano e Cyborg.'},
 {'titulo': 'Árvore de habilidades', 'texto': 'Cada caminho da árvore tem o limite de habilidades da sua divisão:\n\n• Classe: 10 habilidades\n• Raça: 3 habilidades\n• Fruta: variável (sem limite fixo)\n• Haki: 3 para cada tipo — Armamento, Observação e Rei\n• Rokushiki: 6 habilidades e mais 6 na evolução\n\nO jogador libera o próximo espaço e, ali mesmo, escreve a habilidade que combinou com o mestre: nome, descrição, dados de dano e custo. As habilidades gastam MP, menos as de Haki, que gastam EM. Dano e custo podem ficar zerados (habilidades passivas), e dá para pôr um limite de usos por combate (ex.: só 2 vezes por combate).'},
 {'titulo': 'Inventário', 'texto': 'Limite de 20 itens com melhorias no inventário. Dependendo do item, ele ocupa 2 espaços, até 3 no máximo (anote no peso do item).\n\nArmas não ocupam espaço no inventário (deixe o peso delas em 0).'},
]
definicao = {
  'nome': 'Two Piece',
  'resumo': 'Sistema autoral do Raijin: d20, atributos contados em dados (fica com o maior), +2 por perícia, Esquiva, Bloqueio e Desvio técnico, e uma árvore de habilidades com Classe, Raça, Fruta, Haki e Rokushiki que o jogador escreve com o mestre.',
  'dados': 'd20 (parada, fica com o maior)',
  'rolagem': 'parada', 'parada': {'lados': 20},
  'tituloAtributos': 'Atributos',
  'campos': [
    {'id': 'classe', 'nome': 'Classe', 'tipo': 'escolha', 'opcoes': [
      {'nome': 'Espadachim', 'descricao': 'Luta com espadas. Pode usar o Desvio técnico.'},
      {'nome': 'Combatente/Artista marcial', 'descricao': 'Luta com o corpo e os punhos. Pode usar o Desvio técnico.'},
      {'nome': 'Atirador', 'descricao': 'Ataques à distância (usa Inteligência). Não usa o Desvio técnico.'}]},
    {'id': 'raca', 'nome': 'Raça', 'tipo': 'escolha', 'opcoes': [{'nome': 'Lunarian'}, {'nome': 'Humano'}, {'nome': 'Cyborg'}]},
    {'id': 'fruta', 'nome': 'Fruta', 'tipo': 'texto', 'dica': 'A fruta do personagem, se tiver.'},
    {'id': 'historia', 'nome': 'Quem é o personagem', 'tipo': 'area'},
  ],
  'atributos': [
    {'id': 'FOR', 'nome': 'Força', 'min': 0, 'max': 10, 'padrao': 1, 'dica': 'Quantos d20 rola. Ataques com espada longa/pesada e com os punhos; Bloqueio.'},
    {'id': 'INT', 'nome': 'Inteligência', 'min': 0, 'max': 10, 'padrao': 1, 'dica': 'Quantos d20 rola. Ataques à distância: magia e armas de fogo.'},
    {'id': 'VIG', 'nome': 'Vigor', 'min': 0, 'max': 10, 'padrao': 1, 'dica': 'Quantos d20 rola.'},
    {'id': 'DES', 'nome': 'Destreza', 'min': 0, 'max': 10, 'padrao': 1, 'dica': 'Quantos d20 rola. Esquiva.'},
    {'id': 'CAR', 'nome': 'Carisma', 'min': 0, 'max': 10, 'padrao': 1, 'dica': 'Quantos d20 rola.'},
    {'id': 'VON', 'nome': 'Força de vontade', 'min': 0, 'max': 10, 'padrao': 1, 'dica': 'Quantos d20 rola.'},
  ],
  'derivados': [],
  'pericias': {'titulo': 'Perícias', 'modo': 'valor', 'total': 'VALOR', 'livres': True, 'lista': [
    {'id': 'pericia_exemplo', 'nome': 'Perícia de exemplo', 'dica': 'Troque pelas suas: cada jogador escolhe 5 perícias e cada uma dá +2. Crie as suas com “Nova perícia”.'}]},
  'recursos': [
    {'id': 'pv', 'nome': 'PV', 'dica': 'Vida. Com 19 ou menos, ganha 1 dado aleatório de desvantagem.'},
    {'id': 'mp', 'nome': 'MP', 'dica': 'Gasto pelas habilidades (menos as de Haki).'},
    {'id': 'sn', 'nome': 'SN (Sanidade)'},
    {'id': 'em', 'nome': 'EM', 'dica': 'Energia do Haki: as habilidades de Haki gastam EM no lugar do MP.'},
  ],
  'listas': [{'id': 'habilidades_extras', 'nome': 'Anotações das habilidades'}, {'id': 'anotacoes', 'nome': 'Anotações e história'}],
  'carga': {'formula': '20', 'unidade': 'espaços'},
  'regras': regras,
  'observacoes': ['Habilidades não vêm prontas: o mestre escolhe com cada jogador. A árvore mostra o limite de cada divisão de poder.'],
  'visual': {'arvore': 'pirata', 'arvoreFundo': 'mapa', 'cartaoEstilo': 'pergaminho', 'moldura': 'ornamento', 'raio': 10, 'atributosEstilo': 'circulo', 'barrasEstilo': 'grossa'},
  'arvore': {'pontos': 0, 'nos': nos},
}
json.dump(definicao, open(OUT, 'w'), ensure_ascii=False, indent=1)
print(len(nos), 'nós')
