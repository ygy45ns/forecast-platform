import { Request, Response } from "express";
import { reconcileService } from "../services/admin.service";

export async function reconcile(req: Request, res: Response) {
  try {
    const userId = Number(req.query.userId);
    const report = await reconcileService(userId);
    res.json(report);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
}
