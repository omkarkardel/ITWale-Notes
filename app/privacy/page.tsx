export default function PrivacyPage() {
  const siteName = process.env.MERCHANT_NAME || 'ITWale Notes'
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 prose prose-zinc dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p>
        This page explains how {siteName} handles your information.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Account details you provide (e.g., email).</li>
        <li>Order/payment metadata from our payment partners (we do not store card details).</li>
        <li>Basic usage analytics to improve the service.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To process payments and grant access to digital content.</li>
        <li>To operate, protect, and improve our website.</li>
        <li>To send important service-related notices.</li>
      </ul>
      <h2>Security</h2>
      <p>Payments are handled by PCI DSS–compliant processors. We never store your full card details.</p>
      <h2>Updates</h2>
      <p>We may update this policy from time to time. For questions, please use the Contact page.</p>
      <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
    </main>
  )
}
