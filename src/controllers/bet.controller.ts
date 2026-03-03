import { Request, Response } from "express";
import { placeBetService } from "../services/bet.service";

export async function placeBet(req: Request, res: Response) {
  try {
    const { userId, gameId, amount } = req.body;
    const idempotencyKey = req.header("Idempotency-Key");

    if (!idempotencyKey) {
      return res.status(400).json({ error: "Missing Idempotency-Key" });
    }

    const bet = await placeBetService(
      Number(userId),
      gameId,
      Number(amount),
      idempotencyKey
    );

    res.json(bet);
  } catch (e: any) {
    if (e.message === "INSUFFICIENT_BALANCE") {
      return res.status(400).json({ error: "Insufficient balance" });
    }
    if (e.message === "IDEMPOTENCY_CONFLICT") {
      return res.status(409).json({ error: "Idempotency conflict" });
    }
    if (e.message === "IDEMPOTENCY_REPEAT") {
      return res.status(200).json({ ok: true });
    }
    res.status(400).json({ error: e.message });
  }
}
