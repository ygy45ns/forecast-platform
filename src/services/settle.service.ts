import { prisma } from "../lib/prisma";
import { canSettle } from "../domain/betStateMachine";

export async function settleBetService(betId: number, result: "WIN" | "LOSE") {
  return prisma.$transaction(async (tx) => {
    const bet = await tx.bet.findUnique({ where: { id: betId } });
    if (!bet || !canSettle(bet.status)) {
      throw new Error("INVALID_BET_STATE");
    }

    if (result === "WIN") {
      const reward = bet.amount * 2;

      await tx.ledger.create({
        data: {
          userId: bet.userId,
          type: "BET_CREDIT",
          amount: reward,
          refId: `BET_${bet.id}`,
        },
      });

      const user = await tx.user.findUnique({
        where: { id: bet.userId },
      });

      await tx.user.update({
        where: { id: bet.userId },
        data: {
          balance: user!.balance + reward,
        },
      });
    }

    return tx.bet.update({
      where: { id: bet.id },
      data: { status: "SETTLED" },
    });
  });
}
