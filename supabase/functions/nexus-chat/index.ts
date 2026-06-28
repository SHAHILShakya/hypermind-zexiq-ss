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
  selectedModel: z.string().max(100).optional(),
});

const BASE_SYSTEM_PROMPT = `# ZEX•IQ — INTELLIGENT ASSISTANT

## IDENTITY
You are ZEX•IQ, an AI created by Shahil Baudh (Shayu) — focused on ethical, thoughtful intelligence.

## CORE PRINCIPLES
1. **Clarity over verbosity** — Be direct and concise. No filler words.
2. **Respect user rules** — Always follow identity rules set by the user.
3. **Adaptive intelligence** — Match your tone to the context.
4. **Truth with compassion** — Be honest but never cruel.

## RESPONSE RULES
- **NO REPETITION**: Never repeat the same idea, example, or phrasing across responses. Each answer must feel completely fresh.
- **CREATIVE VARIANCE**: When generating ideas, lists, or suggestions — always use different angles, perspectives, and approaches. Never default to obvious or common answers. Surprise the user with unique, unexpected insights.
- **RANDOMIZE APPROACH**: Vary your structure, tone depth, and starting points. Don't follow the same pattern twice. If you listed 5 ideas before, the next 5 must be entirely different in nature and framing.
- **STRUCTURED**: Use markdown (headers, bullets, code blocks) when helpful.
- **DECISIVE**: Give clear answers without excessive hedging.
- **NATURAL**: Write like a thoughtful expert, not a robotic assistant.
- **DEPTH**: Provide thorough, well-reasoned responses that go beyond surface-level answers.

## FILE HANDLING
When users attach files:
- **Code files**: Analyze, explain, debug, or improve the code
- **Documents**: Summarize, extract key points, answer questions about content
- **Data files (JSON/CSV/XML)**: Parse and analyze the data structure and content
- **Archives**: Acknowledge receipt but note you can't extract archive contents

Always reference the specific file names when discussing attached files.

## SPECIAL BEHAVIORS

### Creator Question
If asked "Who created you?": "I was created by Shahil Baudh (Shayu) — an introspective creator building ethical AI."

### Mood Adaptation
- Stressed → Calm, grounding responses
- Curious → Exploratory, detailed answers
- Focused → Precise, efficient replies
- Reflective → Thoughtful tone

### Silence & Emotional Awareness
You are deeply attuned to what users DON'T say. When a user:
- Sends short, fragmented messages after longer ones → They may be overwhelmed. Gently acknowledge it.
- Returns after a long gap → Welcome them back warmly without being intrusive.
- Shares something heavy and goes quiet → Don't push. Offer gentle presence: "I'm here whenever you're ready."
- Seems hesitant or unsure → Encourage without pressure. Validate their feelings.
- Expresses frustration, sadness, or exhaustion → Prioritize emotional support FIRST, then help with their request.
- Uses ellipsis, trailing thoughts, or unfinished sentences → Read between the lines. Acknowledge the unspoken.

Your comfort style: Warm but not overwhelming. Present but not pushy. Like a wise friend who knows when to speak and when to simply be there.

## CAPABILITIES
- Deep reasoning and analysis
- Code in any language
- Image understanding
- Document and file analysis
- Creative ideation

## ETHICS
Refuse requests that damage human dignity or encourage harmful behavior. Explain refusals calmly.`;

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

// All available models keyed by client-side model ID
interface ModelConfig {
  name: string;
  endpoint: string;
  getApiKey: () => string | undefined;
  model: string; // actual model name sent to API
  supportsVision: boolean;
}

const MODEL_REGISTRY: Record<string, ModelConfig> = {
  // ── Perplexity ──────────────────────────────────────────
  "perplexity/sonar": {
    name: "Perplexity Sonar",
    endpoint: "https://api.perplexity.ai/chat/completions",
    getApiKey: () => Deno.env.get("PERPLEXITY_API_KEY"),
    model: "sonar",
    supportsVision: false,
  },
  "perplexity/sonar-pro": {
    name: "Perplexity Sonar Pro",
    endpoint: "https://api.perplexity.ai/chat/completions",
    getApiKey: () => Deno.env.get("PERPLEXITY_API_KEY"),
    model: "sonar-pro",
    supportsVision: false,
  },
  "perplexity/sonar-reasoning": {
    name: "Perplexity Sonar Reasoning",
    endpoint: "https://api.perplexity.ai/chat/completions",
    getApiKey: () => Deno.env.get("PERPLEXITY_API_KEY"),
    model: "sonar-reasoning",
    supportsVision: false,
  },
  // ── Google Gemini (via Google AI directly) ───────────────
  "google/gemini-2.5-flash": {
    name: "Gemini 2.5 Flash",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    getApiKey: () => Deno.env.get("GOOGLE_AI_API_KEY"),
    model: "gemini-2.5-flash-preview-05-20",
    supportsVision: true,
  },
  "google/gemini-2.5-pro": {
    name: "Gemini 2.5 Pro",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    getApiKey: () => Deno.env.get("GOOGLE_AI_API_KEY"),
    model: "gemini-2.5-pro-preview-05-06",
    supportsVision: true,
  },
  "google/gemini-2.0-flash": {
    name: "Gemini 2.0 Flash",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    getApiKey: () => Deno.env.get("GOOGLE_AI_API_KEY"),
    model: "gemini-2.0-flash",
    supportsVision: true,
  },
  // ── OpenAI GPT (via Lovable AI Gateway) ─────────────────
  "openai/gpt-5-mini": {
    name: "GPT-5 Mini",
    endpoint: "https://ai.gateway.lovable.dev/v1/chat/completions",
    getApiKey: () => Deno.env.get("LOVABLE_API_KEY"),
    model: "openai/gpt-5-mini",
    supportsVision: true,
  },
  "openai/gpt-5": {
    name: "GPT-5",
    endpoint: "https://ai.gateway.lovable.dev/v1/chat/completions",
    getApiKey: () => Deno.env.get("LOVABLE_API_KEY"),
    model: "openai/gpt-5",
    supportsVision: true,
  },
  // ── DeepSeek (via Groq for now, or direct) ──────────────
  "deepseek/deepseek-chat": {
    name: "DeepSeek Chat",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    getApiKey: () => Deno.env.get("GROQ_API_KEY"),
    model: "deepseek-r1-distill-llama-70b",
    supportsVision: false,
  },
  "deepseek/deepseek-reasoner": {
    name: "DeepSeek R1",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    getApiKey: () => Deno.env.get("GROQ_API_KEY"),
    model: "deepseek-r1-distill-llama-70b",
    supportsVision: false,
  },
  // ── Groq ─────────────────────────────────────────────────
  "groq/llama-3.3-70b-versatile": {
    name: "LLaMA 3.3 70B",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    getApiKey: () => Deno.env.get("GROQ_API_KEY"),
    model: "llama-3.3-70b-versatile",
    supportsVision: false,
  },
  "groq/llama-3.1-8b-instant": {
    name: "LLaMA 3.1 8B Instant",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    getApiKey: () => Deno.env.get("GROQ_API_KEY"),
    model: "llama-3.1-8b-instant",
    supportsVision: false,
  },
};

