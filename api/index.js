module.exports = async function handler(req, res) {
  try {
    const serverModule = require('../dist/server.cjs');
    const handlerFn = serverModule.default || serverModule;

    if (typeof handlerFn !== 'function') {
      res.statusCode = 500;
      res.end('Server handler not found');
      return;
    }

    return handlerFn(req, res);
  } catch (error) {
    console.error('Vercel handler error:', error);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
};
