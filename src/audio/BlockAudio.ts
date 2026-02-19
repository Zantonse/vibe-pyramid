export class BlockAudio {
  private ctx: AudioContext | null = null;

  private ensureContext(): AudioContext | null {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx.state === 'running' ? this.ctx : null;
  }

  warmup(): void {
    this.ensureContext();
  }

  playBlockLand(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Stone thunk: short low-freq burst with noise
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);

    // Add noise burst for texture
    const bufferSize = ctx.sampleRate * 0.06;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.06, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.06);
  }

  playLevelUp(tierIndex: number): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Base frequencies rise with each tier
    const baseFreqs = [523, 587, 659, 740, 831, 932, 1047, 1175, 1319, 1480, 1661, 1865, 2093, 2349];
    const thirdFreqs = [659, 740, 831, 932, 1047, 1175, 1319, 1480, 1661, 1865, 2093, 2349, 2637, 2960];
    const idx = Math.min(tierIndex - 1, baseFreqs.length - 1);
    const freq1 = baseFreqs[Math.max(0, idx)];
    const freq2 = thirdFreqs[Math.max(0, idx)];

    const isFinalTier = tierIndex >= 8;
    const duration = isFinalTier ? 1.5 : 0.8;
    const volume = isFinalTier ? 0.18 : 0.12;

    // Two-note rising chime
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    masterGain.connect(ctx.destination);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq1, now);
    osc1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + duration * 0.4);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq2, now + 0.15);
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(volume, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + duration);

    // Final tier: triumphant third note (octave)
    if (isFinalTier) {
      const osc3 = ctx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(freq1 * 2, now + 0.3);
      const gain3 = ctx.createGain();
      gain3.gain.setValueAtTime(0, now);
      gain3.gain.setValueAtTime(volume * 0.8, now + 0.3);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.3);
      osc3.stop(now + 1.5);
    }
  }
}
