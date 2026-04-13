import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrismaUser = vi.hoisted(() => ({
  findUnique: vi.fn(),
  delete: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(function () {
    return { user: mockPrismaUser };
  }),
}));

import { UserService } from "../../services/user.service";

const userService = new UserService();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("UserService", () => {
  describe("getById", () => {
    it("retourne le user si il existe", async () => {
      const fakeUser = {
        id: 1,
        email: "user@test.com",
        password: "hashed",
        firstName: "John",
        lastName: "Doe",
        admin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaUser.findUnique.mockResolvedValue(fakeUser);

      const result = await userService.getById(1);

      expect(result).toEqual(fakeUser);
    });

    it("lève une erreur 404 si le user n'existe pas", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      await expect(userService.getById(999)).rejects.toThrow("User not found");
    });
  });

  describe("delete", () => {
    it("lève une erreur 403 si le user essaie de supprimer un autre compte", async () => {
      await expect(userService.delete(1, 2)).rejects.toThrow("You can only delete your own account");
    });

    it("lève une erreur 404 si le user n'existe pas", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      await expect(userService.delete(1, 1)).rejects.toThrow("User not found");
    });

    it("supprime le user si tout est correct", async () => {
      const fakeUser = {
        id: 1,
        email: "user@test.com",
        password: "hashed",
        firstName: "John",
        lastName: "Doe",
        admin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaUser.findUnique.mockResolvedValue(fakeUser);
      mockPrismaUser.delete.mockResolvedValue(undefined);

      await expect(userService.delete(1, 1)).resolves.not.toThrow();
      expect(mockPrismaUser.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe("promoteSelfToAdmin", () => {
    it("lève une erreur 404 si le user n'existe pas", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      await expect(userService.promoteSelfToAdmin(999)).rejects.toThrow("User not found");
    });

    it("retourne le user sans modification si il est déjà admin", async () => {
      const fakeUser = {
        id: 1,
        email: "user@test.com",
        password: "hashed",
        firstName: "John",
        lastName: "Doe",
        admin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaUser.findUnique.mockResolvedValue(fakeUser);

      const result = await userService.promoteSelfToAdmin(1);

      expect(result).toEqual(fakeUser);
      expect(mockPrismaUser.update).not.toHaveBeenCalled();
    });

    it("met à jour le user en admin si il ne l'est pas encore", async () => {
      const fakeUser = {
        id: 1,
        email: "user@test.com",
        password: "hashed",
        firstName: "John",
        lastName: "Doe",
        admin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedUser = { ...fakeUser, admin: true };

      mockPrismaUser.findUnique.mockResolvedValue(fakeUser);
      mockPrismaUser.update.mockResolvedValue(updatedUser);

      const result = await userService.promoteSelfToAdmin(1);

      expect(result.admin).toBe(true);
      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { admin: true },
      });
    });
  });
});
