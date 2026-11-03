import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";

import { AlertIcon, ShieldIcon } from "./icons";

// Botões com alvo ≥ 48 px (56 px no principal), raio de 14 px (§5.4, §9).
const base =
  "inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-button)] px-5 text-lg font-bold transition-colors duration-150 ease-out disabled:cursor-not-allowed";

const variants = {
  primary: `${base} min-h-14 bg-agua text-on-agua disabled:opacity-45`,
  secondary: `${base} min-h-12 border-[1.5px] border-agua text-agua bg-transparent disabled:opacity-45`,
} as const;

type Variant = keyof typeof variants;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${variants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${variants[variant]} ${className}`} {...props} />;
}

/** Aviso curto com ícone (privacidade, finalidade do GPS etc.). */
export function Notice({
  icon,
  children,
  tone = "muted",
}: {
  icon: ReactNode;
  children: ReactNode;
  tone?: "muted" | "atencao";
}) {
  return (
    <p
      className={`flex items-start gap-2 text-base ${tone === "atencao" ? "text-atencao" : "text-ink-muted"}`}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>{children}</span>
    </p>
  );
}

/** Erro em região assertive: leitores de tela anunciam na hora (§9). */
export function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-start gap-2 rounded-[var(--radius-card)] border-[1.5px] border-erro bg-surface p-3 text-base text-erro"
    >
      <AlertIcon className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function PrivacyLink() {
  return (
    <Link
      href="/privacidade"
      className="inline-flex min-h-12 items-center gap-2 text-base text-agua underline underline-offset-4"
    >
      <ShieldIcon />
      Como usamos seus dados
    </Link>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border-[1.5px] border-ink/12 bg-surface p-4 ${className}`}
    >
      {children}
    </div>
  );
}
