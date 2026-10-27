"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { CameraIcon, EyeIcon } from "@/app/_components/icons";
import { Button, ErrorMessage, Notice, PrivacyLink } from "@/app/_components/ui";
import { browserCodec, PhotoError, PHOTO_MESSAGES, preparePhoto } from "@/lib/report/photo";

import { useReportDraft } from "../report-draft";

// Passo 1 de 3 (spec §6.3 / P-02).
export default function PhotoStep() {
  const router = useRouter();
  const { draft, setPhoto } = useReportDraft();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (!file) return;
    setError(null);
    setPreparing(true);
    try {
      setPhoto(await preparePhoto(file, browserCodec));
    } catch (err) {
      setError(err instanceof PhotoError ? err.message : PHOTO_MESSAGES.metadata);
    } finally {
      setPreparing(false);
    }
  }

  const inputs = (
    <>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={onFile}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={onFile}
      />
    </>
  );

  if (draft.photoUrl && !preparing) {
    return (
      <>
        <h1 className="text-[1.75rem] leading-tight font-bold">Esta foto está boa?</h1>
        {/* eslint-disable-next-line @next/next/no-img-element -- object URL local */}
        <img
          src={draft.photoUrl}
          alt="Prévia da foto do local"
          className="aspect-[4/3] w-full rounded-[var(--radius-card)] border-[1.5px] border-ink/12 object-cover"
        />
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <div className="mt-auto flex flex-col gap-3">
          <Button onClick={() => router.push("/relatar/local")}>Usar esta foto</Button>
          <Button variant="secondary" onClick={() => cameraRef.current?.click()}>
            Tirar outra
          </Button>
          <PrivacyLink />
        </div>
        {inputs}
      </>
    );
  }

  return (
    <>
      <h1 className="text-[1.75rem] leading-tight font-bold">
        Fotografe o local com água parada
      </h1>
      <Notice icon={<EyeIcon />}>
        Fotografe só o recipiente ou o local. Evite pessoas, rostos, placas de carro e
        números de casa.
      </Notice>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <div className="mt-auto flex flex-col gap-3" aria-busy={preparing}>
        {preparing ? (
          <p role="status" className="text-center font-bold text-agua">
            Preparando foto…
          </p>
        ) : null}
        <Button disabled={preparing} onClick={() => cameraRef.current?.click()}>
          <CameraIcon />
          Abrir câmera
        </Button>
        <Button
          variant="secondary"
          disabled={preparing}
          onClick={() => galleryRef.current?.click()}
        >
          Escolher da galeria
        </Button>
        <PrivacyLink />
      </div>
      {inputs}
    </>
  );
}
