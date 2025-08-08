// frontend/src/App.jsx
import React, { useEffect, useState } from "react";
import { api } from "./lib/api.js";

export default function App() {
  const [country, setCountry] = useState("us");
  const [q, setQ] = useState("");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function loadTopHeadlines() {
    setLoading(true);
    setErr("");
    try {
      const data = await api.get(`/news/top-headlines?country=${country}&pageSize=20`);
      setArticles(data.articles || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function searchEverything(e) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setErr("");
    try {
      const data = await api.get(`/news/everything?q=${encodeURIComponent(q)}&pageSize=20`);
      setArticles(data.articles || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTopHeadlines();
  }, [country]);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <h1>AI Financial News Summarizer</h1>
      <p>
        Backend base: <code>{api.base}</code>
      </p>

      <form onSubmit={searchEverything} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search topics (e.g., Tesla, inflation)"
          style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
        />
        <button type="submit" style={{ padding: "8px 12px", borderRadius: 8 }}>Search</button>
        <select value={country} onChange={(e) => setCountry(e.target.value)} style={{ padding: 8, borderRadius: 8 }}>
          <option value="us">US</option>
          <option value="gb">UK</option>
          <option value="ca">Canada</option>
          <option value="au">Australia</option>
          <option value="in">India</option>
        </select>
      </form>

      {err && <p style={{ color: "crimson" }}>Error: {err}</p>}
      {loading && <p>Loading…</p>}

      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
        {articles.map((a, i) => (
          <li key={i} style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
            <a href={a.url} target="_blank" rel="noreferrer" style={{ fontWeight: 600, textDecoration: "none" }}>
              {a.title}
            </a>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              {a.source?.name} • {new Date(a.publishedAt).toLocaleString()}
            </div>
            {a.description && <p style={{ marginTop: 8 }}>{a.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
