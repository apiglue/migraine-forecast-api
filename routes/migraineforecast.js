const express = require('express');

const router = express.Router();
const logger = require('../config/logger');
const migraineController = require('../controllers/migraineforecast');

router.get('/migraineIndex', (req, res) => {
  const cityName = decodeURI(req.query.c);

  migraineController.getCityCode(cityName)
    .then(((cityCode) => {
      if (cityCode === -1) {
        return cityCode;
      }
      return migraineController.get1dayIndexByCityCode(cityCode);
    }))
    .then(((migraineIndex) => {
      if (migraineIndex === -1) {
        return res.status(404).json({ error: 'city not found' });
      }
      logger.info(`Migraine index for [${cityName}] is [${migraineIndex}]`);
      return res.json({ migraineIndex: Number(migraineIndex) });
    }))
    .catch((error) => {
      logger.error(error);
    });
});
module.exports = router;
