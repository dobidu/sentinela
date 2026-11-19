import Link from "next/link";

const LINKS = [
  { href: "/sobre", label: "Sobre" },
  { href: "/privacidade", label: "Como usamos seus dados" },
  { href: "/como-reconhecer", label: "Como reconhecer um foco" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-lg border-t border-line px-4 py-4">
      <nav aria-label="Rodapé">
        <ul className="flex flex-wrap gap-x-4">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="inline-flex min-h-12 items-center text-base text-agua underline underline-offset-4"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}
