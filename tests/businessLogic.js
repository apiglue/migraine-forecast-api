/* eslint-disable no-undef */
// During the test the env variable is set to test
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'debug';

// Require the dev-dependencies
const chai = require('chai');
const migraineController = require('../controllers/migraineforecast');

chai.should();

// POSITIVES
it('[L-P01] Should return 348181 code for Atlanta Georgia', () => { // no done
  const inputCityName = 'Atlanta Georgia';
  const outputCityCode = 348181;
  return migraineController.getCityCode(inputCityName).then((cityCode) => {
    cityCode.should.equal(outputCityCode);
  });// no catch, it'll figure it out since the promise is rejected
});

it('[L-P02] Should return 348308 code for Chicago Illinois', () => { // no done
  const inputCityName = 'Chicago Illinois';
  const outputCityCode = 348308;
  return migraineController.getCityCode(inputCityName).then((cityCode) => {
    cityCode.should.equal(outputCityCode);
  });// no catch, it'll figure it out since the promise is rejected
});

// NEGATIVE
it('[L-N01] Should return -1 code for Minas Tirith', () => { // no done
  const inputCityName = 'Minas Tirith';
  const outputCityCode = -1;
  return migraineController.getCityCode(inputCityName).then((cityCode) => {
    cityCode.should.equal(outputCityCode);
  });// no catch, it'll figure it out since the promise is rejected
});
