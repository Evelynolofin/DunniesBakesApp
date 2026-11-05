export const PAYSTACK_PUBLIC_KEY =
  process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY;

const VERIFY_API_BASE_URL = process.env.EXPO_PUBLIC_VERIFY_API_BASE_URL;

export type PaystackVerifyResult = {
  status: "success" | "failed" | "abandoned" | string;
  amountKobo: number;
  reference: string;
};

export async function verifyPaystackTransaction(
  reference: string
): Promise<PaystackVerifyResult | null> {
  if (!VERIFY_API_BASE_URL) {
    console.error(
      "[Paystack] EXPO_PUBLIC_VERIFY_API_BASE_URL is not set. " +
        "Check your .env file has EXPO_PUBLIC_VERIFY_API_BASE_URL=https://dunniekitchen.vercel.app " +
        "and that you restarted `expo start` after adding/changing it."
    );
    return null;
  }
  if (!/^https:\/\//.test(VERIFY_API_BASE_URL)) {
    console.error(
      `[Paystack] EXPO_PUBLIC_VERIFY_API_BASE_URL looks invalid: "${VERIFY_API_BASE_URL}". ` +
        "It must start with https:// and be a publicly reachable URL " +
        "(not localhost/127.0.0.1 — those don't resolve from a phone or simulator)."
    );
    return null;
  }

  const url = `${VERIFY_API_BASE_URL}/api/verify?reference=${encodeURIComponent(reference)}`;

  if (__DEV__) {
    console.log("[Paystack] Verifying against:", url);
  }

  try {
    const res = await fetch(url);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`[Paystack] Verify request failed with status ${res.status}:`, body);
      return null;
    }

    const json = await res.json();
    if (json.status === "error") {
      console.warn("[Paystack] Verify backend error:", json.message);
      return null;
    }
    return json as PaystackVerifyResult;
  } catch (err) {
    console.warn(
      "[Paystack] Verification request failed. This usually means the URL " +
        `"${VERIFY_API_BASE_URL}" is unreachable — check it's deployed, ` +
        "correct, and not pointing at localhost. Raw error:",
      err
    );
    return null;
  }
}

export type PaystackRefundResult = {
  ok: boolean;
  message: string;
};

/**
 * Asks the backend to refund a Paystack payment back to the customer's
 * original payment method. The secret key lives on the server (/api/refund),
 * never in the app.
 */
export async function requestPaystackRefund(
  reference: string,
  amountKobo: number
): Promise<PaystackRefundResult> {
  if (!VERIFY_API_BASE_URL || !/^https:\/\//.test(VERIFY_API_BASE_URL)) {
    return { ok: false, message: "Refund service is not configured." };
  }
  try {
    const res = await fetch(`${VERIFY_API_BASE_URL}/api/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference, amountKobo }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.status === "error") {
      console.warn("[Paystack] Refund failed:", res.status, json);
      return { ok: false, message: json.message ?? "Refund request failed." };
    }
    return { ok: true, message: json.message ?? "Refund initiated." };
  } catch (err) {
    console.warn("[Paystack] Refund request error:", err);
    return { ok: false, message: "Couldn't reach the refund service." };
  }
}