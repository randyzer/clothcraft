import sharp from "sharp";
import { uploadImageBuffer } from "@/lib/r2-storage";

const DEFAULT_LABEL = "ClothCraft";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function createClothCraftWatermarkSvg({
  width,
  height,
  label = DEFAULT_LABEL,
}: {
  width: number;
  height: number;
  label?: string;
}) {
  const fontSize = Math.max(28, Math.round(Math.min(width, height) * 0.044));
  const padding = Math.round(fontSize * 1.1);
  const textWidth = Math.round(label.length * fontSize * 0.58);
  const boxWidth = textWidth + padding * 2;
  const boxHeight = Math.round(fontSize * 2.1);
  const x = Math.max(padding, width - boxWidth - padding);
  const y = Math.max(padding, height - boxHeight - padding);
  const radius = Math.round(boxHeight * 0.28);
  const textX = Math.round(x + padding);
  const textY = Math.round(y + boxHeight / 2 + fontSize * 0.35);

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(${x} ${y})">
    <rect width="${boxWidth}" height="${boxHeight}" rx="${radius}" fill="rgba(0,0,0,0.48)"/>
  </g>
  <text x="${textX}" y="${textY}" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="0">${escapeXml(label)}</text>
</svg>`;
}

export async function watermarkImageUrlToR2({
  imageUrl,
  userId,
  label = DEFAULT_LABEL,
}: {
  imageUrl: string;
  userId: string;
  label?: string;
}) {
  const response = await fetch(imageUrl, {
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch generated image: ${response.statusText}`);
  }

  const sourceBuffer = Buffer.from(await response.arrayBuffer());
  const image = sharp(sourceBuffer);
  const metadata = await image.metadata();
  const width = metadata.width ?? 1024;
  const height = metadata.height ?? 1024;
  const watermarkSvg = createClothCraftWatermarkSvg({ width, height, label });
  const outputBuffer = await image
    .composite([{ input: Buffer.from(watermarkSvg), top: 0, left: 0 }])
    .jpeg({ quality: 92 })
    .toBuffer();

  return uploadImageBuffer({
    buffer: outputBuffer,
    userId,
    type: "image",
    contentType: "image/jpeg",
    extension: "jpg",
  });
}
