export default function ContactPage() {
  const siteName = process.env.MERCHANT_NAME || 'ITWale Notes'
  const contactEmail = 'omkarkardel175@gmail.com'
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 prose prose-zinc dark:prose-invert">
      <h1>Contact Us</h1>
      <p>
        We’re here to help with purchases, access issues, or general queries about {siteName}.
      </p>
      <h2>Email</h2>
      <p>
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
      </p>
      <h2>Response Time</h2>
      <p>
        We usually reply within 24–48 hours on business days.
      </p>
      <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
    </main>
  )
}
