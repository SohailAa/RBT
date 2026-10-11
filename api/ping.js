module.exports = (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    ok: true,
    node: process.version,
    env_node: process.env.NODE_VERSION,
    has_sqlite: (() => {
      try {
        require('node:sqlite');
        return true;
      } catch (e) {
        return e.message;
      }
    })()
  }, null, 2));
};
