"use client";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-purple-600/10 blur-[120px] rounded-full -z-10" />
      
      <div className="max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-purple-200">AI Destekli Yeni Nesil Editör</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
        >
          Fotoğraflarınıza <br />
          <span className="text-gradient">Yapay Zeka Dokunuşu</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-gray-400 max-w-2xl mx-auto mb-10"
        >
          Siyah beyaz fotoğrafları renklendirin, bulanık kareleri netleştirin ve 
          profesyonel editör araçlarıyla görselinizi mükemmelleştirin. Saniyeler içinde, tamamen tarayıcı üzerinden.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <button className="px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2 group">
            Hemen Başla
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="px-8 py-4 glass text-white font-semibold rounded-xl hover:bg-white/10 transition-all">
            Nasıl Çalışır?
          </button>
        </motion.div>

        {/* Features list */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left"
        >
          {[
            { icon: <Zap className="w-6 h-6 text-yellow-400" />, title: "Hızlı İşlem", desc: "AI modellerimiz saniyeler içinde sonuç üretir." },
            { icon: <ShieldCheck className="w-6 h-6 text-green-400" />, title: "Güvenli Saklama", desc: "Görselleriniz işlendikten sonra otomatik olarak silinir." },
            { icon: <Sparkles className="w-6 h-6 text-purple-400" />, title: "Yüksek Kalite", desc: "Real-ESRGAN ile kristal netliğinde çıktılar." },
          ].map((feature, i) => (
            <div key={i} className="p-6 glass-card">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
