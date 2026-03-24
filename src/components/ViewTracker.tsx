"use client";

import { useEffect, useState } from "react";

export default function ViewTracker({ setupId }: { setupId: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // Fire view on mount (once)
    fetch(`/api/setups/${setupId}/view`, { method: "POST" })
      .then((r) => r.json())
      .then((d) => setCount(d.count))
      .catch(() => {
        // Fallback: just get count
        fetch(`/api/setups/${setupId}/view`)
          .then((r) => r.json())
          .then((d) => setCount(d.count))
          .catch(() => {});
      });
  }, [setupId]);

  if (count === null) return null;

  return (
    <span className="flex items-center gap-1 text-xs text-zinc-500">
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
      {count.toLocaleString()}
    </span>
  );
}
