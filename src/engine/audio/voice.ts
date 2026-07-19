// Pre-baked ElevenLabs narration player (ported from console VOICE region
// 455-471). Manifest {key -> src} comes from the lesson config (after build the
// srcs are inlined data-URIs). play() is called ONLY on explicit teacher control
// presses — that call-site gating is the spoiler invariant, since the mp3s
// contain answers. Browser TTS is a fallback if an mp3 fails to load.
export interface VoiceState { src: string; paused: boolean; err: number | null; }
export interface VoiceClip { key: string; src: string; fallbackText: string }
export interface VoicePlayer {
  play(key: string, fallbackText?: string): void;
  stop(): void;
  current(): VoiceState | null;
}

export function createVoice(clips: VoiceClip[], isEnabled: () => boolean): VoicePlayer {
  const srcMap: Record<string, string> = {};
  const fbMap: Record<string, string> = {};
  clips.forEach((c) => { srcMap[c.key] = c.src; fbMap[c.key] = c.fallbackText; });

  let voices: SpeechSynthesisVoice[] = [];
  function loadVoices(): void { voices = speechSynthesis.getVoices(); }
  if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }

  let cur: HTMLAudioElement | null = null;

  function stop(): void {
    if (cur) { try { cur.pause(); cur.currentTime = 0; } catch { /* noop */ } }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }

  function ttsFallback(txt?: string): void {
    if (!txt || !('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(txt); u.rate = 0.98; u.pitch = 1; u.volume = 1;
    const pref = voices.find((v) => /en-GB/.test(v.lang) && /female|Google|Libby|Sonia/i.test(v.name))
      || voices.find((v) => /en/i.test(v.lang) && /Google/i.test(v.name))
      || voices.find((v) => /en/i.test(v.lang));
    if (pref) u.voice = pref;
    speechSynthesis.speak(u);
  }

  function play(key: string, fallbackText?: string): void {
    if (!isEnabled()) return;
    stop();
    const src = srcMap[key];
    const fb = fallbackText ?? fbMap[key];
    if (src) { cur = new Audio(src); cur.volume = 1; cur.play().catch(() => ttsFallback(fb)); }
    else ttsFallback(fb);
  }

  function current(): VoiceState | null {
    if (!cur) return null;
    return {
      src: (cur.currentSrc || cur.src).split('/').pop() || '',
      paused: cur.paused,
      err: cur.error ? cur.error.code : null,
    };
  }

  return { play, stop, current };
}
