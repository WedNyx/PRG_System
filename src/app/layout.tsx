import type { Metadata } from "next";
import { Toaster } from "sonner";
import RelatorErros from "@/components/RelatorErros";
import { PedirSenhaGlobal } from "@/components/perfil/Senha";
import "./globals.css";
import { SCRIPT_TEMA } from '@/lib/tema'
import { SCRIPT_VISUAL } from '@/lib/visual'

// Fontes definidas no CSS para não depender do download de fontes na compilação.
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
      className="h-full antialiased"
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
