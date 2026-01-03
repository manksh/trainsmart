import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold text-sage-700 mb-4">
          CTLST Labs
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Mental performance training for athletes
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-sage-700 text-white rounded-lg hover:bg-sage-800 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="px-6 py-3 border border-sage-700 text-sage-700 rounded-lg hover:bg-sage-50 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  )
}
