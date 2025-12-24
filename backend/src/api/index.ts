import serverless from 'serverless-http'
import app from '../server'

// Export a handler compatible with Vercel / serverless platforms.
// Vercel will compile this file and use the exported default as the function entry.
// Strip the "/api" base path that Vercel keeps in req.url when routing to this function
const handler = serverless(app as any, { basePath: '/api' } as any)

export default async function (req: any, res: any) {
  // serverless-http expects (req, res) to be the Node.js IncomingMessage/ServerResponse.
  // Vercel will forward the request; calling the handler proxy handles the express app.
  return handler(req, res)
}
