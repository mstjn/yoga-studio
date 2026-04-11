import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, beforeEach } from "vitest";
import Navbar from "../../components/Navbar";

vi.mock("../../services/auth.service", () => ({
  authService: {
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn(),
    logout: vi.fn(),
  },
}));
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

import { authService } from "../../services/auth.service";
import { User } from "../../types";

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("utilisateur non connecté", () => {
    it("affiche les liens Login et Register", () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(false);
      vi.mocked(authService.getCurrentUser).mockReturnValue(null);

      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>,
      );

      expect(screen.getByText("Login")).toBeInTheDocument();
      expect(screen.getByText("Register")).toBeInTheDocument();
    });
    it("n'affiche pas le bouton Logout", () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(false);
      vi.mocked(authService.getCurrentUser).mockReturnValue(null);

      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>,
      );

      expect(screen.queryByText("Logout")).not.toBeInTheDocument();
    });
  });

  describe("utilisateur connecté (non admin)", () => {
    const fakeUser: User = {
      id: 1,
      email: "test@mail.com",
      firstName: "Test",
      lastName: "test",
      admin: false,
    };
    it("affiche Sessions, Profile et Logout", () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);

      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>,
      );

      expect(screen.getByText("Sessions")).toBeInTheDocument();
      expect(screen.getByText("Profile")).toBeInTheDocument();
      expect(screen.getByText("Logout")).toBeInTheDocument();
    });
    it("n'affiche pas le lien Create Session", () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);

      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>,
      );

      expect(screen.queryByText("Create Session")).not.toBeInTheDocument();
    });
  });

  describe("utilisateur connecté (admin)", () => {
    const fakeUser: User = {
      id: 1,
      email: "test@mail.com",
      firstName: "Test",
      lastName: "test",
      admin: true,
    };
    it("affiche le lien Create Session", () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getCurrentUser).mockReturnValue(fakeUser);

      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>,
      );

      expect(screen.getByText("Create Session")).toBeInTheDocument();
    });
  });

  describe("Logout", () => {
    it("appelle authService.logout et redirige vers /login", async () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getCurrentUser).mockReturnValue({ id: 1, email: "test@mail.com", firstName: "Test", lastName: "test", admin: false });
      
          render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Logout"))

    expect(authService.logout).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/login')
    });
  });
});
