const { requireAuth } = require('../shared/auth');
const { getDb } = require('../shared/db');

module.exports = async function (context, req) {
  if (!(await requireAuth(context, req))) return;

  const db = getDb();
  const id = (req.query || {}).id;

  if (!id) {
    context.res = { status: 400, body: { error: 'id is required' } };
    return;
  }

  // Deliberately excludes date_of_birth (birth year only) and mailing address --
  // keep PII exposure to the frontend minimal (see CLAUDE.md).
  const voter = db
    .prepare(
      `SELECT sos_voterid, county_number, county_id, last_name, first_name, middle_name, suffix,
              substr(date_of_birth, 1, 4) AS birth_year,
              registration_date, voter_status, party_affiliation,
              residential_address1, residential_secondary_addr, residential_city,
              residential_state, residential_zip, residential_zip_plus4,
              career_center, city, city_school_district, county_court_district,
              congressional_district, court_of_appeals, edu_service_center_district,
              exempted_vill_school_district, library, local_school_district,
              municipal_court_district, precinct_name, precinct_code,
              state_board_of_education, state_representative_district, state_senate_district,
              township, village, ward
       FROM voters WHERE sos_voterid = ?`
    )
    .get(id);

  if (!voter) {
    context.res = { status: 404, body: { error: 'not found' } };
    return;
  }

  const voteHistory = db
    .prepare(
      `SELECT e.election_date, e.election_type, e.raw_column, vh.ballot_value
       FROM vote_history vh
       JOIN elections e ON e.id = vh.election_id
       WHERE vh.voter_id = ?
       ORDER BY e.election_date DESC`
    )
    .all(id);

  context.res = {
    status: 200,
    body: { voter, voteHistory },
  };
};
