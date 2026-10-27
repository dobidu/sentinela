import Link from "next/link";

import { DropIcon, LockIcon } from "@/app/_components/icons";
import { ButtonLink } from "@/app/_components/ui";

// Início provisório: o P-01 completo (mapa, como reconhecer, banner da fila)
// chega no plano 02-03.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex items-center gap-2 text-agua">
        <DropIcon width={36} height={36} />
        <h1 className="text-4xl font-extrabold text-ink">Sentinela</h1>
      </div>
      <p className="text-xl">
        Viu água parada que pode virar foco do mosquito? Avise a vigilância em menos de
        um minuto.
      </p>
      <div className="mt-auto flex flex-col gap-3">
        <ButtonLink href="/relatar/foto">Relatar foco</ButtonLink>
        <p className="flex items-center justify-center gap-2 text-base text-ink-muted">
          <LockIcon />
          Sem cadastro. Você não precisa se identificar.
        </p>
      </div>
      <p className="text-center text-base text-ink-muted">
        Projeto acadêmico do LAVID/UFPB — não é um canal oficial da prefeitura.{" "}
        <Link href="/privacidade" className="text-agua underline underline-offset-4">
          Como usamos seus dados
        </Link>
      </p>
    </main>
  );
}
