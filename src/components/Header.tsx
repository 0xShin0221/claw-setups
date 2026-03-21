import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl">🦞</span>
          <span className="text-xl font-bold text-white group-hover:text-[#E8404A] transition-colors">
            ClawSetups
          </span>
          <span className="text-xs text-zinc-500 mt-1">.dev</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Gallery
          </Link>
          <Link
            href="/submit"
            className="text-sm bg-[#E8404A] hover:bg-[#d63840] text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            Submit Setup
          </Link>
        </nav>
      </div>
    </header>
  );
}
