// Demo mode: replaces the FastAPI backend (/summarize, /tag) and the NewsAPI
// headlines feed with deterministic in-browser stand-ins so the app runs as a
// pure static SPA on Vercel.

const TICKERS = ["AAPL", "GOOGL", "AMZN", "TSLA", "MSFT", "META", "NVDA", "JPM", "BRK", "WMT", "V", "MA"];
const SECTORS = ["technology", "healthcare", "finance", "energy", "automotive", "retail", "banking", "ai", "semiconductors"];

const POSITIVE_WORDS = [
  "surge", "surged", "soar", "soared", "gain", "gains", "growth", "record",
  "beat", "beats", "rally", "rallied", "strong", "boost", "boosted", "raise",
  "raised", "upgrade", "bullish", "rebound", "rebounds", "profitable", "outperform",
];
const NEGATIVE_WORDS = [
  "drop", "dropped", "fall", "fell", "loss", "losses", "decline", "declined",
  "miss", "missed", "plunge", "plunged", "slump", "weak", "cut", "downgrade",
  "bearish", "layoff", "layoffs", "lawsuit", "fraud", "default", "underperform",
];

// A curated set of headlines used in place of the live NewsAPI feed.
const MOCK_HEADLINES = [
  {
    title: "Nvidia surges to record high on blowout AI chip demand and raised guidance",
    description:
      "Shares of NVDA rallied after the chipmaker reported quarterly revenue that beat estimates by 18% and raised full-year guidance, citing relentless demand for its data-center GPUs from hyperscalers.",
    source: "Bloomberg",
    urlToImage: "https://picsum.photos/seed/nvda-chip/640/360",
  },
  {
    title: "Apple beats earnings on strong iPhone 17 launch; services revenue hits new record",
    description:
      "AAPL posted stronger-than-expected quarterly results, with iPhone sales rebounding in greater China and services revenue setting a new all-time high. Cook flagged AI features driving upgrade demand.",
    source: "Reuters",
    urlToImage: "https://picsum.photos/seed/aapl-iphone/640/360",
  },
  {
    title: "Tesla shares plunge after Q2 deliveries miss; price cuts drag automotive margin",
    description:
      "TSLA fell sharply as second-quarter deliveries dropped 12% year over year and gross margin compressed to a multi-year low. Analysts cut price targets across the board.",
    source: "CNBC",
    urlToImage: "https://picsum.photos/seed/tsla-factory/640/360",
  },
  {
    title: "JPMorgan raises guidance as banking sector benefits from higher-for-longer rates",
    description:
      "JPM lifted its full-year net interest income outlook by $2B as commercial loan demand stays resilient. The CEO warned, however, of softening consumer credit metrics.",
    source: "WSJ",
    urlToImage: "https://picsum.photos/seed/jpm-bank/640/360",
  },
  {
    title: "Amazon AWS posts strongest growth in two years as enterprises ramp AI workloads",
    description:
      "AMZN said AWS revenue grew 21% as enterprise customers accelerated AI infrastructure spending. Retail margins also expanded on advertising strength.",
    source: "Financial Times",
    urlToImage: "https://picsum.photos/seed/aws-ai/640/360",
  },
  {
    title: "Meta announces $40B share buyback after AI ad-targeting drives profit boost",
    description:
      "META authorized a fresh $40B repurchase program after Q3 profit beat, citing improved ROAS for advertisers using its AI-driven targeting tools.",
    source: "Bloomberg",
    urlToImage: "https://picsum.photos/seed/meta-ads/640/360",
  },
  {
    title: "Microsoft and Google announce cloud price cuts amid intensifying AI infrastructure war",
    description:
      "MSFT and GOOGL each lowered prices on flagship AI inference SKUs by up to 30%, signaling that the marginal cost of large-model serving continues to fall faster than expected.",
    source: "The Verge",
    urlToImage: "https://picsum.photos/seed/cloud-war/640/360",
  },
  {
    title: "Energy stocks rally as Brent crude rebounds on tighter supply outlook",
    description:
      "Major oil names gained 3-5% after OPEC+ extended voluntary production cuts. Refining margins also widened on stronger seasonal gasoline demand.",
    source: "Reuters",
    urlToImage: "https://picsum.photos/seed/energy-oil/640/360",
  },
  {
    title: "Healthcare sector underperforms as drug-pricing reform fears resurface",
    description:
      "Large-cap pharma names fell on reports that lawmakers are reviving Medicare negotiation expansion. Analysts called the impact 'manageable but a multi-quarter overhang.'",
    source: "WSJ",
    urlToImage: "https://picsum.photos/seed/health-pharma/640/360",
  },
  {
    title: "Walmart raises full-year outlook as consumer demand for value holds up",
    description:
      "WMT lifted same-store sales guidance after a strong back-to-school season. Management said grocery and private-label remain the core growth engines.",
    source: "CNBC",
    urlToImage: "https://picsum.photos/seed/wmt-retail/640/360",
  },
];

