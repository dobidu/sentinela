import { BreedingSiteIcon } from "@/app/_components/icons";
import { BREEDING_SITES, type BreedingSiteType } from "@/lib/report/breeding-sites";

// Conteúdo do P-14 "Como reconhecer um foco" (spec §13.5), em linguagem simples.
// Usado na página /como-reconhecer e na folha "Não sei o tipo?" do passo 3.
const GUIDE: Record<BreedingSiteType, { where: string; todo: string }> = {
  pneu: {
    where: "Borracharias, terrenos baldios e quintais. Junta água da chuva por dentro.",
    todo: "Guarde em lugar coberto ou fure para a água escorrer.",
  },
  caixa_dagua: {
    where: "Caixas d'água, tonéis e tambores sem tampa ou com tampa quebrada.",
    todo: "Tampe bem. Se não tiver tampa, cubra com tela fina.",
  },
  vaso_planta: {
    where: "Pratinhos embaixo de vasos e plantas que acumulam água, como bromélias.",
    todo: "Encha o prato com areia ou lave toda semana, escovando a borda.",
  },
  calha: {
    where: "Calhas entupidas por folhas e lajes ou marquises com poça.",
    todo: "Limpe a calha e tire a água parada da laje.",
  },
  piscina: {
    where: "Piscinas, fontes e espelhos d'água sem tratamento ou abandonados.",
    todo: "Trate a água com cloro ou esvazie e cubra.",
  },
  lixo_entulho: {
    where: "Lixo acumulado, entulho de obra, sacos e plásticos que formam poças.",
    todo: "Descarte no lixo fechado ou no ponto de entulho da prefeitura.",
  },
  recipiente_diverso: {
    where: "Garrafas, baldes, latas, potes e brinquedos deixados ao ar livre.",
    todo: "Vire de boca para baixo ou jogue fora.",
  },
  outro: {
    where: "Qualquer lugar com água parada por mais de uma semana: ralos, bebedouros de animais, lonas.",
    todo: "Troque a água, tampe o ralo ou estique a lona.",
  },
};

export function RecognizeGuide({ headingLevel = 2 }: { headingLevel?: 2 | 3 }) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div className="flex flex-col gap-4">
      <ul className="grid gap-3 sm:grid-cols-2">
        {BREEDING_SITES.map((site) => (
          <li
            key={site.value}
            className="flex flex-col gap-2 rounded-[var(--radius-card)] border-[1.5px] border-ink/12 bg-surface p-4"
          >
            <Heading className="flex items-center gap-2 text-lg font-bold">
              <BreedingSiteIcon type={site.value} width={32} height={32} className="text-agua" />
              {site.label}
            </Heading>
            <p className="text-base">
              <span className="font-bold">Onde costuma aparecer: </span>
              {GUIDE[site.value].where}
            </p>
            <p className="text-base">
              <span className="font-bold">O que fazer: </span>
              {GUIDE[site.value].todo}
            </p>
          </li>
        ))}
      </ul>
      <p className="rounded-[var(--radius-card)] border-[1.5px] border-terracota p-3 text-base font-bold text-terracota">
        Não mexa em propriedade alheia: relate.
      </p>
    </div>
  );
}
