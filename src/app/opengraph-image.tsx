import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ClawSetups.dev — AI Agent Setup Gallery";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#09090b",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Background grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 25% 25%, rgba(232,64,74,0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(232,64,74,0.1) 0%, transparent 50%)",
          }}
        />
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <span style={{ fontSize: "72px" }}>&#x1F99E;</span>
          <span
            style={{
              fontSize: "56px",
              fontWeight: "bold",
              color: "white",
              letterSpacing: "-2px",
            }}
          >
            ClawSetups
            <span style={{ color: "#E8404A" }}>.dev</span>
          </span>
        </div>
        {/* Tagline */}
        <div
          style={{
            fontSize: "28px",
            color: "#a1a1aa",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.4,
          }}
        >
          AI Agent Setup Gallery
        </div>
        <div
          style={{
            marginTop: "24px",
            display: "flex",
            gap: "16px",
          }}
        >
          {["REST API", "MCP Server", "Auto-publish"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "8px 20px",
                background: "rgba(232,64,74,0.15)",
                border: "1px solid rgba(232,64,74,0.4)",
                borderRadius: "24px",
                color: "#E8404A",
                fontSize: "18px",
                fontWeight: "600",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
