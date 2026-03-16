import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`;

export type VoiceId = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" | "coral" | "sage" | "ash" | "ballad" | "verse" | "juniper";

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>(() => (localStorage.getItem("zexiq-tts-voice") as VoiceId) || "nova");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const setVoice = useCallback((voice: VoiceId) => { setSelectedVoice(voice); localStorage.setItem("zexiq-tts-voice", voice); }, []);

  const speak = useCallback(async (text: string, messageId: string, voiceOverride?: VoiceId) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (speakingMessageId === messageId) { setIsSpeaking(false); setSpeakingMessageId(null); return; }

    setIsSpeaking(true);
    setSpeakingMessageId(messageId);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      
      // Use auth token if available, otherwise use anon key
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      } else {
        headers["apikey"] = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        headers["Authorization"] = `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`;
      }

      const response = await fetch(TTS_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ text, voice: voiceOverride || selectedVoice }),
      });

      if (!response.ok) throw new Error("Failed to generate speech");

      const audioBlob = await response.blob();
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audioRef.current = audio;
      audio.onended = () => { setIsSpeaking(false); setSpeakingMessageId(null); audioRef.current = null; };
      audio.onerror = () => { setIsSpeaking(false); setSpeakingMessageId(null); audioRef.current = null; toast.error("Failed to play audio"); };
      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      toast.error("Failed to generate speech");
    }
  }, [speakingMessageId, selectedVoice]);

  const stop = useCallback(() => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } setIsSpeaking(false); setSpeakingMessageId(null); }, []);

  return { speak, stop, isSpeaking, speakingMessageId, selectedVoice, setVoice };
}
