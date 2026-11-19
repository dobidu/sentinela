import type { Metadata } from "next";

import { PageShell } from "@/app/_components/page-shell";
import { RecognizeGuide } from "@/app/_components/recognize";
import { ButtonLink } from "@/app/_components/ui";

export const metadata: Metadata = {
  title: "Como reconhecer um foco · Sentinela",
  description: "Os 8 tipos de lugar onde a água parada vira foco do mosquito, e o que fazer.",
};

// P-14 (spec §13.5).
export default function RecognizePage() {
  return (
    <PageShell title="Como reconhecer um foco">
      <p>
        O mosquito põe ovos em água parada e limpa. Em uma semana eles viram mosquitos. Veja
        onde isso costuma acontecer.
      </p>
      <RecognizeGuide />
      <ButtonLink href="/relatar/foto">Relatar foco</ButtonLink>
    </PageShell>
  );
}
