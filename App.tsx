import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Headphones, Info, Shield, ExternalLink, Zap, AlertCircle, Volume2 } from 'lucide-react';
import { AudioService } from './services/audioService';
import { Header } from './components/Header';
import { ToggleCard } from './components/ToggleCard';
import { CustomSlider } from './components/CustomSlider';
import { DisconnectModal } from './components/DisconnectModal';
import { Visualizer } from './components/Visualizer';
import { TIPS_LIST, COMPANY_INFO } from './constants';
import { AppStatus } from './types';

// Simulate fetching/saving to local storage
const STORAGE_KEY_VOL = 'alarmie_web_volume';

export default function App() {
  // State
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [keepAliveLevel, setKeepAliveLevel] = useState<number>(15);
  const [outputLabel, setOutputLabel] = useState<string>('Initializing...');
  const [deviceCount, setDeviceCount] = useState<number>(0);
  
  // Modals
  const [showTips, setShowTips] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const audioService = useRef(AudioService.getInstance());
  const disconnectCheckInterval = useRef<number | null>(null);
  const previousDeviceCount = useRef<number>(0);
  const statusRef = useRef<AppStatus>(AppStatus.IDLE); // Ref for callbacks

  // Keep ref in sync with state for callbacks
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // --- Initialization ---
  useEffect(() => {
    const savedVol = localStorage.getItem(STORAGE_KEY_VOL);
    if (savedVol) setKeepAliveLevel(parseInt(savedVol, 10));

    // Check for audio output devices support
    updateAudioRouteInfo();
    
    // Listen for device changes (best effort for web)
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    // REGISTER iOS INTERRUPTION HANDLER
    // iOS pauses the audio context when headphones are unplugged.
    audioService.current.onInterruption = () => {
        if (statusRef.current === AppStatus.ACTIVE) {
            console.log("Interruption detected (Possible iOS disconnect)");
            // On iOS WebView, unplugging headphones sets context to 'interrupted'.
            // We interpret this as a disconnect event if we were ACTIVE.
            triggerAlarm();
        }
    };

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      stopMonitoring();
      audioService.current.onInterruption = null;
    };
  }, []);

  // --- Logic ---

  const updateAudioRouteInfo = async () => {
    try {
      // Enumerate devices to guess routing (limited in browser without user interaction)
      const devices = await navigator.mediaDevices.enumerateDevices();
      const outputs = devices.filter(d => d.kind === 'audiooutput');
      
      setDeviceCount(outputs.length);
      previousDeviceCount.current = outputs.length;

      if (outputs.length > 0) {
        // Simple web heuristic
        setOutputLabel(`${outputs.length} Output(s) Available`);
      } else {
        setOutputLabel("Browser Default");
      }
    } catch (e) {
      setOutputLabel("Permission Needed");
    }
  };

  const handleDeviceChange = useCallback(async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const outputs = devices.filter(d => d.kind === 'audiooutput');
    
    setDeviceCount(outputs.length);
    
    // Update UI
    setOutputLabel(`${outputs.length} Output(s) Available`);

    // Detection Logic: If we were active, and output count dropped, trigger alarm
    // This covers desktop mostly. Mobile relies more on onInterruption.
    if (statusRef.current === AppStatus.ACTIVE && outputs.length < previousDeviceCount.current) {
        triggerAlarm();
    }
    previousDeviceCount.current = outputs.length;
  }, []); // Removed dependency on 'status' to avoid stale closures, using ref instead

  const toggleActive = async () => {
    if (status === AppStatus.ACTIVE) {
      // Deactivate
      setStatus(AppStatus.IDLE);
      audioService.current.stopKeepAlive();
      stopMonitoring();
    } else {
      // Activate
      setStatus(AppStatus.ACTIVE);
      await audioService.current.startKeepAlive(keepAliveLevel);
      startMonitoring();
    }
  };

  const startMonitoring = () => {
    disconnectCheckInterval.current = window.setInterval(() => {
        // Heartbeat check for audio context state could go here
    }, 5000);
  };

  const stopMonitoring = () => {
    if (disconnectCheckInterval.current) {
      clearInterval(disconnectCheckInterval.current);
      disconnectCheckInterval.current = null;
    }
  };

  const triggerAlarm = () => {
    console.log("Triggering Alarm Sequence");
    setStatus(AppStatus.ALARMING);
    audioService.current.stopKeepAlive();
    // We attempt to start alarm. If context is suspended, startAlarm calls resume().
    audioService.current.startAlarm();
    stopMonitoring();
  };

  const handleAcknowledgeAlarm = () => {
    audioService.current.stopAlarm();
    setStatus(AppStatus.IDLE);
  };

  const handleVolumeChange = (val: number) => {
    setKeepAliveLevel(val);
    localStorage.setItem(STORAGE_KEY_VOL, val.toString());
    if (status === AppStatus.ACTIVE) {
      audioService.current.updateVolume(val);
    }
  };

  const handleTestAudio = async () => {
    await audioService.current.playTestTone();
  };

  // --- Render Helper ---
  
  const renderTipCard = (tip: typeof TIPS_LIST[0]) => (
    <div key={tip.id} className="glass p-4 rounded-xl mb-3 hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-3 mb-2">
        <Info size={16} className="text-primary" />
        <h4 className="font-bold text-white">{tip.title}</h4>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed font-mono">{tip.description}</p>
    </div>
  );

  return (
    <div className="min-h-screen pb-12 max-w-md mx-auto shadow-2xl relative overflow-hidden font-sans">
      
      <Header isActive={status === AppStatus.ACTIVE} />
      
      <main className="px-6 relative z-10 space-y-6">
        
        {/* Main Control */}
        <ToggleCard isActive={status === AppStatus.ACTIVE} onToggle={toggleActive} />

        {/* Status Dashboard */}
        <div className="glass rounded-2xl p-5 space-y-4">
            {/* Visualizer */}
            <div>
                <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Signal Visualizer</span>
                    {status === AppStatus.ACTIVE && <span className="text-[10px] text-primary animate-pulse">● LIVE</span>}
                </div>
                <Visualizer isActive={status === AppStatus.ACTIVE} />
            </div>

            {/* Route Info */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${status === AppStatus.ACTIVE ? 'bg-primary/10 text-primary' : 'bg-white/5 text-gray-500'}`}>
                        <Headphones size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Audio Route</p>
                        <p className="text-xs font-bold text-white font-mono mt-0.5">{outputLabel}</p>
                    </div>
                </div>
                <button 
                    onClick={updateAudioRouteInfo}
                    className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors"
                    title="Refresh Devices"
                >
                    <Settings size={14} />
                </button>
            </div>
        </div>

        {/* Volume / Settings */}
        <div className="glass rounded-2xl p-6">
             <CustomSlider value={keepAliveLevel} onValueChange={handleVolumeChange} />
             
             <div className="mt-6 flex gap-3">
                <button 
                    onClick={handleTestAudio}
                    className="flex-1 py-3 rounded-xl bg-surface border border-white/10 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                >
                    <Volume2 size={14} /> TEST TONE
                </button>
                <button 
                    onClick={triggerAlarm}
                    className="flex-1 py-3 rounded-xl bg-accent/10 border border-accent/30 text-xs font-bold text-accent hover:bg-accent/20 transition-all flex items-center justify-center gap-2"
                >
                    <AlertCircle size={14} /> SIMULATE
                </button>
             </div>
        </div>

        {/* Tips Teaser */}
        <div 
            onClick={() => setShowTips(true)}
            className="glass rounded-xl p-4 flex items-center justify-between cursor-pointer group"
        >
             <div className="flex items-center gap-3">
                <Info size={18} className="text-gray-500 group-hover:text-primary transition-colors" />
                <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">Usage Tips & Safety</span>
             </div>
             <div className="text-xs bg-white/10 px-2 py-1 rounded text-gray-400">8 Tips</div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-center gap-6 pt-4">
            <button onClick={() => setShowAbout(true)} className="text-xs font-bold text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                ABOUT
            </button>
            <button onClick={() => setShowAbout(true)} className="text-xs font-bold text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                PRIVACY
            </button>
        </div>
      </main>

      {/* Modals */}
      <DisconnectModal isOpen={status === AppStatus.ALARMING} onAcknowledge={handleAcknowledgeAlarm} />

      {/* Full Screen Modals */}
      {showTips && (
        <div className="fixed inset-0 bg-[#050505] z-50 overflow-y-auto p-6 animate-in slide-in-from-bottom duration-300">
            <div className="max-w-md mx-auto">
                <div className="flex justify-between items-center mb-8 sticky top-0 bg-[#050505]/90 backdrop-blur-md py-4 z-10">
                    <h2 className="text-2xl font-black text-white tracking-tight">SYSTEM GUIDE</h2>
                    <button onClick={() => setShowTips(false)} className="p-2 bg-surface rounded-full text-white border border-white/10">✕</button>
                </div>
                {TIPS_LIST.map(renderTipCard)}
            </div>
        </div>
      )}

      {showAbout && (
         <div className="fixed inset-0 bg-[#050505]/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
            <div className="bg-[#050505] w-full max-w-sm rounded-3xl p-8 text-center border border-white/10 relative shadow-2xl">
                <button onClick={() => setShowAbout(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white">✕</button>
                <div className="w-16 h-16 bg-surface rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,240,255,0.2)] border border-primary/20">
                    <Zap size={32} className="text-primary" />
                </div>
                <h2 className="text-2xl font-black text-white mb-1 tracking-tighter">ALARMIE</h2>
                <p className="text-primary font-mono text-xs mb-6 tracking-widest">WEB EDITION {COMPANY_INFO.version}</p>
                <p className="text-gray-400 text-sm mb-8 font-mono leading-relaxed">
                    Prevents audio hardware sleep states via continuous signal injection.
                </p>
                <div className="space-y-3">
                    <a href={`https://${COMPANY_INFO.website}`} className="flex items-center justify-center gap-2 text-xs font-bold text-white bg-surface border border-white/10 py-3 rounded-xl hover:bg-white/5 transition-all">
                        <ExternalLink size={14} /> {COMPANY_INFO.website}
                    </a>
                    <a href={`mailto:${COMPANY_INFO.contact}`} className="flex items-center justify-center gap-2 text-xs font-bold text-white bg-surface border border-white/10 py-3 rounded-xl hover:bg-white/5 transition-all">
                        <Shield size={14} /> CONTACT SUPPORT
                    </a>
                </div>
            </div>
         </div>
      )}
    </div>
  );
}