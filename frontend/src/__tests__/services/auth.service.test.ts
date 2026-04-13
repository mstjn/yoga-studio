import { vi, describe, it, beforeEach, expect } from "vitest";
import { authService } from "../../services/auth.service";

vi.mock("../../services/api", () => ({
  default: {
    post: vi.fn(),
  },
}));

import api from "../../services/api";

const fakeUser = {
  id: 1,
  email: "user@test.com",
  firstName: "Test",
  lastName: "User",
  admin: false,
  token: "fake-token",
};

describe("authService", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should return false when no token in localStorage", () => {
    localStorage.clear();
    expect(authService.isAuthenticated()).toBe(false);
  });

  it("should return true when token in localstroage", () => {
    localStorage.setItem("token", "123456");
    expect(authService.isAuthenticated()).toBe(true);
  });
  it("should be return the token", () => {
    localStorage.setItem("token", "123456");
    expect(authService.getToken()).toBe("123456");
  });
  it("should return null", () => {
    localStorage.clear();
    expect(authService.getToken()).toBe(null);
  });
  it("should be return undefined when the user is logged out", () => {
    localStorage.setItem("token", "123456");
    authService.logout();
    expect(localStorage.getItem("token")).toBe(null);
    expect(localStorage.getItem("user")).toBe(null);
  });
  it("should be return the user", () => {
    localStorage.setItem("user", JSON.stringify(fakeUser));
    expect(authService.getCurrentUser()).toEqual(fakeUser);
  });

  it("should return null when no user in localStorage", () => {
    expect(authService.getCurrentUser()).toBe(null);
  });

  it("should update the user", () => {
    localStorage.setItem("user", JSON.stringify(fakeUser));
    authService.updateCurrentUser({ admin: true });
    expect(authService.getCurrentUser()?.admin).toBe(true);
  });

  it("should return null when updating but no user in localStorage", () => {
    expect(authService.updateCurrentUser({ admin: true })).toBe(null);
  });

  describe("login", () => {
    it("should store token and user in localStorage on success", async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: fakeUser });

      await authService.login({ email: fakeUser.email, password: "password" });

      expect(localStorage.getItem("token")).toBe(fakeUser.token);
      expect(JSON.parse(localStorage.getItem("user")!)).toEqual(fakeUser);
    });

    it("should return the response data", async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: fakeUser });

      const result = await authService.login({ email: fakeUser.email, password: "password" });

      expect(result).toEqual(fakeUser);
    });

    it("ne stocke rien dans localStorage si la réponse n'a pas de token", async () => {
      const userWithoutToken = { ...fakeUser, token: undefined };
      vi.mocked(api.post).mockResolvedValueOnce({ data: userWithoutToken });

      await authService.login({ email: fakeUser.email, password: "password" });

      expect(localStorage.getItem("token")).toBeNull();
    });
  });

  describe("register", () => {
    it("should store token and user in localStorage on success", async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: fakeUser });

      await authService.register({
        email: fakeUser.email,
        password: "password",
        firstName: fakeUser.firstName,
        lastName: fakeUser.lastName,
      });

      expect(localStorage.getItem("token")).toBe(fakeUser.token);
      expect(JSON.parse(localStorage.getItem("user")!)).toEqual(fakeUser);
    });

    it("should return the response data", async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: fakeUser });

      const result = await authService.register({
        email: fakeUser.email,
        password: "password",
        firstName: fakeUser.firstName,
        lastName: fakeUser.lastName,
      });

      expect(result).toEqual(fakeUser);
    });

    it("ne stocke rien dans localStorage si la réponse n'a pas de token", async () => {
      const userWithoutToken = { ...fakeUser, token: undefined };
      vi.mocked(api.post).mockResolvedValueOnce({ data: userWithoutToken });

      await authService.register({
        email: fakeUser.email,
        password: "password",
        firstName: fakeUser.firstName,
        lastName: fakeUser.lastName,
      });

      expect(localStorage.getItem("token")).toBeNull();
    });
  });
});
