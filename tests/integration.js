/* eslint-disable no-undef */
// During the test the env variable is set to test
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'debug';
const apiKey = process.env.LOCALAPIKEY;

// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app');

chai.should();

chai.use(chaiHttp);

// POSITIVE
describe('[I-P01] /GET migraineindex for Chicago Illinois', () => {
  it('it should return a migraineIndex ', (done) => {
    chai.request.agent(server)
      .get('/api/migraineindex')
      .set('apikey', apiKey)
      .query({ c: 'Chicago Illinois' })
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property('migraineIndex');
        done();
      });
  });
  after(() => chai.request.agent(server).close());
});

// NEGATIVE
describe('[I-N01] /GET migraineindex for Chicago Illinois', () => {
  it('it should return 401 due to lack of apikey ', (done) => {
    chai.request.agent(server)
      .get('/api/migraineindex')
      .set('apikey', '')
      .query({ c: 'Chicago Illinois' })
      .end((err, res) => {
        res.should.have.status(401);
        done();
      });
  });
  after(() => chai.request.agent(server).close());
});
