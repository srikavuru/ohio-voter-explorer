const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.resolve(__dirname, '..', '..', 'data', 'franklin.db');

const CORE_COLUMNS = [
  'sos_voterid',
  'county_number',
  'county_id',
  'last_name',
  'first_name',
  'middle_name',
  'suffix',
  'date_of_birth',
  'registration_date',
  'voter_status',
  'party_affiliation',
  'residential_address1',
  'residential_secondary_addr',
  'residential_city',
  'residential_state',
  'residential_zip',
  'residential_zip_plus4',
  'residential_country',
  'residential_postalcode',
  'mailing_address1',
  'mailing_secondary_address',
  'mailing_city',
  'mailing_state',
  'mailing_zip',
  'mailing_zip_plus4',
  'mailing_country',
  'mailing_postal_code',
  'career_center',
  'city',
  'city_school_district',
  'county_court_district',
  'congressional_district',
  'court_of_appeals',
  'edu_service_center_district',
  'exempted_vill_school_district',
  'library',
  'local_school_district',
  'municipal_court_district',
  'precinct_name',
  'precinct_code',
  'state_board_of_education',
  'state_representative_district',
  'state_senate_district',
  'township',
  'village',
  'ward',
];

const SCHEMA = `
CREATE TABLE IF NOT EXISTS voters (
  sos_voterid TEXT PRIMARY KEY,
  county_number TEXT,
  county_id TEXT,
  last_name TEXT,
  first_name TEXT,
  middle_name TEXT,
  suffix TEXT,
  date_of_birth TEXT,
  registration_date TEXT,
  voter_status TEXT,
  party_affiliation TEXT,
  residential_address1 TEXT,
  residential_secondary_addr TEXT,
  residential_city TEXT,
  residential_state TEXT,
  residential_zip TEXT,
  residential_zip_plus4 TEXT,
  residential_country TEXT,
  residential_postalcode TEXT,
  mailing_address1 TEXT,
  mailing_secondary_address TEXT,
  mailing_city TEXT,
  mailing_state TEXT,
  mailing_zip TEXT,
  mailing_zip_plus4 TEXT,
  mailing_country TEXT,
  mailing_postal_code TEXT,
  career_center TEXT,
  city TEXT,
  city_school_district TEXT,
  county_court_district TEXT,
  congressional_district TEXT,
  court_of_appeals TEXT,
  edu_service_center_district TEXT,
  exempted_vill_school_district TEXT,
  library TEXT,
  local_school_district TEXT,
  municipal_court_district TEXT,
  precinct_name TEXT,
  precinct_code TEXT,
  state_board_of_education TEXT,
  state_representative_district TEXT,
  state_senate_district TEXT,
  township TEXT,
  village TEXT,
  ward TEXT
);

CREATE INDEX IF NOT EXISTS idx_voters_county ON voters(county_number);
CREATE INDEX IF NOT EXISTS idx_voters_status ON voters(voter_status);
CREATE INDEX IF NOT EXISTS idx_voters_party ON voters(party_affiliation);
CREATE INDEX IF NOT EXISTS idx_voters_precinct ON voters(precinct_code);
CREATE INDEX IF NOT EXISTS idx_voters_name ON voters(last_name, first_name);

CREATE TABLE IF NOT EXISTS elections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  raw_column TEXT UNIQUE NOT NULL,
  election_type TEXT NOT NULL,
  election_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vote_history (
  voter_id TEXT NOT NULL REFERENCES voters(sos_voterid),
  election_id INTEGER NOT NULL REFERENCES elections(id),
  ballot_value TEXT NOT NULL,
  PRIMARY KEY (voter_id, election_id)
);

CREATE INDEX IF NOT EXISTS idx_vote_history_election ON vote_history(election_id);
`;

let db;

function getDb() {
  if (db) return db;
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);
  return db;
}

module.exports = { getDb, DB_PATH, CORE_COLUMNS };
