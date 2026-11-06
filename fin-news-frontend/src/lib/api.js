// One surface for the app. With VITE_API_URL set it talks to the FastAPI
// service; without it, the in-browser stand-ins in mockApi.js answer instead
// (the static Vercel demo).
//
// Feeds (headlines, tape) fall back to the samples if the service is down and
// say so via `live: false`. summarize/tag do not fall back: a canned summary
// shown in place of a real one would be misleading, so they throw.

import { mockApi } from "./mockApi";

const BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export const hasBackend = Boolean(BASE);

async function request(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${path} failed (${res.status})`);
  return res.json();
}

async function feed(path, fallback) {
  try {
    return { ...(await request(path)), live: true };
  } catch {
    return { ...(await fallback()), live: false };
  }
}

export const api = hasBackend
  ? {
      summarize: (content) => request("/summarize", { content }),
      tag: (content) => request("/tag", { content }),
      headlines: () => feed("/headlines", mockApi.headlines),
      tape: () => feed("/quotes", mockApi.tape),
      // Full article body for a headline; null when it can't be fetched.
      extract: (url) =>
        request("/extract", { url }).then((d) => d.content, () => null),
    }
  : {
      summarize: mockApi.summarize,
      tag: mockApi.tag,
      headlines: async () => ({ ...(await mockApi.headlines()), live: false }),
      tape: async () => ({ ...(await mockApi.tape()), live: false }),
      extract: async () => null,
    };
