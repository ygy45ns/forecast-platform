import { Request, Response } from "express";
import { settleBetService } from "../services/settle.service";

export async function settleBet(req: Request, res: Response) {
  try {
    const betId = Number(req.params.id);
    const { result } = req.body;

    const bet = await settleBetService(betId, result);
    res.json(bet);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
}
