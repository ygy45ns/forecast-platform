import { prisma } from "../lib/prisma";

export async function reconcileService(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("USER_NOT_FOUND");

  const ledgers = await prisma.ledger.findMany({ where: { userId } });
  const bets = await prisma.bet.findMany({ where: { userId } });

  const ledgerBalance = ledgers.reduce((sum, l) => sum + l.amount, 0);

  const statusCount = bets.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const anomalies: string[] = [];
  if (ledgerBalance !== user.balance) {
    anomalies.push("BALANCE_MISMATCH");
  }

  return {
    userId,
    dbBalance: user.balance,
    ledgerBalance,
    betStats: statusCount,
    anomalies,
  };
}
