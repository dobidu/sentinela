// Prepara a foto no aparelho: valida, reduz o maior lado, re-encoda em WebP
// (ou JPEG) e garante que não sobra EXIF. O re-encode em canvas descarta os
// metadados da câmera, inclusive o GPS da foto (LGPD).

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // limite do bucket report-photos
export const TARGET_BYTES = 600 * 1024; // alvo da spec: ~300–500 KB
const STEPS: ReadonlyArray<{ maxSide: number; quality: number }> = [
  { maxSide: 1600, quality: 0.8 },
  { maxSide: 1600, quality: 0.7 },
  { maxSide: 1280, quality: 0.7 },
  { maxSide: 1280, quality: 0.6 },
  { maxSide: 1024, quality: 0.6 },
];

export type PhotoExt = "webp" | "jpg";

export type PreparedPhoto = {
  blob: Blob;
  ext: PhotoExt;
  contentType: "image/webp" | "image/jpeg";
  width: number;
  height: number;
};

export type PhotoErrorKind = "not_image" | "too_large" | "metadata";

export class PhotoError extends Error {
  constructor(readonly kind: PhotoErrorKind) {
    super(PHOTO_MESSAGES[kind]);
    this.name = "PhotoError";
  }
}

export const PHOTO_MESSAGES: Record<PhotoErrorKind, string> = {
  not_image:
    "Esse arquivo não é uma foto. Tente de novo. Se veio da galeria, experimente tirar a foto pela câmera.",
  too_large: "Não conseguimos diminuir essa foto. Tente tirar outra.",
  metadata: "Não conseguimos preparar essa foto. Tente tirar outra.",
};

export type DecodedImage = {
  width: number;
  height: number;
  close(): void;
};

/** Ponte com o navegador; injetável para testar sem canvas (jsdom). */
export interface ImageCodec<T extends DecodedImage = DecodedImage> {
  decode(file: Blob): Promise<T>;
  encode(
    image: T,
    width: number,
    height: number,
    type: "image/webp" | "image/jpeg",
    quality: number,
  ): Promise<Blob | null>;
}

export function fitWithin(
  width: number,
  height: number,
  maxSide: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxSide) return { width, height };
  const scale = maxSide / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

const EXIF_HEADER = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00]; // "Exif\0\0"
const WEBP_EXIF_CHUNK = [0x45, 0x58, 0x49, 0x46]; // "EXIF"

function indexOf(bytes: Uint8Array, needle: number[]): number {
  outer: for (let i = 0; i <= bytes.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (bytes[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}

/** Detecta bloco EXIF (APP1 do JPEG ou chunk EXIF do WebP). */
export async function hasExif(blob: Blob): Promise<boolean> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return indexOf(bytes, EXIF_HEADER) !== -1 || indexOf(bytes, WEBP_EXIF_CHUNK) !== -1;
}

export async function preparePhoto<T extends DecodedImage>(
  file: Blob,
  codec: ImageCodec<T>,
): Promise<PreparedPhoto> {
  // Alguns Android mandam type vazio; nesse caso a decodificação decide.
  if (file.type && !file.type.startsWith("image/")) {
    throw new PhotoError("not_image");
  }

  let image: T;
  try {
    image = await codec.decode(file);
  } catch {
    // Ex.: HEIC da galeria do iPhone num navegador que não decodifica HEIC.
    throw new PhotoError("not_image");
  }

  try {
    let best: PreparedPhoto | null = null;
    let useJpeg = false;
    for (const step of STEPS) {
      const size = fitWithin(image.width, image.height, step.maxSide);
      const type = useJpeg ? "image/jpeg" : "image/webp";
      let blob = await codec.encode(image, size.width, size.height, type, step.quality);
      // Navegador sem encoder WebP devolve PNG (ou null): cai para JPEG.
      if (!useJpeg && (!blob || blob.type !== "image/webp")) {
        useJpeg = true;
        blob = await codec.encode(image, size.width, size.height, "image/jpeg", step.quality);
      }
      if (!blob || blob.type !== (useJpeg ? "image/jpeg" : "image/webp")) {
        throw new PhotoError("metadata");
      }
      const candidate: PreparedPhoto = useJpeg
        ? { blob, ext: "jpg", contentType: "image/jpeg", ...size }
        : { blob, ext: "webp", contentType: "image/webp", ...size };
      if (blob.size <= MAX_UPLOAD_BYTES && (!best || blob.size < best.blob.size)) {
        best = candidate;
      }
      if (blob.size <= TARGET_BYTES) break;
    }

    if (!best) throw new PhotoError("too_large");
    // Garantia de LGPD: nunca subir foto com metadados da câmera.
    if (await hasExif(best.blob)) throw new PhotoError("metadata");
    return best;
  } finally {
    image.close();
  }
}

type BrowserImage = DecodedImage & { bitmap: ImageBitmap };

/** Codec real: createImageBitmap + canvas. Só roda no navegador. */
export const browserCodec: ImageCodec<BrowserImage> = {
  async decode(file) {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    return {
      bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    };
  },
  async encode(image, width, height, type, quality) {
    if (typeof OffscreenCanvas !== "undefined") {
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(image.bitmap, 0, 0, width, height);
      try {
        return await canvas.convertToBlob({ type, quality });
      } catch {
        return null;
      }
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(image.bitmap, 0, 0, width, height);
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  },
};
