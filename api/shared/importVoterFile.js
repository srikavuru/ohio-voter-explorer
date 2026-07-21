const fs = require('fs');
const { parse } = require('csv-parse');
const { getDb, CORE_COLUMNS } = require('./db');

const ELECTION_COLUMN_PATTERN = /^(PRIMARY|GENERAL|SPECIAL)-(\d{2})\/(\d{2})\/(\d{4})$/;
const BATCH_SIZE = 5000;

function parseElectionColumn(rawColumn) {
  const match = ELECTION_COLUMN_PATTERN.exec(rawColumn);
  if (!match) return null;
  const [, electionType, mm, dd, yyyy] = match;
  return { electionType, electionDate: `${yyyy}-${mm}-${dd}` };
}

async function importVoterFile(filePath, { onProgress } = {}) {
  const db = getDb();

  let coreKeys = null;
  let electionKeys = null;
  let electionIdByColumn = null;

  const insertVoter = db.prepare(`
    INSERT INTO voters (${CORE_COLUMNS.join(', ')})
    VALUES (${CORE_COLUMNS.map((c) => `@${c}`).join(', ')})
    ON CONFLICT(sos_voterid) DO UPDATE SET
      ${CORE_COLUMNS.filter((c) => c !== 'sos_voterid')
        .map((c) => `${c} = excluded.${c}`)
        .join(', ')}
  `);
  const insertElection = db.prepare(`
    INSERT INTO elections (raw_column, election_type, election_date)
    VALUES (?, ?, ?)
    ON CONFLICT(raw_column) DO NOTHING
  `);
  const getElectionId = db.prepare(`SELECT id FROM elections WHERE raw_column = ?`);
  const insertVoteHistory = db.prepare(`
    INSERT INTO vote_history (voter_id, election_id, ballot_value)
    VALUES (?, ?, ?)
    ON CONFLICT(voter_id, election_id) DO UPDATE SET ballot_value = excluded.ballot_value
  `);

  const insertBatch = db.transaction((records) => {
    for (const record of records) {
      const voterRow = {};
      for (const key of coreKeys) voterRow[key] = record[key] || null;
      insertVoter.run(voterRow);

      const voterId = record.sos_voterid;
      for (const rawColumn of electionKeys) {
        const value = record[rawColumn];
        if (!value) continue;
        insertVoteHistory.run(voterId, electionIdByColumn.get(rawColumn), value);
      }
    }
  });

  let rowCount = 0;
  let batch = [];

  const parser = fs.createReadStream(filePath).pipe(
    parse({
      columns: (header) => header.map((h) => h.trim()),
      skip_empty_lines: true,
      relax_quotes: true,
    })
  );

  for await (const rawRecord of parser) {
    if (!coreKeys) {
      const allColumns = Object.keys(rawRecord);
      electionKeys = allColumns.filter((c) => ELECTION_COLUMN_PATTERN.test(c));
      coreKeys = allColumns
        .filter((c) => !ELECTION_COLUMN_PATTERN.test(c))
        .map((c) => c.toLowerCase());

      const unknownCore = coreKeys.filter((c) => !CORE_COLUMNS.includes(c));
      if (unknownCore.length) {
        throw new Error(`Unrecognized core column(s) in source file: ${unknownCore.join(', ')}`);
      }

      const registerElections = db.transaction(() => {
        for (const rawColumn of electionKeys) {
          const parsed = parseElectionColumn(rawColumn);
          insertElection.run(rawColumn, parsed.electionType, parsed.electionDate);
        }
      });
      registerElections();

      electionIdByColumn = new Map();
      for (const rawColumn of electionKeys) {
        electionIdByColumn.set(rawColumn, getElectionId.get(rawColumn).id);
      }
    }

    // Re-key the record to lowercase core column names, keep election columns as-is.
    const normalized = {};
    for (const [key, value] of Object.entries(rawRecord)) {
      normalized[ELECTION_COLUMN_PATTERN.test(key) ? key : key.toLowerCase()] = value;
    }

    batch.push(normalized);
    rowCount += 1;

    if (batch.length >= BATCH_SIZE) {
      insertBatch(batch);
      batch = [];
      if (onProgress) onProgress(rowCount);
    }
  }

  if (batch.length) {
    insertBatch(batch);
  }
  if (onProgress) onProgress(rowCount);

  const voterCount = db.prepare('SELECT COUNT(*) AS n FROM voters').get().n;
  const voteHistoryCount = db.prepare('SELECT COUNT(*) AS n FROM vote_history').get().n;
  const electionCount = db.prepare('SELECT COUNT(*) AS n FROM elections').get().n;

  return {
    rowsProcessed: rowCount,
    voters: voterCount,
    voteHistoryRows: voteHistoryCount,
    elections: electionCount,
  };
}

module.exports = { importVoterFile };
