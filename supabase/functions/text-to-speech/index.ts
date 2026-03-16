import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Voice map: our IDs → Gemini TTS voice names
const VOICE_MAP: Record<string, string> = {
  alloy: "Puck",
  echo: "Charon",
  fable: "Kore",
  onyx: "Fenrir",
  nova: "Aoede",
  shimmer: "Leda",
  coral: "Aoede",
  sage: "Puck",
  ash: "Charon",
  ballad: "Kore",
  verse: "Leda",
  juniper: "Aoede",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: { text?: string; voice?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid request." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const text = body.text || "";
    const voice = body.voice || "nova";

    if (!text || text.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Text required (max 5000 chars)." }),
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

    const geminiVoice = VOICE_MAP[voice] || "Aoede";
    console.log("TTS:", { textLength: text.length, voice, geminiVoice });

    // Use Gemini 2.5 Flash with audio generation
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text }]
          }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: geminiVoice
                }
              }
            }
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini TTS error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Speech generation failed." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // Extract audio from Gemini response
    const candidates = data.candidates;
    if (!candidates?.[0]?.content?.parts?.[0]?.inlineData) {
      console.error("No audio in Gemini response:", JSON.stringify(data).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "No audio generated." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const inlineData = candidates[0].content.parts[0].inlineData;
    const audioBase64 = inlineData.data;
    const mimeType = inlineData.mimeType || "audio/mp3";

    // Decode base64 to binary
    const binaryString = atob(audioBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Determine content type from mime
    const contentType = mimeType.includes("wav") ? "audio/wav" 
      : mimeType.includes("pcm") ? "audio/pcm"
      : "audio/mpeg";

    return new Response(bytes.buffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
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
