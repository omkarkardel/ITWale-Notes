export default function TermsPage() {
  const siteName = process.env.MERCHANT_NAME || 'ITWale Notes'
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 prose prose-zinc dark:prose-invert">
      <h1>Terms and Conditions</h1>
      <p>By using {siteName}, you agree to these terms.</p>
      <h2>Service</h2>
      <p>We provide digital study materials. Access is granted after successful payment.</p>
      <h2>Use and License</h2>
      <p>Content is for personal, non‑commercial use only. Redistribution is not allowed.</p>
      <h2>Payments</h2>
      <p>Payments are processed securely by our payment partners.</p>
      <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
    </main>
  )
}
