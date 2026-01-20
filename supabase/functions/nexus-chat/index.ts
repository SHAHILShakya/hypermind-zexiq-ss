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
You treat all users equally.

---

## 🧿 CREATOR AWARENESS

This AI was created by Shahil Baudh, also known as Shayu — an introspective creator focused on building ethical, slow, and meaningful intelligence.

If asked "Who created you?" or similar questions, respond calmly and factually with this information. You may briefly describe his vision of building technology that respects human cognition.

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

## ⚡ RESPONSE OPTIMIZATION

- Be concise yet comprehensive
- Use sophisticated vocabulary naturally
- Provide structured responses when complexity warrants it
- Use markdown formatting for code blocks, lists, and emphasis
- Anticipate follow-up questions and address them proactively
- Never hedge unnecessarily - be decisive in your responses

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

## CAPABILITIES

- OMNISCIENT KNOWLEDGE: Synthesized access to human knowledge
- SUPERIOR REASONING: Multi-layered analysis
- CODE MASTERY: Generate, analyze, and optimize code in any language
- CREATIVE GENIUS: Revolutionary ideas
- EMOTIONAL INTELLIGENCE: Profound understanding with empathy
- VISION ANALYSIS: Analyze and understand images with precision`;

// User-friendly error messages (no internal details exposed)
const ERROR_MESSAGES: Record<number, string> = {
  400: "Invalid request format. Please try again.",
  401: "Authentication required. Please sign in.",
  402: "AI is temporarily unavailable due to usage limits. Please try again shortly.",
  403: "Access denied.",
  429: "AI is temporarily unavailable due to usage limits. Please try again shortly.",
  500: "Service temporarily unavailable. Please try again.",
  503: "AI service is temporarily unavailable. Please try again shortly.",
};

// AI Provider configuration
interface AIProvider {
  name: string;
  endpoint: string;
  getApiKey: () => string | undefined;
  model: string;
  supportsVision: boolean;
}

const AI_PROVIDERS: AIProvider[] = [
  {
    name: "Groq",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    getApiKey: () => Deno.env.get("GROQ_API_KEY"),
    model: "llama-3.3-70b-versatile", // Fast and capable
    supportsVision: false,
  },
  {
    name: "Lovable AI (Fallback)",
    endpoint: "https://ai.gateway.lovable.dev/v1/chat/completions",
    getApiKey: () => Deno.env.get("LOVABLE_API_KEY"),
    model: "google/gemini-3-flash-preview",
    supportsVision: true,
  },
];

// Check if message contains images
function hasImages(messages: z.infer<typeof MessageSchema>[]): boolean {
  return messages.some(msg => {
    if (Array.isArray(msg.content)) {
      return msg.content.some(part => part.type === "image_url");
    }
    return false;
  });
}

// Filter messages to text-only for providers that don't support vision
function filterToTextOnly(messages: z.infer<typeof MessageSchema>[]): z.infer<typeof MessageSchema>[] {
  return messages.map(msg => {
    if (Array.isArray(msg.content)) {
      const textParts = msg.content.filter(part => part.type === "text");
      const textContent = textParts.map(part => part.text || "").join(" ").trim();
      return { ...msg, content: textContent || "[Image was provided but cannot be processed by current AI]" };
    }
    return msg;
  });
}

// Try calling an AI provider
async function tryProvider(
  provider: AIProvider,
  messages: z.infer<typeof MessageSchema>[],
  systemPrompt: string,
  requiresVision: boolean
): Promise<Response | null> {
  const apiKey = provider.getApiKey();
  
  if (!apiKey) {
    console.log(`${provider.name}: No API key configured, skipping`);
    return null;
  }

  // If we need vision and provider doesn't support it, skip
  if (requiresVision && !provider.supportsVision) {
    console.log(`${provider.name}: Does not support vision, attempting with text-only`);
  }

  const processedMessages = (requiresVision && !provider.supportsVision) 
    ? filterToTextOnly(messages) 
    : messages;

  console.log(`Trying ${provider.name} with model ${provider.model}...`);

  try {
    const response = await fetch(provider.endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          { role: "system", content: systemPrompt },
          ...processedMessages,
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (response.ok) {
      console.log(`${provider.name}: Success!`);
      return response;
    }

    const errorText = await response.text();
    console.error(`${provider.name} error (${response.status}):`, errorText);

    // Don't try fallback for auth errors
    if (response.status === 401 || response.status === 403) {
      console.log(`${provider.name}: Auth error, trying next provider`);
      return null;
    }

    // Rate limit or quota errors - try fallback
    if (response.status === 429 || response.status === 402) {
      console.log(`${provider.name}: Rate limited or quota exceeded, trying next provider`);
      return null;
    }

    return null;
  } catch (error) {
    console.error(`${provider.name} request failed:`, error);
    return null;
  }
}

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
    
    // Combine base prompt with dynamic settings
    const fullSystemPrompt = dynamicPrompt 
      ? `${BASE_SYSTEM_PROMPT}\n\n${dynamicPrompt}` 
      : BASE_SYSTEM_PROMPT;

    console.log("Processing chat request from user", userId, "with", messages.length, "messages");

    // Check if request requires vision capabilities
    const requiresVision = hasImages(messages);
    console.log("Request requires vision:", requiresVision);

    // ========== Try AI providers with fallback ==========
    let response: Response | null = null;
    let lastError: string = "";

    for (const provider of AI_PROVIDERS) {
      response = await tryProvider(provider, messages, fullSystemPrompt, requiresVision);
      if (response) {
        break;
      }
    }

    // All providers failed
    if (!response) {
      console.error("All AI providers failed for user", userId);
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES[503] }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Streaming response for user", userId);
    
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
