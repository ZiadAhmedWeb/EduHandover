export const HANDOVER_ACCESS_MONTHS = 6;

export function joinedBefore(joinedAt: Date, months: number): boolean {
  const threshold = new Date();
  threshold.setMonth(threshold.getMonth() - months);
  return joinedAt <= threshold;
}

export function canCreateHandovers(role: string, joinedAt?: Date | null): boolean {
  if (role === "ADMIN") return true;
  return joinedAt ? joinedBefore(joinedAt, HANDOVER_ACCESS_MONTHS) : false;
}

export function canAcknowledgeHandovers(role: string, joinedAt?: Date | null): boolean {
  if (role === "ADMIN") return true;
  return joinedAt ? !joinedBefore(joinedAt, HANDOVER_ACCESS_MONTHS) : false;
}
