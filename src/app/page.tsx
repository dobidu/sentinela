import Link from "next/link";

import { BreedingSiteIcon, DropIcon, LockIcon } from "@/app/_components/icons";
import { SiteFooter } from "@/app/_components/site-footer";
import { ButtonLink } from "@/app/_components/ui";

// P-01 Início (spec §6.2 / §13.5), só com o que existe no MVP: sem mini-mapa de
// risco (fases 3/4) nem "Meus relatos" e banner da fila (02-04).
export default function Home() {
  return (
    <>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-10">
        <div className="flex items-center gap-2 text-agua">
          <DropIcon width={36} height={36} />
          <h1 className="text-4xl font-extrabold text-ink">Sentinela</h1>
        </div>
        <p className="text-xl">
          Viu água parada que pode virar foco do mosquito? Avise a vigilância em menos de
          um minuto.
        </p>

        <Link
          href="/como-reconhecer"
          className="flex min-h-12 items-center gap-3 rounded-[var(--radius-card)] border-[1.5px] border-ink/12 bg-surface p-4"
        >
          <BreedingSiteIcon type="pneu" width={32} height={32} className="shrink-0 text-agua" />
          <span className="flex flex-col">
            <span className="font-bold">Como reconhecer um foco</span>
            <span className="text-base text-ink-muted">
              Pneus, vasos, calhas e outros lugares com água parada.
            </span>
          </span>
        </Link>

        <div className="mt-auto flex flex-col gap-3">
          <ButtonLink href="/relatar/foto">Relatar foco</ButtonLink>
          <p className="flex items-center justify-center gap-2 text-base text-ink-muted">
            <LockIcon />
            Sem cadastro. Você não precisa se identificar.
          </p>
        </div>

        <Link
          href="/sobre"
          className="inline-flex min-h-12 items-center justify-center text-center text-base text-ink-muted underline underline-offset-4"
        >
          Projeto acadêmico — não é um canal oficial da prefeitura
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
