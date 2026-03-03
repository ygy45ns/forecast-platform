import { Request, Response } from "express";
import { cancelBetService } from "../services/cancel.service";

export async function cancelBet(req: Request, res: Response) {
  try {
    const betId = Number(req.params.id);
    const bet = await cancelBetService(betId);
    res.json(bet);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
}
