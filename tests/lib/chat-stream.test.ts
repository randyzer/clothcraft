import { parseEventStreamChunk } from "@/lib/chat-stream";

describe("parseEventStreamChunk", () => {
  it("buffers incomplete SSE payloads until the next chunk arrives", () => {
    const firstPass = parseEventStreamChunk(
      'data: {"type":"content","content":"Hel'
    );

    expect(firstPass.events).toEqual([]);
    expect(firstPass.remaining).toBe(
      'data: {"type":"content","content":"Hel'
    );

    const secondPass = parseEventStreamChunk(
      'lo"}\n\ndata: {"type":"done"}\n\n',
      firstPass.remaining
    );

    expect(secondPass.events).toEqual([
      {
        type: "content",
        content: "Hello",
      },
      {
        type: "done",
      },
    ]);
    expect(secondPass.remaining).toBe("");
  });

  it("ignores DONE sentinels and malformed lines", () => {
    const result = parseEventStreamChunk(
      'data: [DONE]\n\ndata: {"type":"metadata","sessionId":"chat-1","remainingCredits":290}\n\njunk\n'
    );

    expect(result.events).toEqual([
      {
        type: "metadata",
        sessionId: "chat-1",
        remainingCredits: 290,
      },
    ]);
    expect(result.remaining).toBe("");
  });
});
