import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Como usamos seus dados · Sentinela",
};

// 1ª camada do aviso de privacidade (spec §6.9 / P-13). A política completa
// (2ª camada) e o visual final chegam no plano 02-03.
export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-8">
      <Link href="/" className="inline-flex min-h-12 items-center text-agua underline">
        Voltar ao início
      </Link>
      <h1 className="text-[1.75rem] leading-tight font-bold">Como usamos seus dados</h1>

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

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">Quem é responsável</h2>
        <p>
          O Sentinela é um projeto acadêmico do LAVID (Laboratório de Aplicações de Vídeo
          Digital) da Universidade Federal da Paraíba (UFPB). Responsável: Carlos Eduardo
          Batista. Contato:{" "}
          <a href="mailto:bidu@lavid.ufpb.br" className="text-agua underline">
            bidu@lavid.ufpb.br
          </a>
          .
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">Por quanto tempo guardamos</h2>
        <p>Em definição. Esta página será atualizada antes do uso em campo.</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">Não é canal oficial</h2>
        <p>
          O Sentinela não é um canal oficial da prefeitura e não substitui o serviço de
          vigilância em saúde do seu município.
        </p>
      </section>
    </main>
  );
}
