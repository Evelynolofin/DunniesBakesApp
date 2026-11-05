// Deploy as /api/refund next to your existing /api/verify on Vercel.
// Needs env var PAYSTACK_SECRET_KEY (the same one /api/verify uses).

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return res.status(500).json({ status: "error", message: "Server is missing PAYSTACK_SECRET_KEY" });
  }

  const { reference, amountKobo } = req.body || {};
  if (!reference || typeof reference !== "string" || !reference.startsWith("ORDER_")) {
    return res.status(400).json({ status: "error", message: "Invalid reference" });
  }

  try {
    // 1. Only refund a payment that really succeeded, and never more than was paid.
    const vRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secret}` } }
    );
    const vJson = await vRes.json();
    if (!vJson.status || vJson.data?.status !== "success") {
      return res.status(400).json({ status: "error", message: "Transaction was not successful" });
    }
    const paid = vJson.data.amount;
    const amount = Math.min(Number(amountKobo) || paid, paid);

    // 2. Ask Paystack to refund it to the original payment method.
    const rRes = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transaction: reference, amount }),
    });
    const rJson = await rRes.json();

    if (!rJson.status) {
      return res.status(400).json({ status: "error", message: rJson.message || "Paystack refused the refund" });
    }
    return res.status(200).json({
      status: "success",
      message: "Refund initiated",
      refundStatus: rJson.data?.status, // usually "pending" -> "processed"
    });
  } catch (e) {
    return res.status(500).json({ status: "error", message: "Refund request failed" });
  }
};