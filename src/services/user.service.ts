import { prisma } from "../lib/prisma";
import { checkIdempotency } from "../utils/idempotency";

export async function depositService(
  userId: number,
  amount: number,
  idempotencyKey: string
) {
  if (amount <= 0) {
    throw new Error("INVALID_AMOUNT");
  }

  return prisma.$transaction(async (tx) => {
    await checkIdempotency(tx, idempotencyKey, {
      userId,
      amount,
    });

    const user = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    await tx.ledger.create({
      data: {
        userId,
        type: "DEPOSIT",
        amount,
      },
    });

    const updated = await tx.user.update({
      where: { id: userId },
      data: {
        balance: user.balance + amount,
      },
    });

    return {
      userId: updated.id,
      balance: updated.balance,
    };
  });
}
