const stageTitles: Record<string, string> = {
  V75: "Production Screenshot Runner",
  V76: "Hetzner Promotion Transport",
  V77: "Server Secret Posture Scanner",
  V78: "Incident Notification Fanout",
  V79: "Billing Provider Integrations",
  V80: "Release Train Execution"
};

export function OperatingSystemStagePage({ version }: { version: string }) {
  const title = stageTitles[version] ?? `Operating System Stage ${version}`;
  return (
    <main style={{ padding: "32px", maxWidth: "1120px" }}>
      <p style={{ margin: 0, color: "#667085", fontSize: "13px", fontWeight: 700, textTransform: "uppercase" }}>
        {version}
      </p>
      <h1 style={{ margin: "8px 0 12px", color: "#101828", fontSize: "32px", letterSpacing: 0 }}>
        {title}
      </h1>
      <p style={{ color: "#475467", fontSize: "16px", lineHeight: 1.6 }}>
        This operating-system milestone is registered for dashboard governance, validation, and release evidence.
      </p>
    </main>
  );
}
