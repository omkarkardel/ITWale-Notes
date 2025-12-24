"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
const mongodb_1 = require("mongodb");
const MONGODB_URI = process.env.DATABASE_URL;
if (!MONGODB_URI) {
    throw new Error('Please define the DATABASE_URL environment variable');
}
let cachedClient = null;
let cachedDb = null;
/**
 * Establishes a connection to the database, reusing the connection if it already exists.
 * @returns A promise that resolves to the database instance.
 */
async function getDb() {
    if (cachedDb) {
        return cachedDb;
    }
    const client = new mongodb_1.MongoClient(MONGODB_URI);
    await client.connect();
    // The database name is extracted from the connection string
    const db = client.db();
    cachedClient = client;
    cachedDb = db;
    return db;
}
