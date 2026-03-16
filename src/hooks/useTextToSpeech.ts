import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`;

/** Wrap raw PCM data in a WAV header for browser playback */
function pcmToWav(pcmData: ArrayBuffer, sampleRate: number, channels: number, bitsPerSample: number): ArrayBuffer {
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const dataSize = pcmData.byteLength;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  new Uint8Array(buffer, 44).set(new Uint8Array(pcmData));
  return buffer;
}

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

      const contentType = response.headers.get("Content-Type") || "";
      const audioBuffer = await response.arrayBuffer();
      
      let playableBlob: Blob;
      if (contentType.includes("pcm")) {
        // Wrap raw PCM in a WAV header so the browser can play it
        // Gemini TTS returns 24kHz 16-bit mono PCM
        const wavBuffer = pcmToWav(audioBuffer, 24000, 1, 16);
        playableBlob = new Blob([wavBuffer], { type: "audio/wav" });
      } else {
        playableBlob = new Blob([audioBuffer], { type: contentType || "audio/mpeg" });
      }

      const audio = new Audio(URL.createObjectURL(playableBlob));
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
