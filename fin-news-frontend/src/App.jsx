// frontend/src/App.jsx
import React, { useEffect, useState } from "react";
import { api } from "./lib/api.js";

export default function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Example: hit your backend health/status route
    api
      .get("/health")
      .then((data) => {
        setHealth(data);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <h1>AI Financial News Summarizer</h1>
      <p>
        Backend base: <code>{api.base}</code>
      </p>

      {error && (
        <p style={{ color: "crimson" }}>
          Backend error: <code>{error}</code>
        </p>
      )}

      <pre
        style={{
          background: "#111",
          color: "#0f0",
          padding: 12,
          borderRadius: 8,
          overflowX: "auto",
        }}
      >
        {health ? JSON.stringify(health, null, 2) : "Checking backend /health..."}
      </pre>
    </div>
  );
}
