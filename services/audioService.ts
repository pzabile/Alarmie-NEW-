export class AudioService {
  private context: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private alarmOscillator: OscillatorNode | null = null;
  private alarmGain: GainNode | null = null;
  private alarmInterval: number | null = null;
  
  // Callback for when the system pauses audio (unplugged headphones usually trigger this on iOS)
  public onInterruption: (() => void) | null = null;

  // Singleton instance
  private static instance: AudioService;

  private constructor() {}

  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  private getContext(): AudioContext {
    if (!this.context) {
      // @ts-ignore - webkitAudioContext fallback
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.context = new AudioContextClass();
      
      // Listener for iOS interruptions (unplugging often suspends context)
      this.context.onstatechange = () => {
        // Cast to string to support non-standard 'interrupted' state on iOS
        const state = (this.context as any)?.state as string;
        
        // 'interrupted' is specific to iOS when audio route changes (unplugged)
        // 'suspended' can happen when backgrounded if MediaSession isn't working
        if (state === 'suspended' || state === 'interrupted') {
          if (this.onInterruption) {
            this.onInterruption();
          }
        }
      };
    }
    return this.context;
  }

  public getAnalyser(): AnalyserNode {
    const ctx = this.getContext();
    if (!this.analyser) {
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 256; // Small size for performance
    }
    return this.analyser;
  }

  public async ensureContextActive(): Promise<void> {
    const ctx = this.getContext();
    const state = (ctx as any).state as string;
    
    if (state === 'suspended' || state === 'interrupted') {
      try {
        await ctx.resume();
      } catch (e) {
        console.warn('Could not resume audio context', e);
      }
    }
  }

  // Setup Media Session for Lock Screen / Background Support
  // CRITICAL for iPhone: This tells iOS we are a music player, so it doesn't kill us on lock.
  private setupMediaSession() {
    if ('mediaSession' in navigator) {
      // @ts-ignore - MediaMetadata might not be in strict TS lib
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Alarmie Active',
        artist: 'Speaker Keep-Alive',
        album: 'Background Service',
        artwork: [
            { src: 'https://via.placeholder.com/96?text=ON', sizes: '96x96', type: 'image/png' },
            { src: 'https://via.placeholder.com/128?text=ON', sizes: '128x128', type: 'image/png' },
        ]
      });

      // We must define handlers for the OS to think we are a real player
      navigator.mediaSession.setActionHandler('play', async () => {
        await this.ensureContextActive();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        // On iOS, pausing from lock screen might suspend context. 
        // We allow it, but the App logic might interpret it as a disconnect if we are strict.
        // For now, we just acknowledge the action.
        // Optionally, we could immediately resume to prevent user accidental stop.
      });
      navigator.mediaSession.setActionHandler('stop', () => {
        this.stopKeepAlive();
      });
    }
  }

  private createPinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private calculateGain(level: number): number {
    const normalized = Math.max(0, Math.min(100, level));
    if (normalized === 0) return 0;
    return 0.00001 * Math.pow(1000, normalized / 100);
  }

  public async startKeepAlive(level: number): Promise<void> {
    await this.ensureContextActive();
    this.setupMediaSession(); // Register with iOS Lock Screen
    this.stopKeepAlive();

    const ctx = this.getContext();
    const analyser = this.getAnalyser();
    
    this.noiseNode = ctx.createBufferSource();
    this.noiseNode.buffer = this.createPinkNoiseBuffer(ctx);
    this.noiseNode.loop = true;

    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.value = this.calculateGain(level);

    this.noiseNode.connect(analyser);
    analyser.connect(this.noiseGain);
    this.noiseGain.connect(ctx.destination);
    
    this.noiseNode.start();
    
    // Inform iOS we are "playing"
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
    }
  }

  public updateVolume(level: number): void {
    if (this.noiseGain) {
      const ctx = this.getContext();
      this.noiseGain.gain.setTargetAtTime(
        this.calculateGain(level), 
        ctx.currentTime, 
        0.1
      );
    }
  }

  public stopKeepAlive(): void {
    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
      } catch (e) { /* ignore */ }
      this.noiseNode.disconnect();
      this.noiseNode = null;
    }
    if (this.noiseGain) {
      this.noiseGain.disconnect();
      this.noiseGain = null;
    }
    
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
    }
  }

  public async playTestTone(): Promise<void> {
    await this.ensureContextActive();
    const ctx = this.getContext();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1);
  }

  public async startAlarm(): Promise<void> {
    await this.ensureContextActive();
    this.stopAlarm();

    const ctx = this.getContext();
    
    this.alarmOscillator = ctx.createOscillator();
    this.alarmOscillator.type = 'square';
    this.alarmOscillator.frequency.setValueAtTime(1000, ctx.currentTime);

    this.alarmGain = ctx.createGain();
    this.alarmGain.gain.setValueAtTime(1.0, ctx.currentTime);

    this.alarmOscillator.connect(this.alarmGain);
    this.alarmGain.connect(ctx.destination);
    this.alarmOscillator.start();

    let isHigh = true;
    this.alarmInterval = window.setInterval(() => {
      if (!this.alarmGain) return;
      isHigh = !isHigh;
      const now = ctx.currentTime;
      this.alarmGain.gain.setTargetAtTime(isHigh ? 1.0 : 0.0, now, 0.01);
    }, 333);
  }

  public stopAlarm(): void {
    if (this.alarmOscillator) {
      try {
        this.alarmOscillator.stop();
      } catch (e) { /* ignore */ }
      this.alarmOscillator.disconnect();
      this.alarmOscillator = null;
    }
    if (this.alarmGain) {
      this.alarmGain.disconnect();
      this.alarmGain = null;
    }
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
  }
}