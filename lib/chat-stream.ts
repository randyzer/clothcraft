type EventStreamParseResult<TEvent> = {
  events: TEvent[];
  remaining: string;
};

export function parseEventStreamChunk<TEvent>(
  chunk: string,
  previousRemaining = ""
): EventStreamParseResult<TEvent> {
  const buffer = previousRemaining + chunk;
  const lines = buffer.split("\n");
  const remaining = lines.pop() ?? "";
  const events: TEvent[] = [];

  for (const line of lines) {
    if (!line.startsWith("data: ")) {
      continue;
    }

    const payload = line.slice(6).trim();
    if (!payload || payload === "[DONE]") {
      continue;
    }

    try {
      events.push(JSON.parse(payload) as TEvent);
    } catch {
      return {
        events,
        remaining: `${line}\n${remaining}`.trimEnd(),
      };
    }
  }

  return {
    events,
    remaining,
  };
}
