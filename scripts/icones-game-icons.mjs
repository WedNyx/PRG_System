// Copia os ícones do Game-Icons (pacote game-icons-transparent, CC BY 3.0) para public/icones/gi
// e monta o índice usado na busca. Roda sozinho antes do build (npm run build → prebuild).
// Os arquivos gerados não vão para o git (.gitignore): saem sempre do pacote instalado.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const origem = join(raiz, 'node_modules', 'game-icons-transparent')
const destino = join(raiz, 'public', 'icones', 'gi')
if (!existsSync(join(origem, 'svgs'))) { console.error('game-icons-transparent não está instalado (npm install).'); process.exit(1) }

// Nomes dos autores, como pede a licença ("Icons made by {author}").
const autores = {}
for (const linha of readFileSync(join(origem, 'license.txt'), 'utf8').split('\n')) {
  const m = /^- ([^,]+?)(?:,\s*(\S+))?(?:\s*-\s*CC0)?\s*$/.exec(linha.trim())
  if (m) autores[m[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')] = { nome: m[1].trim(), site: m[2] ?? null, cc0: /CC0/.test(linha) }
}

rmSync(destino, { recursive: true, force: true })
const icones = []
for (const autor of readdirSync(join(origem, 'svgs')).sort()) {
  if (!/^[a-z0-9-]+$/.test(autor)) continue
  mkdirSync(join(destino, autor), { recursive: true })
  for (const arq of readdirSync(join(origem, 'svgs', autor)).sort()) {
    const nome = arq.replace(/\.svg$/, '')
    if (!arq.endsWith('.svg') || !/^[a-z0-9-]+$/.test(nome)) continue
    // Só os caminhos: sem scripts nem nada de fora; fill preto (a ficha usa como máscara e pinta na cor que quiser).
    const svg = readFileSync(join(origem, 'svgs', autor, arq), 'utf8')
    const caminhos = [...svg.matchAll(/<path\b[^>]*\sd="([^"]+)"/g)].map(m => m[1])
    if (!caminhos.length) continue
    writeFileSync(join(destino, autor, arq), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${caminhos.map(d => `<path d="${d}"/>`).join('')}</svg>`)
    icones.push([autor, nome])
  }
}
const compacto = t => t.replace(/-/g, '')
const porCompacto = Object.fromEntries(Object.entries(autores).map(([k, v]) => [compacto(k), v]))
// Pasta e nome na licença nem sempre batem (andymeneely = Andy Meneely, lucasms = Lucas).
const nomeAutor = a => (autores[a] ?? porCompacto[compacto(a)] ?? Object.entries(porCompacto).find(([k]) => compacto(a).startsWith(k))?.[1])?.nome
  ?? a.split('-').map(p => p[0].toUpperCase() + p.slice(1)).join(' ')
writeFileSync(join(destino, 'indice.json'), JSON.stringify({ total: icones.length, autores: Object.fromEntries([...new Set(icones.map(i => i[0]))].map(a => [a, nomeAutor(a)])), icones }))
console.log(`Game-Icons: ${icones.length} ícones em public/icones/gi`)
