const store = require('fs-blob-store');
const CycleTime = require('../index.js');
cache = new store({ path: process.cwd() })
let service = new CycleTime({ org: process.env.GITHUB_ORG, token: process.env.GITHUB_TOKEN, cache: cache });

service.tickets('2018-08-09T00:00:00Z')
  .then(tickets => console.log("tickets:\n", tickets))
  .catch(error => console.error(error));
