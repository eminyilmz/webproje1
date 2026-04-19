import Hero from "@/components/Hero";
import ImageEditor from "@/components/ImageEditor";

export default function Home() {
  return (
    <main className="pb-32">
      <Hero />
      <div id="editor-section" className="scroll-mt-32">
        <ImageEditor />
      </div>
      
      {/* Footer or extra sections can go here */}
      <footer className="mt-20 py-10 border-t border-white/5 text-center text-gray-500 text-sm">
        <p>© 2026 Lumina AI. Tüm hakları saklıdır.</p>
      </footer>
    </main>
  );
}
