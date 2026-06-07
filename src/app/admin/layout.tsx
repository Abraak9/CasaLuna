import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/admin" className="font-bold text-gray-900">
          <span className="cl-text-gradient">Casa Luna</span> Admin
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/admin/events" className="text-gray-600 hover:text-gray-900">Events</Link>
          <Link href="/" className="text-gray-400 hover:text-gray-600">↗ Site</Link>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
}
