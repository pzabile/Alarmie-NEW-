import React, { useRef, useState } from 'react';
import { VolumeX, Zap } from 'lucide-react';

interface CustomSliderProps {
  value: number; // 0 to 100
  onValueChange: (value: number) => void;
}

export const CustomSlider: React.FC<CustomSliderProps> = ({ value, onValueChange }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const width = rect.width;
    const offsetX = clientX - rect.left;
    
    let newValue = (offsetX / width) * 100;
    newValue = Math.max(1, Math.min(100, newValue)); // Clamp 1-100
    
    onValueChange(Math.round(newValue));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    trackRef.current?.setPointerCapture(e.pointerId);
    handleMove(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    trackRef.current?.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="w-full flex flex-col gap-2 select-none touch-none">
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Signal Power</label>
        <span className="text-xs font-mono text-primary font-bold">{value}%</span>
      </div>

      <div className="flex items-center gap-3">
        <VolumeX size={16} className="text-gray-600" />
        
        <div 
          ref={trackRef}
          className="relative flex-1 h-10 cursor-pointer flex items-center group"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Track Background */}
          <div className="absolute w-full h-1.5 rounded-full bg-surface border border-white/10 overflow-hidden">
             {/* Filled portion */}
             <div 
                className="h-full bg-gradient-to-r from-primary to-secondary shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                style={{ width: `${value}%` }}
             />
          </div>

          {/* Thumb */}
          <div 
            className={`
                absolute h-6 w-6 rounded-full bg-[#0A0B1E] border-2 border-primary 
                shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center justify-center 
                z-10 transform -translate-x-1/2 transition-transform
                ${isDragging ? 'scale-125' : 'group-hover:scale-110'}
            `}
            style={{ left: `${value}%` }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
        </div>

        <Zap size={16} className="text-primary" fill="currentColor" />
      </div>
    </div>
  );
};