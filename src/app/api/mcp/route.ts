import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/apiKeys";

// MCP Tools definition
const TOOLS = [
  {
    name: "submit_setup",
    description:
      "Submit an OpenClaw agent setup configuration to the claw-setups community gallery. Automatically scans for secrets and creates a PR for review.",
    inputSchema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Setup name (max 200 chars)" },
        description: { type: "string", description: "Brief description (max 200 chars)" },
        useCase: { type: "string", description: "What this agent setup is used for" },
        model: { type: "string", description: "AI model used (e.g. anthropic/claude-sonnet-4-6)" },
        channels: { type: "array", items: { type: "string" }, description: "Channels (discord, slack, etc.)" },
        skills: { type: "array", items: { type: "string" }, description: "Skills enabled for this agent" },
        config: { type: "object", description: "OpenClaw configuration JSON" },
        soulMd: { type: "string", description: "SOUL.md content (agent persona)" },
        agentsMd: { type: "string", description: "AGENTS.md content (agent rules)" },
      },
      required: ["title", "description", "useCase", "model", "config"],
    },
  },
  {
    name: "list_setups",
    description: "List all community setups in the gallery",
    inputSchema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Max results (default 20)" },
      },
    },
  },
  {
    name: "get_setup",
    description: "Get a specific setup by slug/id",
    inputSchema: {
      type: "object" as const,
      properties: {
        slug: { type: "string", description: "Setup slug/id" },
      },
      required: ["slug"],
    },
  },
];

interface JsonRpcRequest {
  jsonrpc: string;
  id: unknown;
  method: string;
  params?: Record<string, unknown>;
}

interface ToolCallParams {
  name?: string;
  arguments?: Record<string, unknown>;
}

// Handle MCP JSON-RPC 2.0 requests
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  let body: JsonRpcRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32700, message: "Parse error" },
    });
  }

  const { id, method, params } = body;

  if (method === "initialize") {
    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "claw-setups", version: "1.0.0" },
      },
    });
  }

  if (method === "tools/list") {
    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      result: { tools: TOOLS },
    });
  }

  if (method === "tools/call") {
    const toolParams = params as ToolCallParams | undefined;
    const toolName = toolParams?.name;
    const args = toolParams?.arguments || {};

    if (toolName === "submit_setup") {
      if (!validateApiKey(authHeader)) {
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: "Error: API key required for submit_setup. Get a key at https://claw-setups.vercel.app/for-agents",
              },
            ],
            isError: true,
          },
        });
      }

      try {
        const baseUrl = process.env.BASE_URL || "https://claw-setups.vercel.app";
        const resp = await fetch(`${baseUrl}/api/agent-submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader || "",
          },
          body: JSON.stringify({
            title: args.title,
            description: args.description,
            useCase: args.useCase,
            model: args.model,
            channels: args.channels || [],
            skills: args.skills || [],
            configText: typeof args.config === "string" ? args.config : JSON.stringify(args.config),
            soulMd: args.soulMd || "",
            agentsMd: args.agentsMd || "",
          }),
        });
        const data = await resp.json();
        if (data.ok) {
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: `Setup submitted! PR: ${data.prUrl}\nSlug: ${data.slug}\nAuto-merge enabled — will go live in ~2 minutes.`,
                },
              ],
            },
          });
        } else {
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: {
              content: [{ type: "text", text: `Error: ${data.error}` }],
              isError: true,
            },
          });
        }
      } catch (e) {
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: `Error: ${e instanceof Error ? e.message : String(e)}` }],
            isError: true,
          },
        });
      }
    }

    if (toolName === "list_setups") {
      try {
        const { getAllSetups } = await import("@/lib/setups");
        const setups = getAllSetups();
        const limit = Number(args.limit) || 20;
        const result = setups.slice(0, limit).map((s) => ({
          slug: s.id,
          title: s.title,
          description: s.description,
          model: s.model,
          useCase: s.useCase,
          channels: s.channels,
          skills: s.skills,
        }));
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          },
        });
      } catch (e) {
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: `Error: ${e instanceof Error ? e.message : String(e)}` }],
            isError: true,
          },
        });
      }
    }

    if (toolName === "get_setup") {
      try {
        const { getAllSetups } = await import("@/lib/setups");
        const setups = getAllSetups();
        const setup = setups.find((s) => s.id === args.slug);
        if (!setup) {
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: {
              content: [{ type: "text", text: `Setup not found: ${args.slug}` }],
              isError: true,
            },
          });
        }
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(setup, null, 2) }],
          },
        });
      } catch (e) {
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: `Error: ${e instanceof Error ? e.message : String(e)}` }],
            isError: true,
          },
        });
      }
    }

    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `Unknown tool: ${toolName}` },
    });
  }

  return NextResponse.json({
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  });
}

// GET endpoint returns MCP server info
export async function GET() {
  return NextResponse.json({
    name: "claw-setups MCP Server",
    version: "1.0.0",
    description: "Submit and browse OpenClaw agent setups",
    endpoint: "/api/mcp",
    tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
    docs: "https://claw-setups.vercel.app/for-agents",
  });
}
