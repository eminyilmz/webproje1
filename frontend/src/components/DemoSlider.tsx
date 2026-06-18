"use client";
import { useState, useRef, useEffect } from "react";
import { ArrowLeftRight } from "lucide-react";

interface DemoSliderProps {
  beforeImg: string;
  afterImg: string;
  beforeLabel: string;
  afterLabel: string;
}

export default function DemoSlider({ beforeImg, afterImg, beforeLabel, afterLabel }: DemoSliderProps) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, x)));
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseDown={() => setIsDragging(true)}
      onTouchStart={() => setIsDragging(true)}
      className="relative aspect-[4/3] w-full border border-white/5 bg-stone-950/80 overflow-hidden cursor-ew-resize select-none group"
    >
      {/* Before Image (Left / Background) */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src={beforeImg}
          alt="Önceki"
          className="w-full h-full object-cover pointer-events-none filter brightness-95"
        />
      </div>

      {/* After Image (Right / Foreground, clipped) */}
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ clipPath: `inset(0 0 0 ${position}%)` }}
      >
        <img
          src={afterImg}
          alt="Sonraki"
          className="w-full h-full object-cover pointer-events-none"
        />
      </div>

      {/* Slider Line & Glowing Handle */}
      <div 
        className="absolute top-0 bottom-0 w-[1px] bg-white/20 pointer-events-none group-hover:bg-white/40 transition-colors"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-stone-900 border border-white/20 flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
          <ArrowLeftRight className="w-3.5 h-3.5 text-stone-300" />
        </div>
      </div>

      {/* Floating labels */}
      <div className="absolute top-4 left-4 bg-stone-950/80 px-2 py-0.5 border border-white/5 text-[8px] tracking-[0.2em] text-stone-400 uppercase font-mono">
        {beforeLabel}
      </div>
      <div className="absolute top-4 right-4 bg-stone-950/80 px-2 py-0.5 border border-white/5 text-[8px] tracking-[0.2em] text-stone-200 uppercase font-mono">
        {afterLabel}
      </div>
    </div>
  );
}
