"use client";
import React, { useState, useCallback } from "react";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import {
  Upload,
  Download,
  RotateCcw,
  Wand2,
  Sun,
  Ghost,
  Zap,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ImageEditor() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");
  const [progress, setProgress] = useState(0);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const loadFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setOriginalImage(url);
    setOriginalFile(file);
    setProcessedImage(url);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) loadFile(file);
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const pollTask = (taskId: string) => {
    setProgress(40);
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/task/${taskId}`);
        const data = await res.json();
        if (data.status === "completed") {
          clearInterval(interval);
          setProcessedImage(`data:image/png;base64,${data.result}`);
          setIsProcessing(false);
          setProgress(100);
        } else if (data.status === "failed") {
          clearInterval(interval);
          setIsProcessing(false);
        }
      } catch {
        clearInterval(interval);
        setIsProcessing(false);
      }
    }, 1000);
  };

  const applyAction = async (action: string) => {
    if (!originalFile) return;
    setIsProcessing(true);
    setProgress(10);
    try {
      const formData = new FormData();
      formData.append("file", originalFile);
      const res = await fetch(`${API_URL}/upload?action=${action}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.task_id) pollTask(data.task_id);
    } catch {
      setIsProcessing(false);
    }
  };

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
    setProgress(0);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* ── Left Sidebar ── */}
        <div className="lg:col-span-1 space-y-6">
          {/* Tool Tabs */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-400" /> Araçlar
            </h3>

            <div className="flex p-1 bg-white/5 rounded-lg mb-6">
              {["ai", "classic"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === tab
                      ? "bg-purple-600 text-white shadow-lg"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {tab === "ai" ? "AI Magic" : "Classic"}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {activeTab === "ai" ? (
                <>
                  <ActionButton
                    icon={<Sparkles className="w-4 h-4" />}
                    label="Renklendir"
                    onClick={() => applyAction("colorize")}
                    disabled={isProcessing}
                  />
                  <ActionButton
                    icon={<Zap className="w-4 h-4" />}
                    label="Netleştir"
                    onClick={() => applyAction("sharpen")}
                    disabled={isProcessing}
                  />
                </>
              ) : (
                <>
                  <ActionButton
                    icon={<Ghost className="w-4 h-4" />}
                    label="Siyah Beyaz"
                    onClick={() => applyAction("grayscale")}
                    disabled={isProcessing}
                  />
                  <ActionButton
                    icon={<Sun className="w-4 h-4" />}
                    label="Blur Yap"
                    onClick={() => applyAction("blur")}
                    disabled={isProcessing}
                  />
                </>
              )}
            </div>
          </div>

          {/* Adjustment Sliders */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-4 tracking-wider uppercase">
              Ayarlar
            </h3>
            <div className="space-y-6">
              <RangeSlider label="Parlaklık" />
              <RangeSlider label="Kontrast" />
              <RangeSlider label="Doygunluk" />
            </div>
          </div>
        </div>

        {/* ── Main Editor Area ── */}
        <div className="lg:col-span-3">
          {!originalImage ? (
            // Drop Zone
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => document.getElementById("file-upload")?.click()}
              className="w-full aspect-video glass-card border-dashed border-2 border-white/10 flex flex-col items-center justify-center group hover:border-purple-500/50 transition-colors cursor-pointer relative"
            >
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleUpload}
              />
              <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-medium mb-2">Fotoğraf Yükleyin</h3>
              <p className="text-gray-400">
                Sürükleyip bırakın veya seçmek için tıklayın
              </p>
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
                    className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mb-4"
                    />
                    <h3 className="text-xl font-bold mb-2">AI İşliyor...</h3>
                    <p className="text-gray-400 text-sm max-w-xs">
                      Görseliniz işleniyor. Bu işlem 2-10 saniye sürebilir.
                    </p>
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
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleReset}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                    title="Sıfırla"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-500">
                    Önizleme: Karşılaştırma Modu
                  </span>
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
                    <ReactCompareSliderImage src={originalImage} alt="Orijinal" />
                  }
                  itemTwo={
                    <ReactCompareSliderImage
                      src={processedImage ?? originalImage}
                      alt="İşlenmiş"
                    />
                  }
                  style={{ maxHeight: 600 }}
                />
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
      className={`w-full p-4 flex items-center gap-3 glass hover:bg-white/10 rounded-xl transition-all text-sm font-medium ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {icon} {label}
    </button>
  );
}

function RangeSlider({ label }: { label: string }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-gray-400">{label}</span>
        <span className="text-purple-400">0%</span>
      </div>
      <input
        type="range"
        className="w-full accent-purple-600 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}
