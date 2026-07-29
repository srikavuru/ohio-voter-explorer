const admin = require('firebase-admin');

// Local dev only, and deliberately opt-in. This lives in api/local.settings.json,
// which is gitignored and never uploaded -- so it is present on this machine and
// absent from Azure App Settings unless someone deliberately adds it there. Any
// value other than the literal 'true' denies.
const ALLOW_ANONYMOUS = process.env.ALLOW_ANONYMOUS_DEV_ACCESS === 'true';

// verifyIdToken only proves a token came from this Firebase project -- with Google
// sign-in enabled, that is satisfied by any Google account on the internet. This is
// a single-operator tool, so the token must also belong to a listed address. An
// empty list denies everyone, which is the right direction to fail in.
const OPERATOR_EMAILS = (process.env.OPERATOR_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

class AuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

let initialized = false;
let firebaseReady = false;

function ensureInitialized() {
  if (initialized) return firebaseReady;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw && raw !== 'YOUR_BASE64_SERVICE_ACCOUNT_HERE') {
    const serviceAccount = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    firebaseReady = true;
  }
  initialized = true;
  return firebaseReady;
}

async function verifyAuth(request) {
  const header = request.headers.get
    ? request.headers.get('authorization')
    : request.headers.authorization;

  // Fails CLOSED. This previously returned a dev user for any request arriving
  // without an Authorization header, which would have made all 891,350 voter
  // records -- names, addresses, birth year, primary-ballot history -- readable
  // by anyone who found the URL, the moment this deployed.
  if (!header) {
    if (ALLOW_ANONYMOUS) return { uid: 'dev-user-local', email: null };
    throw new AuthError('authentication required');
  }

  // A token was presented but there is no key to check it against. Refusing is the
  // only safe reading: accepting would mean trusting an unverified assertion.
  if (!ensureInitialized()) {
    throw new AuthError('auth is not configured on this host', 503);
  }

  const token = header.replace(/^Bearer\s+/i, '');

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch (err) {
    // Deliberately not forwarding err.message -- it can echo token contents back.
    throw new AuthError('invalid or expired token');
  }

  const email = (decoded.email || '').toLowerCase();
  if (!OPERATOR_EMAILS.includes(email)) {
    throw new AuthError('not an authorized operator', 403);
  }

  return { uid: decoded.uid, email };
}

// Endpoints call this rather than verifyAuth directly: it turns a rejection into a
// real 401/403 response. A bare `await verifyAuth(req)` left the throw unhandled,
// which the host surfaced as a 500 -- still a denial, but it reads as a server bug
// rather than an auth decision, and it runs the endpoint's error path instead.
async function requireAuth(context, req) {
  try {
    context.operator = await verifyAuth(req);
    return true;
  } catch (err) {
    const status = err instanceof AuthError ? err.status : 401;
    context.log.warn(`auth rejected (${status}): ${err.message}`);
    context.res = { status, body: { error: err.message } };
    return false;
  }
}

module.exports = { verifyAuth, requireAuth, AuthError };
