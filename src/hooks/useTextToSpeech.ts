import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`;

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string, messageId: string) => {
    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // If clicking on same message, just stop
    if (speakingMessageId === messageId) {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      return;
    }

    setIsSpeaking(true);
    setSpeakingMessageId(messageId);

    try {
      const response = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text, voice: "nova" }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        toast.error("Failed to play audio");
      };

      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      toast.error("Failed to generate speech");
    }
  }, [speakingMessageId]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setSpeakingMessageId(null);
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    speakingMessageId,
  };
}
