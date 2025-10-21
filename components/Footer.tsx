export default function Footer() {
  return (
    <footer className="border-t mt-8">
      <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-600 flex flex-col md:flex-row items-center justify-between gap-3">
        <div>
          © {new Date().getFullYear()} ITWale Notes · All rights reserved
        </div>
        <nav className="flex flex-wrap gap-3">
          <a className="hover:underline" href="/privacy">Privacy</a>
          <span>•</span>
          <a className="hover:underline" href="/terms">Terms</a>
          <span>•</span>
          <a className="hover:underline" href="/refund">Refunds</a>
          <span>•</span>
          <a className="hover:underline" href="/contact">Contact</a>
        </nav>
      </div>
    </footer>
  )
}
