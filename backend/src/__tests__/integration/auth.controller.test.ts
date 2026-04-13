import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

const mockLogin = vi.hoisted(() => vi.fn());
const mockRegister = vi.hoisted(() => vi.fn());

vi.mock("../../services/auth.service", () => ({
  AuthService: vi.fn().mockImplementation(function () {
    return { login: mockLogin, register: mockRegister };
  }),
}));

import app from "../../app";

beforeEach(() => {
  vi.clearAllMocks();
});

const fakeUser = {
  id: 1,
  email: "user@test.com",
  password: "hashed",
  firstName: "John",
  lastName: "Doe",
  admin: false,
  token: "fake-token",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("POST /api/auth/login", () => {
  it("retourne 200 avec les infos du user si les identifiants sont corrects", async () => {
    mockLogin.mockResolvedValue(fakeUser);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe("fake-token");
    expect(res.body.email).toBe("user@test.com");
  });

  it("retourne 400 si l'email est manquant", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: "password123" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Email is required");
  });

  it("retourne 400 si le mot de passe est manquant", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@test.com" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Password is required");
  });

  it("retourne 401 si les identifiants sont incorrects", async () => {
    const error = Object.assign(new Error("Invalid credentials"), { status: 401 });
    mockLogin.mockRejectedValue(error);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "wrong@test.com", password: "wrong" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });

  it("retourne 400 si l'email n'est pas une string", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: 123, password: "password123" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Email must be a string");
  });

  it("retourne 400 si le mot de passe n'est pas une string", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@test.com", password: 123 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Password must be a string");
  });

  it("retourne 500 si une erreur sans status est levée", async () => {
    mockLogin.mockRejectedValue(new Error("Unexpected error"));

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@test.com", password: "password123" });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Unexpected error");
  });
});

describe("POST /api/auth/register", () => {
  it("retourne 201 avec les infos du user si l'inscription réussit", async () => {
    mockRegister.mockResolvedValue(fakeUser);

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "user@test.com", password: "password123", firstName: "John", lastName: "Doe" });

    expect(res.status).toBe(201);
    expect(res.body.token).toBe("fake-token");
    expect(res.body.email).toBe("user@test.com");
  });

  it("retourne 400 si le mot de passe est trop court", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "user@test.com", password: "123", firstName: "John", lastName: "Doe" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Password must be at least 8 characters");
  });

  it("retourne 400 si le prénom est manquant", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "user@test.com", password: "password123", lastName: "Doe" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("First name is required");
  });

  it("retourne 400 si le nom de famille est manquant", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "user@test.com", password: "password123", firstName: "John" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Last name is required");
  });

  it("retourne 400 si l'email est déjà utilisé", async () => {
    const error = Object.assign(new Error("Email already exists"), { status: 400 });
    mockRegister.mockRejectedValue(error);

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "user@test.com", password: "password123", firstName: "John", lastName: "Doe" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Email already exists");
  });
});
