#!/usr/bin/env node
// Run from the /api directory: node scripts/import.js <path-to-voter-file.txt>
// Defaults to ../data/FRANKLIN.txt if no path is given.

const path = require('path');
const { importVoterFile } = require('../shared/importVoterFile');
const { DB_PATH } = require('../shared/db');

async function main() {
  const filePath = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', 'data', 'FRANKLIN.txt'));

  console.log(`Importing ${filePath}`);
  console.log(`Writing to ${DB_PATH}`);

  const startedAt = Date.now();
  const result = await importVoterFile(filePath, {
    onProgress: (rowCount) => {
      const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
      console.log(`  ...${rowCount.toLocaleString()} rows (${elapsedSec}s elapsed)`);
    },
  });
  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);

  console.log('\nDone in', elapsedSec, 'seconds');
  console.log(result);
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
