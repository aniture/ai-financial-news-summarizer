import React, { useEffect, useState } from "react";
import { api } from "./lib/api.js";

export default function App() {
  const [country, setCountry] = useState("us");
  const [q, setQ] = useState("Amazon");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function loadTopHeadlines() {
    setLoading(true);
    setErr("");
    try {
      const data = await api.get(`/news/top-headlines?country=${country}&category=business&pageSize=20`);
      setArticles((data.articles || []).map(a => ({ ...a, _summary: null, _busy: false, _err: "" })));
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function searchEverything(e) {
    e?.preventDefault?.();
    if (!q.trim()) return;
    setLoading(true);
    setErr("");
    try {
      const data = await api.get(`/news/everything?q=${encodeURIComponent(q)}&pageSize=20`);
      setArticles((data.articles || []).map(a => ({ ...a, _summary: null, _busy: false, _err: "" })));
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function summarize(idx, a) {
    setArticles(prev => prev.map((x, i) => i === idx ? { ...x, _busy: true, _err: "" } : x));
    try {
      const body = {
        title: a.title,
        content: [a.title, a.description, a.content].filter(Boolean).join("\n\n").slice(0, 6000), // keep small
        url: a.url
      };
      const res = await api.post("/summarize", body);
      setArticles(prev => prev.map((x, i) => i === idx ? { ...x, _summary: res, _busy: false } : x));
    } catch (e) {
      setArticles(prev => prev.map((x, i) => i === idx ? { ...x, _err: e.message, _busy: false } : x));
    }
  }

  useEffect(() => {
    loadTopHeadlines();
  }, [country]);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 24, maxWidth: 980, margin: "0 auto" }}>
      <h1>AI Financial News Summarizer</h1>
      <p>Backend base: <code>{api.base}</code></p>

      <form onSubmit={searchEverything} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search topics (e.g., Tesla, inflation)"
          style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
        />
        <button type="submit" style={{ padding: "10px 14px", borderRadius: 10 }}>Search</button>
        <select value={country} onChange={(e) => setCountry(e.target.value)} style={{ padding: 10, borderRadius: 10 }}>
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
          <li key={i} style={{ border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
            <a href={a.url} target="_blank" rel="noreferrer" style={{ fontWeight: 700, textDecoration: "none" }}>
              {a.title}
            </a>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              {a.source?.name} • {a.publishedAt ? new Date(a.publishedAt).toLocaleString() : ""}
            </div>
            {a.description && <p style={{ marginTop: 8 }}>{a.description}</p>}

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button disabled={a._busy} onClick={() => summarize(i, a)} style={{ padding: "8px 12px", borderRadius: 8 }}>
                {a._busy ? "Summarizing…" : "Summarize"}
              </button>
            </div>

            {a._err && <p style={{ color: "crimson" }}>Summarize error: {a._err}</p>}

            {a._summary && (
              <div style={{ marginTop: 10, background: "#f7f7f7", padding: 10, borderRadius: 8 }}>
                <h4 style={{ margin: "0 0 6px" }}>Summary</h4>
                <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{a._summary.summary}</pre>
                <div style={{ marginTop: 6, fontSize: 13 }}>
                  <strong>Sentiment:</strong> {a._summary.sentiment} •{" "}
                  <strong>Tickers:</strong> {(a._summary.tags?.tickers || []).join(", ") || "—"} •{" "}
                  <strong>Sectors:</strong> {(a._summary.tags?.sectors || []).join(", ") || "—"}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
