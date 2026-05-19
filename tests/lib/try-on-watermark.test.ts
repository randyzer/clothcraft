import { createClothCraftWatermarkSvg } from "@/lib/try-on-watermark";

describe("try-on watermark", () => {
  it("renders the ClothCraft wordmark in a compositable SVG", () => {
    const svg = createClothCraftWatermarkSvg({
      width: 1200,
      height: 900,
      label: "ClothCraft",
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain("ClothCraft");
    expect(svg).toContain('font-family="Arial, Helvetica, sans-serif"');
    expect(svg).toContain("translate(836 772)");
  });
});
