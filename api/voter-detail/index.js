const { verifyAuth } = require('../shared/auth');

module.exports = async function (context, req) {
  await verifyAuth(req);
  context.res = {
    status: 404,
    body: { error: 'not implemented' },
  };
};
