import 'dotenv/config'
import { MongoClient } from 'mongodb'

async function main() {
  const uri = process.env.DATABASE_URL
  if (!uri) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 })
  try {
    console.log('Connecting to MongoDB...')
    await client.connect()
    const admin = client.db().admin()
    const res = await admin.ping()
    console.log('Ping result:', res)
    const buildInfo = await admin.command({ buildInfo: 1 })
    console.log('Build info:', { version: buildInfo.version, openssl: buildInfo.openssl })
    console.log('SUCCESS: Connected and pinged MongoDB.')
  } catch (e: any) {
    console.error('MongoDB connection failed:')
    console.error(e?.message || e)
    if (e?.cause) console.error('Cause:', e.cause)
    process.exit(2)
  } finally {
    await client.close().catch(() => {})
  }
}

main()