"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cleanAdvisoryText } from "@/lib/advisoryText";

const LANG_TAGS: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  ta: "ta-IN",
  as: "as-IN",
  bn: "bn-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  te: "te-IN",
};

const MAX_CHUNK = 200;

export function toLangTag(code: string): string {
  return LANG_TAGS[code] ?? `${code}-IN`;
}

export function splitIntoChunks(raw: string): string[] {
  const text = cleanAdvisoryText(raw).replace(/\*/g, "");
  const sentences = text.match(/[^.?!।\n]+[.?!।]*|\n/g) ?? [];
  const chunks: string[] = [];
  let current = "";
  for (const piece of sentences) {
    const s = piece.trim();
    if (!s) continue;
    if (current && current.length + s.length + 1 > MAX_CHUNK) {
      chunks.push(current);
      current = "";
    }
    // A single oversized sentence is split on whitespace.
    if (s.length > MAX_CHUNK) {
      for (const word of s.split(/\s+/)) {
        if (current && current.length + word.length + 1 > MAX_CHUNK) {
          chunks.push(current);
          current = "";
        }
        current = current ? `${current} ${word}` : word;
      }
      continue;
    }
    current = current ? `${current} ${s}` : s;
  }
  if (current) chunks.push(current);
  return chunks;
}

// macOS/iOS novelty voices (sound effects, singing) that report an English
// lang tag. Picking one of these is what produced loud buzzing/bell sounds.
const NOVELTY_VOICES =
  /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|deranged|hysterical|pipe organ|junior|ralph|fred|kathy)\b/i;

const QUALITY_HINT = /natural|neural|online|premium|enhanced|google/i;

function findVoice(tag: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const norm = (l: string) => l.replace(/_/g, "-").toLowerCase();
  const target = norm(tag);
  const primary = target.split("-")[0];
  let best: SpeechSynthesisVoice | null = null;
  let bestScore = -1;
  for (const v of voices) {
    const lang = norm(v.lang);
    if (lang.split("-")[0] !== primary || NOVELTY_VOICES.test(v.name)) continue;
    let score = 0;
    if (lang === target) score += 4; // e.g. en-IN accent for English
    if (QUALITY_HINT.test(v.name)) score += 2;
    if (v.default) score += 1;
    if (score > bestScore) {
      best = v;
      bestScore = score;
    }
  }
  return best;
}

// Module-level owner so only one card speaks at a time.
let currentOwner: number | null = null;
let nextId = 1;

export function useSpeech(text: string, language: string) {
  // Stable per-component id (useState initialiser runs once).
  const [ownerId] = useState(() => nextId++);
  const idRef = useRef(ownerId);
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const runRef = useRef(0); // invalidates in-flight chunk chains

  const stop = useCallback(() => {
    runRef.current++;
    if (currentOwner === idRef.current) {
      currentOwner = null;
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setSpeaking(false);
  }, []);

  // Voice availability (voices load asynchronously).
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return; // stays unsupported
    }
    const update = () => {
      try {
        setSupported(findVoice(toLangTag(language)) !== null);
      } catch {
        setSupported(false);
      }
    };
    update();
    try {
      window.speechSynthesis.addEventListener("voiceschanged", update);
    } catch {}
    return () => {
      try {
        window.speechSynthesis.removeEventListener("voiceschanged", update);
      } catch {}
    };
  }, [language]);

  // Stop on text/language change and unmount.
  useEffect(() => {
    return () => stop();
  }, [text, language, stop]);

  const toggle = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (currentOwner === idRef.current) {
      stop();
      return;
    }
    const chunks = splitIntoChunks(text);
    if (chunks.length === 0) return;
    const tag = toLangTag(language);
    try {
      const synth = window.speechSynthesis;
      currentOwner = idRef.current;
      const run = ++runRef.current;
      // Stop any other card (its end/error handler resets it). Only cancel
      // when something is queued: a bare cancel() can glitch Chrome on macOS.
      const busy = synth.speaking || synth.pending;
      if (busy) synth.cancel();
      const voice = findVoice(tag);
      setSpeaking(true);

      const finish = () => {
        if (runRef.current !== run) return;
        if (currentOwner === idRef.current) currentOwner = null;
        setSpeaking(false);
      };
      const speakAt = (i: number) => {
        if (runRef.current !== run) return;
        if (currentOwner !== idRef.current) {
          // Another card took over; just reset our state.
          setSpeaking(false);
          return;
        }
        if (i >= chunks.length) {
          finish();
          return;
        }
        const u = new SpeechSynthesisUtterance(chunks[i]);
        u.lang = voice?.lang ?? tag;
        if (voice) u.voice = voice;
        u.rate = 0.95;
        u.volume = 1;
        u.onend = () => speakAt(i + 1);
        u.onerror = finish;
        synth.speak(u);
      };
      // Defer so the cancel() above settles before speaking (Chrome quirk).
      setTimeout(() => speakAt(0), busy ? 150 : 0);
    } catch {
      currentOwner = null;
      setSpeaking(false);
    }
  }, [text, language, stop]);

  return { supported, speaking, toggle };
}
