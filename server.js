require('dotenv').config();
const app = require('./src/app');
const logger = require('./src/config/logger');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  logger.info('LTraffic Admin API started', {
    url: `http://localhost:${PORT}`,
    docs: `http://localhost:${PORT}/api-docs`,
    env: process.env.NODE_ENV,
  });
});
