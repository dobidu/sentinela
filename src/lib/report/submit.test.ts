import { describe, expect, it } from "vitest";

import type { SentinelaClient } from "@/lib/supabase/client";

import { PHOTO_BUCKET, submitReport, type ReportInput } from "./submit";

const TOKEN = "00000000-0000-4000-8000-000000000001";
const REPORT_ID = "11111111-1111-4111-8111-111111111111";

type UploadReply = { error: { status?: number; message: string; name?: string } | null };
type RpcReply = {
  data: string | null;
  error: { code: string; message: string } | null;
  status: number;
};

/** Cliente falso: responde em fila e registra as chamadas. */
function fakeClient(uploads: UploadReply[], rpcs: RpcReply[]) {
  const calls = {
    uploads: [] as Array<{ bucket: string; path: string; contentType?: string; upsert?: boolean }>,
    rpcs: [] as Array<{ fn: string; args: Record<string, unknown> }>,
  };
  const client = {
    storage: {
      from(bucket: string) {
        return {
          async upload(path: string, _blob: Blob, opts: { contentType?: string; upsert?: boolean }) {
            calls.uploads.push({ bucket, path, ...opts });
            return { data: null, ...(uploads.shift() ?? { error: null }) };
          },
        };
      },
    },
    async rpc(fn: string, args: Record<string, unknown>) {
      calls.rpcs.push({ fn, args });
      return rpcs.shift() ?? { data: REPORT_ID, error: null, status: 200 };
    },
  };
  return { client: client as unknown as SentinelaClient, calls };
}

let counter = 0;
const newId = () => `aaaaaaaa-aaaa-4aaa-8aaa-${String(++counter).padStart(12, "0")}`;

const input: ReportInput = {
  photo: { blob: new Blob(["x"], { type: "image/webp" }), ext: "webp", contentType: "image/webp" },
  lon: -34.8641,
  lat: -7.1195,
  type: "pneu",
  description: "  ",
};

const ok = (): RpcReply => ({ data: REPORT_ID, error: null, status: 200 });
const fail = (code: string, status: number): RpcReply => ({
  data: null,
  error: { code, message: `relato: ${code}` },
  status,
});
const networkRpc = (): RpcReply => ({
  data: null,
  error: { code: "", message: "TypeError: Failed to fetch" },
  status: 0,
});

describe("submitReport", () => {
  it("sobe a foto e chama submit_report com o contrato na ordem certa", async () => {
    const { client, calls } = fakeClient([], [ok()]);
    const result = await submitReport(input, { client, token: TOKEN, newId });

    expect(result).toEqual({ ok: true, reportId: REPORT_ID });
    expect(calls.uploads).toHaveLength(1);
    const [upload] = calls.uploads;
    expect(upload.bucket).toBe(PHOTO_BUCKET);
    expect(upload.path).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(webp|jpg)$/,
    );
    expect(upload).toMatchObject({ contentType: "image/webp", upsert: false });
    expect(calls.rpcs).toEqual([
      {
        fn: "submit_report",
        args: {
          p_reporter_token: TOKEN,
          p_lon: input.lon,
          p_lat: input.lat,
          p_breeding_site_type: "pneu",
          p_photo_path: upload.path,
          p_description: undefined,
        },
      },
    ]);
  });

  it("rede cai depois do upload: a 2ª tentativa reusa o nome e não sobe outra foto", async () => {
    const first = fakeClient([], [networkRpc()]);
    const failed = await submitReport(input, { client: first.client, token: TOKEN, newId });

    expect(failed.ok).toBe(false);
    if (failed.ok) return;
    expect(failed.error.kind).toBe("network");
    expect(failed.attempt.uploaded).toBe(true);

    const second = fakeClient([], [ok()]);
    const retried = await submitReport(input, {
      client: second.client,
      token: TOKEN,
      newId,
      attempt: failed.attempt,
    });

    expect(retried).toEqual({ ok: true, reportId: REPORT_ID });
    expect(second.calls.uploads).toHaveLength(0);
    expect(second.calls.rpcs[0].args.p_photo_path).toBe(failed.attempt.photoPath);
  });

  it("rede cai no upload: retentativa reusa o nome e aceita 'já existe'", async () => {
    const first = fakeClient([{ error: { name: "StorageUnknownError", message: "Failed to fetch" } }], []);
    const failed = await submitReport(input, { client: first.client, token: TOKEN, newId });

    expect(failed.ok).toBe(false);
    if (failed.ok) return;
    expect(failed.attempt.uploaded).toBe(false);

    const second = fakeClient([{ error: { status: 409, message: "The resource already exists" } }], [ok()]);
    const retried = await submitReport(input, {
      client: second.client,
      token: TOKEN,
      newId,
      attempt: failed.attempt,
    });

    expect(retried.ok).toBe(true);
    expect(second.calls.uploads[0].path).toBe(failed.attempt.photoPath);
  });

  it("PT404 reenvia a foto com nome novo", async () => {
    const { client, calls } = fakeClient([], [fail("PT404", 404), ok()]);
    const result = await submitReport(input, { client, token: TOKEN, newId });

    expect(result.ok).toBe(true);
    expect(calls.uploads).toHaveLength(2);
    expect(calls.uploads[0].path).not.toBe(calls.uploads[1].path);
    expect(calls.rpcs[1].args.p_photo_path).toBe(calls.uploads[1].path);
  });

  it("PT409 gera nome novo e tenta de novo", async () => {
    const { client, calls } = fakeClient([], [fail("PT409", 409), ok()]);
    const result = await submitReport(input, { client, token: TOKEN, newId });

    expect(result.ok).toBe(true);
    expect(calls.uploads).toHaveLength(2);
  });

  it("PT404 persistente desiste depois de 3 reenvios", async () => {
    const { client, calls } = fakeClient(
      [],
      [fail("PT404", 404), fail("PT404", 404), fail("PT404", 404), fail("PT404", 404)],
    );
    const result = await submitReport(input, { client, token: TOKEN, newId });

    expect(result.ok).toBe(false);
    expect(calls.uploads).toHaveLength(4);
    if (!result.ok) expect(result.error.kind).toBe("photo_missing");
  });

  it("PT422 e PT429 sobem classificados sem nova tentativa", async () => {
    const outside = fakeClient([], [{ data: null, error: { code: "PT422", message: "relato: local fora dos municípios atendidos" }, status: 422 }]);
    const limited = fakeClient([], [fail("PT429", 429)]);

    const a = await submitReport(input, { client: outside.client, token: TOKEN, newId });
    const b = await submitReport(input, { client: limited.client, token: TOKEN, newId });

    expect(a.ok === false && a.error.kind).toBe("outside_area");
    expect(b.ok === false && b.error.kind).toBe("rate_limited");
    expect(outside.calls.rpcs).toHaveLength(1);
    expect(limited.calls.rpcs).toHaveLength(1);
  });

  it("descrição é aparada e enviada quando há texto", async () => {
    const { client, calls } = fakeClient([], [ok()]);
    await submitReport({ ...input, description: "  perto do portão  " }, { client, token: TOKEN, newId });

    expect(calls.rpcs[0].args.p_description).toBe("perto do portão");
  });

  it("sem Supabase configurado não faz request", async () => {
    const result = await submitReport(input, { client: null, token: TOKEN, newId });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("not_configured");
  });
});
