import {
  jest,
  beforeAll,
  beforeEach,
  afterAll,
  describe,
  test,
  expect,
} from "@jest/globals";

jest.unstable_mockModule("./db/prisma.js", () => ({
  prisma: {
    user: {
      findMany: jest.fn() as jest.MockedFunction<() => Promise<any[]>>,
      create: jest.fn() as jest.MockedFunction<() => Promise<any>>,
    },
    $disconnect: jest.fn(),
  },
}));


const { createApp } = await import("./app.js");
const { prisma } = await import("./db/prisma.js");
import request from "supertest";

const app = createApp();

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  jest.restoreAllMocks();
  await prisma.$disconnect();
});

describe("App", () => {
  describe("Rutas", () => {
    test("GET /api/users debe retornar lista de usuarios", async () => {
      const mockUsers = [
        { id: "1", name: "Alice", email: "alice@test.com" },
        { id: "2", name: "Bob", email: "bob@test.com" },
      ];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      const res = await request(app).get("/api/users");
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUsers);
    });

    test("POST /api/users debe crear un usuario", async () => {
      const mockUser = { id: "3", name: "Carol", email: "carol@test.com" };
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      const res = await request(app)
        .post("/api/users")
        .send({ name: "Carol", email: "carol@test.com" })
        .set("Content-Type", "application/json");
      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockUser);
    });

    test("POST /api/users debe retornar 500 si Prisma falla", async () => {
      (prisma.user.create as jest.Mock).mockRejectedValue(
        new Error("DB error"),
      );
      const res = await request(app)
        .post("/api/users")
        .send({ name: "Fail", email: "fail@test.com" })
        .set("Content-Type", "application/json");
      expect(res.status).toBe(500);
    });

    test("GET /api/ruta-inexistente debe retornar 404", async () => {
      const res = await request(app).get("/api/ruta-inexistente");
      expect(res.status).toBe(404);
    });

    test("respuesta 404 debe ser JSON", async () => {
      const res = await request(app).get("/api/no-existe");
      expect(res.headers["content-type"]).toMatch(/json/);
    });
  });

  describe("Headers de seguridad básicos", () => {
    test("no debe exponer X-Powered-By", async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      const res = await request(app).get("/api/users");
      expect(res.headers["x-powered-by"]).toBeUndefined();
    });
  });
});
