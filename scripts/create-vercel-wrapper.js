// Generates the serverless wrapper function for Vercel at repo-root api/index.js
const fs = require('fs')

fs.mkdirSync('api', { recursive: true })
fs.writeFileSync(
  'api/index.js',
  "module.exports = require('../backend/dist/api/index.js');\n"
)