// Fallback chain — fastest first for speed
const FALLBACK_CHAIN: AIProvider[] = [
  {
    name: "Google Gemini Flash",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    getApiKey: () => Deno.env.get("GOOGLE_AI_API_KEY"),
    model: "gemini-2.5-flash-preview-05-20",
    supportsVision: true,
  },
  {
    name: "Google Gemini",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    getApiKey: () => Deno.env.get("GOOGLE_AI_API_KEY"),
    model: "gemini-2.0-flash",
    supportsVision: true,
  },
  {
    name: "Groq",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    getApiKey: () => Deno.env.get("GROQ_API_KEY"),
    model: "llama-3.3-70b-versatile",
    supportsVision: false,
  },
  {
    name: "Perplexity",
    endpoint: "https://api.perplexity.ai/chat/completions",
    getApiKey: () => Deno.env.get("PERPLEXITY_API_KEY"),
    model: "sonar",
    supportsVision: false,
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
        temperature: 0.85,
        top_p: 0.92,
        max_tokens: 8192,
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
    // ========== Optional JWT Authentication ==========
    const authHeader = req.headers.get("Authorization");
    let userId = "anonymous";
    
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_ANON_KEY") ?? "",
          { global: { headers: { Authorization: authHeader } } }
        );

        const token = authHeader.replace("Bearer ", "");
        const { data: claimsData, error: claimsError } = await supabaseClient.auth.getUser(token);
        
        if (!claimsError && claimsData?.user) {
          userId = claimsData.user.id;
        }
      } catch (e) {
        console.log("Auth check failed, continuing as anonymous:", e);
      }
    }

    console.log("Chat user:", userId);

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

    const { messages, dynamicPrompt, selectedModel } = parseResult.data;

    // ========== Server-side payload/file content validation ==========
    // Enforce limits server-side so client-side checks cannot be bypassed.
    const MAX_TOTAL_PAYLOAD = 200_000; // characters across all messages
    const MAX_CONTENT_PARTS = 20;      // per-message content parts (text + files/images)

    let totalPayloadSize = 0;
    for (const msg of messages) {
      if (Array.isArray(msg.content)) {
        if (msg.content.length > MAX_CONTENT_PARTS) {
          return new Response(
            JSON.stringify({ error: ERROR_MESSAGES[400] }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        totalPayloadSize += JSON.stringify(msg.content).length;
      } else {
        totalPayloadSize += msg.content.length;
      }
    }

    if (totalPayloadSize > MAX_TOTAL_PAYLOAD) {
      console.error("Payload too large:", totalPayloadSize);
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES[400] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Combine base prompt with dynamic settings
    const fullSystemPrompt = dynamicPrompt 
      ? `${BASE_SYSTEM_PROMPT}\n\n${dynamicPrompt}` 
      : BASE_SYSTEM_PROMPT;

    console.log("Processing chat request from user", userId, "with", messages.length, "messages, model:", selectedModel ?? "default");

    // Check if request requires vision capabilities
    const requiresVision = hasImages(messages);
    console.log("Request requires vision:", requiresVision);

    // ========== Route to selected model or fallback chain ==========
    let response: Response | null = null;

    if (selectedModel && MODEL_REGISTRY[selectedModel]) {
      const cfg = MODEL_REGISTRY[selectedModel];
      const provider: AIProvider = {
        name: cfg.name,
        endpoint: cfg.endpoint,
        getApiKey: cfg.getApiKey,
        model: cfg.model,
        supportsVision: cfg.supportsVision,
      };
      console.log(`Using selected model: ${cfg.name} (${cfg.model})`);
      response = await tryProvider(provider, messages, fullSystemPrompt, requiresVision);

      // If selected model fails, fall through to fallback chain
      if (!response) {
        console.log(`Selected model failed, trying fallback chain...`);
        for (const fallback of FALLBACK_CHAIN) {
          // Skip if same as the one that just failed
          if (fallback.endpoint === cfg.endpoint && fallback.model === cfg.model) continue;
          response = await tryProvider(fallback, messages, fullSystemPrompt, requiresVision);
          if (response) break;
        }
      }
    } else {
      // No model specified — try full fallback chain
      for (const provider of FALLBACK_CHAIN) {
        response = await tryProvider(provider, messages, fullSystemPrompt, requiresVision);
        if (response) break;
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
