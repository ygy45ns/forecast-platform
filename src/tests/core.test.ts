import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../server";

describe("Core flows", () => {
  it("deposit increases balance", async () => {
    const beforeRes = await request(app).get("/api/users/1");
    const beforeBalance = beforeRes.body.balance;

    const res = await request(app)
      .post("/api/users/1/deposit")
      .set("Idempotency-Key", "d-1")
      .send({ amount: 100 });
    expect(res.status).toBe(200);
  });

  it("deposit idempotency works", async () => {
    const r1 = await request(app)
      .post("/api/users/1/deposit")
      .set("Idempotency-Key", "d-2")
      .send({ amount: 50 });
    const r2 = await request(app)
      .post("/api/users/1/deposit")
      .set("Idempotency-Key", "d-2")
      .send({ amount: 50 });
    expect(r2.status).toBe(200);
  });

  it("bet fails on insufficient balance", async () => {
    const res = await request(app)
      .post("/api/bets")
      .set("Idempotency-Key", "b-1")
      .send({ userId: 2, gameId: "G", amount: 99999 });
    expect(res.status).toBe(400);
  });

  it("bet idempotency works", async () => {
    const r1 = await request(app)
      .post("/api/bets")
      .set("Idempotency-Key", "b-2")
      .send({ userId: 1, gameId: "G", amount: 10 });
    const r2 = await request(app)
      .post("/api/bets")
      .set("Idempotency-Key", "b-2")
      .send({ userId: 1, gameId: "G", amount: 10 });
    expect(r2.status).toBe(200);
  });

  it("settled bet cannot be settled again", async () => {
    const bet = await request(app)
      .post("/api/bets")
      .set("Idempotency-Key", "b-3")
      .send({ userId: 1, gameId: "G", amount: 10 });

    await request(app)
      .post(`/api/bets/${bet.body.id}/settle`)
      .send({ result: "WIN" });

    const again = await request(app)
      .post(`/api/bets/${bet.body.id}/settle`)
      .send({ result: "WIN" });

    expect(again.status).toBe(400);
  });
});
