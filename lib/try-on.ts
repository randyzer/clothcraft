export type TryOnTier = "free" | "paid";

export type TryOnSize = "adaptive" | "1K" | "2K" | "4K";

export type TryOnLimits =
  | {
      dailyGenerations: number;
      garmentLimit: number;
      watermark: true;
    }
  | {
      monthlyGenerations: number;
      garmentLimit: number;
      watermark: false;
    };

type CreateTryOnPayloadParams = {
  tier: TryOnTier;
  modelImage: string;
  garmentImages: string[];
  size?: TryOnSize;
};

const BASE64_IMAGE_PATTERN = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

export function getTryOnLimits(tier: TryOnTier): TryOnLimits {
  if (tier === "paid") {
    return {
      monthlyGenerations: 200,
      garmentLimit: 3,
      watermark: false,
    };
  }

  return {
    dailyGenerations: 3,
    garmentLimit: 1,
    watermark: true,
  };
}

export function buildTryOnPrompt(garmentCount: number) {
  if (garmentCount <= 1) {
    return "将图1中的模特服装替换为图2中的服装，保持模特身份、姿势、身材比例、背景和光照自然一致，输出真实电商试穿效果。";
  }

  return `将图1中的模特服装替换为图2到图${garmentCount + 1}中的服装组合，保持模特身份、姿势、身材比例、背景和光照自然一致，输出真实电商试穿效果。`;
}

export function isBase64ImageDataUrl(value: string) {
  return BASE64_IMAGE_PATTERN.test(value);
}

export function createTryOnPayload({
  tier,
  modelImage,
  garmentImages,
  size = "2K",
}: CreateTryOnPayloadParams) {
  const limits = getTryOnLimits(tier);
  const images = garmentImages.filter(Boolean);

  if (!isBase64ImageDataUrl(modelImage)) {
    throw new Error("Model image must be a Base64 data URL");
  }

  if (images.length === 0) {
    throw new Error("At least one garment image is required");
  }

  if (images.length > limits.garmentLimit) {
    throw new Error(
      tier === "free"
        ? "Free users can try on 1 garment at a time"
        : "Paid users can try on 3 garments at a time"
    );
  }

  const invalidGarment = images.find((image) => !isBase64ImageDataUrl(image));
  if (invalidGarment) {
    throw new Error("Garment images must be Base64 data URLs");
  }

  return {
    prompt: buildTryOnPrompt(images.length),
    images: [modelImage, ...images],
    size,
    watermark: limits.watermark,
  };
}
