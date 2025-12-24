import { MongoClient, Db, ServerApiVersion } from 'mongodb'

const MONGODB_URI = process.env.DATABASE_URL

if (!MONGODB_URI) {
  throw new Error('Please define the DATABASE_URL environment variable')
}

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

function getMongoOptions() {
  const opts: any = {}
  // Opt-in: allow invalid TLS certs for local dev on Windows/proxied networks
  // Never enable this in production. Set MONGODB_TLS_ALLOW_INVALID_CERTS=true locally if needed.
  if (String(process.env.MONGODB_TLS_ALLOW_INVALID_CERTS).toLowerCase() === 'true') {
    opts.tlsAllowInvalidCertificates = true
  }
  // Opt-in Server API for better compatibility with Atlas
  const api = String(process.env.MONGODB_SERVER_API || '').toUpperCase()
  if (api === 'V1') {
    opts.serverApi = { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
  }
  return opts
}

export async function getDb(): Promise<Db> {
  if (cachedDb) {
    return cachedDb
  }
  const client = new MongoClient(MONGODB_URI as string, getMongoOptions())
  try {
    await client.connect()
  } catch (err: any) {
    const msg = String(err?.message || '')
    const isTlsErr = /SSL|TLS|alert internal error|certificate|handshake/i.test(msg)
    if (isTlsErr) {
      const hint = 'TLS handshake failed while connecting to MongoDB. If you are on Windows or behind an inspecting proxy, set MONGODB_TLS_ALLOW_INVALID_CERTS=true for local development only.'
      throw new Error(`${msg} \n\n${hint}`)
    }
    throw err
  }
  const db = client.db()
  cachedClient = client
  cachedDb = db
  return db
}
