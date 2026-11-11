import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import RelatorErros from "@/components/RelatorErros";
import { PedirSenhaGlobal } from "@/components/perfil/Senha";
import "./globals.css";
import { SCRIPT_TEMA } from '@/lib/tema'
import { SCRIPT_VISUAL } from '@/lib/visual'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fontes dos títulos (v0.32.9): fantasia (padrão) e elegante; “simples” usa a Geist.
const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: ["600", "700"] });
const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"], weight: ["600", "700"], preload: false });

export const metadata: Metadata = {
  title: "PRG System",
  description: "Sistema de RPG online para jogar com seus amigos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} ${cormorant.variable} h-full antialiased`}
    >
      <head>
        {/* Aplica o tema salvo antes de desenhar a página (evita piscar). */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA + SCRIPT_VISUAL }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <RelatorErros />
        <PedirSenhaGlobal />
        <Toaster theme="dark" richColors position="top-center" offset={72} mobileOffset={{ top: 70 }} />
      </body>
    </html>
  );
}
