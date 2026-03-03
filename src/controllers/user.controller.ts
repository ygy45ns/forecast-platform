import { Request, Response } from "express";
import { depositService } from "../services/user.service";

export async function deposit(req: Request, res: Response) {
  try {
    const userId = Number(req.params.id);
    const { amount } = req.body;
    const idempotencyKey = req.header("Idempotency-Key");

    if (!idempotencyKey) {
      return res.status(400).json({ error: "Missing Idempotency-Key" });
    }

    const result = await depositService(userId, amount, idempotencyKey);
    return res.json(result);
  } catch (e: any) {
    if (e.message === "IDEMPOTENCY_CONFLICT") {
      return res.status(409).json({ error: "Idempotency conflict" });
    }
    if (e.message === "IDEMPOTENCY_REPEAT") {
      return res.status(200).json({ error: "Idempotency repeat" });
    }
    return res.status(400).json({ error: e.message });
  }
}
