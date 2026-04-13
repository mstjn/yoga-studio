import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrismaUser = vi.hoisted(() => ({ findUnique: vi.fn() }));
const mockPrismaTeacher = vi.hoisted(() => ({ findUnique: vi.fn() }));
const mockPrismaSession = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));
const mockPrismaSessionParticipation = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(function () {
    return {
      user: mockPrismaUser,
      teacher: mockPrismaTeacher,
      session: mockPrismaSession,
      sessionParticipation: mockPrismaSessionParticipation,
    };
  }),
}));

import { SessionService } from "../../services/session.service";

const sessionService = new SessionService();

beforeEach(() => {
  vi.clearAllMocks();
});

const fakeAdmin = { id: 1, email: "admin@test.com", password: "hashed", firstName: "Admin", lastName: "User", admin: true, createdAt: new Date(), updatedAt: new Date() };
const fakeUser = { id: 2, email: "user@test.com", password: "hashed", firstName: "John", lastName: "Doe", admin: false, createdAt: new Date(), updatedAt: new Date() };
const fakeTeacher = { id: 1, firstName: "Paul", lastName: "Martin", createdAt: new Date(), updatedAt: new Date() };
const fakeSession = { id: 1, name: "Yoga matinal", date: new Date(), description: "Session du matin", teacherId: 1, teacher: fakeTeacher, participants: [], createdAt: new Date(), updatedAt: new Date() };

