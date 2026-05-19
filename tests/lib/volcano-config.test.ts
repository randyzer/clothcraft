import { resolveVolcanoEngineConfig } from "@/lib/volcano-engine/config";

describe("resolveVolcanoEngineConfig", () => {
  it("uses the configured text model when provided", () => {
    const config = resolveVolcanoEngineConfig({
      VOLCANO_ENGINE_API_KEY: "api-key",
      VOLCANO_ENGINE_API_URL: "https://example.com/api/v3",
      VOLCANO_ENGINE_TEXT_MODEL: "custom-chat-model",
    });

    expect(config.textModel).toBe("custom-chat-model");
  });

  it("falls back to a broadly available default chat model", () => {
    const config = resolveVolcanoEngineConfig({
      VOLCANO_ENGINE_API_KEY: "api-key",
      VOLCANO_ENGINE_API_URL: "https://example.com/api/v3",
    });

    expect(config.textModel).toBe("doubao-seed-2-0-lite-260428");
  });

  it("uses Seedream 5.0 lite as the default image model", () => {
    const config = resolveVolcanoEngineConfig({
      VOLCANO_ENGINE_API_KEY: "api-key",
      VOLCANO_ENGINE_API_URL: "https://example.com/api/v3",
    });

    expect(config.imageModel).toBe("doubao-seedream-5-0-260128");
  });
});
