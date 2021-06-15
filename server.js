if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const http = require('http');
const logger = require('./config/logger');
const app = require('./app');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

server.listen(PORT, (error) => {
  if (error) {
    logger.fatal(error);
  }
  logger.info(`[SYSTEM] Server listening on port ${PORT}`);
});
