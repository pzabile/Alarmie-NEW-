import React, { useEffect, useRef } from 'react';
import { AudioService } from '../services/audioService';

interface VisualizerProps {
  isActive: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  useEffect(() => {
    if (!isActive) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      // Clear canvas
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const analyser = AudioService.getInstance().getAnalyser();
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      // Draw centered visualizer
      const centerX = width / 2;
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height;
        
        // Gradient color based on height
        const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
        gradient.addColorStop(0, '#00F0FF');
        gradient.addColorStop(1, '#7000FF');
        
        ctx.fillStyle = gradient;
        
        // Mirrored effect from center
        // We just draw simple bars for now for the pink noise which is full spectrum
        // Pink noise is relatively flat but looks random
        
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive]);

  return (
    <div className="w-full h-16 bg-[#050505]/50 rounded-xl overflow-hidden border border-white/5 shadow-inner relative">
        {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-600 uppercase tracking-widest font-mono">
                Visualizer Offline
            </div>
        )}
        <canvas 
            ref={canvasRef} 
            width={300} 
            height={64} 
            className="w-full h-full opacity-80"
        />
    </div>
  );
};