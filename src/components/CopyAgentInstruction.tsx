"use client";

import { useState } from "react";

interface CopyAgentInstructionProps {
  text: string;
}

export default function CopyAgentInstruction({ text }: CopyAgentInstructionProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // fallback for older browsers
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="w-full bg-[#E8404A] hover:bg-[#d63840] text-white py-3 px-4 rounded-lg text-base font-semibold transition-all duration-200 flex items-center justify-center gap-2"
    >
      {copied ? (
        <>
          <span>✅</span>
          <span>Copied! Paste it to your agent</span>
        </>
      ) : (
        <>
          <span>🤖</span>
          <span>Copy agent instruction</span>
        </>
      )}
    </button>
  );
}
