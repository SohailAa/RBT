// Vercel serverless entrypoint with full diagnostics
module.exports = async (req, res) => {
  try {
    const handler = require('../server.js');
    return await handler(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Crash in api/index.js',
      message: err.message,
      stack: err.stack,
      nodeVersion: process.version,
      platform: process.platform,
      env: {
        VERCEL: process.env.VERCEL,
        NODE_ENV: process.env.NODE_ENV
      }
    }, null, 2));
  }
};
