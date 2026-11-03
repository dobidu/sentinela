import { describe, expect, it } from "vitest";

import {
  BREEDING_SITE_TYPES,
  BREEDING_SITES,
  breedingSiteLabel,
} from "./breeding-sites";

describe("tipos de criadouro", () => {
  it("cobre exatamente os 8 valores do enum do banco", () => {
    expect(BREEDING_SITES).toHaveLength(8);
    expect(new Set(BREEDING_SITES.map((site) => site.value))).toEqual(
      new Set(BREEDING_SITE_TYPES),
    );
  });

  it("usa os rótulos da spec", () => {
    expect(breedingSiteLabel("pneu")).toBe("Pneu");
    expect(breedingSiteLabel("caixa_dagua")).toBe("Caixa d'água / tonel destampado");
    expect(breedingSiteLabel("outro")).toBe("Outro lugar");
  });
});
