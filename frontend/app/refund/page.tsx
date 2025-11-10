export default function RefundPage() {
  const siteName = process.env.MERCHANT_NAME || 'ITWale Notes'
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 prose prose-zinc dark:prose-invert">
      <h1>Refund and Cancellation Policy</h1>
      <p>{siteName} delivers digital products instantly after payment.</p>
      <h2>Refunds</h2>
      <p>All sales are final for digital goods. For issues like duplicate charge or access problems, please use the Contact page within 7 days.</p>
      <h2>Cancellations</h2>
      <p>Orders cannot be cancelled once digital content is delivered to your account.</p>
      <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
    </main>
  )
}
