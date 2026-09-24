import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sentinela",
  description:
    "Relato e triagem de focos de arboviroses, agregados em áreas de risco para a vigilância municipal.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
