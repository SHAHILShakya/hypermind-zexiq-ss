import { useState, useEffect, useCallback, useRef } from "react";

interface SilenceState {
  isUserPaused: boolean;
  pauseDuration: number; // in seconds
  silenceMessage: string | null;
}

const SILENCE_MESSAGES = [
  "You seem to be thinking — no need to rush.",
  "Take your time. I'm here when you're ready.",
  "Pausing to reflect is often the wisest choice.",
  "Sometimes the best answers come after a moment of silence.",
  "I sense you're processing something important.",
  "No hurry. Clarity often emerges from stillness.",
];

const PAUSE_THRESHOLD = 8000; // 8 seconds to detect intentional pause
const MESSAGE_DURATION = 5000; // Show message for 5 seconds

export function useSilenceAware(enabled: boolean = true) {
  const [state, setState] = useState<SilenceState>({
    isUserPaused: false,
    pauseDuration: 0,
    silenceMessage: null,
  });
  
  const lastActivityRef = useRef<number>(Date.now());
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messageTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownMessageRef = useRef<boolean>(false);

  // Record user activity (typing, clicking, etc.)
  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    hasShownMessageRef.current = false;
    
    // Clear any pending message
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
    }
    
    setState(prev => ({
      ...prev,
      isUserPaused: false,
      pauseDuration: 0,
      silenceMessage: null,
    }));
  }, []);

  // Check for pauses
  useEffect(() => {
    if (!enabled) return;

    const checkForPause = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityRef.current;
      
      if (timeSinceActivity >= PAUSE_THRESHOLD && !hasShownMessageRef.current) {
        hasShownMessageRef.current = true;
        const randomMessage = SILENCE_MESSAGES[Math.floor(Math.random() * SILENCE_MESSAGES.length)];
        
        setState(prev => ({
          ...prev,
          isUserPaused: true,
          pauseDuration: Math.floor(timeSinceActivity / 1000),
          silenceMessage: randomMessage,
        }));
        
        // Clear message after duration
        messageTimerRef.current = setTimeout(() => {
          setState(prev => ({
            ...prev,
            silenceMessage: null,
          }));
        }, MESSAGE_DURATION);
      }
    };

    pauseTimerRef.current = setInterval(checkForPause, 1000);

    return () => {
      if (pauseTimerRef.current) {
        clearInterval(pauseTimerRef.current);
      }
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
    };
  }, [enabled]);

  // Dismiss silence message
  const dismissSilenceMessage = useCallback(() => {
    setState(prev => ({ ...prev, silenceMessage: null }));
  }, []);

  return {
    ...state,
    recordActivity,
    dismissSilenceMessage,
  };
}
