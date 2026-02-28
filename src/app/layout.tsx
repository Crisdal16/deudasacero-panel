import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Deudas a Cero - Área de Cliente",
  description: "Panel de gestión de expedientes para la Ley de Segunda Oportunidad. Consulta el estado de tu expediente, documentos y mensajes con tu despacho.",
  keywords: ["Ley de Segunda Oportunidad", "LSO", "exoneración de deudas", "deudas", "insolvencia", " España"],
  authors: [{ name: "Deudas a Cero" }],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔷</text></svg>",
  },
  openGraph: {
    title: "Deudas a Cero - Área de Cliente",
    description: "Gestiona tu expediente de la Ley de Segunda Oportunidad",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
