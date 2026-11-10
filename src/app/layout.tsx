import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Aplica o tema salvo antes de desenhar a página (evita piscar). */}
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('prg-tema');if(t==='classico')document.documentElement.dataset.tema=t}catch(e){}" }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster theme="dark" richColors position="top-center" offset={72} mobileOffset={{ top: 70 }} />
      </body>
    </html>
  );
}
