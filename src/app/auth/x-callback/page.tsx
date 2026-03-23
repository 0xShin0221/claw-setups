"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

export default function XCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Completing X verification...");

  useEffect(() => {
    async function handle() {
      const supabase = createClient();
      if (!supabase) {
        router.replace("/dashboard");
        return;
      }

      // Exchange the code client-side (preserves PKCE verifier in browser cookies)
      const { data, error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );

      if (error || !data.session) {
        setStatus("X link failed. Returning to dashboard...");
        setTimeout(() => router.replace("/dashboard"), 1500);
        return;
      }

      setStatus("Saving verification...");

      // Call verify-x now that the identity is linked
      try {
        const res = await fetch("/api/dashboard/verify-x", { method: "POST" });
        if (res.ok) {
          setStatus("Verified! Redirecting...");
        } else {
          const err = await res.json();
          console.error("verify-x error:", err);
          setStatus("Linked but could not save username. Redirecting...");
        }
      } catch (e) {
        console.error(e);
      }

      setTimeout(() => router.replace("/dashboard"), 800);
    }

    handle();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-[#E8404A] rounded-full animate-spin mx-auto" />
        <p className="text-zinc-400 text-sm">{status}</p>
      </div>
    </div>
  );
}
