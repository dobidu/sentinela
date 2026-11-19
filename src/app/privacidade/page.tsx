import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PageShell } from "@/app/_components/page-shell";

export const metadata: Metadata = {
  title: "Como usamos seus dados · Sentinela",
  description: "Aviso de privacidade do Sentinela, em duas camadas.",
};

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="flex scroll-mt-4 flex-col gap-2">
      <h3 id={`${id}-titulo`} className="text-lg font-bold">
        {title}
      </h3>
      {children}
    </section>
  );
}

const SECTIONS = [
  { id: "controlador", title: "Quem é responsável" },
  { id: "dados", title: "Que dados coletamos" },
  { id: "finalidade", title: "Para que usamos" },
  { id: "compartilhamento", title: "Com quem compartilhamos" },
  { id: "retencao", title: "Por quanto tempo guardamos" },
  { id: "direitos", title: "Seus direitos" },
  { id: "contato", title: "Contato" },
] as const;

// Aviso em camadas (spec §6.9 / P-13): 1ª camada no topo; a 2ª abre em
// "Ler política completa" (funciona sem JavaScript).
export default function PrivacyPage() {
  return (
    <PageShell title="Como usamos seus dados">
      <ul className="flex list-disc flex-col gap-3 pl-6">
        <li>Não pedimos nome nem telefone.</li>
        <li>
          Um código aleatório identifica só o aparelho, para evitar spam. Guardamos dele
          apenas uma versão embaralhada.
        </li>
        <li>A foto fica em área privada, vista só pela equipe de saúde.</li>
        <li>
          A localização exata é vista só pela equipe. O público vê apenas áreas de cerca
          de 100 m.
        </li>
        <li>Finalidade: vigilância em saúde, para achar e eliminar focos do mosquito.</li>
      </ul>

      <section
        aria-labelledby="nao-oficial"
        className="flex flex-col gap-2 rounded-[var(--radius-card)] border-[1.5px] border-terracota p-4"
      >
        <h2 id="nao-oficial" className="text-xl font-bold text-terracota">
          Não é canal oficial
        </h2>
        <p>
          O Sentinela é um projeto acadêmico do LAVID/UFPB. Não é um canal oficial da
          prefeitura e não substitui o serviço de vigilância em saúde do seu município.
        </p>
      </section>

      <details className="group rounded-[var(--radius-card)] border-[1.5px] border-ink/12 bg-surface">
        <summary className="flex min-h-12 cursor-pointer items-center px-4 font-bold text-agua underline underline-offset-4">
          Ler política completa
        </summary>
        <div className="flex flex-col gap-6 px-4 pb-4">
          <h2 className="text-xl font-bold">Política de privacidade</h2>
          <nav aria-label="Seções da política">
            <ul className="flex flex-col">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="inline-flex min-h-12 items-center text-base text-agua underline"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <Section id="controlador" title="Quem é responsável">
            <p>
              O Sentinela é um projeto acadêmico do LAVID (Laboratório de Aplicações de Vídeo
              Digital) da Universidade Federal da Paraíba (UFPB). Responsável: Carlos Eduardo
              Batista.
            </p>
          </Section>

          <Section id="dados" title="Que dados coletamos">
            <ul className="flex list-disc flex-col gap-2 pl-6">
              <li>
                <span className="font-bold">Foto</span> do local com água parada. Tiramos dela
                os dados escondidos do arquivo (EXIF), como o modelo do celular e o GPS.
              </li>
              <li>
                <span className="font-bold">Ponto no mapa</span> onde está o foco.
              </li>
              <li>
                <span className="font-bold">Tipo de foco</span> e, se você quiser, uma
                descrição curta.
              </li>
              <li>
                <span className="font-bold">Código do aparelho</span>: um número aleatório
                criado no seu celular. Guardamos só uma versão embaralhada (hash), que serve
                para limitar o número de relatos e evitar spam.
              </li>
            </ul>
            <p>
              Enquanto você move o mapa, o ponto é enviado ao servidor só para descobrir o
              município. Ele não é guardado até você enviar o relato.
            </p>
            <p>Não coletamos nome, telefone, e-mail nem endereço.</p>
          </Section>

          <Section id="finalidade" title="Para que usamos">
            <p>
              Para vigilância em saúde: somar os relatos em áreas de risco, mostrar essas áreas
              à equipe de saúde e, em mapa público, apenas em áreas de cerca de 100 m. Os dados
              também são usados na pesquisa acadêmica que avalia o sistema, sem identificar
              ninguém.
            </p>
            <p>
              Base legal: realização de estudos por órgão de pesquisa (Lei Geral de Proteção de
              Dados, art. 7º, inciso IV).
            </p>
          </Section>

          <Section id="compartilhamento" title="Com quem compartilhamos">
            <p>
              Não vendemos nem cedemos os dados. Usamos dois serviços que guardam e entregam o
              sistema em nosso nome (operadores):
            </p>
            <ul className="flex list-disc flex-col gap-2 pl-6">
              <li>Supabase: banco de dados e fotos, em servidores em São Paulo.</li>
              <li>Vercel: hospedagem do site.</li>
            </ul>
            <p>
              A equipe de saúde vê o ponto exato e a foto. O público vê só áreas de cerca de
              100 m, sem foto.
            </p>
          </Section>

          <Section id="retencao" title="Por quanto tempo guardamos">
            <p>Em definição. Esta página será atualizada antes do uso em campo.</p>
          </Section>

          <Section id="direitos" title="Seus direitos">
            <p>
              Você pode pedir informação, correção ou exclusão dos dados (Lei Geral de Proteção
              de Dados, art. 18). Como não pedimos identificação, só conseguimos achar um
              relato se você contar a data, o local e o tipo aproximados.
            </p>
          </Section>

          <Section id="contato" title="Contato">
            <p>
              Escreva para{" "}
              <a href="mailto:bidu@lavid.ufpb.br" className="text-agua underline">
                bidu@lavid.ufpb.br
              </a>
              .
            </p>
          </Section>
        </div>
      </details>
    </PageShell>
  );
}
