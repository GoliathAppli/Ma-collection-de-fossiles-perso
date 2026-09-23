/**
 * Synthesizes a realistic low-frequency rumbly dinosaur roar / growl using the Web Audio API.
 * This guarantees audio feedback works seamlessly without needing external assets.
 */
let sharedCtx: AudioContext | null = null;
let cachedNoiseBuffer: AudioBuffer | null = null;
let cachedDistortionCurve: Float32Array | null = null;

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (cachedNoiseBuffer && cachedNoiseBuffer.sampleRate === ctx.sampleRate) {
    return cachedNoiseBuffer;
  }
  const bufferSize = ctx.sampleRate * 1.5; // 1.5 seconds of noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  cachedNoiseBuffer = buffer;
  return buffer;
}

function getDistortionCurve(amount = 80): Float32Array {
  if (cachedDistortionCurve) {
    return cachedDistortionCurve;
  }
  const k = typeof amount === 'number' ? amount : 80;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  cachedDistortionCurve = curve;
  return curve;
}

export function playDinoSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    if (!sharedCtx) {
      sharedCtx = new AudioContextClass();
    }
    const ctx = sharedCtx;
    
    // Resume context if suspended (Chrome user gesture policy)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    
    const now = ctx.currentTime;

    // We'll create several nodes:
    // 1. Low frequency oscillator for the deep rumble
    // 2. Modulator to create the fluttering "growl" effect
    // 3. Noise generator with bandpass filter to simulate the breathy roar

    // Low Rumble Oscillator
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 1.2);

    // Filter to keep it deep and heavy
    const lpFilter = ctx.createBiquadFilter();
    lpFilter.type = 'lowpass';
    lpFilter.frequency.setValueAtTime(140, now);
    lpFilter.frequency.exponentialRampToValueAtTime(80, now + 1.2);
    lpFilter.Q.setValueAtTime(8, now);

    // Gain node for Rumble
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.01, now);
    rumbleGain.gain.linearRampToValueAtTime(1.2, now + 0.15);
    rumbleGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

    // Modulator for fluttering
    const mod = ctx.createOscillator();
    mod.type = 'sine';
    mod.frequency.setValueAtTime(25, now); // flutter rate (25 Hz)
    const modGain = ctx.createGain();
    modGain.gain.setValueAtTime(30, now); // flutter depth

    // Connect modulator to oscillator frequency
    mod.connect(modGain);
    modGain.connect(osc.frequency);

    // Growl/Breathy Noise generator
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);

    // Bandpass filter for noise to simulate throat resonance
    const bpFilter = ctx.createBiquadFilter();
    bpFilter.type = 'bandpass';
    bpFilter.frequency.setValueAtTime(100, now);
    bpFilter.frequency.exponentialRampToValueAtTime(180, now + 0.5);
    bpFilter.frequency.exponentialRampToValueAtTime(60, now + 1.2);
    bpFilter.Q.setValueAtTime(2.5, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.01, now);
    noiseGain.gain.linearRampToValueAtTime(0.8, now + 0.1);
    noiseGain.gain.linearRampToValueAtTime(0.5, now + 0.6);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

    // Distortion node to make it mean/aggressive
    const distortion = ctx.createWaveShaper();
    distortion.curve = getDistortionCurve(80);
    distortion.oversample = '4x';

    // Connections
    osc.connect(lpFilter);
    lpFilter.connect(rumbleGain);
    rumbleGain.connect(distortion);

    noise.connect(bpFilter);
    bpFilter.connect(noiseGain);
    noiseGain.connect(distortion);

    // Final master output
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.4, now);
    masterGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

    distortion.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Start everything
    mod.start(now);
    osc.start(now);
    noise.start(now);

    // Stop everything
    mod.stop(now + 1.3);
    osc.stop(now + 1.3);
    noise.stop(now + 1.3);
  } catch (error) {
    console.warn("Could not play sound:", error);
  }
}
