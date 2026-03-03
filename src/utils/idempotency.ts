import { Prisma } from "@prisma/client";

export async function checkIdempotency(
  tx: Prisma.TransactionClient,
  key: string,
  payload: any
) {
  const record = await tx.idempotency.findUnique({
    where: { key },
  });

  const hash = JSON.stringify(payload);

  if (!record) {
    await tx.idempotency.create({
      data: { key, request: hash },
    });
    return;
  }

  if (record.request !== hash) {
    throw new Error("IDEMPOTENCY_CONFLICT");
  }

  throw new Error("IDEMPOTENCY_REPEAT");
}
