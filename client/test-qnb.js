const { config } = require('dotenv');
config({ path: './.env.local' });
const { QNBClient } = require('./dist/lib/qnb/client.js'); // Next.js builds to .next, wait, I can compile the ts file.
