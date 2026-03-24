"use client";

import { useState, useEffect } from "react";

export default function OnboardingBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("claw_visited")) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem("claw_visited", "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="mb-6 border border-zinc-700 bg-zinc-900 rounded-xl px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-white">
            👋 New here? Here&apos;s how OpenClaw Setup Registry works
          </p>
          <ol className="space-y-1 text-sm text-zinc-400">
            <li>1. Pick any setup below</li>
            <li>
              2. Click <span className="text-zinc-300 font-medium">&quot;Tell your agent&quot;</span>
            </li>
            <li>3. Your AI agent auto-configures itself 🎉</li>
          </ol>
        </div>
        <button
          onClick={dismiss}
          className="flex-shrink-0 text-xs text-zinc-500 hover:text-zinc-200 transition-colors border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-lg"
        >
          Got it! ×
        </button>
      </div>
    </div>
  );
}
