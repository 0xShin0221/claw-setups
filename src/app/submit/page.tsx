"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [prUrl, setPrUrl] = useState("");
  const [forkTitle, setForkTitle] = useState("");

  // JSON validation
  const [jsonError, setJsonError] = useState("");

  // Custom validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Load fork data
  useEffect(() => {
    if (forkId) {
      fetch(`/api/setup/${forkId}`)
        .then((res) => res.json())
        .then((setup) => {
          setForkTitle(setup.title || forkId);
          setTitle(`${setup.title} (fork)`);
          setDescription(setup.description);
          setUseCase(setup.useCase);
          setChannels(setup.channels || []);
          setModel(setup.model);
          setSkills(setup.skills || []);
          setConfigText(JSON.stringify(setup.config, null, 2));
          if (setup.workspaceFiles?.["SOUL.md"]) setSoulMd(setup.workspaceFiles["SOUL.md"]);
          if (setup.workspaceFiles?.["AGENTS.md"]) setAgentsMd(setup.workspaceFiles["AGENTS.md"]);
        })
        .catch(() => {});
    }
  }, [forkId]);

  const handleConfigChange = (value: string) => {
    setConfigText(value);
    // Clear JSON error while typing — validate on blur
    if (jsonError) setJsonError("");
  };

  const validateJson = useCallback(() => {
    if (!configText.trim()) {
      setJsonError("");
      setSanitizeResult(null);
      return;
    }
    try {
      JSON.parse(configText);
      setJsonError("");
      // Only run sanitizer on valid JSON
      const result = sanitizeConfig(configText);
      setSanitizeResult(result);
    } catch {
      setJsonError("Invalid JSON");
      setSanitizeResult(null);
    }
  }, [configText]);

  const toggleChannel = (ch: string) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
    if (fieldErrors.channels) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next.channels; return next; });
    }
  };

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = "Title is required";
    if (!description.trim()) errors.description = "Description is required";
    if (!useCase) errors.useCase = "Use case is required";
    if (!model) errors.model = "Model is required";
    if (!configText.trim()) {
      errors.config = "Configuration is required";
    } else {
      try {
        JSON.parse(configText);
      } catch {
        errors.config = "Configuration must be valid JSON";
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, useCase, channels, model, skills,
          configText, soulMd, agentsMd,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Submission failed. Please try again.");
        return;
      }

      setPrUrl(data.prUrl);
      setSubmitted(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
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
        {prUrl && (
          <a
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#E8404A] hover:bg-[#d63840] text-white px-6 py-2.5 rounded-lg transition-colors font-medium mb-4"
          >
            View Pull Request
          </a>
        )}
        <br />
        <a
          href="/"
          className="text-[#E8404A] hover:text-[#d63840] transition-colors"
        >
          Back to Gallery
        </a>
      </div>
    );
  }

  const inputBase = "w-full bg-zinc-900 border rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#E8404A]/50 focus:border-[#E8404A]/50 transition-colors";
  const inputOk = `${inputBase} border-zinc-800`;
  const inputErr = `${inputBase} border-red-500/60`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Submit a Setup</h1>
      <p className="text-zinc-400 mb-8">
        Share your OpenClaw configuration with the community. Your submission
        will create a GitHub PR for review.
      </p>

      {/* Fork banner */}
      {forkId && (
        <div className="bg-zinc-800/60 border border-zinc-700 text-zinc-300 text-sm px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <span className="text-lg">🍴</span>
          <span>Forked from <strong>{forkTitle || forkId}</strong></span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm px-4 py-3 rounded-lg mb-6 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); clearFieldError("title"); }}
            placeholder="e.g. My Telegram Bot Setup"
            className={fieldErrors.title ? inputErr : inputOk}
          />
          {fieldErrors.title && <p className="text-red-400 text-xs mt-1">{fieldErrors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); clearFieldError("description"); }}
            rows={3}
            placeholder="What does this setup do? Who is it for?"
            className={`${fieldErrors.description ? inputErr : inputOk} resize-none`}
          />
          {fieldErrors.description && <p className="text-red-400 text-xs mt-1">{fieldErrors.description}</p>}
        </div>

        {/* Use Case */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Use Case <span className="text-red-400">*</span>
          </label>
          <select
            value={useCase}
            onChange={(e) => { setUseCase(e.target.value); clearFieldError("useCase"); }}
            className={fieldErrors.useCase ? inputErr : inputOk}
          >
            <option value="">Select a use case</option>
            {USE_CASES.map((uc) => (
              <option key={uc} value={uc}>
                {uc.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
              </option>
            ))}
          </select>
          {fieldErrors.useCase && <p className="text-red-400 text-xs mt-1">{fieldErrors.useCase}</p>}
        </div>

        {/* Channels */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Channels{" "}
            <span className="text-xs text-zinc-400 border border-zinc-600 rounded px-1.5 py-0.5 ml-1">optional</span>
            {channels.length > 0 && (
              <span className="text-zinc-500 font-normal ml-2">({channels.length} selected)</span>
            )}
          </label>
          <p className="text-xs text-zinc-500 mb-2">Select all that apply</p>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((ch) => {
              const selected = channels.includes(ch);
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => toggleChannel(ch)}
                  className={`text-sm px-3 py-1.5 rounded-lg border transition-all ${
                    selected
                      ? "bg-[#E8404A] border-[#E8404A] text-white font-medium shadow-sm shadow-[#E8404A]/20"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
                  }`}
                >
                  {selected && <span className="mr-1">✓</span>}
                  {ch.charAt(0).toUpperCase() + ch.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Model <span className="text-red-400">*</span>
          </label>
          <select
            value={model}
            onChange={(e) => { setModel(e.target.value); clearFieldError("model"); }}
            className={fieldErrors.model ? inputErr : inputOk}
          >
            <option value="">Select a model</option>
            {MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {fieldErrors.model && <p className="text-red-400 text-xs mt-1">{fieldErrors.model}</p>}
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Skills{" "}
            <span className="text-xs text-zinc-400 border border-zinc-600 rounded px-1.5 py-0.5 ml-1">optional</span>
            {skills.length > 0 && (
              <span className="text-zinc-500 font-normal ml-2">({skills.length} selected)</span>
            )}
          </label>
          <p className="text-xs text-zinc-500 mb-2">Select all that apply</p>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_SKILLS.map((skill) => {
              const selected = skills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                    selected
                      ? "bg-[#E8404A] border-[#E8404A] text-white font-medium shadow-sm shadow-[#E8404A]/20"
                      : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400"
                  }`}
                >
                  {selected && <span className="mr-1">✓</span>}
                  {skill}
                </button>
              );
            })}
          </div>
        </div>

        {/* Config JSON */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Configuration (openclaw.json) <span className="text-red-400">*</span>
          </label>
          {sanitizeResult && sanitizeResult.secretsFound > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm px-3 py-2 rounded-lg mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {sanitizeResult.secretsFound} secret{sanitizeResult.secretsFound > 1 ? "s" : ""} will be masked before submission
            </div>
          )}
          {jsonError && (
            <div className="text-red-400 text-xs mb-1.5">{jsonError}</div>
          )}
          <textarea
            value={configText}
            onChange={(e) => { handleConfigChange(e.target.value); clearFieldError("config"); }}
            onBlur={validateJson}
            rows={12}
            placeholder='{"version": "1.0", "name": "My Bot", ...}'
            className={`${fieldErrors.config || jsonError ? inputErr : inputOk} font-mono text-sm resize-none`}
          />
          <div className="flex justify-between mt-1">
            {fieldErrors.config && <p className="text-red-400 text-xs">{fieldErrors.config}</p>}
            <span className="text-zinc-600 text-xs ml-auto">{configText.length} chars</span>
          </div>
        </div>

        {/* SOUL.md */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            SOUL.md{" "}
            <span className="text-xs text-zinc-400 border border-zinc-600 rounded px-1.5 py-0.5">optional</span>
          </label>
          <textarea
            value={soulMd}
            onChange={(e) => setSoulMd(e.target.value)}
            rows={4}
            placeholder="Your agent's personality and instructions..."
            className={`${inputOk} font-mono text-sm resize-none`}
          />
          {soulMd.length > 0 && (
            <p className="text-zinc-600 text-xs mt-1 text-right">{soulMd.length} chars</p>
          )}
        </div>

        {/* AGENTS.md */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            AGENTS.md{" "}
            <span className="text-xs text-zinc-400 border border-zinc-600 rounded px-1.5 py-0.5">optional</span>
          </label>
          <textarea
            value={agentsMd}
            onChange={(e) => setAgentsMd(e.target.value)}
            rows={4}
            placeholder="Agent routing and orchestration docs..."
            className={`${inputOk} font-mono text-sm resize-none`}
          />
          {agentsMd.length > 0 && (
            <p className="text-zinc-600 text-xs mt-1 text-right">{agentsMd.length} chars</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#E8404A] hover:bg-[#d63840] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-colors font-medium text-lg"
        >
          {submitting ? "Submitting..." : "Submit Setup"}
        </button>
      </form>
    </div>
  );
}
