require('newrelic');

require('dotenv').config();
const express = require('express');
const unirest = require('unirest');
const async = require('async');
const axios = require('axios').default;
const redisClient = require('./db/redis');
const logger = require('./config/logger');

const app = express();
const router = express.Router();
const port = process.env.PORT || 3000;
const accApiKey = process.env.ACCUWEATHERAPIKEY;
const localApiKey = process.env.LOCALAPIKEY;
const forecast1DayCacheTimeout = process.env.REDIS_FORECAST_1DAY_TIMEOUT;

app.use(express.json());

// =============================================================================
// API routes
// =============================================================================

// middleware to use for all requests
router.use((req, res, next) => {
  if (req.header('apikey') === localApiKey) {
    next();
  } else {
    res.json({ message: 'invalid api key' });
  }
});

// GET MIGRAINE INDEX

function getCityCode(cityName) {
  return new Promise((resv, rej) => {
    redisClient.getCacheById(cityName)
      .then((cachedCityCode) => {
        if (cachedCityCode) {
          return resv(cachedCityCode);
        }
        //
        axios.get(`https://dataservice.accuweather.com/locations/v1/cities/us/search?apikey=${accApiKey}&q=${cityName}`)
          .then((cityCoderesponse) => {
            if (cityCoderesponse.data.length === 0 || cityCoderesponse.data.length > 1) {
              // EITHER TOO MANY RESULTS OR NOT AT ALL
              return resv(-1);
            }
            const cityCode = cityCoderesponse.data[0].Key;

            redisClient.setCache(cityName, cityCode);

            return resv(cityCode);
          })
          .catch((error) => {
            logger.error(error);
            rej(error);
          });
        //
      })
      .catch((error) => {
        logger.error(error);
        rej(error);
      });
  });
}
function get1dayIndexByCityCode(cityCode) {
  return new Promise((resv, rej) => {
    redisClient.getCacheById(cityCode)
      .then((cachedMigraineIndex) => {
        if (cachedMigraineIndex) {
          return resv(cachedMigraineIndex);
        }
        axios.get(`https://dataservice.accuweather.com/indices/v1/daily/1day/${cityCode}/27?apikey=${accApiKey}`)
          .then((response) => {
            const migraineIndex = response.data[0].Value;
            redisClient.setCacheWithExpiration(cityCode, forecast1DayCacheTimeout, migraineIndex);
            return resv(migraineIndex);
          })
          .catch((error) => rej(error));
      });
  });
}

// =============================================================================
// REGISTER OUR ROUTES
// =============================================================================
app.use('/api', router);
router.get('/migraineIndex', (req, res) => {
  const cityName = decodeURI(req.query.c);

  getCityCode(cityName)
    .then(((cityCode) => {
      if (cityCode === -1) {
        return cityCode;
      }
      return get1dayIndexByCityCode(cityCode);
    }))
    .then(((migraineIndex) => {
      if (migraineIndex === -1) {
        return res.status(404).json({ error: 'city not found' });
      }

      return res.json({ migraineIndex: Number(migraineIndex) });
    }))
    .catch((error) => {
      logger.error(error);
    });
});

app.listen(port);
logger.info(`API Magic happens on port ${port}`);
