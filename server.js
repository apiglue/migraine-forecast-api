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

//

// =============================================================================
// API routes
// =============================================================================

// middleware to use for all requests
router.use((req, res, next) => {
  if (req.header('apikey') == localApiKey) {
    next();
  } else {
    res.json({ message: 'invalid key' });
  }
});

// GET MIGRAINE INDEX
router.get('/migraineindex', (req, res) => {
  const cityName = decodeURI(req.query.c);

  const cachedCityCode = redisClient.getCacheById(cityName);

  async.waterfall([
    async.apply(getCity, cityName), get1dayForecast,
  ], (err, result) => {
    res.json({ migraineIndex: result });
  });

  function getCity(arg1, callback) {
    if (cachedCityCode) {
      return callback(null, cachedCityCode);
    }

    const url = `http://dataservice.accuweather.com/locations/v1/search?apikey=${accApiKey} &q=${arg1}`;

    unirest.get(url)
      .end((response) => {
        let cityCode = '';
        const data = response.body;

        if (data.length == 0) {
          cityCode = 'notfound';
        } else if (data.length > 1) {
          cityCode = 'toomany';
        } else if (data.length == 1) {
          cityCode = data[0].Key;
          redisClient.setCache(cityName, cityCode);
        }

        console.log(`getCity: ${arg1} code is ${cityCode}`);

        callback(null, cityCode);
      });
  }

  function get1dayForecast(cityCode, callback) {
    const cachedMigraineIndex = redisClient.getCacheById(cityCode);

    if (cachedMigraineIndex) {
      callback(null, cachedMigraineIndex);
    }
    const url = `http://dataservice.accuweather.com/indices/v1/daily/1day/${cityCode}/27?apikey=${accApiKey}`;

    unirest.get(url)
      .end((response) => {
        let migraineIndex = '';

        if (response.body.length == 1) {
          if (response.body[0].hasOwnProperty('Value')) {
            console.log(`get1dayForecast: Found Index ${response.body[0].Value} for city code ${cityCode}`);
            migraineIndex = response.body[0].Value;
            redisClient.setCacheWithExpiration(migraineIndex, forecastCacheTimeout, cityCode);
          } else {
            console.log(`get1dayForecast: Could not Index retrieve migraine index for city: ${cityCode}`);
          }
        } else {
          migraineIndex = '-1';
        }

        callback(null, migraineIndex);
      });
  }
});

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
            const cityCode = cityCoderesponse.data[0].Key ?? -1; // -1 = CITY NOT FOUND
            if (cityCode > -1) {
              redisClient.setCache(cityName, cityCode);
            }
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

router.get('/migraineIndex2', (req, res) => {
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
        res.status(404).json({ error: 'city not found' });
      }

      res.json({ migraineIndex });
    }))
    .catch((error) => {
      logger.error(error);
    });
});

// =============================================================================
// REGISTER OUR ROUTES
// =============================================================================
app.use('/api', router);

console.log(`Port: ${port}`);
app.listen(port);
console.log(`API Magic happens on port ${port}`);
