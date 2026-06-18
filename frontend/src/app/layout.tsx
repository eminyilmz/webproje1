import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import MouseGlow from "@/components/MouseGlow";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"]
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: "Piksel - GAN Tabanlı Görüntü Restorasyonu",
  description: "GAN (Çekişmeli Üretici Ağlar) modelleri ile fotoğraflarınızı renklendirin, parazitlerden arındırın ve çözünürlüğünü artırın.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="bg-[#060608] bg-pixel-squares text-stone-200 min-h-screen selection:bg-stone-800 selection:text-white antialiased">
        <MouseGlow />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
