const handler = require('../../server.js');

module.exports = async (req, res) => {
  await handler(req, res);
};
