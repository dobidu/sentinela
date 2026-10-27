import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("página inicial", () => {
  it("exibe o título Sentinela", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: /sentinela/i }),
    ).toBeInTheDocument();
  });

  it("leva ao relato e avisa que não precisa de cadastro", () => {
    render(<Home />);

    expect(screen.getAllByRole("link", { name: "Relatar foco" })[0]).toHaveAttribute(
      "href",
      "/relatar/foto",
    );
    expect(
      screen.getAllByText("Sem cadastro. Você não precisa se identificar.")[0],
    ).toBeInTheDocument();
  });
});
