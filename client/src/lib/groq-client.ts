// Direct browser-to-Groq API calls (no server needed)

const GROQ_API_URL = "https://api.groq.com/openai/v1";
// Fast chat model for the live conversation; the heavier 70b model is reserved
// for end-of-call scoring where latency doesn't matter.
const FAST_CHAT_MODEL = "llama-3.1-8b-instant";
const SCORING_MODEL = "llama-3.3-70b-versatile";

export async function groqChat(
  apiKey: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  userMessage: string
): Promise<string> {
  const groqMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];
  for (const msg of messages) {
    groqMessages.push({
      role: msg.role === "rep" ? "user" : "assistant",
      content: msg.content,
    });
  }
  groqMessages.push({ role: "user", content: userMessage });

  const res = await fetch(`${GROQ_API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: FAST_CHAT_MODEL,
      max_tokens: 200,
      messages: groqMessages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function groqScorecard(
  apiKey: string,
  prompt: string
): Promise<string> {
  const res = await fetch(`${GROQ_API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: SCORING_MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "{}";
}

/**
 * Stream chat completion tokens as they arrive (SSE).
 * Yields incremental text deltas; consumer can splice them into a TTS pipeline.
 */
export async function* groqChatStream(
  apiKey: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  userMessage: string,
): AsyncGenerator<string, void, unknown> {
  const groqMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];
  for (const msg of messages) {
    groqMessages.push({
      role: msg.role === "rep" ? "user" : "assistant",
      content: msg.content,
    });
  }
  groqMessages.push({ role: "user", content: userMessage });

  const res = await fetch(`${GROQ_API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: FAST_CHAT_MODEL,
      max_tokens: 200,
      stream: true,
      messages: groqMessages,
    }),
  });

  if (!res.ok || !res.body) {
    const err = await res.text().catch(() => "");
    throw new Error(`Groq stream error (${res.status}): ${err}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield delta as string;
      } catch {
        // ignore malformed chunk
      }
    }
  }
}

export async function groqWhisper(
  apiKey: string,
  audioBlob: Blob
): Promise<string> {
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");
  formData.append("model", "whisper-large-v3-turbo");
  formData.append("language", "en");
  formData.append("response_format", "json");

  const res = await fetch(`${GROQ_API_URL}/audio/transcriptions`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Whisper error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.text?.trim() || "";
}