describe("SessionService", () => {
  describe("getAll", () => {
    it("retourne toutes les sessions", async () => {
      mockPrismaSession.findMany.mockResolvedValue([fakeSession]);

      const result = await sessionService.getAll();

      expect(result).toEqual([fakeSession]);
      expect(mockPrismaSession.findMany).toHaveBeenCalledOnce();
    });
  });

  describe("getById", () => {
    it("retourne la session si elle existe", async () => {
      mockPrismaSession.findUnique.mockResolvedValue(fakeSession);

      const result = await sessionService.getById(1);

      expect(result).toEqual(fakeSession);
    });

    it("lève une erreur 404 si la session n'existe pas", async () => {
      mockPrismaSession.findUnique.mockResolvedValue(null);

      await expect(sessionService.getById(999)).rejects.toThrow("Session not found");
    });
  });

  describe("create", () => {
    const sessionData = { name: "Yoga matinal", date: "2024-06-01", description: "Session du matin", teacherId: 1 };

    it("lève une erreur 403 si le user n'est pas admin", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(fakeUser);

      await expect(sessionService.create(sessionData, 2)).rejects.toThrow("Admin access required");
    });

    it("lève une erreur 404 si le teacher n'existe pas", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(fakeAdmin);
      mockPrismaTeacher.findUnique.mockResolvedValue(null);

      await expect(sessionService.create(sessionData, 1)).rejects.toThrow("Teacher not found");
    });

    it("crée la session si tout est correct", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(fakeAdmin);
      mockPrismaTeacher.findUnique.mockResolvedValue(fakeTeacher);
      mockPrismaSession.create.mockResolvedValue(fakeSession);

      const result = await sessionService.create(sessionData, 1);

      expect(result).toEqual(fakeSession);
      expect(mockPrismaSession.create).toHaveBeenCalledOnce();
    });
  });

  describe("update", () => {
    const updateData = { name: "Nouveau nom" };

    it("lève une erreur 403 si le user n'est pas admin", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(fakeUser);

      await expect(sessionService.update(1, updateData, 2)).rejects.toThrow("Admin access required");
    });

    it("lève une erreur 404 si la session n'existe pas", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(fakeAdmin);
      mockPrismaSession.findUnique.mockResolvedValue(null);

      await expect(sessionService.update(999, updateData, 1)).rejects.toThrow("Session not found");
    });

    it("lève une erreur 404 si le nouveau teacher n'existe pas", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(fakeAdmin);
      mockPrismaSession.findUnique.mockResolvedValue(fakeSession);
      mockPrismaTeacher.findUnique.mockResolvedValue(null);

      await expect(sessionService.update(1, { teacherId: 999 }, 1)).rejects.toThrow("Teacher not found");
    });

    it("met à jour la session si tout est correct", async () => {
      const updatedSession = { ...fakeSession, name: "Nouveau nom" };

      mockPrismaUser.findUnique.mockResolvedValue(fakeAdmin);
      mockPrismaSession.findUnique.mockResolvedValue(fakeSession);
      mockPrismaSession.update.mockResolvedValue(updatedSession);

      const result = await sessionService.update(1, updateData, 1);

      expect(result.name).toBe("Nouveau nom");
      expect(mockPrismaSession.update).toHaveBeenCalledOnce();
    });
  });

  describe("delete", () => {
    it("lève une erreur 403 si le user n'est pas admin", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(fakeUser);

      await expect(sessionService.delete(1, 2)).rejects.toThrow("Admin access required");
    });

    it("lève une erreur 404 si la session n'existe pas", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(fakeAdmin);
      mockPrismaSession.findUnique.mockResolvedValue(null);

      await expect(sessionService.delete(999, 1)).rejects.toThrow("Session not found");
    });

    it("supprime la session si tout est correct", async () => {
      mockPrismaUser.findUnique.mockResolvedValue(fakeAdmin);
      mockPrismaSession.findUnique.mockResolvedValue(fakeSession);
      mockPrismaSession.delete.mockResolvedValue(undefined);

      await expect(sessionService.delete(1, 1)).resolves.not.toThrow();
      expect(mockPrismaSession.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe("participate", () => {
    it("lève une erreur 404 si la session n'existe pas", async () => {
      mockPrismaSession.findUnique.mockResolvedValue(null);

      await expect(sessionService.participate(999, 1)).rejects.toThrow("Session not found");
    });

    it("lève une erreur 404 si le user n'existe pas", async () => {
      mockPrismaSession.findUnique.mockResolvedValue(fakeSession);
      mockPrismaUser.findUnique.mockResolvedValue(null);

      await expect(sessionService.participate(1, 999)).rejects.toThrow("User not found");
    });

    it("lève une erreur 400 si le user participe déjà", async () => {
      mockPrismaSession.findUnique.mockResolvedValue(fakeSession);
      mockPrismaUser.findUnique.mockResolvedValue(fakeUser);
      mockPrismaSessionParticipation.findUnique.mockResolvedValue({ sessionId: 1, userId: 2 });

      await expect(sessionService.participate(1, 2)).rejects.toThrow("User already participating in this session");
    });

    it("crée la participation si tout est correct", async () => {
      mockPrismaSession.findUnique.mockResolvedValue(fakeSession);
      mockPrismaUser.findUnique.mockResolvedValue(fakeUser);
      mockPrismaSessionParticipation.findUnique.mockResolvedValue(null);
      mockPrismaSessionParticipation.create.mockResolvedValue(undefined);

      await expect(sessionService.participate(1, 2)).resolves.not.toThrow();
      expect(mockPrismaSessionParticipation.create).toHaveBeenCalledWith({
        data: { sessionId: 1, userId: 2 },
      });
    });
  });

  describe("unparticipate", () => {
    it("lève une erreur 404 si la participation n'existe pas", async () => {
      mockPrismaSessionParticipation.findUnique.mockResolvedValue(null);

      await expect(sessionService.unparticipate(1, 2)).rejects.toThrow("Participation not found");
    });

    it("supprime la participation si elle existe", async () => {
      mockPrismaSessionParticipation.findUnique.mockResolvedValue({ sessionId: 1, userId: 2 });
      mockPrismaSessionParticipation.delete.mockResolvedValue(undefined);

      await expect(sessionService.unparticipate(1, 2)).resolves.not.toThrow();
      expect(mockPrismaSessionParticipation.delete).toHaveBeenCalledWith({
        where: { sessionId_userId: { sessionId: 1, userId: 2 } },
      });
    });
  });
});
