import Link from "next/link";
import type { ReactNode } from "react";

import { ArrowLeftIcon } from "./icons";
import { SiteFooter } from "./site-footer";

/** Moldura das páginas informativas: voltar ao início, h1 único e rodapé. */
export function PageShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6">
        <Link
          href="/"
          className="inline-flex min-h-12 items-center gap-2 self-start text-agua underline underline-offset-4"
        >
          <ArrowLeftIcon />
          Voltar ao início
        </Link>
        <h1 className="text-[1.75rem] leading-tight font-bold">{title}</h1>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
