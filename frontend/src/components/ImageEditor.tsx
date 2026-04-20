"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import {
  Upload, Download, RotateCcw, Wand2, Sun, Ghost, Zap, Sparkles,
  ArrowLeftRight, ArrowUpDown, RotateCw, SlidersHorizontal, Droplet, ImagePlus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Types ── */
interface Adjustments {
  brightness: number; // 0.5 – 2.0  (1 = no change)
  contrast:   number; // 0.5 – 2.0
  saturation: number; // 0   – 2.0
  blur:       number; // 0   – 15   (0 = no blur)
}

const DEFAULT_ADJ: Adjustments = { brightness: 1, contrast: 1, saturation: 1, blur: 0 };

export default function ImageEditor() {
  const [originalImage,  setOriginalImage]  = useState<string | null>(null);
  const [originalFile,   setOriginalFile]   = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing,   setIsProcessing]   = useState(false);
  const [activeTab,      setActiveTab]      = useState<"ai" | "classic" | "adjust">("ai");
  const [progress,       setProgress]       = useState(0);
  const [statusMsg,      setStatusMsg]      = useState("İşleniyor…");
  const [flipH,          setFlipH]          = useState(false);
  const [flipV,          setFlipV]          = useState(false);
  const [rotation,       setRotation]       = useState(0);
  const [adjustments,    setAdjustments]    = useState<Adjustments>(DEFAULT_ADJ);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  /* ── File loading ── */
  const loadFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setOriginalImage(url);
    setOriginalFile(file);
    setProcessedImage(url);
    setFlipH(false);
    setFlipV(false);
    setRotation(0);
    setAdjustments(DEFAULT_ADJ);
    setProgress(0);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) loadFile(file);
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    // Reset input so same file can be re-selected
    if (e.target) e.target.value = "";
  };

  /* ── Task polling ── */
  const pollTask = (taskId: string) => {
    setProgress(40);
    const interval = setInterval(async () => {
      try {
        const res  = await fetch(`${API_URL}/task/${taskId}`);
        const data = await res.json();
        if (data.status === "completed") {
          clearInterval(interval);
          setProcessedImage(`data:image/png;base64,${data.result}`);
          setIsProcessing(false);
          setProgress(100);
        } else if (data.status === "failed") {
          clearInterval(interval);
          setIsProcessing(false);
          setProgress(0);
        }
      } catch {
        clearInterval(interval);
        setIsProcessing(false);
      }
    }, 1000);
  };

  /* ── Generic action dispatcher ── */
  const applyAction = async (action: string, params: Record<string, number> = {}, msg = "AI İşliyor…") => {
    if (!originalFile) return;
    setIsProcessing(true);
    setStatusMsg(msg);
    setProgress(10);
    try {
      const formData = new FormData();
      formData.append("file", originalFile);

      const qp = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) });
      const res  = await fetch(`${API_URL}/upload?${qp}`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.task_id) pollTask(data.task_id);
    } catch {
      setIsProcessing(false);
    }
  };

  /* ── Adjustment sliders (debounced) ── */
  const handleAdjustChange = (key: keyof Adjustments, value: number) => {
    const next = { ...adjustments, [key]: value };
    setAdjustments(next);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      // Only call API for brightness/contrast/saturation
      if (key !== "blur") {
        applyAction("adjust", {
          brightness: next.brightness,
          contrast:   next.contrast,
          saturation: next.saturation,
        }, "Ayarlar uygulanıyor…");
      }
    }, 600);
  };

  const handleBlurApply = () => {
    applyAction("blur", { level: adjustments.blur }, "Bulanıklaştırılıyor…");
  };

  /* ── Client-side transforms ── */
  const imageTransform = [
    flipH ? "scaleX(-1)" : "",
    flipV ? "scaleY(-1)" : "",
    rotation ? `rotate(${rotation}deg)` : "",
  ].filter(Boolean).join(" ") || "none";

  /* ── Controls ── */
  const handleDownload = () => {
    if (!processedImage) return;
    const a = document.createElement("a");
    a.href = processedImage;
    a.download = "lumina-output.png";
    a.click();
  };

  const handleReset = () => {
    if (!originalImage) return;
    setProcessedImage(originalImage);
    setFlipH(false);
    setFlipV(false);
    setRotation(0);
    setAdjustments(DEFAULT_ADJ);
    setProgress(0);
  };

  const handleNewImage = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Hidden file input for "new image" */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleUpload}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* ── Left Sidebar ── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Tab Switcher */}
          <div className="glass-card p-2 flex gap-1">
            {(["ai", "classic", "adjust"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === tab ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {tab === "ai" ? "AI Magic" : tab === "classic" ? "Klasik" : "Ayarlar"}
              </button>
            ))}
          </div>

          {/* Tool Panel */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-4">
              <Wand2 className="w-4 h-4 text-purple-400" />
              {activeTab === "ai" ? "AI Araçları" : activeTab === "classic" ? "Klasik İşlemler" : "Görüntü Ayarları"}
            </h3>

            {/* AI Tab */}
            {activeTab === "ai" && (
              <>
                <ActionButton icon={<Sparkles className="w-4 h-4 text-purple-400" />} label="Renklendir" onClick={() => applyAction("colorize", {}, "Renklendiriliyor… (ilk işlemde ~2dk)")} disabled={!originalFile || isProcessing} />
                <ActionButton icon={<Zap className="w-4 h-4 text-yellow-400" />} label="Netleştir (AI)" onClick={() => applyAction("sharpen", {}, "Netleştiriliyor…")} disabled={!originalFile || isProcessing} />
              </>
            )}

            {/* Classic Tab */}
            {activeTab === "classic" && (
              <>
                <ActionButton icon={<Ghost className="w-4 h-4 text-blue-400" />} label="Siyah Beyaz" onClick={() => applyAction("grayscale", {}, "Siyah beyaza dönüştürülüyor…")} disabled={!originalFile || isProcessing} />
                
                {/* Flip */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setFlipH((v) => !v)}
                    disabled={!originalFile}
                    className="flex-1 flex items-center justify-center gap-2 p-3 glass hover:bg-white/10 rounded-xl text-xs font-medium transition-all disabled:opacity-40"
                  >
                    <ArrowLeftRight className="w-4 h-4" /> Yatay Çevir
                  </button>
                  <button
                    onClick={() => setFlipV((v) => !v)}
                    disabled={!originalFile}
                    className="flex-1 flex items-center justify-center gap-2 p-3 glass hover:bg-white/10 rounded-xl text-xs font-medium transition-all disabled:opacity-40"
                  >
                    <ArrowUpDown className="w-4 h-4" /> Dikey Çevir
                  </button>
                </div>

                {/* Rotate */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setRotation((r) => r - 90)}
                    disabled={!originalFile}
                    className="flex-1 flex items-center justify-center gap-2 p-3 glass hover:bg-white/10 rounded-xl text-xs font-medium transition-all disabled:opacity-40"
                  >
                    <RotateCcw className="w-4 h-4" /> Sol Döndür
                  </button>
                  <button
                    onClick={() => setRotation((r) => r + 90)}
                    disabled={!originalFile}
                    className="flex-1 flex items-center justify-center gap-2 p-3 glass hover:bg-white/10 rounded-xl text-xs font-medium transition-all disabled:opacity-40"
                  >
                    <RotateCw className="w-4 h-4" /> Sağ Döndür
                  </button>
                </div>

                {/* Blur with level */}
                <div className="pt-2 space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-400 flex items-center gap-1"><Droplet className="w-3 h-3" /> Bulanıklık</span>
                    <span className="text-purple-400">{adjustments.blur}</span>
                  </div>
                  <input
                    type="range" min={1} max={15} step={1}
                    value={adjustments.blur}
                    onChange={(e) => setAdjustments((a) => ({ ...a, blur: Number(e.target.value) }))}
                    disabled={!originalFile}
                    className="w-full accent-purple-600 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer disabled:opacity-40"
                  />
                  <button
                    onClick={handleBlurApply}
                    disabled={!originalFile || isProcessing}
                    className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 rounded-lg text-xs font-semibold text-purple-300 transition-all disabled:opacity-40"
                  >
                    Uygula
                  </button>
                </div>
              </>
            )}

            {/* Adjust Tab */}
            {activeTab === "adjust" && (
              <div className="space-y-5">
                <WorkingSlider
                  label="Parlaklık"
                  icon={<Sun className="w-3 h-3" />}
                  value={adjustments.brightness}
                  min={0.5} max={2.0} step={0.05}
                  display={(v) => `${Math.round((v - 1) * 100)}%`}
                  disabled={!originalFile}
                  onChange={(v) => handleAdjustChange("brightness", v)}
                />
                <WorkingSlider
                  label="Kontrast"
                  icon={<SlidersHorizontal className="w-3 h-3" />}
                  value={adjustments.contrast}
                  min={0.5} max={2.0} step={0.05}
                  display={(v) => `${Math.round((v - 1) * 100)}%`}
                  disabled={!originalFile}
                  onChange={(v) => handleAdjustChange("contrast", v)}
                />
                <WorkingSlider
                  label="Doygunluk"
                  icon={<SlidersHorizontal className="w-3 h-3" />}
                  value={adjustments.saturation}
                  min={0} max={2.0} step={0.05}
                  display={(v) => `${Math.round((v - 1) * 100)}%`}
                  disabled={!originalFile}
                  onChange={(v) => handleAdjustChange("saturation", v)}
                />
                <p className="text-xs text-gray-500 text-center pt-1">Slider bırakıldığında otomatik uygulanır</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Main Editor Area ── */}
        <div className="lg:col-span-3">
          {!originalImage ? (
            // Drop Zone
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => document.getElementById("file-upload-drop")?.click()}
              className="w-full aspect-video glass-card border-dashed border-2 border-white/10 flex flex-col items-center justify-center group hover:border-purple-500/50 transition-colors cursor-pointer"
            >
              <input id="file-upload-drop" type="file" className="hidden" accept="image/*" onChange={handleUpload} />
              <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-medium mb-2">Fotoğraf Yükleyin</h3>
              <p className="text-gray-400 text-sm">Sürükleyip bırakın veya seçmek için tıklayın</p>
              <p className="text-gray-600 text-xs mt-2">PNG, JPG, WEBP · Maks 20 MB</p>
            </div>
          ) : (
            // Editor View
            <div className="glass-card p-4 overflow-hidden relative">
              {/* Processing Overlay */}
              <AnimatePresence>
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center rounded-xl"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mb-4"
                    />
                    <h3 className="text-lg font-bold mb-1">{statusMsg}</h3>
                    <p className="text-gray-400 text-xs max-w-xs">İlk AI işleminde model ağırlıkları yüklendiğinden daha uzun sürebilir.</p>
                    <div className="w-full max-w-xs h-1 bg-white/10 rounded-full mt-6 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-purple-500"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  {/* Reset */}
                  <button
                    onClick={handleReset}
                    title="Sıfırla"
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* New image */}
                  <button
                    onClick={handleNewImage}
                    title="Yeni resim yükle"
                    className="flex items-center gap-1.5 px-3 py-1.5 glass hover:bg-white/10 rounded-lg transition-colors text-xs font-medium text-gray-300 hover:text-white"
                  >
                    <ImagePlus className="w-4 h-4" />
                    Yeni Resim
                  </button>

                  <span className="text-xs text-gray-500">Karşılaştırma Modu</span>
                </div>

                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" /> İndir
                </button>
              </div>

              {/* Before / After Slider */}
              <div className="rounded-xl overflow-hidden shadow-2xl bg-black/20">
                <ReactCompareSlider
                  itemOne={
                    <ReactCompareSliderImage
                      src={originalImage}
                      alt="Orijinal"
                      style={{ transform: imageTransform }}
                    />
                  }
                  itemTwo={
                    <ReactCompareSliderImage
                      src={processedImage ?? originalImage}
                      alt="İşlenmiş"
                      style={{ transform: imageTransform }}
                    />
                  }
                  style={{ maxHeight: 580 }}
                />
              </div>

              {/* Labels */}
              <div className="flex justify-between mt-2 px-1">
                <span className="text-xs text-gray-500">◀ Orijinal</span>
                <span className="text-xs text-gray-500">İşlenmiş ▶</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

function ActionButton({ icon, label, onClick, disabled }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-3.5 flex items-center gap-3 glass hover:bg-white/10 rounded-xl transition-all text-sm font-medium ${
        disabled ? "opacity-40 cursor-not-allowed" : "hover:scale-[1.02] active:scale-[0.98]"
      }`}
    >
      {icon} {label}
    </button>
  );
}

interface WorkingSliderProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  display: (v: number) => string;
  disabled?: boolean;
  onChange: (v: number) => void;
}

function WorkingSlider({ label, icon, value, min, max, step, display, disabled, onChange }: WorkingSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs font-medium">
        <span className="text-gray-400 flex items-center gap-1">{icon} {label}</span>
        <span className={`font-mono tabular-nums ${value !== 1 ? "text-purple-400" : "text-gray-500"}`}>
          {display(value)}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-purple-600 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer disabled:opacity-40"
      />
    </div>
  );
}
