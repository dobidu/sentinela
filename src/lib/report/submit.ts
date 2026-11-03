import { getClient, type SentinelaClient } from "@/lib/supabase/client";

import type { BreedingSiteType } from "./breeding-sites";
import { getDeviceToken } from "./device-token";
import {
  classifyRpcError,
  classifyStorageError,
  isAlreadyUploaded,
  MESSAGES,
  ReportError,
} from "./errors";
import type { PreparedPhoto } from "./photo";

export const PHOTO_BUCKET = "report-photos";
const MAX_PHOTO_RETRIES = 3;

export type ReportInput = {
  photo: Pick<PreparedPhoto, "blob" | "ext" | "contentType">;
  lon: number;
  lat: number;
  type: BreedingSiteType;
  description?: string | null;
};

/**
 * Estado de uma tentativa. Em erro de rede a UI guarda e devolve este objeto:
 * a retentativa reusa o mesmo nome de foto e o mesmo token, e o submit_report
 * devolve o mesmo id (idempotência do 02-01). Nome novo só em PT404/PT409.
 */
export type SubmitAttempt = { photoPath: string; uploaded: boolean };

export type SubmitResult =
  | { ok: true; reportId: string }
  | { ok: false; error: ReportError; attempt: SubmitAttempt };

type SubmitOptions = {
  client?: SentinelaClient | null;
  token?: string;
  attempt?: SubmitAttempt;
  newId?: () => string;
};

export async function submitReport(
  input: ReportInput,
  options: SubmitOptions = {},
): Promise<SubmitResult> {
  const newId = options.newId ?? (() => crypto.randomUUID());
  const newAttempt = (): SubmitAttempt => ({
    photoPath: `${newId()}.${input.photo.ext}`,
    uploaded: false,
  });
  let attempt = options.attempt ?? newAttempt();

  const client = options.client === undefined ? getClient() : options.client;
  if (!client) {
    return {
      ok: false,
      error: new ReportError("not_configured", MESSAGES.not_configured, false),
      attempt,
    };
  }
  const token = options.token ?? getDeviceToken();
  const description = input.description?.trim() || undefined;

  for (let photoRetries = 0; ; photoRetries++) {
    if (!attempt.uploaded) {
      const { error } = await client.storage
        .from(PHOTO_BUCKET)
        .upload(attempt.photoPath, input.photo.blob, {
          contentType: input.photo.contentType,
          upsert: false,
        });
      if (error && !isAlreadyUploaded(error)) {
        return { ok: false, error: classifyStorageError(error), attempt };
      }
      attempt = { ...attempt, uploaded: true };
    }

    const { data, error, status } = await client.rpc("submit_report", {
      p_reporter_token: token,
      p_lon: input.lon,
      p_lat: input.lat,
      p_breeding_site_type: input.type,
      p_photo_path: attempt.photoPath,
      p_description: description,
    });
    if (!error && data) return { ok: true, reportId: data };

    const classified = error
      ? classifyRpcError(error, status)
      : new ReportError("unknown", MESSAGES.unknown, true);
    const photoProblem =
      classified.kind === "photo_missing" || classified.kind === "photo_conflict";
    if (photoProblem && photoRetries < MAX_PHOTO_RETRIES) {
      attempt = newAttempt();
      continue;
    }
    return { ok: false, error: classified, attempt };
  }
}
