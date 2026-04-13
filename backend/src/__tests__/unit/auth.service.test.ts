import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrismaUser = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(function () {
    return { user: mockPrismaUser };
  }),
}));

vi.mock("bcrypt", () => ({
  compare: vi.fn(),
  hash: vi.fn(),
}));

vi.mock("../../utils/jwt.util", () => ({
  generateToken: vi.fn().mockReturnValue("fake-token"),
}));

import * as bcrypt from "bcrypt";
import { AuthService } from "../../services/auth.service";

const authService = new AuthService();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AuthService", () => {
  describe("login", () => {
    it("retourne le user et un token si les identifiants sont corrects", async () => {
      const fakeUser = {
        id: 1,
        email: "user@test.com",
        password: "hashed-password",
        firstName: "John",
        lastName: "Doe",
        admin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaUser.findUnique.mockResolvedValue(fakeUser);

      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await authService.login("user@test.com", "password123");

      expect(result.token).toBe("fake-token");
      expect(result.email).toBe("user@test.com");
    });

    it("lève une erreur 401 si l'utilisateur n'existe pas", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      await expect(authService.login("wrong@test.com", "password")).rejects.toThrow("Invalid credentials");
    });

    it("lève une erreur 401 si le mot de passe est incorrect", async () => {
      const fakeUser = {
        id: 1,
        email: "user@test.com",
        password: "hashed-password",
        firstName: "John",
        lastName: "Doe",
        admin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaUser.findUnique.mockResolvedValue(fakeUser);

      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(authService.login("user@test.com", "wrong-password")).rejects.toThrow("Invalid credentials");
    });
  });

  describe("register", () => {
    it("crée un utilisateur et retourne un token si l'email n'existe pas", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password" as never);

      const newUser = {
        id: 2,
        email: "new@test.com",
        password: "hashed-password",
        firstName: "Jane",
        lastName: "Doe",
        admin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaUser.create.mockResolvedValue(newUser);

      const result = await authService.register("new@test.com", "password123", "Jane", "Doe");

      expect(result.token).toBe("fake-token");
      expect(result.email).toBe("new@test.com");
    });

    it("lève une erreur 400 si l'email est déjà utilisé", async () => {
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 1,
        email: "user@test.com",
        password: "hashed",
        firstName: "John",
        lastName: "Doe",
        admin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(authService.register("user@test.com", "password", "John", "Doe")).rejects.toThrow("Email already exists");
    });
  });
});
