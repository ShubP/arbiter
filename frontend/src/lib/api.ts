import { API_BASE } from "./config";
import type { DisputePayload, NegotiationEvent } from "./negotiation";

/** Load the built-in preset disputes from the backend. */
export async function fetchPresets(): Promise<DisputePayload[]> {
  const res = await fetch(`${API_BASE}/presets`);
  if (!res.ok) throw new Error(`presets ${res.status}`);
  return res.json();
}

/** Turn a plain-English description into a structured dispute (needs Qwen). */
export async function structureDispute(text: string): Promise<DisputePayload> {
  const res = await fetch(`${API_BASE}/intake`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? "Couldn't structure that description.");
  }
  return res.json();
}

/** Whether this deployment can voice advocates with live Qwen. */
export async function fetchCapabilities(): Promise<{ liveQwen: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/capabilities`);
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return { liveQwen: false };
  }
}

/**
 * Stream a negotiation from the backend, invoking `onEvent` for each event.
 * Pass `dispute = null` to run the default flagship demo. Reads the SSE response
 * via a streaming fetch so a custom dispute can be POSTed in the body.
 */
export async function streamNegotiation(
  dispute: DisputePayload | null,
  onEvent: (event: NegotiationEvent) => void,
  live = false,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${API_BASE}/negotiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dispute, delay: 1.2, live }),
    signal,
  });
  if (res.status === 422) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail ?? "That dispute isn't valid.");
  }
  if (!res.ok || !res.body) throw new Error(`negotiate ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const line = chunk
        .split("\n")
        .find((l) => l.startsWith("data: "));
      if (line) onEvent(JSON.parse(line.slice("data: ".length)));
    }
  }
}
