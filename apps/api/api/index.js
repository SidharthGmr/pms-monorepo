// Vercel serverless entry. Vercel treats every file under api/ as a function and
// bundles it with its own tracer, so this only needs to hand over the compiled
// Express app - `npm run vercel-build` has already produced dist/ by the time this
// is bundled. The rewrite in vercel.json sends every path here.
module.exports = require('../dist/index.js');
