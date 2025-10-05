const request = require("supertest");
const app = require("../app");

describe("Sanity check", () => {
  it("debería responder en / con 200", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Backend CINE funcionando");
  });
});
