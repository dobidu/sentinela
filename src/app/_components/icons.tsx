import type { SVGProps } from "react";

import type { BreedingSiteType } from "@/lib/report/breeding-sites";

// Ícones de traço de 2 px, cantos arredondados (spec §5.4). Decorativos:
// o texto ao lado sempre carrega o significado.
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

type P = SVGProps<SVGSVGElement>;

export const LockIcon = (p: P) => (
  <Icon {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Icon>
);

export const EyeIcon = (p: P) => (
  <Icon {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);

export const ShieldIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" />
  </Icon>
);

export const CrosshairIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="7" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    <circle cx="12" cy="12" r="1.5" />
  </Icon>
);

export const CheckIcon = (p: P) => (
  <Icon {...p}>
    <path d="m5 12 5 5 9-10" />
  </Icon>
);

export const AlertIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 3 2 20h20L12 3Z" />
    <path d="M12 10v4M12 17h.01" />
  </Icon>
);

export const CameraIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 8h3l2-3h6l2 3h3v11H4V8Z" />
    <circle cx="12" cy="13" r="3.5" />
  </Icon>
);

export const ArrowLeftIcon = (p: P) => (
  <Icon {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icon>
);

export const CloseIcon = (p: P) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);

/** Gota d'água com ponto de mira: assinatura visual do Sentinela (§5.1). */
export const DropIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11Z" />
    <circle cx="12" cy="14" r="2" />
  </Icon>
);

const BREEDING_SITE_ICONS: Record<BreedingSiteType, (p: P) => React.JSX.Element> = {
  pneu: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 4v2M12 18v2M4 12h2M18 12h2" />
    </Icon>
  ),
  caixa_dagua: (p) => (
    <Icon {...p}>
      <path d="M5 8h14l-1.5 12h-11L5 8Z" />
      <path d="M7 12h10" />
      <path d="M9 5h6" />
    </Icon>
  ),
  vaso_planta: (p) => (
    <Icon {...p}>
      <path d="M7 12h10l-1.5 7h-7L7 12Z" />
      <path d="M4 20h16" />
      <path d="M12 12V7M12 7c0-2 2-3 4-3M12 8c0-2-2-3-4-3" />
    </Icon>
  ),
  calha: (p) => (
    <Icon {...p}>
      <path d="M3 8h18" />
      <path d="M4 8v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
      <path d="M8 16v3M12 16v4M16 16v3" />
    </Icon>
  ),
  piscina: (p) => (
    <Icon {...p}>
      <path d="M3 15c2 0 2 1.5 4.5 1.5S10 15 12 15s2 1.5 4.5 1.5S19 15 21 15" />
      <path d="M3 19c2 0 2 1.5 4.5 1.5S10 19 12 19s2 1.5 4.5 1.5S19 19 21 19" />
      <path d="M8 12V5a2 2 0 0 1 4 0M16 12V5a2 2 0 0 0-4 0" />
    </Icon>
  ),
  lixo_entulho: (p) => (
    <Icon {...p}>
      <path d="M6 9h12l-1 11H7L6 9Z" />
      <path d="M9 9V6h6v3" />
      <path d="M4 9h16" />
    </Icon>
  ),
  recipiente_diverso: (p) => (
    <Icon {...p}>
      <path d="M7 4h3v3l1 2v11H6V9l1-2V4Z" />
      <path d="M14 10h6l-1 10h-4l-1-10Z" />
    </Icon>
  ),
  outro: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5V14M12 17h.01" />
    </Icon>
  ),
};

export function BreedingSiteIcon({ type, ...props }: P & { type: BreedingSiteType }) {
  const Glyph = BREEDING_SITE_ICONS[type];
  return <Glyph {...props} />;
}
