import type { Metadata } from "next";
import { Source_Serif_4, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  weight: ["400", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "RD Notícias | Porto Seguro & Costa do Descobrimento",
    template: "%s | RD Notícias",
  },
  description: "Notícias de Porto Seguro, Eunápolis, Santa Cruz Cabrália e região. A verdade onde acontece.",
  openGraph: {
    siteName: "RD Notícias",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${sourceSerif.variable} ${inter.variable} font-sans`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
