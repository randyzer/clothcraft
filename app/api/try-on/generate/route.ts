import { NextRequest, NextResponse } from "next/server";
import { volcanoEngine } from "@/lib/volcano-engine";
import { createTryOnPayload, type TryOnTier } from "@/lib/try-on";
import { getErrorMessage } from "@/lib/error-utils";

type TryOnRequestBody = {
  tier?: TryOnTier;
  modelImage?: string;
  garmentImages?: string[];
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TryOnRequestBody;
    const payload = createTryOnPayload({
      tier: body.tier ?? "free",
      modelImage: body.modelImage ?? "",
      garmentImages: body.garmentImages ?? [],
      size: "2K",
    });

    const result = await volcanoEngine.generateImage(payload.prompt, {
      inputImages: payload.images,
      size: payload.size,
      watermark: payload.watermark,
    });

    const image = result.data?.[0];
    if (!image?.url) {
      return NextResponse.json({ error: "No image generated" }, { status: 502 });
    }

    return NextResponse.json({
      url: image.url,
      prompt: payload.prompt,
      watermark: payload.watermark,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to generate try-on image") },
      { status: 400 }
    );
  }
}
