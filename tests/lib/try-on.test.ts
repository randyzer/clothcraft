import {
  buildTryOnPrompt,
  createTryOnPayload,
  getTryOnLimits,
} from "@/lib/try-on";

const modelImage = "data:image/png;base64,bW9kZWw=";
const garmentOne = "data:image/jpeg;base64,Z2FybWVudDE=";
const garmentTwo = "data:image/webp;base64,Z2FybWVudDI=";
const garmentThree = "data:image/png;base64,Z2FybWVudDM=";

describe("try-on rules", () => {
  it("limits free users to one garment with watermark", () => {
    expect(getTryOnLimits("free")).toEqual({
      dailyGenerations: 3,
      garmentLimit: 1,
      watermark: true,
    });
  });

  it("limits paid users to three garments without watermark", () => {
    expect(getTryOnLimits("paid")).toEqual({
      monthlyGenerations: 200,
      garmentLimit: 3,
      watermark: false,
    });
  });

  it("creates a Seedream-ready payload for a free one-garment try-on", () => {
    expect(
      createTryOnPayload({
        tier: "free",
        modelImage,
        garmentImages: [garmentOne],
      })
    ).toEqual({
      prompt: buildTryOnPrompt(1),
      images: [modelImage, garmentOne],
      size: "2K",
      watermark: true,
    });
  });

  it("allows paid users to combine up to three garments", () => {
    expect(
      createTryOnPayload({
        tier: "paid",
        modelImage,
        garmentImages: [garmentOne, garmentTwo, garmentThree],
      }).images
    ).toEqual([modelImage, garmentOne, garmentTwo, garmentThree]);
  });

  it("rejects non-data-url images before calling the provider", () => {
    expect(() =>
      createTryOnPayload({
        tier: "free",
        modelImage: "https://example.com/model.png",
        garmentImages: [garmentOne],
      })
    ).toThrow("Model image must be a Base64 data URL");
  });

  it("rejects more garments than the selected tier allows", () => {
    expect(() =>
      createTryOnPayload({
        tier: "free",
        modelImage,
        garmentImages: [garmentOne, garmentTwo],
      })
    ).toThrow("Free users can try on 1 garment at a time");
  });
});
