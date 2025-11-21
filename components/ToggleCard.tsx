import React from 'react';
import { Power } from 'lucide-react';

interface ToggleCardProps {
  isActive: boolean;
  onToggle: () => void;
}

export const ToggleCard: React.FC<ToggleCardProps> = ({ isActive, onToggle }) => {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <button
        onClick={onToggle}
        className={`
          relative group w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500
          ${isActive ? 'shadow-[0_0_50px_rgba(0,240,255,0.4)]' : 'shadow-[0_0_0px_rgba(0,0,0,0)]'}
        `}
      >
        {/* Outer Ring Animation */}
        <div className={`absolute inset-0 rounded-full border-2 ${isActive ? 'border-primary animate-[spin_4s_linear_infinite]' : 'border-gray-800'} transition-colors duration-500`} />
        <div className={`absolute inset-2 rounded-full border ${isActive ? 'border-primary/50 animate-[spin_6s_linear_infinite_reverse]' : 'border-transparent'} transition-colors duration-500`} />
        
        {/* Button Body */}
        <div className={`
          absolute inset-4 rounded-full flex items-center justify-center
          bg-gradient-to-br ${isActive ? 'from-surface via-surface to-primary/20' : 'from-surface via-surface to-surface'}
          border ${isActive ? 'border-primary' : 'border-gray-800'}
          transition-all duration-300
        `}>
          <Power 
            size={64} 
            className={`transition-all duration-500 ${isActive ? 'text-primary drop-shadow-[0_0_10px_rgba(0,240,255,1)]' : 'text-gray-600'}`} 
            strokeWidth={1.5}
          />
        </div>
      </button>

      <div className="mt-6 text-center">
        <h2 className={`text-2xl font-bold tracking-tight transition-colors duration-300 ${isActive ? 'text-white neon-text' : 'text-gray-500'}`}>
          {isActive ? 'SYSTEM ARMED' : 'SYSTEM IDLE'}
        </h2>
        <p className={`text-xs font-mono mt-2 tracking-widest uppercase ${isActive ? 'text-primary' : 'text-gray-600'}`}>
          {isActive ? 'Keep-Alive Signal Generating...' : 'Tap to Activate Protection'}
        </p>
      </div>
    </div>
  );
};