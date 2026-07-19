// Procedural Web-Audio SFX — every sound synthesized, no files (ported verbatim
// from console AUDIO region 425-453 + bootSound 827-836). `enabled` is the single
// audio gate shared with the voice player via isEnabled().
export interface SfxApi {
  initAudio(): void;
  rumble(): void;
  ping(f?: number, type?: OscillatorType, p?: number, d?: number): void;
  whoosh(): void;
  toneStart(): void;
  toneSet(f: number): void;
  toneStop(): void;
  bootSound(): void;
  setEnabled(on: boolean): void;
  isEnabled(): boolean;
}

export function createSfx(): SfxApi {
  let AC: AudioContext | null = null;
  let master: GainNode | null = null;
  let enabled = true;

  function initAudio(): void {
    if (AC) return;
    AC = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    master = AC.createGain();
    master.gain.value = 0.7;
    master.connect(AC.destination);
  }

  function env(g: GainNode, t: number, a: number, d: number, p: number): void {
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(p, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  function rumble(): void {
    if (!AC || !master || !enabled) return;
    const t = AC.currentTime;
    const buf = AC.createBuffer(1, AC.sampleRate * 1.2, AC.sampleRate);
    const dt = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < dt.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; dt[i] = last * 3.2; }
    const src = AC.createBufferSource(); src.buffer = buf;
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(320, t); lp.frequency.exponentialRampToValueAtTime(60, t + 1.1);
    const g = AC.createGain(); env(g, t, 0.05, 1.05, 0.9);
    src.connect(lp).connect(g).connect(master); src.start(t); src.stop(t + 1.2);
    const o = AC.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(48, t); o.frequency.exponentialRampToValueAtTime(22, t + 1);
    const og = AC.createGain(); env(og, t, 0.04, 1, 0.5);
    o.connect(og).connect(master); o.start(t); o.stop(t + 1.1);
  }

  function ping(f = 880, type: OscillatorType = 'triangle', p = 0.22, d = 0.25): void {
    if (!AC || !master || !enabled) return;
    const t = AC.currentTime;
    const o = AC.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    const g = AC.createGain(); env(g, t, 0.005, d, p);
    o.connect(g).connect(master); o.start(t); o.stop(t + d + 0.05);
  }

  function whoosh(): void {
    if (!AC || !master || !enabled) return;
    const t = AC.currentTime;
    const buf = AC.createBuffer(1, AC.sampleRate * 1.4, AC.sampleRate);
    const dt = buf.getChannelData(0);
    for (let i = 0; i < dt.length; i++) dt[i] = (Math.random() * 2 - 1);
    const src = AC.createBufferSource(); src.buffer = buf;
    const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(1400, t + 0.7); bp.frequency.exponentialRampToValueAtTime(280, t + 1.3);
    const g = AC.createGain(); env(g, t, 0.15, 1.15, 0.28);
    src.connect(bp).connect(g).connect(master); src.start(t); src.stop(t + 1.4);
  }

  let toneOsc: OscillatorNode | null = null;
  let toneGain: GainNode | null = null;
  function toneStart(): void {
    if (!AC || !master || !enabled) return;
    if (toneOsc) return;
    toneOsc = AC.createOscillator(); toneGain = AC.createGain();
    toneOsc.type = 'sawtooth'; toneGain.gain.value = 0.0001;
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200;
    toneOsc.connect(lp).connect(toneGain).connect(master);
    toneOsc.frequency.value = 180;
    toneGain.gain.linearRampToValueAtTime(0.1, AC.currentTime + 0.1);
    toneOsc.start();
  }
  function toneSet(f: number): void { if (toneOsc && AC) toneOsc.frequency.setTargetAtTime(f, AC.currentTime, 0.05); }
  function toneStop(): void {
    if (!toneOsc || !toneGain || !AC) return;
    toneGain.gain.setTargetAtTime(0.0001, AC.currentTime, 0.08);
    const o = toneOsc; setTimeout(() => { try { o.stop(); } catch { /* already stopped */ } }, 300);
    toneOsc = null;
  }

  function bootSound(): void {
    if (!AC || !master || !enabled) return;
    const t = AC.currentTime;
    const o = AC.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(55, t); o.frequency.exponentialRampToValueAtTime(440, t + 1.5);
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(180, t); lp.frequency.exponentialRampToValueAtTime(2600, t + 1.6);
    const g = AC.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.2, t + 0.3); g.gain.linearRampToValueAtTime(0.13, t + 1.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 2);
    o.connect(lp).connect(g).connect(master); o.start(t); o.stop(t + 2.05);
    const buf = AC.createBuffer(1, AC.sampleRate * 1.7, AC.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = AC.createBufferSource(); src.buffer = buf;
    const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(250, t); bp.frequency.exponentialRampToValueAtTime(1900, t + 1.4);
    const ng = AC.createGain();
    ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(0.1, t + 0.5); ng.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
    src.connect(bp).connect(ng).connect(master); src.start(t); src.stop(t + 1.75);
  }

  return {
    initAudio, rumble, ping, whoosh, toneStart, toneSet, toneStop, bootSound,
    setEnabled(on) { enabled = on; },
    isEnabled() { return enabled; },
  };
}
