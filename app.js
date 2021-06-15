require('newrelic');

const express = require('express');
const helmet = require('helmet');
const pinoExpress = require('express-pino-logger');
const logger = require('./config/logger');

const migraineForecastRoutes = require('./routes/migraineforecast');

const app = express();
const localApiKey = process.env.LOCALAPIKEY;
const processport = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());
app.use(pinoExpress({
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
    }),
  },
}));
// =============================================================================
// API routes
// =============================================================================

app.get('/health', (req, res) => {
  res.json({
    id: `${process.pid}`,
    description: `${process.pid} PID says hello!`,
  });
});
// middleware to use for all requests
app.use((req, res, next) => {
  if (req.header('apikey') === localApiKey) {
    next();
  } else {
    res.status(401).json({ message: 'invalid api key' });
  }
});
app.use('/api', migraineForecastRoutes);

// ERROR HANDLER
app.use((err, req, res, next) => {
  // TODO REMOVE PROD
  logger.error(err.stack);

  res.status(err.status || 500);

  res.json({
    errors: {
      message: err.message,
      error: {},
    },
  });
});

if (!module.parent) {
  app.listen(processport, () => {
    logger.info(`[SERVER] Process up at port ${processport}`);
  });
}
module.exports = app;
