"use client";

import { useEffect, useRef, useState } from "react";

interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface UseSpeechRecognitionResult {
  isSupported: boolean;
  isListening: boolean;
  toggleListening: () => void;
}

/**
 * Starts listening automatically on mount (prompting for mic permission right away)
 * and keeps listening continuously, auto-restarting after each pause in speech,
 * mirroring the camera's always-on behavior in Sign to Text.
 */
export function useSpeechRecognition(onTranscript: (text: string) => void): UseSpeechRecognitionResult {
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const enabledRef = useRef(true);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  useEffect(() => {
    const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      setIsSupported(false);
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult?.[0]?.transcript;
      if (transcript) onTranscriptRef.current(transcript.trim());
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => {
      setIsListening(false);
      if (enabledRef.current) {
        try {
          recognition.start();
          setIsListening(true);
        } catch {
          // recognition already running or restart rejected; leave it stopped
        }
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      // some browsers require a user gesture before the first permission prompt;
      // the mic button below still lets the user start it manually.
    }

    return () => {
      enabledRef.current = false;
      recognition.stop();
    };
  }, []);

  function toggleListening() {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      enabledRef.current = false;
      recognition.stop();
      setIsListening(false);
    } else {
      enabledRef.current = true;
      recognition.start();
      setIsListening(true);
    }
  }

  return { isSupported, isListening, toggleListening };
}
