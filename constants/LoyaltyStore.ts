import AsyncStorage from "@react-native-async-storage/async-storage";
import { notifyPointsEarned, notifyPointsRedeemed } from "@/constants/Notificationservice";

export const LOYALTY_EARN_THRESHOLD = 5000;
export const LOYALTY_EARN_RATE = 100;
export const LOYALTY_REDEEM_RATE = 1;
export const LOYALTY_MAX_REDEEM_PERCENT = 0.5;

export type LoyaltyEntryType = "earned" | "redeemed";

export type LoyaltyEntry = {
  id: string;
  type: LoyaltyEntryType;
  points: number;
  title: string;
  subtitle?: string;
  date: string;
  orderRef?: string;
};

function balanceKey(email: string) {
  return `loyalty_points_${email}`;
}
function historyKey(email: string) {
  return `loyalty_history_${email}`;
}

export async function getPoints(email: string): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(balanceKey(email));
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

export async function getPointsHistory(email: string): Promise<LoyaltyEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(historyKey(email));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function setPoints(email: string, value: number): Promise<void> {
  await AsyncStorage.setItem(balanceKey(email), String(Math.max(0, Math.round(value))));
}

async function addHistoryEntry(
  email: string,
  entry: Omit<LoyaltyEntry, "id" | "date">
): Promise<LoyaltyEntry> {
  const current = await getPointsHistory(email);
  const item: LoyaltyEntry = {
    ...entry,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    date: new Date().toISOString(),
  };
  await AsyncStorage.setItem(historyKey(email), JSON.stringify([item, ...current]));
  return item;
}

/** Pure calculation — how many points a given amount would earn (0 if under the threshold). */
export function calculateEarnedPoints(amount: number): number {
  if (amount < LOYALTY_EARN_THRESHOLD) return 0;
  return Math.floor(amount / LOYALTY_EARN_RATE);
}

/** Converts a points amount into its naira discount value. */
export function pointsToNaira(points: number): number {
  return Math.round(points * LOYALTY_REDEEM_RATE);
}

/**
 * Max points redeemable against a given subtotal — capped by both the
 * user's balance and the max-redeem percentage rule.
 */
export function maxRedeemablePoints(subtotal: number, availablePoints: number): number {
  const capByOrder = Math.floor((subtotal * LOYALTY_MAX_REDEEM_PERCENT) / LOYALTY_REDEEM_RATE);
  return Math.max(0, Math.min(availablePoints, capByOrder));
}

/**
 * Awards points for a completed order. Call this with the amount the
 * customer actually paid (after any points discount was applied) — not the
 * pre-discount subtotal — so redeeming points doesn't let someone farm more
 * points than they paid for.
 */
export async function earnPointsForOrder(
  email: string,
  amountPaid: number,
  orderRef: string
): Promise<number> {
  const earned = calculateEarnedPoints(amountPaid);
  if (earned <= 0) return 0;

  const current = await getPoints(email);
  await setPoints(email, current + earned);
  await addHistoryEntry(email, {
    type: "earned",
    points: earned,
    title: "Points earned",
    subtitle: `Order #${orderRef}`,
    orderRef,
  });
  await notifyPointsEarned(earned, orderRef);
  return earned;
}

/**
 * Redeems points as a discount on an order. Returns false (and changes
 * nothing) if the balance is insufficient.
 */
export async function redeemPoints(
  email: string,
  points: number,
  orderRef: string
): Promise<boolean> {
  if (points <= 0) return true;

  const current = await getPoints(email);
  if (points > current) return false;

  await setPoints(email, current - points);
  await addHistoryEntry(email, {
    type: "redeemed",
    points,
    title: "Points redeemed",
    subtitle: `Order #${orderRef} · -₦${pointsToNaira(points).toLocaleString()}`,
    orderRef,
  });
  await notifyPointsRedeemed(points, pointsToNaira(points), orderRef);
  return true;
}