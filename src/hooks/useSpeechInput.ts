import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Click-to-talk voice input built on the browser's built-in Web Speech API
 * (SpeechRecognition). No external service or API cost. Supported in Chrome,
 * Edge and Safari (incl. iOS Safari); gracefully reports `supported: false`
 * elsewhere (e.g. Firefox, some native WebViews) so the UI can hide the mic.
 */

// The Web Speech API isn't in the standard TS lib DOM types.
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

type Options = {
  /** Called with the final transcript when the user stops speaking. */
  onResult: (transcript: string) => void;
  /** Called with the live (not-yet-final) transcript while speaking. */
  onInterim?: (transcript: string) => void;
  lang?: string;
};

export function useSpeechInput({ onResult, onInterim, lang = "en-US" }: Options) {
  const [supported] = useState(() => getRecognitionCtor() !== null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  // Keep the latest callbacks without re-creating the recognition instance.
  const cbRef = useRef({ onResult, onInterim });
  cbRef.current = { onResult, onInterim };

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    // Reuse a single instance; abort any in-flight session first.
    recognitionRef.current?.abort();

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;

    let finalText = "";
    recognition.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += chunk;
        else interim += chunk;
      }
      if (interim) cbRef.current.onInterim?.(interim);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => {
      setListening(false);
      const text = finalText.trim();
      if (text) cbRef.current.onResult(text);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [lang]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { supported, listening, start, stop, toggle };
}
