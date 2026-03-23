import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-6">
      <h1 className="text-3xl font-bold">Authentication Failed</h1>
      <p className="text-zinc-400">Something went wrong during sign in. Please try again.</p>
      <Link
        href="/dashboard"
        className="inline-block px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
