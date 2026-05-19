import { buildImageGenerationRequest } from "@/lib/volcano-engine/image";

describe("buildImageGenerationRequest", () => {
  it("builds a Seedream multi-image request with disabled sequential generation", () => {
    expect(
      buildImageGenerationRequest("Replace the outfit", {
        model: "doubao-seedream-5-0-260128",
        inputImages: [
          "data:image/png;base64,bW9kZWw=",
          "data:image/jpeg;base64,Z2FybWVudA==",
        ],
        size: "2K",
        watermark: false,
      })
    ).toEqual({
      model: "doubao-seedream-5-0-260128",
      prompt: "Replace the outfit",
      image: [
        "data:image/png;base64,bW9kZWw=",
        "data:image/jpeg;base64,Z2FybWVudA==",
      ],
      sequential_image_generation: "disabled",
      response_format: "url",
      size: "2K",
      stream: false,
      watermark: false,
    });
  });
});
