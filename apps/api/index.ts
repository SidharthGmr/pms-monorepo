import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import swaggerJsdoc from "swagger-jsdoc";
import { swaggerOptions } from "./src/config/swagger";
import routes from "./src/routes/index.routes";
import asyncHandler from "./src/middleware/asyncHandler.middleware";
import clientidMiddleware from "./src/middleware/clientid.middleware";
import errorHandler from "./src/middleware/errorHandler.middleware";
// Routes

dotenv.config();
const app = express();
const port = process.env.PORT || 4000;

app.use(cors()); // <--- Add this line BEFORE your routes

// If you want to be more specific (Optional but recommended for production):
/*
app.use(cors({
  origin: "*", // Allow all origins (good for development)
  // origin: ["https://ganga-pms.vercel.app","http://192.168.1.67:3000", "http://localhost:3000","http://localhost:5000"], // Allow specific IPs
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
*/

app.use(express.json());

// // --- VIEW ENGINE (HTML Serve karna) ---
// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "views", "index.html"));
// });




//route setup --- SWAGGER ---
const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Serve the generated OpenAPI JSON at /swagger.json
app.get('/swagger.json', (_req, res) => {
  res.json(swaggerDocs);
});

// Serve a simple Swagger UI using CDN-hosted assets to avoid static asset
// path issues in serverless environments. This loads the OpenAPI JSON from
// /swagger.json.
app.get('/api', (_req, res) => {
  const html = `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Swagger UI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css">
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = function() {
        SwaggerUIBundle({
          url: '/swagger.json',
          dom_id: '#swagger-ui',
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: 'BaseLayout',
        });
      };
    </script>
  </body>
  </html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Redirect any /docs/* paths back to /docs to avoid relative asset resolution
// Redirect any /docs/... requests back to /docs using a RegExp route
app.get(/^\/api\/.*$/, (_req, res) => {
  res.redirect('/api');
});

// Redirect legacy swagger asset requests to the CDN equivalents so older
// cached pages that reference local files still work.
app.get(['/swagger-ui-bundle.js', '/swagger-ui-standalone-preset.js'], (req, res) => {
  const map: Record<string, string> = {
    '/swagger-ui-bundle.js': 'https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js',
    '/swagger-ui-standalone-preset.js': 'https://unpkg.com/swagger-ui-dist/swagger-ui-standalone-preset.js',
  };
  const target = map[req.path] || 'https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js';
  res.redirect(target);
});


// 👉 MOVE THE MIDDLEWARE DOWN HERE 👈
// This ensures /swagger.json and /docs are ignored by the middleware
app.use(asyncHandler(clientidMiddleware.verify));

// application routes
app.use('/', routes);




// Error-handling middleware
app.use(errorHandler);

// In serverless environments (like Vercel) export the Express app instead
// of calling app.listen(). When run directly (node index.js), start the
// HTTP server for local development.
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Swagger Docs at http://localhost:${port}/api`);
  });
}

export default app;
module.exports = app;
