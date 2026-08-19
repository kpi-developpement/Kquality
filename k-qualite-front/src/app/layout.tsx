import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/ui/Sidebar/Sidebar"; // 🚀 Bdlnaha l Sidebar
import { AuthProvider } from "@/context/AuthContext";

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
        <AuthProvider>
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}