// Vercel entry that delegates to compiled backend handler without breaking relative imports
module.exports = require('../backend/dist/api/index.js');
