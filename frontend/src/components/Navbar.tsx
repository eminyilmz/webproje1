"use client";
import { Layers } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 px-8 py-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between glass px-8 py-4 rounded-none border border-white/5 shadow-2xl">
        <a href="#home" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-zinc-900 border border-white/10 rounded-none flex items-center justify-center transition-transform group-hover:rotate-45">
            <Layers className="w-4 h-4 text-stone-200" />
          </div>
          <span className="text-sm tracking-[0.25em] font-light text-stone-100 uppercase transition-all duration-300">Piksel</span>
        </a>
        
        <div className="hidden md:flex items-center gap-8">
          <a href="#home" className="text-[10px] tracking-[0.25em] uppercase font-light text-stone-400 hover:text-white transition-colors">Ana Sayfa</a>
          <a href="#features" className="text-[10px] tracking-[0.25em] uppercase font-light text-stone-400 hover:text-white transition-colors">Nasıl Çalışır?</a>
          <a href="#about" className="text-[10px] tracking-[0.25em] uppercase font-light text-stone-400 hover:text-white transition-colors">Proje Hakkında</a>
        </div>
      </div>
    </nav>
  );
}

