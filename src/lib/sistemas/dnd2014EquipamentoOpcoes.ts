/** Alternativas factuais de equipamento oferecidas às classes no PHB 2014 (cap. 3).
 * Resumos de nomes/quantidades; o Inventário é quem guarda os itens reais.
 * A ficha não concede gratuitamente itens ao apenas selecionar uma opção aqui.
 */
export type GrupoKit2014={id:string;titulo:string;opcoes:readonly string[]}
export type KitClasse2014={grupos:readonly GrupoKit2014[];fixos:readonly string[]}
const g=(id:string,titulo:string,...opcoes:string[]):GrupoKit2014=>({id,titulo,opcoes})
export const KITS_CLASSES_2014:Record<string,KitClasse2014>={
 'Bárbaro':{grupos:[
  g('arma1','Arma principal','Machado grande','Qualquer arma marcial corpo a corpo'),
  g('arma2','Arma adicional','Duas machadinhas','Qualquer arma simples'),
 ],fixos:['Pacote de aventureiro','Quatro azagaias']},
 'Bardo':{grupos:[
  g('arma1','Arma principal','Rapieira','Espada longa','Qualquer arma simples'),
  g('pacote','Pacote','Diplomata','Artista'),
  g('instrumento','Instrumento','Alaúde','Outro instrumento musical'),
 ],fixos:['Armadura de couro','Adaga']},
 'Bruxo':{grupos:[
  g('arma1','Primeira arma','Besta leve + 20 virotes','Qualquer arma simples'),
  g('foco','Instrumento de conjuração','Bolsa de componentes','Foco arcano'),
  g('pacote','Pacote','Estudioso','Explorador'),
 ],fixos:['Armadura de couro','Uma arma simples adicional','Duas adagas']},
 'Clérigo':{grupos:[
  g('arma1','Arma principal','Maça','Martelo de guerra (se proficiente)'),
  g('armadura','Armadura','Brunea','Armadura de couro','Cota de malha (se proficiente)'),
  g('arma2','Arma secundária','Besta leve + 20 virotes','Qualquer arma simples'),
  g('pacote','Pacote','Sacerdote','Aventureiro'),
 ],fixos:['Escudo','Símbolo sagrado']},
 'Druida':{grupos:[
  g('arma1','Escudo ou arma','Escudo de madeira','Qualquer arma simples'),
  g('arma2','Arma corpo a corpo','Cimitarra','Qualquer arma simples corpo a corpo'),
  g('pacote','Pacote da tradução enviada','Estudioso','Explorador'),
 ],fixos:['Armadura de couro','Pacote de aventureiro','Foco druídico']},
 'Feiticeiro':{grupos:[
  g('arma1','Arma','Besta leve + 20 virotes','Qualquer arma simples'),
  g('foco','Instrumento de conjuração','Bolsa de componentes','Foco arcano'),
  g('pacote','Pacote','Explorador','Aventureiro'),
 ],fixos:[]},
 'Guerreiro':{grupos:[
  g('armadura','Armadura','Cota de malha','Gibão de peles + arco longo + 20 flechas'),
  g('arma1','Armas marciais','Uma arma marcial + escudo','Duas armas marciais'),
  g('arma2','Armas adicionais','Besta leve + 20 virotes','Duas machadinhas'),
  g('pacote','Pacote','Aventureiro','Explorador'),
 ],fixos:[]},
 'Ladino':{grupos:[
  g('arma1','Arma principal','Rapieira','Espada longa'),
  g('arma2','Arma adicional','Arco curto + aljava + 20 flechas','Espada curta'),
  g('pacote','Pacote','Assaltante','Aventureiro','Explorador'),
 ],fixos:['Armadura de couro','Duas adagas','Ferramentas de ladrão']},
 'Mago':{grupos:[
  g('arma1','Arma','Bordão','Adaga'),
  g('foco','Instrumento de conjuração','Bolsa de componentes','Foco arcano'),
  g('pacote','Pacote','Estudioso','Explorador'),
 ],fixos:['Grimório']},
 'Monge':{grupos:[
  g('arma1','Arma','Espada curta','Qualquer arma simples'),
  g('pacote','Pacote','Explorador','Aventureiro'),
 ],fixos:['Dez dardos']},
 'Paladino':{grupos:[
  g('arma1','Armas marciais','Uma arma marcial + escudo','Duas armas marciais'),
  g('arma2','Arma adicional','Cinco azagaias','Qualquer arma simples corpo a corpo'),
  g('pacote','Pacote','Sacerdote','Aventureiro'),
 ],fixos:['Cota de malha','Símbolo sagrado']},
 'Patrulheiro':{grupos:[
  g('armadura','Armadura','Brunea','Armadura de couro'),
  g('armas','Armas corpo a corpo','Duas espadas curtas','Duas armas simples corpo a corpo'),
  g('pacote','Pacote','Explorador','Aventureiro'),
 ],fixos:['Arco longo','Aljava com 20 flechas']},
}
export function escolhasKitClasse2014Validas(classe:string,valor:unknown,exigirTodas:boolean):boolean {
 const kit=KITS_CLASSES_2014[classe]
 if(!kit||!valor||typeof valor!=='object'||Array.isArray(valor))return false
 const o=valor as Record<string,unknown>
 if(Object.keys(o).some(id=>!kit.grupos.some(x=>x.id===id)))return false
 if(kit.grupos.some(x=>o[x.id]!==undefined && !x.opcoes.includes(String(o[x.id]))))return false
 return !exigirTodas || kit.grupos.every(x=>x.opcoes.includes(String(o[x.id]??'')))
}
