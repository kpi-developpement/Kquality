import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/ui/Navbar/Navbar";

export const metadata: Metadata = {
  title: "K-Qualité | Portail Partenaires",
  description: "Portail de transparence qualité et pénalités",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <Navbar />
        {/* Hna fin kayt-injectaw les pages (Dashboard, Erreurs, etc.) */}
        <main className="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}