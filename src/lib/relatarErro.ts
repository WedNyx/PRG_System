'use client'

/** Avisa o servidor sobre um erro inesperado na tela (no máximo 5 por página aberta, sem repetir). */
const enviados = new Set<string>()
export function relatarErro(mensagem: string, detalhe = '') {
  try {
    const m = (mensagem || '').slice(0, 500).trim()
    if (!m || enviados.size >= 5 || enviados.has(m)) return
    // Ruído comum de navegador/extensões que não é erro da plataforma.
    if (/ResizeObserver loop|Script error\.?$|chrome-extension:|moz-extension:|safari-extension:/i.test(m + ' ' + detalhe)) return
    enviados.add(m)
    void fetch('/api/prg/erros', {
      method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensagem: m, pagina: location.pathname, detalhe: detalhe.slice(0, 2000) }),
    }).catch(() => {})
  } catch { /* nunca atrapalha a tela */ }
}
