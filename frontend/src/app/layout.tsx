import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lumina AI - Profesyonel Fotoğraf Editörü",
  description: "Yapay zeka ile fotoğraflarınızı renklendirin, netleştirin ve düzenleyin.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={`${inter.className} premium-gradient min-h-screen`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
