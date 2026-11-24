/**
 * Menu da ficha com a cara de cada sistema (v0.36.9): o mesmo jeito do menu de D&D — ícones de traço e nomes curtos
 * numa barra única no celular, ícone + nome + subtítulo no computador — mas com os ícones e as palavras de cada jogo.
 * As cores vêm do tema do sistema (--ficha-acento, --ficha-borda, --ficha-cartao).
 */
import {
  Anchor, Apple, Atom, Axe, Backpack, Biohazard, Bone, BookOpen, BookText, Brain, Briefcase, Castle, Coins, Compass, Cpu, Crosshair, Crown, Dice5, Dice6,
  Dna, Dog, Eye, Feather, Fingerprint, Flag, Flame, FolderLock, Footprints, Gauge, Gem, Ghost, GitBranch, Hexagon, Hourglass, IdCard, KeyRound, Layers,
  Map as MapaIcone, Moon, Network, Newspaper, NotebookPen, Orbit, Package, PawPrint, Percent, Route, ScanFace, Scroll, ScrollText, Search, Shield, Skull, Sparkles,
  Sprout, Star, Swords, Target, Tent, User, VenetianMask, Wand2, Zap, type LucideIcon,
} from 'lucide-react'

type Item = [LucideIcon, string]
type Menu = Partial<Record<string, Item>>
const EXTRAS: Menu = { marcas: [PawPrint, 'Marcas'], formas: [Dog, 'Formas'], invocacoes: [Sparkles, 'Invocar'], efeitos: [Hourglass, 'Efeitos'] }
const PADRAO: Menu = {
  principal: [User, 'Principal'], atributos: [Dice5, 'Atributos'], habilidades: [Sparkles, 'Poderes'], arvore: [GitBranch, 'Árvore'],
  equipamentos: [Backpack, 'Itens'], anotacoes: [ScrollText, 'Notas'], ...EXTRAS,
}
const MENUS: Record<string, Menu> = {
  'dnd5e-srd': { principal: [User, 'Principal'], atributos: [Dice5, 'Atributos'], habilidades: [BookOpen, 'Poderes'], arvore: [GitBranch, 'Árvore'], equipamentos: [Backpack, 'Itens'], anotacoes: [ScrollText, 'Diário'] },
  pf2e: { principal: [Shield, 'Herói'], atributos: [Target, 'Perícias'], habilidades: [Star, 'Talentos'], arvore: [Flag, 'Estandarte'], equipamentos: [Backpack, 'Itens'], anotacoes: [BookOpen, 'Crônicas'] },
  tormenta20: { principal: [Shield, 'Herói'], atributos: [Dice5, 'Atributos'], habilidades: [Zap, 'Poderes'], arvore: [Castle, 'Caminho'], equipamentos: [Swords, 'Arsenal'], anotacoes: [Scroll, 'Memórias'] },
  'ordem-paranormal': { principal: [Fingerprint, 'Dossiê'], atributos: [Gauge, 'Avaliação'], habilidades: [Flame, 'Rituais'], arvore: [Eye, 'NEX'], equipamentos: [Briefcase, 'Missão'], anotacoes: [FolderLock, 'Arquivo'] },
  'fate-core': { principal: [User, 'Conceito'], atributos: [Layers, 'Escada'], habilidades: [Star, 'Façanhas'], arvore: [Route, 'Marcos'], equipamentos: [Package, 'Extras'], anotacoes: [BookText, 'História'] },
  blades: { principal: [VenetianMask, 'Canalha'], atributos: [Dice6, 'Ações'], habilidades: [KeyRound, 'Truques'], arvore: [Route, 'Becos'], equipamentos: [Briefcase, 'Carga'], anotacoes: [NotebookPen, 'Golpes'] },
  brp: { principal: [IdCard, 'Ficha'], atributos: [Percent, 'Perícias'], habilidades: [Atom, 'Poderes'], arvore: [Search, 'Pistas'], equipamentos: [Briefcase, 'Pertences'], anotacoes: [NotebookPen, 'Diário'] },
  'call-of-cthulhu': { principal: [IdCard, 'Arquivo'], atributos: [Percent, 'Perícias'], habilidades: [Brain, 'Mitos'], arvore: [Search, 'Pistas'], equipamentos: [Briefcase, 'Evidências'], anotacoes: [NotebookPen, 'Caderno'] },
  'faroeste-arcano': { principal: [Star, 'Xerife'], atributos: [Crosshair, 'Provas'], habilidades: [Flame, 'Arcanos'], arvore: [Route, 'Trilha'], equipamentos: [Backpack, 'Alforjes'], anotacoes: [Newspaper, 'Relatos'] },
  'mork-borg': { principal: [Skull, 'Perdido'], atributos: [Dice6, 'Provas'], habilidades: [Ghost, 'Dons'], arvore: [Bone, 'Ruína'], equipamentos: [Axe, 'Despojos'], anotacoes: [Scroll, 'Crônica'] },
  assimilacao: { principal: [Biohazard, 'Sobrevivente'], atributos: [Dna, 'Instintos'], habilidades: [Sprout, 'Mutações'], arvore: [Network, 'Evolução'], equipamentos: [Tent, 'Suprimentos'], anotacoes: [NotebookPen, 'Diário'] },
  opositores: { principal: [Moon, 'Identidade'], atributos: [Sparkles, 'Atributos'], habilidades: [Star, 'Poderes'], arvore: [Orbit, 'Constelação'], equipamentos: [Gem, 'Relíquias'], anotacoes: [Feather, 'Memórias'] },
  nova: { principal: [ScanFace, 'Perfil'], atributos: [Cpu, 'Matriz'], habilidades: [Zap, 'Protocolos'], arvore: [Hexagon, 'Rede'], equipamentos: [Package, 'Módulos'], anotacoes: [BookText, 'Registro'] },
  marcas: { principal: [PawPrint, 'Portador'], atributos: [Dice5, 'Atributos'], habilidades: [Wand2, 'Poderes'], arvore: [Footprints, 'Rastro'], equipamentos: [Backpack, 'Itens'], anotacoes: [ScrollText, 'Notas'] },
  'two-piece': { principal: [Anchor, 'Tripulante'], atributos: [Swords, 'Atributos'], habilidades: [Apple, 'Poderes'], arvore: [Compass, 'Rota'], equipamentos: [Coins, 'Baú'], anotacoes: [MapaIcone, 'Diário'] },
  livre: { principal: [User, 'Principal'], atributos: [Dice5, 'Atributos'], habilidades: [Crown, 'Poderes'], arvore: [GitBranch, 'Árvore'], equipamentos: [Backpack, 'Itens'], anotacoes: [ScrollText, 'Notas'] },
}

/** Ícone e nome curto de uma aba da ficha neste sistema. */
export function itemDoMenu(identidade: string, secao: string): Item {
  return MENUS[identidade]?.[secao] ?? EXTRAS[secao] ?? PADRAO[secao] ?? [BookOpen, secao]
}
export const SISTEMAS_COM_MENU = Object.keys(MENUS)