// Quote strip for the ticker tape. Fixed values, not random: the tape is a
// demo surface, and numbers that reshuffle on every render read as noise.
const MOCK_TAPE = [
  { symbol: "NVDA", last: 1064.22, change: 4.81 },
  { symbol: "AAPL", last: 241.16, change: 1.24 },
  { symbol: "TSLA", last: 198.4, change: -6.32 },
  { symbol: "MSFT", last: 468.9, change: 0.42 },
  { symbol: "GOOGL", last: 191.55, change: -0.87 },
  { symbol: "AMZN", last: 214.07, change: 2.15 },
  { symbol: "META", last: 602.31, change: 3.06 },
  { symbol: "JPM", last: 238.74, change: 0.91 },
  { symbol: "WMT", last: 88.19, change: 1.58 },
  { symbol: "V", last: 312.66, change: -0.34 },
  { symbol: "BRK.B", last: 471.02, change: 0.12 },
  { symbol: "MA", last: 528.44, change: -1.19 },
];

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function summarize(content) {
  const sentences = content
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.length > 0);
  if (sentences.length === 0) return "";
  if (sentences.length <= 2) return sentences.join(" ");

  // Pick the lead sentence + the most "informative" follow-up (longest non-lead),
  // then optionally the closing sentence. Fakes a recap-style summary cheaply.
  const lead = sentences[0];
  const middle = sentences
    .slice(1, -1)
    .sort((a, b) => b.length - a.length)[0] ?? "";
  const closer = sentences[sentences.length - 1];
  const picked = [lead, middle, closer].filter(Boolean);
  return picked.join(" ");
}

function detectSentiment(content) {
  const lower = content.toLowerCase();
  let pos = 0;
  let neg = 0;
  for (const w of POSITIVE_WORDS) if (lower.includes(w)) pos += 1;
  for (const w of NEGATIVE_WORDS) if (lower.includes(w)) neg += 1;
  if (pos === 0 && neg === 0) return "neutral";
  if (pos > neg) return "positive";
  if (neg > pos) return "negative";
  return "neutral";
}

function extractTags(content) {
  const upper = content.toUpperCase();
  const lower = content.toLowerCase();
  const tickers = TICKERS.filter((t) => new RegExp(`\\b${t}\\b`).test(upper));
  const sectors = SECTORS.filter((s) => lower.includes(s));
  return { tickers, sectors };
}

export const mockApi = {
  async summarize(content) {
    await delay(700);
    if (!content || !content.trim()) {
      return { summary: "Paste a financial news article and I'll summarize it for you." };
    }
    return { summary: summarize(content) };
  },

  async tag(content) {
    await delay(500);
    return {
      sentiment: detectSentiment(content),
      tags: extractTags(content),
    };
  },

  async headlines() {
    await delay(300);
    return { articles: MOCK_HEADLINES };
  },

  async tape() {
    return { quotes: MOCK_TAPE };
  },
};
