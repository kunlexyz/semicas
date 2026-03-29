// netlify/functions/create-payment.js
const fetch = require('node-fetch');
const crypto = require('crypto');
const admin = require('firebase-admin');

const OPAY_CASHIER_CREATE_URL = 'https://sandboxapi.opaycheckout.com/api/v1/international/cashier/create'; // change to production when ready

// Initialize Firebase Admin safely (works across multiple invocations)
function initFirebase() {
  if (global._firebaseAdminInitialized) return admin;
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!base64) throw new Error('FIREBASE_SERVICE_ACCOUNT env var not set');

  const serviceAccountJson = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountJson)
  });
  global._firebaseAdminInitialized = true;
  return admin;
}

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const OPAY_PUBLIC_KEY = process.env.OPAY_PUBLIC_KEY;
    const OPAY_MERCHANT_ID = process.env.OPAY_MERCHANT_ID;
    if (!OPAY_PUBLIC_KEY || !OPAY_MERCHANT_ID) {
      return { statusCode: 500, body: 'OPAY_PUBLIC_KEY or OPAY_MERCHANT_ID not configured' };
    }

    const body = JSON.parse(event.body || '{}');
    const amount = body.amount || 1000;
    const currency = body.currency || 'NGN';
    const customer = body.customer || {};
    const merchantOrderId = body.merchantOrderId || `order_${Date.now()}`;

    // init firebase
    initFirebase();
    const db = admin.firestore();

    // Create an order document in Firestore (status: PENDING)
    const orderDoc = {
      merchantOrderId,
      amount,
      currency,
      customer,
      status: 'PENDING',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      opayResponse: null
    };

    await db.collection('orders').doc(merchantOrderId).set(orderDoc);

    // Build payload for OPay cashier create — adjust fields per your OPay docs
    const payload = {
      merchantOrderId,
      amount: { total: amount, currency },
      description: body.description || 'Order payment',
      redirectUrl: body.redirectUrl || '', // where OPay redirects user after payment (client)
      callbackUrl: body.callbackUrl || '', // OPay will POST to this serverless webhook (recommended)
      customer: {
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || ''
      },
      merchantName: body.merchantName || 'Your Shop'
    };

    // Call OPay (server-to-server)
    const resp = await fetch(OPAY_CASHIER_CREATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPAY_PUBLIC_KEY}`,
        'MerchantId': OPAY_MERCHANT_ID
      },
      body: JSON.stringify(payload)
    });

    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

    // Save raw opay response into order doc (helpful for debugging)
    await db.collection('orders').doc(merchantOrderId).update({
      opayResponse: data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Extract cashier/checkout URL (check your sandbox response shape)
    const cashierUrl =
      data?.data?.cashierUrl ||
      data?.data?.checkoutUrl ||
      data?.checkoutUrl ||
      data?.cashierUrl ||
      (data?.data?.cashier_url) ||
      null;

    if (!cashierUrl) {
      return {
        statusCode: 502,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'No cashierUrl in OPay response', raw: data })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ cashierUrl, merchantOrderId, opay: data })
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message || 'Server error' })
    };
  }
};