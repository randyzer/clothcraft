import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { generationHistory } from "@/lib/db/schema";
import { getActiveSessionUser } from "@/lib/auth/session";
import { volcanoEngine } from "@/lib/volcano-engine";
import { createTryOnPayload } from "@/lib/try-on";
import {
  countTryOnsInWindow,
  getShanghaiDayWindow,
  getTryOnEntitlement,
} from "@/lib/try-on-access";
import { uploadImageFromUrl } from "@/lib/r2-storage";
import { watermarkImageUrlToR2 } from "@/lib/try-on-watermark";
import { getErrorMessage } from "@/lib/error-utils";

type TryOnRequestBody = {
  modelImage?: string;
  garmentImages?: string[];
};

export async function POST(req: NextRequest) {
  let historyId: string | null = null;

  try {
    const access = await getActiveSessionUser(req.headers);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const userId = access.user.id;
    const entitlement = await getTryOnEntitlement(userId);
    const usageWindow = getShanghaiDayWindow();
    const usedToday = await countTryOnsInWindow(userId, usageWindow);

    if (usedToday >= entitlement.dailyLimit) {
      return NextResponse.json(
        {
          error: "Daily try-on limit reached",
          entitlement,
          usedToday,
          remainingToday: 0,
        },
        { status: 429 }
      );
    }

    const body = (await req.json()) as TryOnRequestBody;
    const payload = createTryOnPayload({
      tier: entitlement.tier,
      modelImage: body.modelImage ?? "",
      garmentImages: body.garmentImages ?? [],
      size: "2K",
    });

    historyId = randomUUID();
    await db.insert(generationHistory).values({
      id: historyId,
      userId,
      type: "try_on",
      prompt: payload.prompt,
      imageUrl: body.modelImage ?? null,
      status: "processing",
      creditsUsed: 0,
      metadata: JSON.stringify({
        feature: "try_on",
        tier: entitlement.tier,
        garmentCount: payload.images.length - 1,
        watermark: entitlement.watermark,
        size: payload.size,
      }),
    });

    const result = await volcanoEngine.generateImage(payload.prompt, {
      inputImages: payload.images,
      size: payload.size,
      watermark: false,
    });

    const image = result.data?.[0];
    if (!image?.url) {
      throw new Error("No image generated");
    }

    const finalUrl = entitlement.watermark
      ? await watermarkImageUrlToR2({
          imageUrl: image.url,
          userId,
          label: "ClothCraft",
        })
      : await uploadImageFromUrl(image.url, userId, "image");

    await db
      .update(generationHistory)
      .set({
        status: "completed",
        resultUrl: finalUrl,
        updatedAt: new Date(),
      })
      .where(eq(generationHistory.id, historyId));

    return NextResponse.json({
      id: historyId,
      url: finalUrl,
      prompt: payload.prompt,
      watermark: entitlement.watermark,
      entitlement,
      usedToday: usedToday + 1,
      remainingToday: Math.max(entitlement.dailyLimit - usedToday - 1, 0),
    });
  } catch (error: unknown) {
    if (historyId) {
      await db
        .update(generationHistory)
        .set({
          status: "failed",
          error: getErrorMessage(error, "Failed to generate try-on image"),
          updatedAt: new Date(),
        })
        .where(eq(generationHistory.id, historyId));
    }

    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to generate try-on image") },
      { status: 400 }
    );
  }
}
