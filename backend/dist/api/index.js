"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const serverless_http_1 = __importDefault(require("serverless-http"));
const server_1 = __importDefault(require("../server"));
// Export a handler compatible with Vercel / serverless platforms.
// Vercel will compile this file and use the exported default as the function entry.
// Strip the "/api" base path that Vercel keeps in req.url when routing to this function
const handler = (0, serverless_http_1.default)(server_1.default, { basePath: '/api' });
async function default_1(req, res) {
    // serverless-http expects (req, res) to be the Node.js IncomingMessage/ServerResponse.
    // Vercel will forward the request; calling the handler proxy handles the express app.
    return handler(req, res);
}
