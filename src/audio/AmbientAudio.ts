export class AmbientAudio {
  private ctx: AudioContext | null = null;
  private windGainNode: GainNode | null = null;
  private waterGainNode: GainNode | null = null;
  private birdTimer: number = 0;
  private birdInterval: number = 0;
  private torchesActive: boolean = false;
  private torchCrackleTimer: number = 0;
  private windOscillationPhase: number = 0;

  private ensureContext(): AudioContext | null {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch (error) {
        console.warn('AudioContext creation failed:', error);
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx.state === 'running' ? this.ctx : null;
  }

  warmup(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    // Initialize wind sound
    this.initializeWind(ctx);

    // Initialize water sound
    this.initializeWater(ctx);

    // Set initial bird call interval (5-15 seconds)
    this.resetBirdInterval();
  }

  private initializeWind(ctx: AudioContext): void {
    const now = ctx.currentTime;

    // Create white noise buffer
    const bufferSize = ctx.sampleRate * 2; // 2 seconds of white noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Create continuous noise source
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Create bandpass filter (400Hz center frequency)
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.Q.setValueAtTime(1, now);

    // Create wind gain node with initial value
    this.windGainNode = ctx.createGain();
    this.windGainNode.gain.setValueAtTime(0.03, now);

    // Connect wind chain: noise → filter → gain → destination
    noiseSource.connect(filter);
    filter.connect(this.windGainNode);
    this.windGainNode.connect(ctx.destination);

    // Start wind loop
    noiseSource.start(now);
  }

  private initializeWater(ctx: AudioContext): void {
    const now = ctx.currentTime;

    // Create sine oscillator at 120Hz
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);

    // Create LFO (0.3Hz) to modulate oscillator frequency
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.3, now);

    // LFO gain to control modulation depth
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(20, now); // 20Hz modulation depth

    // Connect LFO to oscillator frequency
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    // Create lowpass filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);

    // Create water gain node
    this.waterGainNode = ctx.createGain();
    this.waterGainNode.gain.setValueAtTime(0.015, now);

    // Connect water chain: osc → filter → gain → destination
    osc.connect(filter);
    filter.connect(this.waterGainNode);
    this.waterGainNode.connect(ctx.destination);

    // Start oscillators
    osc.start(now);
    lfo.start(now);
  }

  setTorchesActive(active: boolean): void {
    this.torchesActive = active;
    if (!active) {
      this.torchCrackleTimer = 0;
    }
  }

  update(delta: number): void {
    // Update wind gain oscillation
    this.updateWindOscillation();

    // Update bird call timer
    this.birdTimer += delta;
    if (this.birdTimer >= this.birdInterval) {
      this.triggerBirdCall();
      this.birdTimer = 0;
      this.resetBirdInterval();
    }

    // Update torch crackle
    if (this.torchesActive) {
      this.torchCrackleTimer += delta;
      const crackleInterval = 0.1 + Math.random() * 0.2; // 0.1-0.3 seconds
      if (this.torchCrackleTimer >= crackleInterval) {
        this.triggerCrackleBurst();
        this.torchCrackleTimer = 0;
      }
    }
  }

  private updateWindOscillation(): void {
    if (!this.windGainNode) return;

    // Oscillate wind gain slowly (sine wave modulation)
    this.windOscillationPhase += 0.005;
    const oscillationAmount = Math.sin(this.windOscillationPhase) * 0.015; // ±0.015 around base 0.03
    this.windGainNode.gain.setValueAtTime(0.03 + oscillationAmount, 0);
  }

  private triggerBirdCall(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    // Randomize number of chirps (2-4)
    const chirpCount = 2 + Math.floor(Math.random() * 3);
    const baseDelay = ctx.currentTime;

    for (let i = 0; i < chirpCount; i++) {
      const chirpStart = baseDelay + i * 0.15; // 150ms between chirps
      this.playBirdChirp(ctx, chirpStart);
    }
  }

  private playBirdChirp(ctx: AudioContext, startTime: number): void {
    // Chirp: sine oscillator from 1200-3000Hz over 0.08s
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200 + Math.random() * 1800, startTime);
    osc.frequency.exponentialRampToValueAtTime(3000, startTime + 0.08);

    // Chirp gain with quick attack and decay
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.08);
  }

  private triggerCrackleBurst(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Create short noise burst for crackle effect
    const bufferSize = ctx.sampleRate * 0.04; // 40ms burst
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Fill with random noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.6;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Quick envelope for crackle
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    // Filter to make crackle brighter (highpass-ish through highQ)
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3000 + Math.random() * 2000, now); // 3000-5000Hz
    filter.Q.setValueAtTime(2, now);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.04);
  }

  private resetBirdInterval(): void {
    // Random interval between 5-15 seconds
    this.birdInterval = 5 + Math.random() * 10;
  }
}
