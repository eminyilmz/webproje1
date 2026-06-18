"use client";
import { motion } from "framer-motion";
import { ArrowRight, Layers } from "lucide-react";

export default function Hero() {
  const scrollToEditor = () => {
    document.getElementById("editor-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="home" className="relative pt-44 pb-32 overflow-hidden bg-[#060608]">
      {/* Floating Cinematic Moody Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-stone-900/30 blur-[150px] animate-float-cinematic-1" />
        <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-zinc-950/50 blur-[180px] animate-float-cinematic-2" />
        <div className="absolute top-[40%] right-[30%] w-[350px] h-[350px] rounded-full bg-neutral-900/25 blur-[120px] animate-float-cinematic-1" />
      </div>

      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Main Title Left Side (Editorial asymmetric layout) */}
          <div className="lg:col-span-8 space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3 text-stone-500 tracking-[0.4em] uppercase text-[9px] font-medium"
            >
              <Layers className="w-3 h-3 text-stone-500" />
              <span>GAN Görüntü Restorasyonu</span>
            </motion.div>

            <div className="relative">
              {/* Volumetric background glow behind headers */}
              <div className="absolute -top-12 -left-10 w-96 h-44 bg-white/[0.02] rounded-full blur-[100px] pointer-events-none -z-10" />

              {/* Overlapping text size */}
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-7xl md:text-9xl font-editorial font-light tracking-tight leading-[0.85] text-stone-100 relative z-10 flex items-baseline"
              >
                Piksel
                <motion.span 
                  animate={{ opacity: [0.3, 0.85, 0.3], scale: [0.95, 1.05, 0.95] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block w-2.5 h-2.5 bg-white rounded-full ml-4 shadow-[0_0_8px_#fff,0_0_15px_#fff]"
                />
              </motion.h1>
              
              <motion.h2
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.4, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="text-5xl md:text-7xl font-editorial italic text-stone-500 font-extralight tracking-tight ml-16 md:ml-32 mt-2"
              >
                Restorasyonu
              </motion.h2>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="text-stone-400 font-light text-base md:text-lg leading-relaxed max-w-xl font-sans"
            >
              Siyah beyaz fotoğrafları renklendirin, bulanık kareleri netleştirin ve
              gelişmiş restorasyon modellerimizle görselinizi mükemmelleştirin.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center gap-6 pt-4"
            >
              <button
                onClick={scrollToEditor}
                className="px-8 py-4 bg-stone-100 hover:bg-white text-stone-950 font-medium text-[10px] tracking-[0.2em] uppercase transition-all duration-300 flex items-center gap-3 rounded-none shadow-2xl cursor-pointer"
              >
                Hemen Başla
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#about"
                className="px-8 py-4 bg-transparent border border-white/10 hover:border-white/20 text-stone-300 hover:text-white font-medium text-[10px] tracking-[0.2em] uppercase transition-all duration-300 rounded-none"
              >
                Keşfet
              </a>
            </motion.div>
          </div>

          {/* Side Info Box Right Side (Breaking the standard grid) */}
          <div className="lg:col-span-4 lg:mt-24 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="border-l border-white/5 relative pl-8 space-y-12"
            >
              {/* Glowing vertical line accent */}
              <div className="absolute left-0 top-0 w-[1px] h-20 bg-gradient-to-b from-white/40 to-transparent" />
              {[
                { label: "01 / HIZ", title: "Hızlı İşlem", desc: "Restorasyon modellerimiz saniyeler içinde sonuç üretir." },
                { label: "02 / GÜVENLİK", title: "Güvenli Saklama", desc: "Görselleriniz işlendikten sonra otomatik olarak silinir." },
                { label: "03 / NETLİK", title: "Yüksek Çözünürlük", desc: "Super-Resolution modelleriyle kristal netliğinde çıktılar." },
              ].map((item, idx) => (
                <div key={idx} className="space-y-2 group">
                  <div className="text-[9px] font-sans tracking-[0.3em] text-stone-500 uppercase">{item.label}</div>
                  <h3 className="font-editorial text-xl font-light text-stone-200 group-hover:text-white transition-colors">{item.title}</h3>
                  <p className="text-stone-400 font-light text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
