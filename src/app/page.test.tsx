import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import RecognizePage from "./como-reconhecer/page";
import Home from "./page";
import PrivacyPage from "./privacidade/page";
import AboutPage from "./sobre/page";

afterEach(cleanup);

describe("P-01 início", () => {
  it("exibe o título Sentinela", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { level: 1, name: /sentinela/i })).toBeInTheDocument();
  });

  it("leva ao relato e avisa que não precisa de cadastro", () => {
    render(<Home />);

    expect(screen.getByRole("link", { name: "Relatar foco" })).toHaveAttribute(
      "href",
      "/relatar/foto",
    );
    expect(screen.getByText("Sem cadastro. Você não precisa se identificar.")).toBeInTheDocument();
  });

  it("tem como reconhecer, selo acadêmico → Sobre e rodapé com Privacidade", () => {
    render(<Home />);

    expect(screen.getByRole("link", { name: /como reconhecer um foco.*pneus/i })).toHaveAttribute(
      "href",
      "/como-reconhecer",
    );
    expect(
      screen.getByRole("link", { name: "Projeto acadêmico — não é um canal oficial da prefeitura" }),
    ).toHaveAttribute("href", "/sobre");
    const footer = screen.getByRole("navigation", { name: "Rodapé" });
    expect(within(footer).getByRole("link", { name: "Como usamos seus dados" })).toHaveAttribute(
      "href",
      "/privacidade",
    );
  });

  it("não mostra itens de fases futuras", () => {
    render(<Home />);

    expect(screen.queryByText(/mapa de risco/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/meus relatos/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/aguardando internet/i)).not.toBeInTheDocument();
  });
});

describe("páginas informativas", () => {
  it("/como-reconhecer lista os 8 tipos e o aviso de propriedade alheia", () => {
    render(<RecognizePage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Como reconhecer um foco");
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(8);
    expect(screen.getByText("Não mexa em propriedade alheia: relate.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Relatar foco" })).toHaveAttribute("href", "/relatar/foto");
  });

  it("/sobre diz quem faz, que não é canal oficial e linka o código", () => {
    render(<AboutPage />);

    expect(screen.getByText(/Laboratório de Aplicações de Vídeo Digital/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Não é canal oficial" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /GitHub/ })).toHaveAttribute(
      "href",
      "https://github.com/dobidu/sentinela",
    );
    expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(3);
  });

  it("/privacidade tem 1ª camada no topo e a política completa com âncoras", () => {
    const { container } = render(<PrivacyPage />);

    expect(screen.getByText("Não pedimos nome nem telefone.")).toBeInTheDocument();
    expect(screen.getByText("Ler política completa").closest("details")).not.toHaveAttribute("open");
    for (const id of ["controlador", "dados", "finalidade", "compartilhamento", "retencao", "direitos", "contato"]) {
      expect(container.querySelector(`#${id}`)).not.toBeNull();
      expect(container.querySelector(`a[href="#${id}"]`)).not.toBeNull();
    }
    expect(screen.getByText(/não é guardado até você enviar o relato/)).toBeInTheDocument();
  });
});
