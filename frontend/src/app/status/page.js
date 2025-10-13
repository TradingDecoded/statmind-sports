export const metadata = {
  title: "System Status | StatMind Sports",
};

export default function StatusPage() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#0f172a",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
        ✅ StatMind Sports Frontend is Online
      </h1>
      <p style={{ fontSize: "1.1rem", maxWidth: "600px", lineHeight: "1.5" }}>
        This page confirms the frontend is running and reachable over HTTPS. <br />
        Backend API health data is available at{" "}
        <a
          href="https://statmindsports.com/api/status"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#38bdf8", textDecoration: "underline" }}
        >
          /api/status
        </a>.
      </p>
    </main>
  );
}
