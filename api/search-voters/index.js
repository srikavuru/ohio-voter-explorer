const { verifyAuth } = require('../shared/auth');
const { getDb } = require('../shared/db');

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

// Years since a voter FIRST registered -- not years at their current address. Ohio
// carries the original registration date across in-state moves, which the data
// confirms: 91.8% of multi-person households have differing registration dates, and
// 36,861 people carry dates from the 1970s. There is no address-effective-date column
// in the file, so address tenure is not derivable. Treat this as county tenure.
const TENURE_BRACKETS = {
  '0-2': [null, 2],
  '3-5': [2, 5],
  '6-10': [5, 10],
  '11-20': [10, 20],
  '20+': [20, null],
};

// 1,048 rows carry a 1900-01-01 placeholder rather than a real date. Left in, they
// would all pile into the 20+ bracket and overstate long-tenure counts.
const PLACEHOLDER_REGISTRATION = '1900-01-01';

module.exports = async function (context, req) {
  await verifyAuth(req);

  const db = getDb();
  const query = req.query || {};

  const conditions = [];
  const params = [];

  if (query.status) {
    conditions.push('voter_status = ?');
    params.push(query.status);
  }
  if (query.party) {
    // Most voters have never pulled a primary ballot, so their party is NULL --
    // reachable only via IS NULL, not the = comparison.
    if (query.party === 'NONE') {
      conditions.push('party_affiliation IS NULL');
    } else {
      conditions.push('party_affiliation = ?');
      params.push(query.party);
    }
  }
  if (query.precinct) {
    conditions.push('(precinct_code = ? OR precinct_name LIKE ?)');
    params.push(query.precinct, `%${query.precinct}%`);
  }
  // District codes are zero-padded strings ('03', not 3) and every row has one,
  // so these are plain equality matches with no NULL case to handle.
  if (query.congressional) {
    conditions.push('congressional_district = ?');
    params.push(query.congressional);
  }
  if (query.stateSenate) {
    conditions.push('state_senate_district = ?');
    params.push(query.stateSenate);
  }
  if (query.stateHouse) {
    conditions.push('state_representative_district = ?');
    params.push(query.stateHouse);
  }
  if (query.tenure && TENURE_BRACKETS[query.tenure]) {
    const [minYears, maxYears] = TENURE_BRACKETS[query.tenure];
    conditions.push('registration_date <> ?');
    params.push(PLACEHOLDER_REGISTRATION);
    if (minYears !== null) {
      conditions.push("registration_date <= date('now', ?)");
      params.push(`-${minYears} years`);
    }
    if (maxYears !== null) {
      conditions.push("registration_date > date('now', ?)");
      params.push(`-${maxYears} years`);
    }
  }
  // A unit/apartment number implies multi-family housing, which is the closest thing
  // in this file to a rent-vs-own signal. It holds up: voters with a unit number
  // average 10.8 years registered against 16.2 for those without.
  if (query.housing === 'MULTI') {
    conditions.push("TRIM(COALESCE(residential_secondary_addr, '')) <> ''");
  }
  if (query.housing === 'SINGLE') {
    conditions.push("TRIM(COALESCE(residential_secondary_addr, '')) = ''");
  }
  if (query.q) {
    conditions.push('(last_name LIKE ? OR first_name LIKE ? OR residential_address1 LIKE ?)');
    const like = `%${query.q}%`;
    params.push(like, like, like);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = Math.min(parseInt(query.limit, 10) || DEFAULT_LIMIT, MAX_LIMIT);
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const offset = (page - 1) * limit;

  const total = db.prepare(`SELECT COUNT(*) AS n FROM voters ${where}`).get(...params).n;
  const results = db
    .prepare(
      `SELECT sos_voterid, first_name, last_name, residential_address1, residential_city,
              residential_zip, precinct_code, party_affiliation, voter_status,
              registration_date,
              CASE WHEN registration_date = '${PLACEHOLDER_REGISTRATION}' THEN NULL
                   ELSE CAST((julianday('now') - julianday(registration_date)) / 365.25 AS INT)
              END AS years_registered,
              CASE WHEN TRIM(COALESCE(residential_secondary_addr, '')) <> ''
                   THEN 'MULTI' ELSE 'SINGLE' END AS housing_type
       FROM voters
       ${where}
       ORDER BY last_name, first_name
       LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset);

  context.res = {
    status: 200,
    body: { results, total, page, limit },
  };
};
