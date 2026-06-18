"use client";
import Hero from "@/components/Hero";
import ImageEditor from "@/components/ImageEditor";
import DemoSlider from "@/components/DemoSlider";
import { Cpu, Eye, ImagePlus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const scrollReveal = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
  };

  return (
    <main className="pb-20 text-stone-200 bg-[#060608]">
      <Hero />
      
      {/* Editor Section */}
      <div id="editor-section" className="scroll-mt-32 max-w-7xl mx-auto px-8 mb-44">
        <motion.div {...scrollReveal}>
          <ImageEditor />
        </motion.div>
      </div>

      {/* Features Section - Asymmetric layout */}
      <section id="features" className="scroll-mt-32 max-w-7xl mx-auto px-8 mb-44 relative">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 bg-zinc-900/10 blur-[130px] rounded-full pointer-events-none -z-10" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-20">
          <motion.div {...scrollReveal} className="lg:col-span-5 space-y-4">
            <span className="text-[9px] tracking-[0.3em] uppercase text-stone-500 font-medium">Süreç</span>
            <h2 className="text-4xl md:text-5xl font-editorial font-light tracking-tight text-stone-100">
              Nasıl Çalışır?
            </h2>
          </motion.div>
          <motion.div 
            {...scrollReveal} 
            transition={{ ...scrollReveal.transition, delay: 0.15 }}
            className="lg:col-span-7 lg:pt-6"
          >
            <p className="text-stone-400 font-light text-base leading-relaxed">
              Gelişmiş derin öğrenme modellerimiz, saniyeler içinde fotoğraflarınızı analiz eder ve en iyi sonucu üretir.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div 
            {...scrollReveal}
            whileHover={{ y: -4 }}
            className="glass-card p-10 border border-white/5 hover:bg-stone-900/40 relative"
          >
            <div className="absolute top-0 right-0 p-4 text-[10px] tracking-widest text-stone-600 font-mono">01</div>
            <h3 className="font-editorial text-2xl font-light mb-4 text-stone-200">1. Fotoğrafınızı Yükleyin</h3>
            <p className="text-stone-400 font-light text-sm leading-relaxed">
              İster siyah beyaz tarihi bir fotoğraf, ister bulanık veya gürültülü çıkmış bir anı olsun. Sistemi yormadan saniyeler içinde yüklenir.
            </p>
          </motion.div>
          
          <motion.div 
            {...scrollReveal}
            transition={{ ...scrollReveal.transition, delay: 0.15 }}
            whileHover={{ y: -4 }}
            className="glass-card p-10 border border-white/5 hover:bg-stone-900/40 relative md:translate-y-8"
          >
            <div className="absolute top-0 right-0 p-4 text-[10px] tracking-widest text-stone-600 font-mono">02</div>
            <h3 className="font-editorial text-2xl font-light mb-4 text-stone-200">2. GAN Modelini Seçin</h3>
            <p className="text-stone-400 font-light text-sm leading-relaxed">
              Tek bir tıklamayla renkleri geri getirin, parazitleri temizleyin veya çözünürlüğü 4 katına kadar artırın.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Proje Hakkında (GAN Details) Section */}
      <section id="about" className="scroll-mt-32 max-w-7xl mx-auto px-8 mb-44 relative">
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-stone-900/10 blur-[150px] rounded-full pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-20">
          <motion.div {...scrollReveal} className="lg:col-span-5 space-y-4">
            <span className="text-[9px] tracking-[0.3em] uppercase text-stone-500 font-medium">Modeller</span>
            <h2 className="text-4xl md:text-5xl font-editorial font-light tracking-tight text-stone-100">
              Proje Hakkında
            </h2>
          </motion.div>
          <motion.div 
            {...scrollReveal} 
            transition={{ ...scrollReveal.transition, delay: 0.15 }}
            className="lg:col-span-7 lg:pt-6"
          >
            <p className="text-stone-400 font-light text-base leading-relaxed">
              Bu çalışma, Generative Adversarial Networks (GAN) mimarilerini kullanan iki temel görüntü restorasyon modelini içermektedir.
            </p>
          </motion.div>
        </div>

        {/* GAN Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
          {/* Colorization Card */}
          <motion.div 
            {...scrollReveal}
            className="glass-card group p-10 border border-white/5 relative overflow-hidden flex flex-col justify-between"
          >
            {/* Glowing corner aura */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/[0.02] rounded-full blur-[60px] pointer-events-none group-hover:bg-white/[0.08] transition-all duration-700" />

            <div>
              <div className="w-10 h-10 bg-zinc-900 border border-white/10 flex items-center justify-center mb-8 relative">
                <span className="text-stone-300 font-light text-xs font-mono">01</span>
              </div>
              <h3 className="font-editorial text-2xl font-light mb-4 text-stone-200">Image Colorization GAN</h3>
              <p className="text-stone-400 font-light text-sm leading-relaxed mb-6">
                Siyah beyaz tarihi fotoğraflara gerçekçi renk tonları kazandırmak için eğitilmiş bir derin öğrenme modelidir. 
                Sistemimiz, görüntülerin anlamsal içeriğini analiz ederek gökyüzü, ten renkleri, bitki örtüsü ve nesneleri ayırt eder, 
                ardından gerçeğe en yakın renk dağılımlarını üretir.
              </p>

              {/* Draggable Demo comparison */}
              <div className="mb-6 border border-white/10 overflow-hidden relative shadow-2xl">
                <DemoSlider 
                  beforeImg="/demo_mountain_before.png" 
                  afterImg="/demo_mountain_after.jpg" 
                  beforeLabel="Siyah Beyaz" 
                  afterLabel="Renklendirilmiş (GAN)" 
                />
              </div>
            </div>
            <div className="border-t border-white/5 pt-6 flex justify-between text-[9px] tracking-[0.2em] uppercase text-stone-500 font-medium">
              <span>Pix2Pix / CycleGAN</span>
              <span>Görüntü Renklendirme</span>
            </div>
          </motion.div>

          {/* Denoising & Super-Resolution Card */}
          <motion.div 
            {...scrollReveal}
            transition={{ ...scrollReveal.transition, delay: 0.15 }}
            className="glass-card group p-10 border border-white/5 relative overflow-hidden flex flex-col justify-between md:translate-y-8"
          >
            {/* Glowing corner aura */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/[0.02] rounded-full blur-[60px] pointer-events-none group-hover:bg-white/[0.08] transition-all duration-700" />

            <div>
              <div className="w-10 h-10 bg-zinc-900 border border-white/10 flex items-center justify-center mb-8 relative">
                <span className="text-stone-300 font-light text-xs font-mono">02</span>
              </div>
              <h3 className="font-editorial text-2xl font-light mb-4 text-stone-200">GAN-based Denoising / Super-Resolution</h3>
              <p className="text-stone-400 font-light text-sm leading-relaxed mb-6">
                Düşük çözünürlüklü veya dijital sensör gürültüsü (noise) barındıran pikselli görselleri iyileştirmek için geliştirilmiştir. 
                Geleneksel yumuşatma veya enterpolasyon filtrelerinin aksine, yüksek frekanslı kenar detaylarını ve dokuları sıfırdan inşa ederek 
                görseli 4 katına kadar ölçeklendirir.
              </p>

              {/* Draggable Demo comparison */}
              <div className="mb-6 border border-white/10 overflow-hidden relative shadow-2xl">
                <DemoSlider 
                  beforeImg="/demo_man_before.png" 
                  afterImg="/demo_man_after.png" 
                  beforeLabel="Bulanık / Orijinal" 
                  afterLabel="Netleştirilmiş (GAN)" 
                />
              </div>
            </div>
            <div className="border-t border-white/5 pt-6 flex justify-between text-[9px] tracking-[0.2em] uppercase text-stone-500 font-medium">
              <span>SRGAN / Real-ESRGAN</span>
              <span>Süper Çözünürlük</span>
            </div>
          </motion.div>
        </div>

        {/* Technical details explaining GAN */}
        <motion.div 
          {...scrollReveal}
          className="glass-card p-10 md:p-14 border border-white/5 bg-gradient-to-br from-stone-900/10 to-stone-950/20 relative overflow-hidden mt-16 md:mt-24"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-zinc-950/40 blur-[100px] rounded-full pointer-events-none -z-10" />

          <h3 className="font-editorial text-3xl font-light mb-6 text-stone-100">Çekişmeli Üretici Ağlar (GAN) Nedir?</h3>
          <p className="text-stone-400 font-light text-sm md:text-base leading-relaxed mb-8 max-w-3xl">
            GAN'lar (Generative Adversarial Networks), iki ayrı yapay sinir ağının birbiriyle rekabet halinde eğitildiği yenilikçi bir derin öğrenme mimarisidir:
          </p>

          {/* Visual GAN Architecture Flow Diagram */}
          <div className="relative mt-8 mb-12 p-8 rounded-none border border-white/5 bg-zinc-950/30 overflow-x-auto">
            <div className="min-w-[800px] flex items-center justify-between gap-6 py-6 px-4">
              
              {/* Node 1: Input */}
              <div className="flex flex-col items-center w-40 text-center">
                <div className="w-12 h-12 bg-zinc-900 border border-white/10 flex items-center justify-center mb-4 shadow-2xl text-stone-400">
                  <ImagePlus className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-wider font-light text-stone-300 uppercase">Düşük Kalite</span>
                <span className="text-[9px] text-stone-500 mt-1 font-mono">Siyah Beyaz / Parazitli</span>
              </div>

              {/* Arrow 1 */}
              <div className="flex-1 flex flex-col items-center">
                <div className="h-[1px] bg-white/10 w-full relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 border-y-[3px] border-y-transparent border-l-[4px] border-l-white/20" />
                </div>
                <span className="text-[8px] tracking-[0.2em] text-stone-600 mt-2 uppercase">Eğitim</span>
              </div>

              {/* Node 2: Generator */}
              <div className="flex flex-col items-center w-48 text-center bg-stone-900/60 border border-white/10 p-5 rounded-none relative">
                <div className="absolute -top-3 px-3 py-0.5 bg-stone-100 text-stone-950 text-[8px] tracking-[0.2em] font-medium uppercase">GENERATOR</div>
                <div className="w-10 h-10 bg-zinc-950 border border-white/5 flex items-center justify-center mb-3 text-stone-300">
                  <Cpu className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-wider font-light text-stone-200 uppercase">Üretici Ağ (G)</span>
                <span className="text-[9px] text-stone-500 mt-2 leading-relaxed">Görseli sıfırdan inşa eder.</span>
              </div>

              {/* Arrow 2 */}
              <div className="flex-1 flex flex-col items-center">
                <div className="h-[1px] bg-white/10 w-full relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 border-y-[3px] border-y-transparent border-l-[4px] border-l-white/20" />
                </div>
                <span className="text-[8px] tracking-[0.2em] text-stone-600 mt-2 uppercase">Çıktı</span>
              </div>

              {/* Node 3: Generated Fake vs Real Reference */}
              <div className="flex flex-col gap-3 w-44">
                {/* Fake */}
                <div className="flex flex-col items-center text-center p-3 border border-white/5 bg-stone-950/40">
                  <span className="text-[9px] tracking-wider text-stone-400 uppercase">Yapay Çıktı</span>
                </div>
                {/* Real */}
                <div className="flex flex-col items-center text-center p-3 border border-white/10 bg-zinc-900/30">
                  <span className="text-[9px] tracking-wider text-stone-300 uppercase">Gerçek Referans</span>
                </div>
              </div>

              {/* Arrow 3 */}
              <div className="flex-1 flex flex-col items-center">
                <div className="h-[1px] bg-white/10 w-full relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 border-y-[3px] border-y-transparent border-l-[4px] border-l-white/20" />
                </div>
                <span className="text-[8px] tracking-[0.2em] text-stone-600 mt-2 uppercase">Gözlem</span>
              </div>

              {/* Node 4: Discriminator */}
              <div className="flex flex-col items-center w-48 text-center bg-stone-900/60 border border-white/10 p-5 rounded-none relative">
                <div className="absolute -top-3 px-3 py-0.5 bg-stone-800 text-stone-200 border border-white/10 text-[8px] tracking-[0.2em] font-medium uppercase">DISCRIMINATOR</div>
                <div className="w-10 h-10 bg-zinc-950 border border-white/5 flex items-center justify-center mb-3 text-stone-300">
                  <Eye className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-wider font-light text-stone-200 uppercase">Ayırt Edici (D)</span>
                <span className="text-[9px] text-stone-500 mt-2 leading-relaxed">Gerçeklik analizi yapar.</span>
              </div>

              {/* Arrow 4 */}
              <div className="flex-1 flex flex-col items-center">
                <div className="h-[1px] bg-white/10 w-full relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 border-y-[3px] border-y-transparent border-l-[4px] border-l-white/20" />
                </div>
                <span className="text-[8px] tracking-[0.2em] text-stone-600 mt-2 uppercase">Karar</span>
              </div>

              {/* Node 5: Decision Output */}
              <div className="flex flex-col items-center w-40 text-center">
                <div className="w-12 h-12 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center mb-4 text-stone-300 shadow-2xl">
                  <Sparkles className="w-5 h-5 text-stone-300" />
                </div>
                <span className="text-[10px] tracking-wider font-light text-stone-200 uppercase">Tamamlandı</span>
                <span className="text-[9px] text-stone-500 mt-1 font-mono">Net Çıktı</span>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 text-left">
            <div className="p-6 border border-white/5 bg-stone-900/10">
              <h4 className="font-editorial text-lg font-light text-stone-200 mb-2">Üretici Ağ (Generator)</h4>
              <p className="text-stone-400 font-light text-xs leading-relaxed">
                Girdi olarak verilen verileri (örneğin siyah beyaz veya gürültülü fotoğrafları) alır ve gerçeğe en yakın restored versiyonlarını üretmeye çalışır.
              </p>
            </div>
            <div className="p-6 border border-white/5 bg-stone-900/10">
              <h4 className="font-editorial text-lg font-light text-stone-200 mb-2">Ayırt Edici Ağ (Discriminator)</h4>
              <p className="text-stone-400 font-light text-xs leading-relaxed">
                Önüne gelen fotoğrafların gerçek (orijinal yüksek kaliteli veri) mi yoksa üretici ağ tarafından mı oluşturulduğunu ayırt etmeye çalışır.
              </p>
            </div>
          </div>
          <p className="text-stone-500 font-light text-xs leading-relaxed">
            Bu iki ağın sürekli birbiriyle yarışması (Minimax oyunu), üretici ağın zamanla insan gözünün ayırt edemeyeceği kadar gerçekçi ve yüksek çözünürlüklü restorasyonlar yapabilmesini sağlar.
          </p>
        </motion.div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center text-stone-600 text-xs tracking-widest uppercase">
        <p>© 2026 Piksel. Tüm hakları saklıdır.</p>
      </footer>
    </main>
  );
}
