const redis = require('redis');

const logger = require('../config/logger');

const redisClientOptions = {
  url: process.env.REDIS_TLS_URL,
  tls: {
    rejectUnauthorized: false,
  },
  retry_strategy(options) {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      // End reconnecting on a specific error and flush all commands with
      // a individual error
      logger.error('[REDIS] The server refused the connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      // End reconnecting after a specific timeout and flush all commands
      // with a individual errorredis
      logger.error('[REDIS] Retry time exhausted');
    }
    if (options.attempt > 10) {
      // End reconnecting with built in error
      return undefined;
    }
    // reconnect after
    return Math.min(options.attempt * 100, 3000);
  },
};
const client = redis.createClient(redisClientOptions);

client.on('error', (err) => {
  logger.error(`[REDIS] Error Connecting to Redis: ${err}`);
});

function getCacheById(key) {
  return new Promise((resv, rej) => {
    client.get(key, (err, reply) => {
      if (err) {
        logger.error(`[REDIS] Error getting cache => ${key} with error => ${err}`);
        rej(err);
      }
      if (reply) {
        logger.info(`[REDIS] cache retrieved => [${key}]`);
        resv(reply);
      } else {
        logger.info(`[REDIS] cache empty => [${key}] `);
        resv();
      }
    });
  });
}
function setCache(key, value) {
  return new Promise((resv, rej) => {
    if (!value) {
      logger.info(`[REDIS] cache ${key} - NOTHING to set `);
    }
    client.set(key, value, (err, res) => {
      if (err) {
        logger.error(`[REDIS] Error getting cache => ${key} with error => ${err}`);
        rej(err);
      } else {
        logger.info(`[REDIS] cache ${key} set with`);
        resv(1);
      }
    });
  });
}
function setCacheWithExpiration(key, timeout, value) {
  return new Promise((resv, rej) => {
    if (!value) {
      logger.info(`[REDIS] cache ${key} - NOTHING to set `);
    }
    client.setex(key, timeout, value, (err, res) => {
      if (err) {
        logger.error(`[REDIS] Error getting cache => ${key} with error => ${err}`);
        rej(err);
      } else {
        logger.info(`[REDIS] cache [${key}] set with timeout of ${timeout}`);
        resv(1);
      }
    });
  });
}

module.exports = { getCacheById, setCache, setCacheWithExpiration };
