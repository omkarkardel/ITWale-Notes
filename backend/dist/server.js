"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
// Use require-typed import to work around missing type decls in some environments
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cors = require('cors');
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const health_1 = require("./routes/health");
const auth_1 = require("./routes/auth");
const subjects_1 = require("./routes/subjects");
const resources_1 = require("./routes/resources");
const app = (0, express_1.default)();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const ORIGINS_ENV = process.env.CORS_ORIGIN || 'http://localhost:3000';
const ALLOWED_ORIGINS = ORIGINS_ENV.split(',').map((s) => s.trim()).filter(Boolean);
// CORS (explicitly handle preflight to avoid 404 on OPTIONS)
const corsOptions = {
    origin: (origin, callback) => {
        // No origin (e.g., curl, same-origin) => allow
        if (!origin)
            return callback(null, true);
        // If wildcard specified
        if (ALLOWED_ORIGINS.includes('*'))
            return callback(null, true);
        // Exact match against allowed list
        if (ALLOWED_ORIGINS.includes(origin))
            return callback(null, true);
        // Not allowed
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Routes
app.use('/health', health_1.router);
app.use('/auth', auth_1.router);
app.use('/subjects', subjects_1.router);
app.use('/resources', resources_1.router);
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});
// Error handler
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});
exports.default = app;
// Only start listener when running as a standalone process (not as a module)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Backend listening on http://localhost:${PORT}`);
    });
}
