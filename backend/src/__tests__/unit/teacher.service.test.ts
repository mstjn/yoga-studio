import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrismaTeacher = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(function () {
    return { teacher: mockPrismaTeacher };
  }),
}));

import { TeacherService } from "../../services/teacher.service";

const teacherService = new TeacherService();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TeacherService", () => {
  describe("getAll", () => {
    it("retourne la liste de tous les teachers", async () => {
      const fakeTeachers = [
        { id: 1, firstName: "John", lastName: "Doe", createdAt: new Date(), updatedAt: new Date() },
        { id: 2, firstName: "Jane", lastName: "Smith", createdAt: new Date(), updatedAt: new Date() },
      ];

      mockPrismaTeacher.findMany.mockResolvedValue(fakeTeachers);

      const result = await teacherService.getAll();

      expect(result).toEqual(fakeTeachers);
      expect(mockPrismaTeacher.findMany).toHaveBeenCalledOnce();
    });
  });

  describe("getById", () => {
    it("retourne le teacher si il existe", async () => {
      const fakeTeacher = {
        id: 1,
        firstName: "John",
        lastName: "Doe",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaTeacher.findUnique.mockResolvedValue(fakeTeacher);

      const result = await teacherService.getById(1);

      expect(result).toEqual(fakeTeacher);
    });

    it("lève une erreur 404 si le teacher n'existe pas", async () => {
      mockPrismaTeacher.findUnique.mockResolvedValue(null);

      await expect(teacherService.getById(999)).rejects.toThrow("Teacher not found");
    });
  });
});
