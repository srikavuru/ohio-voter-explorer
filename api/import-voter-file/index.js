const { verifyAuth } = require('../shared/auth');

module.exports = async function (context, req) {
  await verifyAuth(req);
  context.res = {
    status: 501,
    body: { error: 'not implemented' },
  };
};
