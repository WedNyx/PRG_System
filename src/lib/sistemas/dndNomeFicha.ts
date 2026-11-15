/** Nome mostrado no cabeçalho e no arquivo exportado.
 * O id do sistema é único para D&D 2014/2024; o nome cadastrado no catálogo
 * não é fonte confiável da edição efetiva da ficha.
 */
import type {DadosFicha,Sistema} from './tipos'
import {lerLivrosDnd,type LivroBaseDnd} from './dndLivros'

export function nomeEdicaoFichaDnd(
 sistema:Pick<Sistema,'id'|'nome'>|null,
 dados:Pick<DadosFicha,'dndLivros'>|null,
 livroBaseCampanha:LivroBaseDnd|null=null,
):string {
 if(!sistema)return '…'
 if(sistema.id!=='dnd5e-srd')return sistema.nome
 const base=livroBaseCampanha??lerLivrosDnd(dados?.dndLivros).base
 return base==='phb2014'?'D&D 5e (2014) · SRD 5.1':'D&D 5e (2024) · SRD 5.2.1'
}
