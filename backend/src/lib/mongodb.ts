import { MongoClient, Db } from 'mongodb'

const MONGODB_URI = process.env.DATABASE_URL

if (!MONGODB_URI) {
  throw new Error('Please define the DATABASE_URL environment variable')
}

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

/**
 * Establishes a connection to the database, reusing the connection if it already exists.
 * @returns A promise that resolves to the database instance.
 */
export async function getDb(): Promise<Db> {
  if (cachedDb) {
    return cachedDb
  }

  const client = new MongoClient(MONGODB_URI as string)
  await client.connect()
  
  // The database name is extracted from the connection string
  const db = client.db()

  cachedClient = client
  cachedDb = db

  return db
}
