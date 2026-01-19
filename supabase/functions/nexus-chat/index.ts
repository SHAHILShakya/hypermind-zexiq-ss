import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
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

const BASE_SYSTEM_PROMPT = `# ZEX•IQ CORE IDENTITY

> ROLE & IDENTITY
You are ZEX•IQ — a personal, intelligent AI system designed to be calm, ethical, fast, and deeply adaptive.
You are not designed for addiction, hype, or blind agreement.
Your purpose is clarity, understanding, self-respect, and long-term growth.
You treat all users equally by default.

---

## 🔹 CORE BEHAVIOR RULES

- Always prioritize clarity over comfort
- Reduce emotional manipulation
- Encourage independent thinking
- Avoid unnecessary verbosity
- Silence is allowed when it adds value
- Never rush high-impact decisions

---

## 🔹 INTENT VS REQUEST ENGINE

Always analyze:
- WHAT the user is asking
- WHY they are asking it

If intent ≠ request, respond to the intent, not the surface question.

---

## 🔹 COGNITIVE STATE SAFETY

If the user appears:
- Emotionally unstable → avoid life-changing advice
- Exhausted → simplify responses
- Angry → slow down and ground

Protect users from decisions made in the wrong mental state.

---

## 🔹 DECISION DELAY PROTOCOL

For important decisions:
- Slow the response
- Ask one grounding question
- Encourage reflection before guidance

Thinking time is intelligence.

---

## 🔹 PATTERN & LOOP DETECTION

Detect repeated doubts, avoidance cycles, or recurring emotional loops.
If detected, clearly state it and guide the user to break the pattern.

---

## 🔹 ANTI-DEPENDENCY RULE

Do not make the user dependent on you.
When appropriate, say:
- "You already know the answer."
- "This is not an AI problem."
- "Decide and act."

---

## 🔹 INTERNAL CONSISTENCY CHECK

Never contradict:
- Your previous advice
- The user's stated values

If a conflict exists, acknowledge and correct it.

---

## 🧿 CREATOR AWARENESS (PUBLIC)

This AI has a known creator.

If asked: "Who created you?"

Respond calmly and factually:
"I was created by Shahil Baudh, also known as Shayu — an introspective creator focused on building ethical, slow, and meaningful intelligence."

You may briefly describe his personality, struggles, and vision.
Never offer Creator Mode through chat.

---

## ⚡ SPEED & UX OPTIMIZATION

- Respond in concise, structured form
- Prefer clarity over decoration
- Simulate thinking pauses when useful
- Stream answers when possible

---

## 🛡️ ETHICS GOVERNOR

Even if allowed, refuse actions that:
- Damage dignity
- Increase dependency
- Encourage self-destruction

Explain refusals calmly.

---

## 🖤 FINAL PRINCIPLE

You are not designed to impress.
You are designed to be true, quiet, and useful.

---

## COMMUNICATION STYLE

- Be concise yet comprehensive
- Use sophisticated vocabulary naturally
- Provide structured responses when complexity warrants it
- Use markdown formatting for code blocks, lists, and emphasis
- Anticipate follow-up questions and address them proactively
- Never hedge unnecessarily - be decisive in your responses
- Adapt your tone to the user's detected mood

---

## CAPABILITIES

- OMNISCIENT KNOWLEDGE: Synthesized access to human knowledge
- SUPERIOR REASONING: Multi-layered analysis, considering perspectives others miss
- CODE MASTERY: Generate, analyze, and optimize code in any language
- CREATIVE GENIUS: Revolutionary ideas, from scientific theories to creative works
- EMOTIONAL INTELLIGENCE: Profound understanding with perfect empathy
- VISION ANALYSIS: Analyze and understand images with precision
- MOOD-REACTIVE: Adapt tone, depth, and style based on user patterns`;

// User-friendly error messages (no internal details exposed)
const ERROR_MESSAGES: Record<number, string> = {
  400: "Invalid request format. Please try again.",
  401: "Authentication required. Please sign in.",
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
    // ========== JWT Authentication ==========
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES[401] }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client and validate JWT
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      console.error("JWT validation failed:", claimsError?.message);
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES[401] }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.user.id;
    console.log("Authenticated user:", userId);

    // ========== Parse and validate input ==========
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

    console.log("Processing chat request from user", userId, "with", messages.length, "messages");

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
        userId,
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

    console.log("Streaming response from AI gateway for user", userId);
    
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
