import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold text-primary-600 mb-4">
          TrainSmart
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Mental performance training for athletes
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="px-6 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  )
}
