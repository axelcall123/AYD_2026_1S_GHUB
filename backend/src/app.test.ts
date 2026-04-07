import {
  jest,
  beforeAll,
  beforeEach,
  afterAll,
  describe,
  test,
  expect,
} from "@jest/globals";

// Integracion( tip mas mocks(mas depedencias/servicios))
//Mockea el módulo prisma.js
//También mockea $disconnect para evitar conexiones reales.
jest.unstable_mockModule("./db/prisma.js", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

//Importa dinámicamente la app y el prisma mockeado
const { createApp } = await import("./app.js");
const { prisma } = await import("./db/prisma.js");
import request from "supertest";

const mockFindMany = jest.mocked(prisma.user.findMany);
const mockCreate = jest.mocked(prisma.user.create);

const app = createApp();

//Tipa los mocks para tener autocompletado y verificación de tipos
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

//Silencia los errores de consola para que no ensucien la salida de pruebas
beforeEach(() => {
  jest.clearAllMocks();
});

//Reinicia los mocks antes de cada prueba
afterAll(async () => {
  jest.restoreAllMocks();
  await prisma.$disconnect();
});

describe("App", () => {
  describe("Rutas", () => {
    test("GET /api/users debe retornar lista de usuarios", async () => {
      const createdAt = new Date(); // Date para el mock de Prisma

      const dbUsers = [
        { id: "1", name: "Alice", email: "alice@test.com", createdAt },
        { id: "2", name: "Bob", email: "bob@test.com", createdAt },
      ];

      mockFindMany.mockResolvedValue(dbUsers);
      //Simula que prisma.user.findMany resuelve con dos usuarios.
      const expectedBody = dbUsers.map((u) => ({
        ...u,
        createdAt: createdAt.toISOString(),
      }));

      const res = await request(app).get("/api/users");
      expect(res.status).toBe(200);
      expect(res.body).toEqual(expectedBody);
    });

    test("POST /api/users debe crear un usuario", async () => {
      const createdAt = new Date();

      const dbUser = {
        id: "3",
        name: "Carol",
        email: "carol@test.com",
        createdAt,
      };

      mockCreate.mockResolvedValue(dbUser);

      const expectedBody = { ...dbUser, createdAt: createdAt.toISOString() };

      const res = await request(app)
        .post("/api/users")
        .send({ name: "Carol", email: "carol@test.com" })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(201);
      expect(res.body).toEqual(expectedBody);
    });

    test("POST /api/users debe retornar 500 si Prisma falla", async () => {
      mockCreate.mockRejectedValue(new Error("DB error"));

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
      mockFindMany.mockResolvedValue([]);

      const res = await request(app).get("/api/users");
      expect(res.headers["x-powered-by"]).toBeUndefined();
    });
  });
});
