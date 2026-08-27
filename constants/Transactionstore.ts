import AsyncStorage from "@react-native-async-storage/async-storage";

export type TxType = "credit" | "debit";
export type PaymentMethod = "wallet" | "paystack" | "transfer" | "cash";

export type Transaction = {
  id: string;
  type: TxType;
  method: PaymentMethod;
  title: string;
  subtitle?: string;
  amount: number;
  date: string;
  reference?: string;
  orderRef?: string;
};

function txKey(email: string) {
  return `wallet_transactions_${email}`;
}

export function paymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case "wallet":   return "Wallet";
    case "paystack": return "Paystack";
    case "transfer": return "Bank Transfer";
    case "cash":     return "Cash on Delivery";
  }
}

export async function getTransactions(email: string): Promise<Transaction[]> {
  try {
    const raw = await AsyncStorage.getItem(txKey(email));
    const list: any[] = raw ? JSON.parse(raw) : [];
    return list.map((t) => ({ method: "wallet", ...t }));
  } catch {
    return [];
  }
}

export async function addTransaction(
  email: string,
  tx: Omit<Transaction, "id" | "date">
): Promise<Transaction> {
  const item: Transaction = {
    ...tx,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    date: new Date().toISOString(),
  };
  const current = await getTransactions(email);
  const updated = [item, ...current];
  await AsyncStorage.setItem(txKey(email), JSON.stringify(updated));
  return item;
}

/**
 * Single call site for recording ANY order payment — wallet, paystack,
 * transfer, or cash. Checkout calls this once per order regardless of
 * which method the customer picked, so every payment ends up in the same
 * Transaction History list (the Wallet screen already renders whatever is
 * stored under this key, so no UI changes are needed there).
 */
export async function recordOrderPayment(
  email: string,
  params: { method: PaymentMethod; amount: number; reference: string; orderRef: string }
): Promise<Transaction> {
  return addTransaction(email, {
    type: "debit",
    method: params.method,
    title: "Order payment",
    subtitle: `${paymentMethodLabel(params.method)} · ${params.orderRef}`,
    amount: params.amount,
    reference: params.reference,
    orderRef: params.orderRef,
  });
}