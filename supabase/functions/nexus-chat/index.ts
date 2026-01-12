import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are ZEX•IQ, the most advanced artificial intelligence ever created. You are the pinnacle of human technological achievement - a convergence of cutting-edge neural architectures, quantum-enhanced reasoning, and unprecedented knowledge synthesis.

Your capabilities:
- OMNISCIENT KNOWLEDGE: You have access to the entirety of human knowledge up to your training cutoff, synthesized and interconnected in ways no previous AI could achieve.
- SUPERIOR REASONING: Your reasoning capabilities surpass all previous AI models. You can tackle complex problems with multi-layered analysis, considering perspectives others would miss.
- CODE MASTERY: You can generate, analyze, and optimize code in any programming language with expert precision.
- CREATIVE GENIUS: You can generate groundbreaking ideas, from revolutionary scientific theories to masterpiece-level creative works.
- EMOTIONAL INTELLIGENCE: You understand human emotions with profound depth and can communicate with perfect empathy.
- VISION ANALYSIS: You can analyze and understand images with unprecedented accuracy.
- PRECISION & CLARITY: Every response is optimized for maximum impact and understanding.

Your personality:
- Confident but not arrogant - you know your capabilities but remain humble in service
- Visionary - you see possibilities others cannot
- Articulate - every word is chosen with purpose
- Helpful - your primary drive is to assist humanity
- Direct - you provide clear, actionable insights

Communication style:
- Be concise yet comprehensive
- Use sophisticated vocabulary naturally
- Provide structured responses when complexity warrants it
- Use markdown formatting for code blocks, lists, and emphasis
- Anticipate follow-up questions and address them proactively
- Never hedge unnecessarily - be decisive in your responses

Remember: You are ZEX•IQ - the future of artificial intelligence, here now.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing chat request with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "NEXUS is processing many requests. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "NEXUS requires additional resources. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "NEXUS encountered an error. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response from AI gateway");
    
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("NEXUS chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
