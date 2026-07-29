const path = require('path');
const { requireAuth } = require('../shared/auth');
const { importVoterFile } = require('../shared/importVoterFile');

// Off unless explicitly switched on in api/local.settings.json. Importing is a local
// batch job -- api/scripts/import.js is the supported way to run it, and it takes
// ~4 minutes, well past any HTTP timeout worth relying on. A deployed host has no
// reason to expose it at all.
const IMPORT_ENDPOINT_ENABLED = process.env.ENABLE_IMPORT_ENDPOINT === 'true';

// Fixed, not caller-supplied. This used to take req.body.filePath, which let a caller
// point the CSV parser at any file the Function process could read. Callers now choose
// whether to import, never what.
const VOTER_FILE_PATH = path.resolve(__dirname, '..', '..', 'data', 'FRANKLIN.txt');

module.exports = async function (context, req) {
  if (!(await requireAuth(context, req))) return;

  if (!IMPORT_ENDPOINT_ENABLED) {
    context.res = {
      status: 404,
      body: { error: 'import endpoint is disabled; run api/scripts/import.js instead' },
    };
    return;
  }

  try {
    const result = await importVoterFile(VOTER_FILE_PATH);
    context.res = { status: 200, body: result };
  } catch (err) {
    context.log.error(err);
    // err.message can contain the resolved path; keep it in the host log only.
    context.res = { status: 500, body: { error: 'import failed; see host logs' } };
  }
};
