// Kokoro TTS — lifelike neural speech running 100% in the browser.
// Model is ~100MB quantized (q8) and is cached by the browser after first load.

import type { Gender } from "./jobs";

type TTSInstance = any; // KokoroTTS — lazy imported to keep main bundle lean

let ttsPromise: Promise<TTSInstance> | null = null;
let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;

// Map app gender → Kokoro voice IDs (American English, highest quality set)
const VOICE_BY_GENDER: Record<Gender, string> = {
  female: "af_heart",
  male: "am_michael",
};

async function getTTS(): Promise<TTSInstance> {
  if (!ttsPromise) {
    ttsPromise = (async () => {
      const { KokoroTTS } = await import("kokoro-js");
      // Try WebGPU first (much faster), fall back to WASM.
      const hasWebGPU = typeof navigator !== "undefined" && (navigator as any).gpu;
      return KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
        dtype: hasWebGPU ? "fp32" : "q8",
        device: hasWebGPU ? "webgpu" : "wasm",
      } as any);
    })();
    ttsPromise.catch(() => { ttsPromise = null; });
  }
  return ttsPromise;
}

/** Kick off the model download ahead of time (e.g. when the user opens the intro). */
export function preloadKokoro(): void {
  getTTS().catch((e) => console.warn("[Kokoro] preload failed", e));
}

export function isKokoroLoaded(): boolean {
  return ttsPromise !== null;
}

export function stopKokoro(): void {
  if (currentAudio) {
    try { currentAudio.pause(); currentAudio.currentTime = 0; } catch {}
  }
  if (currentUrl) {
    try { URL.revokeObjectURL(currentUrl); } catch {}
    currentUrl = null;
  }
  currentAudio = null;
}

export async function speakWithKokoro(
  text: string,
  gender: Gender,
  onStart?: () => void,
  onEnd?: () => void,
): Promise<void> {
  stopKokoro();
  try {
    const tts = await getTTS();
    const voice = VOICE_BY_GENDER[gender] || "am_michael";
    const result: any = await tts.generate(text, { voice });
    const blob: Blob = typeof result.toBlob === "function" ? result.toBlob() : result;
    const url = URL.createObjectURL(blob);
    currentUrl = url;
    const el = new Audio(url);
    currentAudio = el;
    el.onplay = () => onStart?.();
    el.onended = () => { stopKokoro(); onEnd?.(); };
    el.onerror = () => { stopKokoro(); onEnd?.(); };
    await el.play();
  } catch (err) {
    console.error("[Kokoro] speak failed", err);
    stopKokoro();
    throw err;
  }
}
