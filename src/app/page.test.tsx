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
});
