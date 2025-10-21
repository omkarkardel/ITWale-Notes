export default function ShippingPage() {
  const siteName = process.env.MERCHANT_NAME || 'ITWale Notes'
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 prose prose-zinc dark:prose-invert">
      <h1>Shipping and Delivery Policy</h1>
      <p>
        {siteName} sells digital products only. No physical items are shipped.
      </p>
      <h2>Digital Delivery</h2>
      <p>
        Access to purchased content is typically granted instantly to your account after successful payment. In rare cases, it may take a few minutes due to network delays.
      </p>
      <h2>Shipping Charges</h2>
      <p>
        Not applicable. There are no shipping or handling fees for digital goods.
      </p>
      <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
    </main>
  )
}
