const { requireAuth } = require('../shared/auth');

module.exports = async function (context, req) {
  if (!(await requireAuth(context, req))) return;
  context.res = {
    status: 501,
    body: { error: 'not implemented' },
  };
};
