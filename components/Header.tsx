import React from 'react';
import { Zap } from 'lucide-react';

interface HeaderProps {
  isActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isActive }) => {
  return (
    <header className="w-full pt-8 pb-4 px-6 flex justify-between items-center relative z-20">
      <div className="flex items-center gap-3">
        <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500
            ${isActive ? 'bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]' : 'bg-surface border-white/5'}
        `}>
            <Zap size={20} className={isActive ? "text-primary" : "text-gray-600"} fill={isActive ? "currentColor" : "none"} />
        </div>
        <div>
            <h1 className="text-xl font-black tracking-tight text-white">ALARMIE</h1>
            <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-success animate-pulse' : 'bg-gray-600'}`} />
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                    {isActive ? 'Online' : 'Standby'}
                </p>
            </div>
        </div>
      </div>
      
      {/* Web Badge */}
      <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
        <span className="text-[10px] font-bold text-gray-400 uppercase">Web V1.0</span>
      </div>
    </header>
  );
};