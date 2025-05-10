const NodeCache = require('node-cache');

let cacheTTL = process.env.CACHE_TTL;

const cacheClient = new NodeCache({
    stdTTL: cacheTTL
});

module.exports = cacheClient;