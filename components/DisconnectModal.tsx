import React from 'react';
import { AlertTriangle, Activity } from 'lucide-react';

interface DisconnectModalProps {
  isOpen: boolean;
  onAcknowledge: () => void;
}

export const DisconnectModal: React.FC<DisconnectModalProps> = ({ isOpen, onAcknowledge }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/95 backdrop-blur-lg animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#0f0505] border-2 border-accent rounded-3xl p-8 shadow-[0_0_100px_rgba(255,0,60,0.3)] flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Warning stripes background */}
        <div className="absolute inset-0 opacity-10" style={{ 
            backgroundImage: 'repeating-linear-gradient(45deg, #FF003C 0, #FF003C 10px, transparent 10px, transparent 20px)' 
        }} />

        <div className="relative z-10 mb-8">
            <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center animate-[pulse_0.5s_ease-in-out_infinite]">
                <AlertTriangle size={48} className="text-accent" strokeWidth={2.5} />
            </div>
        </div>

        <h2 className="relative z-10 text-3xl font-black text-white mb-2 tracking-tight">DISCONNECTED</h2>
        <div className="w-full h-px bg-accent/30 my-4" />
        
        <p className="relative z-10 text-gray-300 mb-8 font-mono text-sm leading-relaxed">
          <span className="text-accent font-bold block mb-2">CRITICAL ALERT</span>
          Audio output path has changed. Playing emergency alarm to verify connection state.
        </p>

        <button
          onClick={onAcknowledge}
          className="relative z-10 w-full py-4 bg-accent hover:bg-red-600 text-white font-black tracking-widest rounded-xl text-lg active:scale-95 transition-all shadow-[0_0_30px_rgba(255,0,60,0.4)] flex items-center justify-center gap-2"
        >
          <Activity className="animate-bounce" />
          ACKNOWLEDGE
        </button>
      </div>
    </div>
  );
};