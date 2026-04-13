import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { generateToken } from "../../utils/jwt.util";

const mockGetAll = vi.hoisted(() => vi.fn());
const mockGetById = vi.hoisted(() => vi.fn());

vi.mock("../../services/teacher.service", () => ({
  TeacherService: vi.fn().mockImplementation(function () {
    return { getAll: mockGetAll, getById: mockGetById };
  }),
}));

import app from "../../app";

const token = generateToken(1);

beforeEach(() => {
  vi.clearAllMocks();
});

const fakeTeacher = {
  id: 1,
  firstName: "Paul",
  lastName: "Martin",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("GET /api/teacher", () => {
  it("retourne 200 avec la liste des teachers", async () => {
    mockGetAll.mockResolvedValue([fakeTeacher]);

    const res = await request(app)
      .get("/api/teacher")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("retourne 401 si aucun token n'est fourni", async () => {
    const res = await request(app).get("/api/teacher");

    expect(res.status).toBe(401);
  });

  it("retourne 401 si le format du token est invalide (Bearer sans token)", async () => {
    const res = await request(app)
      .get("/api/teacher")
      .set("Authorization", "Bearer");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid token format");
  });

  it("retourne 401 si le token est invalide ou expiré", async () => {
    const res = await request(app)
      .get("/api/teacher")
      .set("Authorization", "Bearer token-invalide");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid or expired token");
  });
});

describe("GET /api/teacher/:id", () => {
  it("retourne 200 avec le teacher si il existe", async () => {
    mockGetById.mockResolvedValue(fakeTeacher);

    const res = await request(app)
      .get("/api/teacher/1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.firstName).toBe("Paul");
  });

  it("retourne 400 si l'id n'est pas un nombre", async () => {
    const res = await request(app)
      .get("/api/teacher/abc")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid teacher ID");
  });

  it("retourne 404 si le teacher n'existe pas", async () => {
    const error = Object.assign(new Error("Teacher not found"), { status: 404 });
    mockGetById.mockRejectedValue(error);

    const res = await request(app)
      .get("/api/teacher/999")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Teacher not found");
  });
});
