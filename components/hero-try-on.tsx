"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/button";
import { createTryOnPayload, getTryOnLimits, type TryOnTier } from "@/lib/try-on";
import { useSession } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/error-utils";
import { Loader2, Sparkles, Upload, X } from "lucide-react";

type UploadSlot = "model" | 0 | 1 | 2;

type TryOnResponse = {
  url?: string;
  error?: string;
  entitlement?: TryOnEntitlement;
  usedToday?: number;
  remainingToday?: number;
};

type TryOnEntitlement = {
  tier: TryOnTier;
  dailyLimit: number;
  garmentLimit: number;
  watermark: boolean;
};

type TryOnEntitlementResponse = {
  entitlement: TryOnEntitlement;
  usedToday: number;
  remainingToday: number;
  error?: string;
};

function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

export function HeroTryOn() {
  const t = useTranslations("hero.tryOn");
  const locale = useLocale();
  const router = useRouter();
  const session = useSession();
  const userId = session.data?.user?.id;
  const defaultEntitlement = useMemo(() => getEntitlementFromTier("free"), []);
  const entitlementErrorRef = useRef(t("errors.entitlement"));
  const [entitlement, setEntitlement] = useState<TryOnEntitlement>(defaultEntitlement);
  const [usedToday, setUsedToday] = useState(0);
  const [remainingToday, setRemainingToday] = useState(defaultEntitlement.dailyLimit);
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [garmentImages, setGarmentImages] = useState<Array<string | null>>([
    null,
    null,
    null,
  ]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const modelInputRef = useRef<HTMLInputElement | null>(null);
  const garmentInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    entitlementErrorRef.current = t("errors.entitlement");
  }, [t]);

  const activeGarments = useMemo(
    () => garmentImages.filter((image): image is string => Boolean(image)),
    [garmentImages]
  );
  const isAnonymous = !userId;
  const canGenerate =
    !isGenerating &&
    (isAnonymous || (Boolean(modelImage) && activeGarments.length > 0 && remainingToday > 0));

  useEffect(() => {
    if (!userId) {
      setEntitlement(defaultEntitlement);
      setUsedToday(0);
      setRemainingToday(defaultEntitlement.dailyLimit);
      setGarmentImages((images) => [images[0], null, null]);
      return;
    }

    let cancelled = false;

    async function loadEntitlement() {
      try {
        const response = await fetch("/api/try-on/entitlement", {
          cache: "no-store",
        });
        const data = (await response.json()) as TryOnEntitlementResponse;

        if (!response.ok) {
          throw new Error(data.error || entitlementErrorRef.current);
        }

        if (!cancelled) {
          setEntitlement(data.entitlement);
          setUsedToday(data.usedToday);
          setRemainingToday(data.remainingToday);
          setGarmentImages((images) => images.map((image, index) =>
            index < data.entitlement.garmentLimit ? image : null
          ));
        }
      } catch (entitlementError: unknown) {
        if (!cancelled) {
          setError(getErrorMessage(entitlementError, entitlementErrorRef.current));
        }
      }
    }

    void loadEntitlement();

    return () => {
      cancelled = true;
    };
  }, [defaultEntitlement, userId]);

  const handleUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    slot: UploadSlot
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t("errors.invalidFile"));
      event.target.value = "";
      return;
    }

    try {
      const dataUrl = await readImageAsDataUrl(file);
      if (slot === "model") {
        setModelImage(dataUrl);
      } else {
        setGarmentImages((images) => {
          const next = [...images];
          next[slot] = dataUrl;
          return next;
        });
      }
      setError(null);
      setResultUrl(null);
    } catch (uploadError: unknown) {
      setError(getErrorMessage(uploadError, t("errors.upload")));
    } finally {
      event.target.value = "";
    }
  };

  const removeGarment = (index: number) => {
    setGarmentImages((images) => {
      const next = [...images];
      next[index] = null;
      return next;
    });
  };

  const handleGenerate = async () => {
    if (isAnonymous) {
      setError(t("errors.loginRequired"));
      return;
    }

    if (!modelImage || activeGarments.length === 0) {
      setError(t("errors.missingImages"));
      return;
    }

    if (remainingToday <= 0) {
      setError(t("errors.limitReached"));
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const payload = createTryOnPayload({
        tier: entitlement.tier,
        modelImage,
        garmentImages: activeGarments,
      });

      const response = await fetch("/api/try-on/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          modelImage,
          garmentImages: payload.images.slice(1),
        }),
      });

      const data = (await response.json()) as TryOnResponse;
      if (!response.ok || !data.url) {
        throw new Error(data.error || t("errors.generate"));
      }

      setResultUrl(data.url);
      if (data.entitlement) {
        setEntitlement(data.entitlement);
      }
      if (typeof data.usedToday === "number") {
        setUsedToday(data.usedToday);
      }
      if (typeof data.remainingToday === "number") {
        setRemainingToday(data.remainingToday);
      }
    } catch (generateError: unknown) {
      setError(getErrorMessage(generateError, t("errors.generate")));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mt-8 w-full max-w-5xl rounded-2xl border border-border bg-background/90 p-4 shadow-2xl backdrop-blur sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-medium text-foreground">
          {isAnonymous ? t("status.anonymous") : t(`tiers.${entitlement.tier}`)}
        </div>
        <div className="text-xs leading-5 text-muted-foreground sm:text-right">
          <p>{t("rules.free")}</p>
          <p>{t("rules.paid")}</p>
          {!isAnonymous && (
            <p>{t("rules.remaining", { remaining: remainingToday, used: usedToday })}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="min-h-[300px]">
          <input
            ref={modelInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleUpload(event, "model")}
          />
          <UploadPanel
            title={t("model.title")}
            helper={t("model.helper")}
            image={modelImage}
            onClick={() => modelInputRef.current?.click()}
            onRemove={() => setModelImage(null)}
          />
        </div>

        <div className="grid gap-3">
          {garmentImages.map((image, index) => {
            const disabled = index >= entitlement.garmentLimit;
            return (
              <div key={index} className="min-h-[92px]">
                <input
                  ref={(node) => {
                    garmentInputRefs.current[index] = node;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={disabled}
                  onChange={(event) => handleUpload(event, index as UploadSlot)}
                />
                <UploadPanel
                  title={t(`garments.${index}.title`)}
                  helper={disabled ? t("garments.locked") : t(`garments.${index}.helper`)}
                  image={image}
                  disabled={disabled}
                  compact
                  onClick={() => garmentInputRefs.current[index]?.click()}
                  onRemove={() => removeGarment(index)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_260px] lg:items-stretch">
        <div className="rounded-xl border border-border bg-secondary p-4">
          <p className="text-sm font-medium text-foreground">{t("result.title")}</p>
          <div className="relative mt-3 flex min-h-[112px] items-center justify-center overflow-hidden rounded-lg bg-background">
            {resultUrl ? (
              <Image
                src={resultUrl}
                alt={t("result.alt")}
                fill
                sizes="(max-width: 1024px) 100vw, 520px"
                className="object-contain"
                unoptimized
              />
            ) : (
              <p className="max-w-sm text-center text-sm text-muted-foreground">
                {t("result.empty")}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-secondary p-4">
          <div>
            <p className="text-sm font-medium text-foreground">{t("settings.title")}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {entitlement.watermark ? t("settings.watermarkOn") : t("settings.watermarkOff")}
            </p>
            {isAnonymous && (
              <button
                type="button"
                onClick={() => router.push(`/${locale}/login`)}
                className="mt-3 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {t("generate.login")}
              </button>
            )}
          </div>
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full justify-center gap-2"
          >
            <Loader2
              data-icon-state="loading"
              className={`h-4 w-4 ${isGenerating ? "animate-spin" : "hidden"}`}
            />
            <Sparkles
              data-icon-state="idle"
              className={`h-4 w-4 ${isGenerating ? "hidden" : ""}`}
            />
            {isGenerating ? t("generate.loading") : t("generate.button")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function getEntitlementFromTier(tier: TryOnTier): TryOnEntitlement {
  const limits = getTryOnLimits(tier);

  return {
    tier,
    dailyLimit: limits.dailyGenerations,
    garmentLimit: limits.garmentLimit,
    watermark: limits.watermark,
  };
}

type UploadPanelProps = {
  title: string;
  helper: string;
  image?: string | null;
  disabled?: boolean;
  compact?: boolean;
  onClick: () => void;
  onRemove: () => void;
};

function UploadPanel({
  title,
  helper,
  image,
  disabled,
  compact,
  onClick,
  onRemove,
}: UploadPanelProps) {
  return (
    <div
      className={`relative h-full min-h-full overflow-hidden rounded-xl border border-dashed ${
        disabled ? "border-border bg-muted/50" : "border-neutral-300 bg-background"
      }`}
    >
      {image ? (
        <>
          <Image
            src={image}
            alt={title}
            fill
            sizes={compact ? "300px" : "520px"}
            className="object-contain"
            unoptimized
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm transition hover:bg-background"
            aria-label={`Remove ${title}`}
          >
            <X className="h-4 w-4" />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className="flex h-full w-full flex-col items-center justify-center gap-3 px-4 py-6 text-center transition hover:bg-secondary disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Upload className="h-5 w-5" />
          </span>
          <span className="text-base font-medium text-foreground">{title}</span>
          <span className="text-sm text-muted-foreground">{helper}</span>
        </button>
      )}
    </div>
  );
}
