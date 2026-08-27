const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export default async function handler(req: any, res: any) {
  if (!PAYSTACK_SECRET_KEY) {
    return res.status(500).json({
      status: "error",
      message: "Server misconfigured",
    });
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      status: "error",
      message: "Method not allowed",
    });
  }

  const reference = req.query.reference;

  if (!reference) {
    return res.status(400).json({
      status: "error",
      message: "Missing reference",
    });
  }

  try {
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paystackJson = await paystackRes.json();

    return res.status(200).json({
      status: paystackJson.data?.status ?? "failed",
      amountKobo: Number(paystackJson.data?.amount ?? 0),
      reference,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      message: "Verification request failed",
    });
  }
}