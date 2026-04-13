import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { generateToken } from "../../utils/jwt.util";

const mockGetAll = vi.hoisted(() => vi.fn());
const mockGetById = vi.hoisted(() => vi.fn());
const mockCreate = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn());
const mockParticipate = vi.hoisted(() => vi.fn());
const mockUnparticipate = vi.hoisted(() => vi.fn());

vi.mock("../../services/session.service", () => ({
  SessionService: vi.fn().mockImplementation(function () {
    return {
      getAll: mockGetAll,
      getById: mockGetById,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
      participate: mockParticipate,
      unparticipate: mockUnparticipate,
    };
  }),
}));

import app from "../../app";

const token = generateToken(1);

beforeEach(() => {
  vi.clearAllMocks();
});

const fakeSession = {
  id: 1,
  name: "Yoga matinal",
  date: new Date(),
  description: "Session du matin",
  teacherId: 1,
  teacher: { id: 1, firstName: "Paul", lastName: "Martin" },
  participants: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const fakeSessionWithParticipants = {
  ...fakeSession,
  participants: [{ user: { id: 2 } }, { user: { id: 3 } }],
};

describe("GET /api/session", () => {
  it("retourne 200 avec la liste des sessions", async () => {
    mockGetAll.mockResolvedValue([fakeSessionWithParticipants]);

    const res = await request(app)
      .get("/api/session")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("retourne 401 si aucun token n'est fourni", async () => {
    const res = await request(app).get("/api/session");

    expect(res.status).toBe(401);
  });
});

describe("GET /api/session/:id", () => {
  it("retourne 200 avec la session si elle existe", async () => {
    mockGetById.mockResolvedValue(fakeSession);

    const res = await request(app)
      .get("/api/session/1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Yoga matinal");
  });

  it("retourne 400 si l'id n'est pas un nombre", async () => {
    const res = await request(app)
      .get("/api/session/abc")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid session ID");
  });

  it("retourne 404 si la session n'existe pas", async () => {
    const error = Object.assign(new Error("Session not found"), { status: 404 });
    mockGetById.mockRejectedValue(error);

    const res = await request(app)
      .get("/api/session/999")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Session not found");
  });
});

describe("POST /api/session", () => {
  it("retourne 201 avec la session créée", async () => {
    mockCreate.mockResolvedValue(fakeSession);

    const res = await request(app)
      .post("/api/session")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Yoga matinal", date: "2024-06-01", description: "Session du matin", teacherId: 1 });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Yoga matinal");
  });

  it("retourne 400 si le nom est manquant", async () => {
    const res = await request(app)
      .post("/api/session")
      .set("Authorization", `Bearer ${token}`)
      .send({ date: "2024-06-01", description: "Session du matin", teacherId: 1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Name is required");
  });

  it("retourne 403 si le user n'est pas admin", async () => {
    const error = Object.assign(new Error("Admin access required"), { status: 403 });
    mockCreate.mockRejectedValue(error);

    const res = await request(app)
      .post("/api/session")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Yoga matinal", date: "2024-06-01", description: "Session du matin", teacherId: 1 });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Admin access required");
  });
});

describe("PUT /api/session/:id", () => {
  it("retourne 200 avec la session mise à jour", async () => {
    const updatedSession = { ...fakeSession, name: "Nouveau nom" };
    mockUpdate.mockResolvedValue(updatedSession);

    const res = await request(app)
      .put("/api/session/1")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Nouveau nom" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Nouveau nom");
  });

  it("retourne 400 si l'id n'est pas un nombre", async () => {
    const res = await request(app)
      .put("/api/session/abc")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Nouveau nom" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid session ID");
  });
});

describe("DELETE /api/session/:id", () => {
  it("retourne 200 si la suppression réussit", async () => {
    mockDelete.mockResolvedValue(undefined);

    const res = await request(app)
      .delete("/api/session/1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Session deleted successfully");
  });

  it("retourne 404 si la session n'existe pas", async () => {
    const error = Object.assign(new Error("Session not found"), { status: 404 });
    mockDelete.mockRejectedValue(error);

    const res = await request(app)
      .delete("/api/session/999")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Session not found");
  });
});

describe("POST /api/session/:id/participate/:userId", () => {
  it("retourne 200 si la participation est créée", async () => {
    mockParticipate.mockResolvedValue(undefined);

    const res = await request(app)
      .post("/api/session/1/participate/2")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Successfully joined the session");
  });

  it("retourne 400 si le user participe déjà", async () => {
    const error = Object.assign(new Error("User already participating in this session"), { status: 400 });
    mockParticipate.mockRejectedValue(error);

    const res = await request(app)
      .post("/api/session/1/participate/2")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("User already participating in this session");
  });
});

describe("DELETE /api/session/:id/participate/:userId", () => {
  it("retourne 200 si la participation est supprimée", async () => {
    mockUnparticipate.mockResolvedValue(undefined);

    const res = await request(app)
      .delete("/api/session/1/participate/2")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Successfully left the session");
  });

  it("retourne 404 si la participation n'existe pas", async () => {
    const error = Object.assign(new Error("Participation not found"), { status: 404 });
    mockUnparticipate.mockRejectedValue(error);

    const res = await request(app)
      .delete("/api/session/1/participate/2")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Participation not found");
  });
});
