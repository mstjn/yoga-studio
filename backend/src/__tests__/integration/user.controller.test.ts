import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { generateToken } from "../../utils/jwt.util";

const mockGetById = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn());
const mockPromoteSelfToAdmin = vi.hoisted(() => vi.fn());

vi.mock("../../services/user.service", () => ({
  UserService: vi.fn().mockImplementation(function () {
    return { getById: mockGetById, delete: mockDelete, promoteSelfToAdmin: mockPromoteSelfToAdmin };
  }),
}));

import app from "../../app";

const token = generateToken(1);

beforeEach(() => {
  vi.clearAllMocks();
});

const fakeUser = {
  id: 1,
  email: "user@test.com",
  firstName: "John",
  lastName: "Doe",
  admin: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("GET /api/user/:id", () => {
  it("retourne 200 avec le user si il existe", async () => {
    mockGetById.mockResolvedValue(fakeUser);

    const res = await request(app)
      .get("/api/user/1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("user@test.com");
  });

  it("retourne 400 si l'id n'est pas un nombre", async () => {
    const res = await request(app)
      .get("/api/user/abc")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid user ID");
  });

  it("retourne 404 si le user n'existe pas", async () => {
    const error = Object.assign(new Error("User not found"), { status: 404 });
    mockGetById.mockRejectedValue(error);

    const res = await request(app)
      .get("/api/user/999")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("User not found");
  });
});

describe("DELETE /api/user/:id", () => {
  it("retourne 200 si la suppression réussit", async () => {
    mockDelete.mockResolvedValue(undefined);

    const res = await request(app)
      .delete("/api/user/1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User deleted successfully");
  });

  it("retourne 403 si le user essaie de supprimer un autre compte", async () => {
    const error = Object.assign(new Error("You can only delete your own account"), { status: 403 });
    mockDelete.mockRejectedValue(error);

    const res = await request(app)
      .delete("/api/user/2")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("You can only delete your own account");
  });

  it("retourne 400 si l'id n'est pas un nombre", async () => {
    const res = await request(app)
      .delete("/api/user/abc")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid user ID");
  });
});

describe("POST /api/user/promote-admin", () => {
  it("retourne 200 avec le user promu admin si NODE_ENV est development", async () => {
    const adminUser = { ...fakeUser, admin: true };
    mockPromoteSelfToAdmin.mockResolvedValue(adminUser);

    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const res = await request(app)
      .post("/api/user/promote-admin")
      .set("Authorization", `Bearer ${token}`);

    process.env.NODE_ENV = originalEnv;

    expect(res.status).toBe(200);
    expect(res.body.admin).toBe(true);
  });

  it("retourne 403 si NODE_ENV n'est pas development", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const res = await request(app)
      .post("/api/user/promote-admin")
      .set("Authorization", `Bearer ${token}`);

    process.env.NODE_ENV = originalEnv;

    expect(res.status).toBe(403);
  });

  it("retourne 200 si NODE_ENV n'est pas défini (fallback development)", async () => {
    const adminUser = { ...fakeUser, admin: true };
    mockPromoteSelfToAdmin.mockResolvedValue(adminUser);

    const originalEnv = process.env.NODE_ENV;
    delete process.env.NODE_ENV;

    const res = await request(app)
      .post("/api/user/promote-admin")
      .set("Authorization", `Bearer ${token}`);

    process.env.NODE_ENV = originalEnv;

    expect(res.status).toBe(200);
  });
});
