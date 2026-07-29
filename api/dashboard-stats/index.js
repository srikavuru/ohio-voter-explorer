const { verifyAuth } = require('../shared/auth');
const { getDb } = require('../shared/db');

// 34 of the 91 elections on file drew under 5,000 ballots -- they are localized
// specials that ran in a handful of precincts, not countywide races. Ignoring that
// distinction is actively misleading: the third-most-recent election typed GENERAL
// is 2024-06-11 with 47 ballots, so "the last 3 generals" would otherwise describe
// a race almost nobody in Franklin County was eligible to vote in.
const COUNTYWIDE_MIN_BALLOTS = 5000;

// The voter file is read-only at runtime -- nothing writes to it between imports --
// so these aggregates can never change while the host is up. Computing them costs
// ~2.4s of full table scans, which is worth paying exactly once. Restart the
// Functions host after re-running the import to pick up new numbers.
let cached = null;

function computeStats(db) {
  const totalVoters = db.prepare('SELECT COUNT(*) AS n FROM voters').get().n;
  const totalElections = db.prepare('SELECT COUNT(*) AS n FROM elections').get().n;

  const byStatus = db
    .prepare(
      `SELECT voter_status AS key, COUNT(*) AS n
       FROM voters GROUP BY voter_status ORDER BY n DESC`
    )
    .all();

  // Group on the bare column, not COALESCE(...) -- wrapping it in a function stops
  // SQLite using idx_voters_party as a covering index (196ms -> 31ms). The NULL
  // bucket is the 671k voters who never pulled a primary; relabel it in JS instead.
  const byParty = db
    .prepare(
      `SELECT party_affiliation AS key, COUNT(*) AS n
       FROM voters GROUP BY party_affiliation ORDER BY n DESC`
    )
    .all()
    .map((row) => ({ key: row.key === null ? 'NONE' : row.key, n: row.n }));

  const byCongressional = db
    .prepare(
      `SELECT congressional_district AS key, COUNT(*) AS n
       FROM voters GROUP BY key ORDER BY key`
    )
    .all();

  const topCities = db
    .prepare(
      `SELECT TRIM(residential_city) AS key, COUNT(*) AS n
       FROM voters GROUP BY key ORDER BY n DESC LIMIT 5`
    )
    .all();

  // Count ballots per election in a subquery FIRST, then join to elections. Driving
  // from elections instead makes SQLite do an indexed lookup into vote_history per
  // election, random-accessing millions of rows: 6.7s versus 1.2s for this shape,
  // which scans the election_id index once as a covering index.
  // Oldest-first so the frontend can render it left-to-right without reversing.
  const generalTurnout = db
    .prepare(
      `SELECT e.election_date AS date, c.ballots AS ballots
       FROM (
         SELECT election_id, COUNT(*) AS ballots
         FROM vote_history
         GROUP BY election_id
       ) c
       JOIN elections e ON e.id = c.election_id
       WHERE e.election_type = 'GENERAL' AND c.ballots >= ?
       ORDER BY e.election_date DESC
       LIMIT 8`
    )
    .all(COUNTYWIDE_MIN_BALLOTS)
    .reverse();

  // Turnout needs a denominator, and today's 891,350 is the wrong one -- for 2018 it
  // would count ~300k people who had not registered yet. Instead, count voters whose
  // registration_date precedes each election. One SUM per election in a single pass,
  // rather than one scan per election (~250ms versus ~2s).
  //
  // Caveat worth knowing: this file only holds CURRENT registrants, so anyone purged,
  // moved, or deceased since an election is missing from both sides of the ratio.
  // Purges fall hardest on people who do not vote, so these rates read high compared
  // with the true historical turnout. It is "share of today's roll, registered by then,
  // who voted" -- precise, but not the county's official turnout figure.
  if (generalTurnout.length) {
    const eligibleRow = db
      .prepare(
        `SELECT ${generalTurnout
          .map((_, i) => `SUM(registration_date <= ?) AS e${i}`)
          .join(', ')} FROM voters`
      )
      .get(...generalTurnout.map((e) => e.date));

    generalTurnout.forEach((entry, i) => {
      entry.registeredByThen = eligibleRow[`e${i}`];
      entry.turnoutPct = entry.registeredByThen
        ? (entry.ballots / entry.registeredByThen) * 100
        : null;
    });
  }

  return {
    totalVoters,
    totalElections,
    byStatus,
    byParty,
    byCongressional,
    topCities,
    generalTurnout,
    countywideMinBallots: COUNTYWIDE_MIN_BALLOTS,
  };
}

module.exports = async function (context, req) {
  await verifyAuth(req);

  if (!cached) cached = computeStats(getDb());

  context.res = { status: 200, body: cached };
};
