import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_VOICES = [
  "alloy", "echo", "fable", "onyx", "nova", "shimmer",
  "coral", "sage", "ash", "ballad", "verse", "juniper"
] as const;

// Map our voice IDs to Google TTS voice names
const GOOGLE_VOICE_MAP: Record<string, { name: string; ssmlGender: string }> = {
  alloy:   { name: "en-US-Studio-Q", ssmlGender: "MALE" },
  echo:    { name: "en-US-Studio-M", ssmlGender: "MALE" },
  fable:   { name: "en-GB-Studio-B", ssmlGender: "MALE" },
  onyx:    { name: "en-US-Studio-D", ssmlGender: "MALE" },
  nova:    { name: "en-US-Studio-O", ssmlGender: "FEMALE" },
  shimmer: { name: "en-US-Studio-F", ssmlGender: "FEMALE" },
  coral:   { name: "en-US-Neural2-F", ssmlGender: "FEMALE" },
  sage:    { name: "en-US-Neural2-A", ssmlGender: "MALE" },
  ash:     { name: "en-US-Neural2-D", ssmlGender: "MALE" },
  ballad:  { name: "en-US-Neural2-E", ssmlGender: "FEMALE" },
  verse:   { name: "en-US-Neural2-C", ssmlGender: "FEMALE" },
  juniper: { name: "en-US-Neural2-G", ssmlGender: "FEMALE" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ========== Parse input ==========
    let body: { text?: string; voice?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid request format." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const text = body.text || "";
    const voice = body.voice || "nova";

    if (!text || text.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Text is required and must be under 5000 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_API_KEY) {
      console.error("GOOGLE_AI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Speech service unavailable." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const googleVoice = GOOGLE_VOICE_MAP[voice] || GOOGLE_VOICE_MAP["nova"];

    console.log("TTS request:", { textLength: text.length, voice, googleVoice: googleVoice.name });

    // Use Google Cloud Text-to-Speech API
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: googleVoice.name.startsWith("en-GB") ? "en-GB" : "en-US",
            name: googleVoice.name,
            ssmlGender: googleVoice.ssmlGender,
          },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 1.0,
            pitch: 0,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google TTS error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Speech generation failed. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const audioContent = data.audioContent; // base64 encoded

    // Decode base64 to binary
    const binaryString = atob(audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new Response(bytes.buffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return new Response(
      JSON.stringify({ error: "Speech generation unavailable." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
