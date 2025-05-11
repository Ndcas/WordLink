const NodeCache = require('node-cache');

const cacheTTL = process.env.CACHE_TTL;

const cacheClient = new NodeCache({
    stdTTL: cacheTTL
});

module.exports = cacheClient;