const fetch = require("node-fetch");

const OPAY_CASHIER_CREATE_URL =
  "https://sandboxapi.opaycheckout.com/api/v1/international/cashier/create";

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        },
        body: ""
      };
    }

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: "Method Not Allowed"
      };
    }

    const OPAY_PUBLIC_KEY = process.env.OPAY_PUBLIC_KEY;
    const OPAY_MERCHANT_ID = process.env.OPAY_MERCHANT_ID;

    if (!OPAY_PUBLIC_KEY || !OPAY_MERCHANT_ID) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          error: "Missing OPAY_PUBLIC_KEY or OPAY_MERCHANT_ID"
        })
      };
    }

    const input = JSON.parse(event.body || "{}");

    const amount = Number(input.amount || 0);
    const currency = String(input.currency || "NGN").toUpperCase();
    const reference = String(
      input.reference || input.merchantOrderId || `ref_${Date.now()}`
    ).trim();

    const customer = input.customer || {};

    const payload = {
      reference: "TEST_REF_123456", // 🔥 FORCE VALUE
      merchantOrderId: "TEST_REF_123456",
    
      amount: {
        total: 5000,
        currency: "NGN"
      },
    
      description: "Test payment",
    
      redirectUrl: "https://videocourses.netlify.app/return.html",
    
      callbackUrl: "https://videocourses.netlify.app/.netlify/functions/webhook",
    
      customer: {
        name: "Test User",
        email: "test@example.com",
        phoneNumber: "08000000000"
      },
    
      merchantName: "Video Courses"
    };

    const resp = await fetch(OPAY_CASHIER_CREATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPAY_PUBLIC_KEY}`,
        "MerchantId": OPAY_MERCHANT_ID
      },
      body: JSON.stringify(payload)
    });

    const rawText = await resp.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { raw: rawText };
    }

    if (!resp.ok) {
      return {
        statusCode: resp.status,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          error: "OPay request failed",
          raw: data
        })
      };
    }

    const cashierUrl =
      data?.data?.cashierUrl ||
      data?.data?.checkoutUrl ||
      data?.cashierUrl ||
      data?.checkoutUrl ||
      null;

    if (!cashierUrl) {
      return {
        statusCode: 502,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          error: "No cashierUrl in OPay response",
          raw: data
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        cashierUrl,
        reference,
        raw: data
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        error: err.message || "Server error"
      })
    };
  }
};