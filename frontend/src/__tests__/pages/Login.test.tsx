import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, beforeEach } from "vitest";
import Login from "../../pages/Login";

vi.mock("../../services/auth.service", () => ({
  authService: {
    login: vi.fn(),
  },
}));

import { authService } from "../../services/auth.service";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendu", () => {
    it("affiche le formulaire de login", () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      );
      expect(screen.getByText("Login to Yoga Studio")).toBeInTheDocument();
    });

    it("affiche les champs email et password", () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      );
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Password")).toBeInTheDocument();
    });

    it("affiche le lien vers Register", () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      );
      expect(screen.getByText("Register here")).toBeInTheDocument();
    });
  });

  describe("soumission réussie", () => {
    it("appelle authService.login avec les bonnes valeurs", async () => {
      vi.mocked(authService.login).mockResolvedValueOnce({
        id: 1,
        email: "user@test.com",
        firstName: "Test",
        lastName: "User",
        admin: false,
        token: "fake-token",
      });

      const { container } = render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      );

      // les inputs n'ont pas de htmlfor ni d'id
      fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: "user@test.com" } });
      fireEvent.change(container.querySelector('input[type="password"]')!, { target: { value: "password123" } });
      fireEvent.click(screen.getByRole("button", { name: /login/i }));

      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith({ email: "user@test.com", password: "password123" });
      });
    });

    it("redirige vers /sessions après connexion réussie", async () => {
      vi.mocked(authService.login).mockResolvedValueOnce({
        id: 1,
        email: "user@test.com",
        firstName: "Test",
        lastName: "User",
        admin: false,
        token: "fake-token",
      });

      const { container } = render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      );

      fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: "user@test.com" } });
      fireEvent.change(container.querySelector('input[type="password"]')!, { target: { value: "password123" } });
      fireEvent.click(screen.getByRole("button", { name: /login/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/sessions");
      });
    });
  });

  describe("erreurs", () => {
    it("affiche un message erreur si le login échoue", async () => {
      vi.mocked(authService.login).mockRejectedValueOnce({ response: { data: { message: "Invalid credentials" } } });

      const { container } = render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      );

      fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: "user@test.com" } });
      fireEvent.change(container.querySelector('input[type="password"]')!, { target: { value: "wrongpassword" } });
      fireEvent.click(screen.getByRole("button", { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
      });
    });

    it("affiche le message par défaut si l'erreur n'a pas de message serveur", async () => {
      vi.mocked(authService.login).mockRejectedValueOnce(new Error("Network error"));

      const { container } = render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      );

      fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: "user@test.com" } });
      fireEvent.change(container.querySelector('input[type="password"]')!, { target: { value: "wrongpassword" } });
      fireEvent.click(screen.getByRole("button", { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText("Login failed")).toBeInTheDocument();
      });
    });
  });
});
