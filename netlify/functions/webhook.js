// netlify/functions/webhook.js
const crypto = require('crypto');
const admin = require('firebase-admin');

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
  try {
    // Netlify passes raw body as string in event.body
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const OPAY_SECRET_KEY = process.env.OPAY_SECRET_KEY;
    if (!OPAY_SECRET_KEY) {
      console.error('OPAY_SECRET_KEY not configured');
      return { statusCode: 500, body: 'Server misconfigured' };
    }

    const headers = Object.keys(event.headers || {}).reduce((acc, k) => {
      acc[k.toLowerCase()] = event.headers[k];
      return acc;
    }, {});

    const signatureHeader = headers['signature'] || headers['authorization'] || '';
    const requestTimestamp = headers['requesttimestamp'] || '';

    const bodyString = event.body || ''; // raw string
    // Build the data to sign exactly as OPay expects. Many examples use timestamp + body.
    const dataToSign = requestTimestamp + bodyString;

    // Compute HMAC-SHA512
    const computedSignature = crypto.createHmac('sha512', OPAY_SECRET_KEY).update(dataToSign).digest('hex');

    let receivedSignature = String(signatureHeader || '').replace(/^HMAC\s+/i, '').replace(/^sha512=/i, '').trim();

    let isValid = false;
    try {
      if (computedSignature.length === receivedSignature.length) {
        isValid = crypto.timingSafeEqual(Buffer.from(computedSignature, 'hex'), Buffer.from(receivedSignature, 'hex'));
      }
    } catch (e) {
      isValid = false;
    }

    if (!isValid) {
      console.warn('Invalid signature', { computedSignature, receivedSignature });
      return { statusCode: 400, body: 'Invalid signature' };
    }

    // Signature valid
    console.log('✅ Valid webhook signature');

    // Parse payload and update Firestore
    const payload = JSON.parse(bodyString || '{}');
    initFirebase();
    const db = admin.firestore();

    const merchantOrderId = payload.merchantOrderId || payload.orderId || payload.merchant_order_id;
    const status = payload.status || payload.paymentStatus || '';

    if (!merchantOrderId) {
      console.warn('No merchantOrderId in payload', payload);
      return { statusCode: 400, body: 'No merchantOrderId' };
    }

    // Update the order in Firestore
    const orderRef = db.collection('orders').doc(merchantOrderId);

    // Optionally load current order
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      console.warn('Order not found in Firestore:', merchantOrderId);
      // You may want to create it or reject. Here we'll create minimal doc.
      await orderRef.set({
        merchantOrderId,
        status: status || 'UNKNOWN',
        opayPayload: payload,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { statusCode: 200, body: 'OK' };
    }

    // Map OPay status to your own
    let newStatus = 'PENDING';
    if (String(status).toUpperCase() === 'SUCCESS' || String(payload?.paymentStatus).toUpperCase() === 'SUCCESS') {
      newStatus = 'PAID';
    } else if (String(status).toUpperCase() === 'FAILED') {
      newStatus = 'FAILED';
    } else {
      newStatus = status || 'UNKNOWN';
    }

    await orderRef.update({
      status: newStatus,
      opayPayload: payload,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Order ${merchantOrderId} updated to ${newStatus}`);
    return { statusCode: 200, body: 'OK' };

  } catch (err) {
    console.error('Webhook error', err);
    return { statusCode: 500, body: 'Server error' };
  }
};