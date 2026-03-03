import { prisma } from "../lib/prisma";
import { checkIdempotency } from "../utils/idempotency";

export async function placeBetService(
  userId: number,
  gameId: string,
  amount: number,
  idempotencyKey: string
) {
  if (amount <= 0) {
    throw new Error("INVALID_AMOUNT");
  }

  return prisma.$transaction(async (tx) => {
    await checkIdempotency(tx, idempotencyKey, {
      userId,
      gameId,
      amount,
    });

    const user = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (user.balance < amount) {
      throw new Error("INSUFFICIENT_BALANCE");
    }

    const bet = await tx.bet.create({
      data: {
        userId,
        gameId,
        amount,
        status: "PLACED",
      },
    });

    await tx.ledger.create({
      data: {
        userId,
        type: "BET_DEBIT",
        amount: -amount,
        refId: `BET_${bet.id}`,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        balance: user.balance - amount,
      },
    });

    return bet;
  });
}
