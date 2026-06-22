"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Upload, Download, RotateCcw, Wand2, Sun, Ghost, Zap, Sparkles,
  ArrowLeftRight, ArrowUpDown, RotateCw, SlidersHorizontal, Droplet, ImagePlus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Types ── */
interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
}

const DEFAULT_ADJ: Adjustments = {
  brightness: 1.0,
  contrast: 1.0,
  saturation: 1.0,
  blur: 1,
};

export default function ImageEditor() {
  const [originalImage,  setOriginalImage]  = useState<string | null>(null);
  const [originalFile,   setOriginalFile]   = useState<File | null>(null);
  const [baseImage,      setBaseImage]      = useState<string | null>(null);
  const [previousImage,  setPreviousImage]  = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing,   setIsProcessing]   = useState(false);
  const [activeTab,      setActiveTab]      = useState<"ai" | "classic" | "adjust">("ai");
  const [progress,       setProgress]       = useState(0);
  const [statusMsg,      setStatusMsg]      = useState("İşleniyor…");
  const [flipH,          setFlipH]          = useState(false);
  const [flipV,          setFlipV]          = useState(false);
  const [rotation,       setRotation]       = useState(0);
  const [adjustments,    setAdjustments]    = useState<Adjustments>(DEFAULT_ADJ);

  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, x)));
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleSliderMove(e.clientX);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  /* Helper to convert URL/Base64 to File — handles data: URIs without fetching */
  const getFileFromUrl = async (url: string, filename: string): Promise<File> => {
    if (url.startsWith("data:")) {
      const [header, base64] = url.split(",");
      const mime = header.match(/:(.*?);/)?.[1] || "image/png";
      const bytes = atob(base64);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      return new File([arr], filename, { type: mime });
    }
    const res = await fetch(url);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || "image/png" });
  };

  /* ── Client-side canvas fallback (used when backend is offline) ── */
  const processImageClientSide = (action: string, params: Record<string, number> = {}): Promise<string> =>
    new Promise((resolve, reject) => {
      const src = baseImage || originalImage;
      if (!src) return reject("No source image");
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("No canvas context");
        if (action === "grayscale") {
          ctx.filter = "grayscale(100%)";
        } else if (action === "blur") {
          ctx.filter = `blur(${params.level ?? 3}px)`;
        } else if (action === "adjust") {
          const b = params.brightness ?? 1;
          const c = params.contrast ?? 1;
          const s = params.saturation ?? 1;
          ctx.filter = `brightness(${b}) contrast(${c}) saturate(${s})`;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = src;
    });

  /* ── File loading ── */
  const loadFile = (file: File) => {
    const tempUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = tempUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const normalizedUrl = URL.createObjectURL(blob);
            const normalizedFile = new File([blob], file.name, { type: file.type });
            setOriginalImage(normalizedUrl);
            setOriginalFile(normalizedFile);
            setBaseImage(normalizedUrl);
            setPreviousImage(normalizedUrl);
            setProcessedImage(normalizedUrl);
          }
        }, file.type || "image/png");
      }
      URL.revokeObjectURL(tempUrl);
    };
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
    if (e.target) e.target.value = "";
  };

  /* ── Task polling ── */
  const pollTask = (taskId: string, action: string) => {
    setProgress(40);
    const interval = setInterval(async () => {
      try {
        const res  = await fetch(`${API_URL}/task/${taskId}`);
        const data = await res.json();
        if (data.status === "completed") {
          clearInterval(interval);
          const resultUrl = `data:image/png;base64,${data.result}`;
          setProcessedImage(resultUrl);

          if (action !== "adjust") {
            setBaseImage(resultUrl);
            setAdjustments(DEFAULT_ADJ);
          }

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
  const applyAction = async (action: string, params: Record<string, number> = {}, msg = "İşleniyor…") => {
    if (!originalImage || !baseImage) return;
    setIsProcessing(true);
    setStatusMsg(msg);
    setProgress(10);

    try {
      let sourceUrl = baseImage;

      // Commit current processedImage to baseImage if performing a non-adjust action
      if (action !== "adjust" && processedImage && processedImage !== baseImage) {
        sourceUrl = processedImage;
        setBaseImage(sourceUrl);
      }

      let uploadFile: File;
      if (sourceUrl === originalImage && originalFile) {
        uploadFile = originalFile;
      } else {
        uploadFile = await getFileFromUrl(sourceUrl, "source-image.png");
      }

      try {
        const formData = new FormData();
        formData.append("file", uploadFile);
        const qp = new URLSearchParams({
          action,
          ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
        });
        const res  = await fetch(`${API_URL}/upload?${qp}`, { method: "POST", body: formData });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.task_id) pollTask(data.task_id, action);
      } catch {
        // Backend unreachable — fall back to client-side Canvas processing
        setStatusMsg("Sunucu yok, yerel işlem yapılıyor…");
        setProgress(50);
        const localResult = await processImageClientSide(action, params);
        setProcessedImage(localResult);
        if (action !== "adjust") {
          setBaseImage(localResult);
          setAdjustments(DEFAULT_ADJ);
        }
        setProgress(100);
        setIsProcessing(false);
      }
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  /* ── Adjustment sliders (debounced) ── */
  const handleAdjustChange = (key: keyof Adjustments, value: number) => {
    const next = { ...adjustments, [key]: value };
    setAdjustments(next);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
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
    a.download = "piksel-output.png";
    a.click();
  };

  const handleReset = () => {
    if (!originalImage) return;
    setBaseImage(originalImage);
    setPreviousImage(originalImage);
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
    <div className="max-w-7xl mx-auto py-12">
      {/* Hidden file input for "new image" */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleUpload}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">

        {/* ── Left Sidebar (Editorial controls) ── */}
        <div className="lg:col-span-1 space-y-6">

          {/* Tab Switcher */}
          <div className="glass-card p-1 rounded-none border border-white/5 bg-zinc-950/40 flex">
            {(["ai", "classic", "adjust"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-[10px] tracking-wider uppercase font-light transition-all rounded-none ${
                  activeTab === tab ? "bg-stone-100 text-stone-950 font-medium" : "text-stone-400 hover:text-white"
                }`}
              >
                {tab === "ai" ? "GAN" : tab === "classic" ? "Klasik" : "Ayar"}
              </button>
            ))}
          </div>

          {/* Tool Panel */}
          <div className="glass-card p-6 rounded-none border border-white/5 bg-zinc-950/20 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4 mb-4">
              <Wand2 className="w-3.5 h-3.5 text-stone-400" />
              <h3 className="text-[10px] tracking-[0.2em] font-light uppercase text-stone-300">
                {activeTab === "ai" ? "GAN Modelleri" : activeTab === "classic" ? "Klasik İşlemler" : "Görüntü Ayarları"}
              </h3>
            </div>

            {/* AI Tab */}
            {activeTab === "ai" && (
              <div className="space-y-3">
                <ActionButton 
                  icon={<Sparkles className="w-3.5 h-3.5 text-stone-300" />} 
                  label="GAN Renklendirme" 
                  onClick={() => applyAction("colorize", {}, "Renklendiriliyor… (Model yükleniyor...)")} 
                  disabled={!originalFile || isProcessing} 
                />
                <ActionButton 
                  icon={<Zap className="w-3.5 h-3.5 text-stone-300" />} 
                  label="Süper Çözünürlük (GAN)" 
                  onClick={() => applyAction("sharpen", {}, "Detaylar belirginleştiriliyor…")} 
                  disabled={!originalFile || isProcessing} 
                />
              </div>
            )}

            {/* Classic Tab */}
            {activeTab === "classic" && (
              <div className="space-y-4">
                <ActionButton 
                  icon={<Ghost className="w-3.5 h-3.5 text-stone-300" />} 
                  label="Siyah Beyaz" 
                  onClick={() => applyAction("grayscale", {}, "Siyah beyaza dönüştürülüyor…")} 
                  disabled={!originalFile || isProcessing} 
                />
                
                {/* Flip */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setFlipH((v) => !v)}
                    disabled={!originalFile}
                    className="flex-1 flex items-center justify-center gap-2 py-3 border border-white/5 bg-stone-950/40 text-[10px] tracking-wider uppercase font-light transition-all disabled:opacity-30 text-stone-300 hover:bg-white/5 hover:text-white rounded-none"
                  >
                    <ArrowLeftRight className="w-3 h-3" /> Yatay
                  </button>
                  <button
                    onClick={() => setFlipV((v) => !v)}
                    disabled={!originalFile}
                    className="flex-1 flex items-center justify-center gap-2 py-3 border border-white/5 bg-stone-950/40 text-[10px] tracking-wider uppercase font-light transition-all disabled:opacity-30 text-stone-300 hover:bg-white/5 hover:text-white rounded-none"
                  >
                    <ArrowUpDown className="w-3 h-3" /> Dikey
                  </button>
                </div>

                {/* Rotate */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setRotation((r) => r - 90)}
                    disabled={!originalFile}
                    className="flex-1 flex items-center justify-center gap-2 py-3 border border-white/5 bg-stone-950/40 text-[10px] tracking-wider uppercase font-light transition-all disabled:opacity-30 text-stone-300 hover:bg-white/5 hover:text-white rounded-none"
                  >
                    <RotateCcw className="w-3 h-3" /> Sol
                  </button>
                  <button
                    onClick={() => setRotation((r) => r + 90)}
                    disabled={!originalFile}
                    className="flex-1 flex items-center justify-center gap-2 py-3 border border-white/5 bg-stone-950/40 text-[10px] tracking-wider uppercase font-light transition-all disabled:opacity-30 text-stone-300 hover:bg-white/5 hover:text-white rounded-none"
                  >
                    <RotateCw className="w-3 h-3" /> Sağ
                  </button>
                </div>

                {/* Blur with level */}
                <div className="pt-4 border-t border-white/5 space-y-3">
                  <div className="flex justify-between text-[10px] tracking-wider uppercase font-light text-stone-400">
                    <span className="flex items-center gap-1.5"><Droplet className="w-3 h-3" /> Bulanıklık</span>
                    <span className="font-mono text-stone-300">{adjustments.blur}</span>
                  </div>
                  <input
                    type="range" min={1} max={15} step={1}
                    value={adjustments.blur}
                    onChange={(e) => setAdjustments((a) => ({ ...a, blur: Number(e.target.value) }))}
                    disabled={!originalFile}
                    className="w-full accent-stone-300 h-1 bg-stone-800 rounded-none appearance-none cursor-pointer disabled:opacity-30"
                  />
                  <button
                    onClick={handleBlurApply}
                    disabled={!originalFile || isProcessing}
                    className="w-full py-3 bg-stone-100 hover:bg-white text-stone-950 border border-transparent text-[10px] tracking-[0.2em] font-medium uppercase transition-all disabled:opacity-30 cursor-pointer rounded-none"
                  >
                    Uygula
                  </button>
                </div>
              </div>
            )}

            {/* Adjust Tab */}
            {activeTab === "adjust" && (
              <div className="space-y-6">
                <WorkingSlider
                  label="Parlaklık"
                  icon={<Sun className="w-3 h-3 text-stone-400" />}
                  value={adjustments.brightness}
                  min={0.5} max={2.0} step={0.05}
                  display={(v) => `${Math.round((v - 1) * 100)}%`}
                  disabled={!originalFile}
                  onChange={(v) => handleAdjustChange("brightness", v)}
                />
                <WorkingSlider
                  label="Kontrast"
                  icon={<SlidersHorizontal className="w-3 h-3 text-stone-400" />}
                  value={adjustments.contrast}
                  min={0.5} max={2.0} step={0.05}
                  display={(v) => `${Math.round((v - 1) * 100)}%`}
                  disabled={!originalFile}
                  onChange={(v) => handleAdjustChange("contrast", v)}
                />
                <WorkingSlider
                  label="Doygunluk"
                  icon={<SlidersHorizontal className="w-3 h-3 text-stone-400" />}
                  value={adjustments.saturation}
                  min={0} max={2.0} step={0.05}
                  display={(v) => `${Math.round((v - 1) * 100)}%`}
                  disabled={!originalFile}
                  onChange={(v) => handleAdjustChange("saturation", v)}
                />
                <p className="text-[9px] tracking-wider text-stone-500 text-center uppercase pt-2">Bırakıldığında otomatik işlenir</p>
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
              className="w-full aspect-video border border-dashed border-white/10 hover:border-white/20 bg-zinc-950/20 flex flex-col items-center justify-center group transition-all duration-500 cursor-pointer relative overflow-hidden"
            >
              <input id="file-upload-drop" type="file" className="hidden" accept="image/*" onChange={handleUpload} />

              <div className="w-12 h-12 border border-white/10 bg-zinc-950 flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-500">
                <Upload className="w-5 h-5 text-stone-400 group-hover:text-white transition-colors" />
              </div>
              
              <h3 className="font-editorial text-2xl font-light mb-2 text-stone-100">Fotoğraf Yükleyin</h3>
              <p className="text-stone-500 font-light text-xs">Sürükleyip bırakın veya seçmek için tıklayın</p>
              <p className="text-stone-600 text-[10px] tracking-wider font-mono mt-3 uppercase">PNG, JPG, WEBP · Maks 20 MB</p>
            </div>
          ) : (
            // Editor View
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-4">
                  {/* Reset */}
                  <button
                    onClick={handleReset}
                    title="Sıfırla"
                    className="p-2 border border-white/5 bg-zinc-950/30 hover:bg-white/5 hover:text-white rounded-none transition-colors text-stone-400"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* New image */}
                  <button
                    onClick={handleNewImage}
                    className="flex items-center gap-2 px-4 py-2 border border-white/5 bg-zinc-950/30 hover:bg-white/5 text-[10px] tracking-wider uppercase font-light text-stone-300 hover:text-white rounded-none transition-colors"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    Yeni Resim
                  </button>

                  <span className="text-[9px] tracking-widest uppercase text-stone-500 font-mono">Karşılaştırma Modu</span>
                </div>

                <button
                  onClick={handleDownload}
                  className="px-6 py-2 bg-stone-100 hover:bg-white text-stone-950 text-[10px] tracking-widest font-medium uppercase rounded-none flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> İndir
                </button>
              </div>

              {/* Before / After Slider */}
              <div className="rounded-none bg-zinc-950 border border-white/5 h-[500px] flex items-center justify-center p-4">
                <div 
                  ref={sliderRef}
                  onMouseDown={() => setIsDragging(true)}
                  onMouseMove={handleMouseMove}
                  onTouchMove={handleTouchMove}
                  onClick={(e) => handleSliderMove(e.clientX)}
                  className="relative max-w-full max-h-full flex-shrink-0 cursor-ew-resize select-none overflow-hidden"
                >
                  {/* Processing Overlay */}
                  <AnimatePresence>
                    {isProcessing && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[#060608]/85 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6"
                      >
                        <div className="relative w-48 h-1 bg-stone-800 overflow-hidden mb-4">
                          <motion.div
                            className="absolute h-full bg-stone-100"
                            initial={{ left: "-100%" }}
                            animate={{ left: "100%" }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            style={{ width: "50%" }}
                          />
                        </div>
                        <p className="text-[10px] tracking-widest uppercase text-stone-400 font-mono">{statusMsg}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Original Image (Sets the container bounds) */}
                  <img
                    src={originalImage!}
                    alt="Orijinal"
                    className="block max-w-full max-h-[468px] pointer-events-none"
                    style={{ transform: imageTransform }}
                  />

                  {/* Processed Image (Overlays perfectly over original image bounds) */}
                  <div 
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
                  >
                    <img
                      src={processedImage ?? originalImage!}
                      alt="İşlenmiş"
                      className="absolute top-0 left-0 w-full h-full object-fill pointer-events-none"
                      style={{ transform: imageTransform }}
                    />
                  </div>

                  {/* Divider Line & Handle */}
                  <div 
                    className="absolute top-0 bottom-0 w-[2px] bg-white/30 pointer-events-none"
                    style={{ left: `${sliderPosition}%` }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-zinc-900 border-2 border-white/40 flex items-center justify-center shadow-2xl text-stone-200 backdrop-blur-sm">
                      <ArrowLeftRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Labels */}
              <div className="flex justify-between px-1 text-[9px] tracking-widest text-stone-500 uppercase font-mono">
                <span>◀ Orijinal</span>
                <span>Islenmis ▶</span>
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
      className={`w-full p-4 flex items-center gap-3 border border-white/5 bg-stone-950/40 hover:bg-white/5 rounded-none transition-all text-xs tracking-wider font-light text-stone-300 hover:text-white ${
        disabled ? "opacity-30 cursor-not-allowed" : "hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
      }`}
    >
      {icon} <span className="uppercase">{label}</span>
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
    <div className="space-y-3">
      <div className="flex justify-between items-center text-[10px] tracking-wider uppercase font-light text-stone-400">
        <span className="flex items-center gap-1.5">{icon} {label}</span>
        <span className={`font-mono text-stone-300 ${value !== 1 ? "font-bold" : ""}`}>
          {display(value)}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-stone-300 h-1 bg-stone-800 rounded-none appearance-none cursor-pointer disabled:opacity-30"
      />
    </div>
  );
}
