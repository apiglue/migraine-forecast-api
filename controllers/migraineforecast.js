const axios = require('axios').default;
const redisClient = require('../db/redis');
const logger = require('../config/logger');

const accApiKey = process.env.ACCUWEATHERAPIKEY;
const forecast1DayCacheTimeout = process.env.REDIS_FORECAST_1DAY_TIMEOUT;

function getCityCode(cityName) {
  return new Promise((resv, rej) => {
    redisClient.getCacheById(cityName)
      .then((cachedCityCode) => {
        if (cachedCityCode) {
          return resv(Number(cachedCityCode));
        }
        //
        axios.get(`https://dataservice.accuweather.com/locations/v1/cities/us/search?apikey=${accApiKey}&q=${cityName}`)
          .then((cityCoderesponse) => {
            // TODO -- ACCOUNT FOR 503 - WHEN ACCUWEATHER API LIMIT IS EXCEEDED
            if (cityCoderesponse.data.length === 0 || cityCoderesponse.data.length > 1) {
              // EITHER TOO MANY RESULTS OR NOT AT ALL
              return resv(-1);
            }
            const cityCode = Number(cityCoderesponse.data[0].Key);

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

module.exports = { getCityCode, get1dayIndexByCityCode };
