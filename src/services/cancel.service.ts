import { prisma } from "../lib/prisma";
import { canCancel } from "../domain/betStateMachine";

export async function cancelBetService(betId: number) {
  return prisma.$transaction(async (tx) => {
    const bet = await tx.bet.findUnique({ where: { id: betId } });
    if (!bet || !canCancel(bet.status)) {
      throw new Error("INVALID_BET_STATE");
    }
    await tx.ledger.create({
      data: {
        userId: bet.userId,
        type: "BET_REFUND",
        amount: bet.amount,
        refId: `BET_${bet.id}`,
      },
    });

    const user = await tx.user.findUnique({ where: { id: bet.userId } });

    await tx.user.update({
      where: { id: bet.userId },
      data: { balance: user!.balance + bet.amount },
    });

    return tx.bet.update({
      where: { id: bet.id },
      data: { status: "CANCELLED" },
    });
  });
}
