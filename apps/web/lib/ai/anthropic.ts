// Anthropic Messages API adapter — a plain fetch call, no SDK dependency
// (docs/ai-mode.md's chat proxy route: "implement at minimum an Anthropic
// adapter using a plain fetch call ... keep it simple"). A generic
// OpenAI-compatible adapter is explicitly a bonus, not built in this pass —
// AiChatSettings' `provider` field already models the choice so it can be
// added later without a shape change.

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function* streamAnthropicChat(options: {
  apiKey: string;
  model: string;
  systemPrompt?: string;
  messages: ChatMessage[];
}): AsyncGenerator<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": options.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: options.model,
      system: options.systemPrompt || undefined,
      max_tokens: 2048,
      stream: true,
      messages: options.messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic API error (${res.status}): ${text.slice(0, 500)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice("data: ".length).trim();
      if (!data || data === "[DONE]") continue;
      let event: { type?: string; delta?: { type?: string; text?: string } };
      try {
        event = JSON.parse(data);
      } catch {
        continue;
      }
      if (event.type === "content_block_delta" && event.delta?.type === "text_delta" && event.delta.text) {
        yield event.delta.text;
      }
    }
  }
}
