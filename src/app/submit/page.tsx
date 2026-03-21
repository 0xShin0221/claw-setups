"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CHANNELS, MODELS, USE_CASES } from "@/lib/constants";
import { sanitizeConfig } from "@/lib/sanitizer";

const AVAILABLE_SKILLS = [
  "web_search", "github", "code_review", "jira", "calendar",
  "email_draft", "weather", "apple-reminders", "home_assistant",
  "voice_commands", "smart_lights", "thermostat", "security_cam",
  "crm_memory", "lead_tracking", "pdf_reader", "canvas",
  "citation_manager", "summarizer",
];

export default function SubmitPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-8 text-zinc-500">Loading...</div>}>
      <SubmitForm />
    </Suspense>
  );
}

function SubmitForm() {
  const searchParams = useSearchParams();
  const forkId = searchParams.get("fork");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [useCase, setUseCase] = useState("");
  const [channels, setChannels] = useState<string[]>([]);
  const [model, setModel] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [configText, setConfigText] = useState("");
  const [soulMd, setSoulMd] = useState("");
  const [agentsMd, setAgentsMd] = useState("");
  const [sanitizeResult, setSanitizeResult] = useState<{ secretsFound: number } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Load fork data
  useEffect(() => {
    if (forkId) {
      fetch(`/api/setup/${forkId}`)
        .then((res) => res.json())
        .then((setup) => {
          setTitle(`${setup.title} (fork)`);
          setDescription(setup.description);
          setUseCase(setup.useCase);
          setChannels(setup.channels);
          setModel(setup.model);
          setSkills(setup.skills);
          setConfigText(JSON.stringify(setup.config, null, 2));
          if (setup.workspaceFiles?.["SOUL.md"]) setSoulMd(setup.workspaceFiles["SOUL.md"]);
          if (setup.workspaceFiles?.["AGENTS.md"]) setAgentsMd(setup.workspaceFiles["AGENTS.md"]);
        })
        .catch(() => {});
    }
  }, [forkId]);

  const handleConfigChange = (value: string) => {
    setConfigText(value);
    if (value.trim()) {
      const result = sanitizeConfig(value);
      setSanitizeResult(result);
    } else {
      setSanitizeResult(null);
    }
  };

  const toggleChannel = (ch: string) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production this would create a GitHub PR
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-4">🦞</div>
        <h1 className="text-2xl font-bold mb-2">Setup Submitted!</h1>
        <p className="text-zinc-400 mb-6">
          Your setup has been submitted as a GitHub PR. It will appear in the
          gallery once approved.
        </p>
        <a
          href="/"
          className="text-[#E8404A] hover:text-[#d63840] transition-colors"
        >
          Back to Gallery
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Submit a Setup</h1>
      <p className="text-zinc-400 mb-8">
        Share your OpenClaw configuration with the community. Your submission
        will create a GitHub PR for review.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. My Telegram Bot Setup"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8404A]/50"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Description
          </label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What does this setup do? Who is it for?"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8404A]/50 resize-none"
          />
        </div>

        {/* Use Case */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Use Case
          </label>
          <select
            required
            value={useCase}
            onChange={(e) => setUseCase(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-300 focus:outline-none focus:border-[#E8404A]/50"
          >
            <option value="">Select a use case</option>
            {USE_CASES.map((uc) => (
              <option key={uc} value={uc}>
                {uc.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
              </option>
            ))}
          </select>
        </div>

        {/* Channels */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Channels
          </label>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => toggleChannel(ch)}
                className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                  channels.includes(ch)
                    ? "bg-[#E8404A]/20 border-[#E8404A]/50 text-[#E8404A]"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                {ch.charAt(0).toUpperCase() + ch.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Model
          </label>
          <select
            required
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-300 focus:outline-none focus:border-[#E8404A]/50"
          >
            <option value="">Select a model</option>
            {MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Skills
          </label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_SKILLS.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                  skills.includes(skill)
                    ? "bg-[#E8404A]/20 border-[#E8404A]/50 text-[#E8404A]"
                    : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Config JSON */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Configuration (openclaw.json)
          </label>
          {sanitizeResult && sanitizeResult.secretsFound > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm px-3 py-2 rounded-lg mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {sanitizeResult.secretsFound} secret{sanitizeResult.secretsFound > 1 ? "s" : ""} will be masked before submission
            </div>
          )}
          <textarea
            required
            value={configText}
            onChange={(e) => handleConfigChange(e.target.value)}
            rows={12}
            placeholder='{"version": "1.0", "name": "My Bot", ...}'
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8404A]/50 font-mono text-sm resize-none"
          />
        </div>

        {/* Optional workspace files */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            SOUL.md <span className="text-zinc-500">(optional)</span>
          </label>
          <textarea
            value={soulMd}
            onChange={(e) => setSoulMd(e.target.value)}
            rows={4}
            placeholder="Your agent's personality and instructions..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8404A]/50 font-mono text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            AGENTS.md <span className="text-zinc-500">(optional)</span>
          </label>
          <textarea
            value={agentsMd}
            onChange={(e) => setAgentsMd(e.target.value)}
            rows={4}
            placeholder="Agent routing and orchestration docs..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8404A]/50 font-mono text-sm resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#E8404A] hover:bg-[#d63840] text-white py-3 rounded-lg transition-colors font-medium text-lg"
        >
          Submit Setup
        </button>
      </form>
    </div>
  );
}
