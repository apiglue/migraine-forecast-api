if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const newRelicLicense = process.env.NEW_RELIC_LICENSE_KEY;
const newRelicAppName = process.env.NEW_RELIC_APP_NAME;
const newRelicDebugLevel = process.env.NEW_RELIC_DEBUG_LEVEL;

/**
 * New Relic agent configuration.
 *
 * See lib/config.defaults.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
exports.config = {
  /**
   * Array of application names.
   */
  app_name: [newRelicAppName],
  /**
   * Your New Relic license key.
   */
  license_key: newRelicLicense,
  logging: {
    /**
     * Level at which to log. 'trace' is most useful to New Relic when diagnosing
     * issues with the agent, 'info' and higher will impose the least overhead on
     * production applications.
     */
    level: newRelicDebugLevel,
  },
};
