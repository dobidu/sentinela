import { Constants, type Database } from "@/lib/database.types";

export type BreedingSiteType = Database["public"]["Enums"]["breeding_site_type"];

export const BREEDING_SITE_TYPES = Constants.public.Enums.breeding_site_type;

// Rótulos em linguagem simples (spec de UI/UX §6.5), na ordem da grade 2×4.
export const BREEDING_SITES: ReadonlyArray<{
  value: BreedingSiteType;
  label: string;
}> = [
  { value: "pneu", label: "Pneu" },
  { value: "caixa_dagua", label: "Caixa d'água / tonel destampado" },
  { value: "vaso_planta", label: "Vaso ou prato de planta" },
  { value: "calha", label: "Calha ou laje com água" },
  { value: "piscina", label: "Piscina ou fonte sem cuidado" },
  { value: "lixo_entulho", label: "Lixo ou entulho" },
  { value: "recipiente_diverso", label: "Garrafa, balde, lata…" },
  { value: "outro", label: "Outro lugar" },
];

export function breedingSiteLabel(value: BreedingSiteType): string {
  return BREEDING_SITES.find((site) => site.value === value)?.label ?? value;
}
