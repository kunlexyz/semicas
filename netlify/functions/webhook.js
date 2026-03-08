const crypto = require("crypto");

exports.handler = async (event, context) => {
  try {
    // Allow only POST
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: "Method Not Allowed"
      };
    }

    const OPAY_SECRET_KEY = process.env.OPAY_SECRET_KEY;

    if (!OPAY_SECRET_KEY) {
      return {
        statusCode: 500,
        body: "Secret key not configured"
      };
    }

    const headers = event.headers;
    const body = event.body;

    // OPay usually sends signature + timestamp headers
    const signatureHeader =
      headers.signature ||
      headers.Signature ||
      headers.authorization ||
      "";

    const requestTimestamp =
      headers.requesttimestamp ||
      headers.RequestTimestamp ||
      "";

    // 🔐 Build string to sign (confirm with your OPay API version)
    const dataToSign = requestTimestamp + body;

    const computedSignature = crypto
      .createHmac("sha512", OPAY_SECRET_KEY)
      .update(dataToSign)
      .digest("hex");

    const receivedSignature = signatureHeader
      .replace(/^HMAC\s+/i, "")
      .replace(/^sha512=/i, "")
      .trim();

    let isValid = false;

    if (
      computedSignature.length === receivedSignature.length
    ) {
      isValid = crypto.timingSafeEqual(
        Buffer.from(computedSignature),
        Buffer.from(receivedSignature)
      );
    }

    if (!isValid) {
      console.log("❌ Invalid signature");
      return {
        statusCode: 400,
        body: "Invalid signature"
      };
    }

    console.log("✅ Signature verified");

    const payload = JSON.parse(body);

    const { merchantOrderId, status } = payload;

    // 🔥 Mark order as paid (Demo logic)
    if (status === "SUCCESS") {
      console.log(`Order ${merchantOrderId} marked as PAID`);
      // TODO: Update your database here
    }

    return {
      statusCode: 200,
      body: "OK"
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: "Server Error"
    };
  }
};