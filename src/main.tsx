import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div style={{
          minHeight: "100vh",
          background: "#070807",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          boxSizing: "border-box",
          fontFamily: "system-ui, sans-serif",
        }}>
          <div style={{
            background: "#111514",
            border: "1px solid rgba(214,180,90,0.25)",
            borderRadius: "20px",
            padding: "28px 24px",
            maxWidth: "360px",
            width: "100%",
          }}>
            <p style={{ color: "#D6B45A", fontWeight: 700, margin: "0 0 12px", fontSize: "1rem" }}>
              Something went wrong
            </p>
            <p style={{ color: "#B9B0A0", fontSize: "0.78rem", margin: "0 0 16px", wordBreak: "break-all", lineHeight: 1.5 }}>
              {error.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "#D6B45A",
                color: "#0a0a0a",
                border: "none",
                borderRadius: "12px",
                padding: "12px 20px",
                fontWeight: 700,
                fontSize: "0.9rem",
                width: "100%",
                cursor: "pointer",
              }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
