const admin = require('firebase-admin');

let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw && raw !== 'YOUR_BASE64_SERVICE_ACCOUNT_HERE') {
    const serviceAccount = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
  initialized = true;
}

async function verifyAuth(request) {
  const header = request.headers.get
    ? request.headers.get('authorization')
    : request.headers.authorization;

  if (!header) {
    return { uid: 'dev-user-local' };
  }

  ensureInitialized();
  const token = header.replace(/^Bearer\s+/i, '');
  const decoded = await admin.auth().verifyIdToken(token);
  return { uid: decoded.uid, email: decoded.email };
}

module.exports = { verifyAuth };
