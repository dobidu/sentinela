import { describe, expect, it } from "vitest";

import {
  fitWithin,
  hasExif,
  MAX_UPLOAD_BYTES,
  PhotoError,
  preparePhoto,
  type DecodedImage,
  type ImageCodec,
} from "./photo";

// JPEG mínimo com segmento APP1 "Exif\0\0" (como sai da câmera, com GPS).
const JPEG_WITH_EXIF = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe1, 0x00, 0x10, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
  0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08, 0xff, 0xd9,
]);

type FakeImage = DecodedImage & { closed: boolean };

/**
 * Codec falso: em jsdom não há canvas. Ele reemite só "pixels" (bytes neutros),
 * como o canvas real faz. A garantia real de remoção de EXIF vem do re-encode
 * em canvas; aqui testamos a lógica e a checagem de segurança.
 */
function fakeCodec(options: {
  width?: number;
  height?: number;
  sizes?: number[];
  webp?: boolean;
  leakExif?: boolean;
  failDecode?: boolean;
}) {
  const calls: Array<{ width: number; height: number; type: string; quality: number }> = [];
  const images: FakeImage[] = [];
  let encodeCount = 0;
  const codec: ImageCodec<FakeImage> = {
    async decode() {
      if (options.failDecode) throw new Error("decode failed");
      const image: FakeImage = {
        width: options.width ?? 4000,
        height: options.height ?? 3000,
        closed: false,
        close() {
          this.closed = true;
        },
      };
      images.push(image);
      return image;
    },
    async encode(_image, width, height, type, quality) {
      calls.push({ width, height, type, quality });
      const size = options.sizes?.[encodeCount++] ?? 300 * 1024;
      const outType = type === "image/webp" && options.webp === false ? "image/png" : type;
      const body = new Uint8Array(size);
      if (options.leakExif) body.set(JPEG_WITH_EXIF.subarray(2, 12), 0);
      return new Blob([body], { type: outType });
    },
  };
  return { codec, calls, images };
}

const file = (type = "image/jpeg") => new Blob([JPEG_WITH_EXIF], { type });

describe("fitWithin", () => {
  it("reduz o maior lado mantendo a proporção", () => {
    expect(fitWithin(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3000, 4000, 1600)).toEqual({ width: 1200, height: 1600 });
  });

  it("não aumenta fotos pequenas", () => {
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });
});

describe("hasExif", () => {
  it("detecta o APP1 Exif de um JPEG de câmera", async () => {
    expect(await hasExif(new Blob([JPEG_WITH_EXIF]))).toBe(true);
  });

  it("não acusa bytes sem metadados", async () => {
    expect(await hasExif(new Blob([new Uint8Array(1024)]))).toBe(false);
  });
});

describe("preparePhoto", () => {
  it("recusa arquivo que não é imagem", async () => {
    const { codec } = fakeCodec({});

    await expect(preparePhoto(new Blob(["a"], { type: "application/pdf" }), codec)).rejects.toMatchObject({
      kind: "not_image",
    });
  });

  it("recusa imagem que o navegador não decodifica (ex.: HEIC)", async () => {
    const { codec } = fakeCodec({ failDecode: true });

    const error = await preparePhoto(file("image/heic"), codec).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(PhotoError);
    expect((error as PhotoError).kind).toBe("not_image");
    expect((error as PhotoError).message).toMatch(/não é uma foto/);
  });

  it("gera WebP com maior lado ≤ 1600 px, sem EXIF, e libera o bitmap", async () => {
    const { codec, calls, images } = fakeCodec({});
    const photo = await preparePhoto(file(), codec);

    expect(photo.ext).toBe("webp");
    expect(photo.contentType).toBe("image/webp");
    expect(Math.max(photo.width, photo.height)).toBeLessThanOrEqual(1600);
    expect(calls[0]).toMatchObject({ width: 1600, height: 1200, type: "image/webp" });
    expect(await hasExif(photo.blob)).toBe(false);
    expect(images[0].closed).toBe(true);
  });

  it("cai para JPEG quando o navegador não encoda WebP", async () => {
    const { codec } = fakeCodec({ webp: false });
    const photo = await preparePhoto(file(), codec);

    expect(photo.ext).toBe("jpg");
    expect(photo.contentType).toBe("image/jpeg");
  });

  it("reduz qualidade/tamanho até caber e escolhe a menor ≤ 2 MB", async () => {
    const big = 3 * 1024 * 1024;
    const { codec, calls } = fakeCodec({ sizes: [big, big, 1_500_000, 900_000, 700_000] });
    const photo = await preparePhoto(file(), codec);

    expect(calls).toHaveLength(5);
    expect(photo.blob.size).toBe(700_000);
    expect(photo.blob.size).toBeLessThanOrEqual(MAX_UPLOAD_BYTES);
  });

  it("falha se nada couber em 2 MB", async () => {
    const big = 3 * 1024 * 1024;
    const { codec, images } = fakeCodec({ sizes: [big, big, big, big, big] });

    await expect(preparePhoto(file(), codec)).rejects.toMatchObject({ kind: "too_large" });
    expect(images[0].closed).toBe(true);
  });

  it("recusa saída que ainda tenha EXIF (checagem de segurança)", async () => {
    const { codec } = fakeCodec({ leakExif: true });

    await expect(preparePhoto(file(), codec)).rejects.toMatchObject({ kind: "metadata" });
  });

  it("aceita type vazio quando a imagem decodifica (alguns Android)", async () => {
    const { codec } = fakeCodec({});

    await expect(preparePhoto(new Blob([JPEG_WITH_EXIF]), codec)).resolves.toMatchObject({ ext: "webp" });
  });
});
