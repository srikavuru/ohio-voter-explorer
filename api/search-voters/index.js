const { verifyAuth } = require('../shared/auth');
const { getDb } = require('../shared/db');

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

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
    conditions.push('party_affiliation = ?');
    params.push(query.party);
  }
  if (query.precinct) {
    conditions.push('(precinct_code = ? OR precinct_name LIKE ?)');
    params.push(query.precinct, `%${query.precinct}%`);
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
              residential_zip, precinct_code, party_affiliation, voter_status
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
