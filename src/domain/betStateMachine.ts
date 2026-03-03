import { BetStatus } from "@prisma/client";

export function canSettle(status: BetStatus) {
  return status === "PLACED";
}

export function canCancel(status: BetStatus) {
  return status === "PLACED";
}
