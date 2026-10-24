const { join } = require('path');

/**
 * Keep Puppeteer's Chrome download inside the project. Render's native Node
 * runtime ships only the project dir, so the default `~/.cache/puppeteer`
 * filled at build time is gone at runtime ("Could not find Chrome").
 * @type {import('puppeteer').Configuration}
 */
module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
