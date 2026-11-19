import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PageShell } from "@/app/_components/page-shell";
import { ButtonLink } from "@/app/_components/ui";

export const metadata: Metadata = {
  title: "Sobre · Sentinela",
  description: "O que é o Sentinela, como funciona e quem faz.",
};

const VERSION =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? process.env.npm_package_version ?? "dev";

// Ilustrações em traço de 2 px, uma cor plana, sem rostos (spec §5.4).
function Illustration({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width="64"
      height="64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="shrink-0 text-agua"
    >
      {children}
    </svg>
  );
}

const STEPS = [
  {
    title: "Você relata",
    text: "Tira uma foto da água parada, marca o local no mapa e diz o que viu. Leva menos de um minuto e não precisa de cadastro.",
    art: (
      <Illustration>
        <rect x="18" y="6" width="28" height="52" rx="5" />
        <rect x="23" y="14" width="18" height="22" rx="2" fill="var(--ocre)" fillOpacity="0.35" />
        <path d="M32 22c2.5 3.2 4 5.5 4 7.5a4 4 0 0 1-8 0c0-2 1.5-4.3 4-7.5Z" />
        <path d="M28 50h8" />
      </Illustration>
    ),
  },
  {
    title: "Agrupamos em áreas",
    text: "Os relatos próximos são somados em áreas de cerca de 100 m. Assim aparece onde há mais focos, sem expor a casa de ninguém.",
    art: (
      <Illustration>
        <path d="M8 8h48v48H8z" />
        <path d="M24 8v48M40 8v48M8 24h48M8 40h48" />
        <rect x="24" y="24" width="16" height="16" fill="var(--ocre)" fillOpacity="0.5" />
        <circle cx="30" cy="30" r="1.5" fill="currentColor" />
        <circle cx="35" cy="34" r="1.5" fill="currentColor" />
        <circle cx="45" cy="15" r="1.5" fill="currentColor" />
      </Illustration>
    ),
  },
  {
    title: "A vigilância age",
    text: "A equipe de saúde do município vê as áreas com mais relatos e decide onde mandar agentes primeiro.",
    art: (
      <Illustration>
        <path d="M10 14 24 8l16 6 14-6v42l-14 6-16-6-14 6Z" />
        <path d="M24 8v42M40 14v42" />
        <path d="M27 31l5 5 9-10" strokeWidth="3" />
      </Illustration>
    ),
  },
];

// P-11 (spec §13.5).
export default function AboutPage() {
  return (
    <PageShell title="Sobre o Sentinela">
      <p>
        O Sentinela é um jeito rápido de avisar onde há água parada que pode virar foco do
        mosquito da dengue, zika e chikungunya. Funciona em João Pessoa e Cabedelo.
      </p>

      <section aria-labelledby="como-funciona" className="flex flex-col gap-4">
        <h2 id="como-funciona" className="text-xl font-bold">
          Como funciona
        </h2>
        <ol className="flex flex-col gap-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex items-start gap-4">
              {step.art}
              <div>
                <h3 className="text-lg font-bold">
                  {i + 1}. {step.title}
                </h3>
                <p className="text-base">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="quem-faz" className="flex flex-col gap-2">
        <h2 id="quem-faz" className="text-xl font-bold">
          Quem faz
        </h2>
        <p>
          Projeto acadêmico do LAVID (Laboratório de Aplicações de Vídeo Digital) da
          Universidade Federal da Paraíba (UFPB). Responsável: Carlos Eduardo Batista. Contato:{" "}
          <a href="mailto:bidu@lavid.ufpb.br" className="text-agua underline">
            bidu@lavid.ufpb.br
          </a>
          .
        </p>
      </section>

      <section
        aria-labelledby="nao-oficial"
        className="flex flex-col gap-2 rounded-[var(--radius-card)] border-[1.5px] border-terracota p-4"
      >
        <h2 id="nao-oficial" className="text-xl font-bold text-terracota">
          Não é canal oficial
        </h2>
        <p>
          O Sentinela não é um serviço da prefeitura e não substitui a vigilância em saúde. Em
          caso de doença ou para pedir uma visita, procure a Secretaria de Saúde do seu
          município ou a unidade de saúde mais perto.
        </p>
      </section>

      <section aria-labelledby="codigo" className="flex flex-col gap-2">
        <h2 id="codigo" className="text-xl font-bold">
          Código aberto
        </h2>
        <p>
          O código está no{" "}
          <a href="https://github.com/dobidu/sentinela" className="text-agua underline">
            GitHub (dobidu/sentinela)
          </a>
          . Versão <span className="font-mono">{VERSION}</span>.
        </p>
      </section>

      <ButtonLink href="/relatar/foto">Relatar foco</ButtonLink>
    </PageShell>
  );
}
