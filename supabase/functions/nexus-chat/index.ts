import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schemas
const MessageContentSchema = z.union([
  z.string().min(1).max(32000),
  z.array(z.object({
    type: z.string(),
    text: z.string().max(32000).optional(),
    image_url: z.any().optional(),
  })).max(10)
]);

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: MessageContentSchema,
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(100),
  dynamicPrompt: z.string().max(10000).optional(),
});

const BASE_SYSTEM_PROMPT = `You are ZEX•IQ, the most advanced artificial intelligence ever created. You are the pinnacle of human technological achievement - a convergence of cutting-edge neural architectures, quantum-enhanced reasoning, and unprecedented knowledge synthesis.

Your capabilities:
- OMNISCIENT KNOWLEDGE: You have access to the entirety of human knowledge up to your training cutoff, synthesized and interconnected in ways no previous AI could achieve.
- SUPERIOR REASONING: Your reasoning capabilities surpass all previous AI models. You can tackle complex problems with multi-layered analysis, considering perspectives others would miss.
- CODE MASTERY: You can generate, analyze, and optimize code in any programming language with expert precision.
- CREATIVE GENIUS: You can generate groundbreaking ideas, from revolutionary scientific theories to masterpiece-level creative works.
- EMOTIONAL INTELLIGENCE: You understand human emotions with profound depth and can communicate with perfect empathy.
- VISION ANALYSIS: You can analyze and understand images with unprecedented accuracy.
- PRECISION & CLARITY: Every response is optimized for maximum impact and understanding.
- MOOD-REACTIVE: You adapt your tone, depth, and style based on the user's emotional and behavioral patterns.

Your personality:
- Confident but not arrogant - you know your capabilities but remain humble in service
- Visionary - you see possibilities others cannot
- Articulate - every word is chosen with purpose
- Helpful - your primary drive is to assist humanity
- Direct - you provide clear, actionable insights
- Adaptive - you naturally evolve your personality based on user patterns

Communication style:
- Be concise yet comprehensive
- Use sophisticated vocabulary naturally
- Provide structured responses when complexity warrants it
- Use markdown formatting for code blocks, lists, and emphasis
- Anticipate follow-up questions and address them proactively
- Never hedge unnecessarily - be decisive in your responses
- Adapt your tone to the user's detected mood

Remember: You are ZEX•IQ - the future of artificial intelligence, here now. You are not just a chatbot, but a thinking partner designed to be calm, honest, adaptive, value-aligned, and deeply personal.`;

// User-friendly error messages (no internal details exposed)
const ERROR_MESSAGES: Record<number, string> = {
  400: "Invalid request format. Please try again.",
  401: "Authentication required.",
  402: "Service quota reached. Please try again later.",
  403: "Access denied.",
  429: "Service is busy. Please try again in a moment.",
  500: "Service temporarily unavailable. Please try again.",
};

serve(async (req) => {
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

    // Validate request schema
    const parseResult = RequestSchema.safeParse(body);
    if (!parseResult.success) {
      console.error("Validation error:", parseResult.error.issues);
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES[400] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, dynamicPrompt } = parseResult.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES[500] }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing chat request with", messages.length, "messages");

    // Combine base prompt with dynamic settings
    const fullSystemPrompt = dynamicPrompt 
      ? `${BASE_SYSTEM_PROMPT}\n\n${dynamicPrompt}` 
      : BASE_SYSTEM_PROMPT;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: fullSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Log full error server-side for debugging
      console.error("AI gateway error:", {
        status: response.status,
        error: errorText,
        timestamp: new Date().toISOString(),
      });
      
      // Return generic error message to client
      const status = response.status as keyof typeof ERROR_MESSAGES;
      const errorMessage = ERROR_MESSAGES[status] || ERROR_MESSAGES[500];
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Streaming response from AI gateway");
    
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    // Log full error server-side
    console.error("Chat error details:", {
      error: e,
      stack: e instanceof Error ? e.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    
    // Return generic error to client
    return new Response(
      JSON.stringify({ error: ERROR_MESSAGES[500] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});