/**
 * Ficha em arquivo (v0.33.2): baixar um backup .json do personagem e importar de volta como ficha avulsa.
 * Só fichas — sistemas não são importados por arquivo (decisão do Wed).
 */
export const FORMATO_FICHA = 'prg-ficha'
export type ArquivoFicha = { formato: typeof FORMATO_FICHA; versao: 1; exportadoEm: string; sistema: string; sistemaNome?: string; nome: string; dados: Record<string, unknown> }

export function montarArquivo(sistema: string, dados: Record<string, unknown>, sistemaNome?: string): ArquivoFicha {
  const nome = typeof dados.nome === 'string' && dados.nome.trim() ? dados.nome.trim().slice(0, 90) : 'Personagem sem nome'
  return { formato: FORMATO_FICHA, versao: 1, exportadoEm: new Date().toISOString(), sistema, ...(sistemaNome ? { sistemaNome } : {}), nome, dados }
}

/** Nome do arquivo: “lyra-dnd5e-srd.json” (sem acentos nem espaços). */
export function nomeDoArquivo(a: Pick<ArquivoFicha, 'nome' | 'sistema'>) {
  const limpar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  return `${limpar(a.nome) || 'personagem'}-${limpar(a.sistema) || 'ficha'}.json`
}

/** Lê o texto de um arquivo e confere o formato. Não confia em nada: o servidor valida de novo ao criar. */
export function lerArquivo(texto: string): { ok: true; sistema: string; nome: string; dados: Record<string, unknown> } | { ok: false; erro: string } {
  if (texto.length > 2_000_000) return { ok: false, erro: 'Arquivo grande demais para ser uma ficha.' }
  let bruto: unknown
  try { bruto = JSON.parse(texto) } catch { return { ok: false, erro: 'Este arquivo não é uma ficha do PRG System (.json).' } }
  const a = bruto as Partial<ArquivoFicha>
  if (!a || typeof a !== 'object' || a.formato !== FORMATO_FICHA) return { ok: false, erro: 'Este arquivo não é uma ficha do PRG System. Use um arquivo baixado pelo botão “Baixar ficha”.' }
  if (a.versao !== 1) return { ok: false, erro: 'Esta ficha foi baixada por uma versão mais nova da plataforma.' }
  if (typeof a.sistema !== 'string' || !/^[a-z0-9-]{1,60}$/.test(a.sistema)) return { ok: false, erro: 'O arquivo não diz de qual sistema é a ficha.' }
  if (!a.dados || typeof a.dados !== 'object' || Array.isArray(a.dados)) return { ok: false, erro: 'O arquivo está sem os dados da ficha.' }
  const nome = typeof a.nome === 'string' ? a.nome.slice(0, 90) : ''
  return { ok: true, sistema: a.sistema, nome, dados: { ...a.dados, sistema: a.sistema } }
}

/** Baixa o arquivo no navegador. */
export function baixarArquivo(a: ArquivoFicha) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(a, null, 2)], { type: 'application/json' }))
  const link = Object.assign(document.createElement('a'), { href: url, download: nomeDoArquivo(a) })
  document.body.appendChild(link); link.click(); link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
