"use client";
import { Sparkles } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between glass px-6 py-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Lumina AI</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Ana Sayfa</a>
          <a href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Özellikler</a>
          <a href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Fiyatlandırma</a>
        </div>

        <div>
          <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold rounded-xl transition-all border border-white/10">
            Giriş Yap
          </button>
        </div>
      </div>
    </nav>
  );
}
