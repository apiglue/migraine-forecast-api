/* eslint-disable no-undef */
// During the test the env variable is set to test
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'debug';

// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app');

chai.should();

chai.use(chaiHttp);

// HEALTH ENDPOINT
describe('[B-P01] /GET health', () => {
  it('it should 200 and have a pid number', (done) => {
    chai.request.agent(server)
      .get('/health')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('id');
        done();
      });
  });
  after(() => chai.request.agent(server).close());
});
