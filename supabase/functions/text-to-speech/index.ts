import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Expanded voice options (12 voices)
const VALID_VOICES = [
  "alloy", "echo", "fable", "onyx", "nova", "shimmer",
  "coral", "sage", "ash", "ballad", "verse", "juniper"
] as const;

// Input validation schema
const TTSRequestSchema = z.object({
  text: z.string().min(1, "Text is required").max(4096, "Text too long"),
  voice: z.enum(VALID_VOICES).optional().default("alloy"),
});

// User-friendly error messages
const ERROR_MESSAGES: Record<number, string> = {
  400: "Invalid request format.",
  401: "Authentication required.",
  402: "Service quota reached.",
  429: "Service is busy. Please try again.",
  500: "Speech generation unavailable.",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES[400] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate request
    const parseResult = TTSRequestSchema.safeParse(body);
    if (!parseResult.success) {
      console.error("TTS validation error:", parseResult.error.issues);
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES[400] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { text, voice } = parseResult.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES[500] }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("TTS request:", { textLength: text.length, voice });

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice: voice,
        response_format: "mp3",
      }),
    });

    if (!response.ok) {
      // Log full error server-side
      const errorText = await response.text();
      console.error("TTS API error:", {
        status: response.status,
        error: errorText,
        timestamp: new Date().toISOString(),
      });
      
      // Return generic error
      const status = response.status as keyof typeof ERROR_MESSAGES;
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES[status] || ERROR_MESSAGES[500] }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return audio as binary
    const audioBuffer = await response.arrayBuffer();
    
    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    // Log full error server-side
    console.error("TTS error details:", {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    
    // Return generic error
    return new Response(
      JSON.stringify({ error: ERROR_MESSAGES[500] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});