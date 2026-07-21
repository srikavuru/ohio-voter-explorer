const path = require('path');
const { verifyAuth } = require('../shared/auth');
const { importVoterFile } = require('../shared/importVoterFile');

module.exports = async function (context, req) {
  await verifyAuth(req);

  const filePath = path.resolve(
    req.body && req.body.filePath ? req.body.filePath : path.join(__dirname, '..', '..', 'data', 'FRANKLIN.txt')
  );

  try {
    const result = await importVoterFile(filePath);
    context.res = { status: 200, body: result };
  } catch (err) {
    context.log.error(err);
    context.res = { status: 500, body: { error: err.message } };
  }
};
