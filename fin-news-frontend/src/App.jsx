import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  X,
  Brain,
  Newspaper,
  Tag,
  ArrowRight,
} from "lucide-react";
import { mockApi } from "./lib/mockApi";

function clsx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function AuroraBackground({ children }) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div className="aurora-grid pointer-events-none absolute inset-0 opacity-20" />
      <div className="pointer-events-none absolute inset-0">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_var(--color-bg)_75%)]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function SpotlightCard({ children, className, onClick }) {
  const ref = useRef(null);
  function onMove(e) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onClick={onClick}
      className={clsx("spotlight overflow-hidden", onClick && "cursor-pointer", className)}
    >
      {children}
    </div>
  );
}

function ShimmerButton({ children, ...props }) {
  return (
    <button {...props} className={clsx("shimmer", props.className)}>
      <span className="shimmer-inner">{children}</span>
    </button>
  );
}

function SentimentBadge({ value }) {
  const map = {
    positive: { icon: TrendingUp, label: "Positive", color: "text-emerald-300", ring: "ring-emerald-400/30", bg: "bg-emerald-500/10" },
    negative: { icon: TrendingDown, label: "Negative", color: "text-rose-300", ring: "ring-rose-400/30", bg: "bg-rose-500/10" },
    neutral: { icon: Minus, label: "Neutral", color: "text-slate-300", ring: "ring-slate-400/30", bg: "bg-slate-500/10" },
  };
  const v = map[value] ?? map.neutral;
  const Icon = v.icon;
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1", v.color, v.ring, v.bg)}>
      <Icon className="h-3.5 w-3.5" />
      {v.label}
    </span>
  );
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-medium text-slate-200">
      {children}
    </span>
  );
}

export default function App() {
  const [inputText, setInputText] = useState("");
  const [summary, setSummary] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [headlines, setHeadlines] = useState([]);
  const [headlinesLoading, setHeadlinesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    mockApi.headlines().then((data) => {
      if (cancelled) return;
      setHeadlines(data.articles ?? []);
      setHeadlinesLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAnalyze() {
    if (!inputText.trim()) return;
    setLoading(true);
    setSummary("");
    setAnalysis(null);
    try {
      const [sumData, tagData] = await Promise.all([
        mockApi.summarize(inputText),
        mockApi.tag(inputText),
      ]);
      setSummary(sumData.summary);
      setAnalysis(tagData);
    } finally {
      setLoading(false);
    }
  }

  const filteredHeadlines = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return headlines;
    return headlines.filter((a) => `${a.title} ${a.description ?? ""}`.toLowerCase().includes(q));
  }, [headlines, searchQuery]);

  return (
    <AuroraBackground>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-24">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            AI-powered analysis
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            Read the markets,{" "}
            <span className="gradient-text">in seconds</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-slate-300">
            Paste any financial news article — get an instant summary, sentiment, and the
            tickers and sectors it touches.
          </p>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Analyze */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-3 space-y-6"
          >
            <div className="rounded-2xl glass p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2 text-sm text-slate-300">
                <Brain className="h-4 w-4 text-sky-300" />
                <span>Article</span>
              </div>
              <textarea
                rows={8}
                placeholder="Paste your financial news article here, or click any headline below to populate it…"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full resize-y rounded-xl border border-white/10 bg-slate-950/50 p-4 text-base leading-relaxed text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-sky-500/50"
              />
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  {inputText.length === 0 ? "Empty" : `${inputText.length} characters`}
                </div>
                <ShimmerButton
                  onClick={handleAnalyze}
                  disabled={loading || !inputText.trim()}
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Analyze
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </ShimmerButton>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {summary && (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                  className="rounded-2xl glass p-5 sm:p-6"
                >
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    Summary
                  </div>
                  <p className="text-base leading-relaxed text-slate-100">{summary}</p>
                </motion.div>
              )}

              {analysis && (
                <motion.div
                  key="analysis"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, delay: 0.05 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <div className="rounded-2xl glass p-5">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
                      <TrendingUp className="h-4 w-4 text-sky-300" />
                      Sentiment
                    </div>
                    <SentimentBadge value={analysis.sentiment} />
                  </div>

                  <div className="rounded-2xl glass p-5">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
                      <Tag className="h-4 w-4 text-cyan-300" />
                      Tags detected
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs uppercase tracking-wider text-slate-400">Tickers</span>
                        {analysis.tags.tickers.length > 0 ? (
                          analysis.tags.tickers.map((t) => <Chip key={t}>{t}</Chip>)
                        ) : (
                          <span className="text-xs text-slate-500">None detected</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs uppercase tracking-wider text-slate-400">Sectors</span>
                        {analysis.tags.sectors.length > 0 ? (
                          analysis.tags.sectors.map((s) => <Chip key={s}>{s}</Chip>)
                        ) : (
                          <span className="text-xs text-slate-500">None detected</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* Right: Headlines */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <Newspaper className="h-4 w-4 text-cyan-300" />
                Live headlines
              </div>
              <span className="text-xs text-slate-400">{filteredHeadlines.length} stories</span>
            </div>

            <div className="mb-4 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search headlines…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/40 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-500/50"
                />
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="scroll-fade max-h-[640px] overflow-y-auto pr-1 space-y-3">
              {headlinesLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="rounded-2xl glass p-3 animate-pulse">
                      <div className="flex gap-3">
                        <div className="h-16 w-24 rounded-lg bg-white/5" />
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-3 w-3/4 rounded bg-white/10" />
                          <div className="h-3 w-1/2 rounded bg-white/10" />
                        </div>
                      </div>
                    </div>
                  ))
                : filteredHeadlines.map((article, i) => (
                    <motion.div
                      key={`${article.title}-${i}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.2) }}
                    >
                      <SpotlightCard
                        className="p-3"
                        onClick={() => {
                          setInputText(`${article.title}. ${article.description ?? ""}`.trim());
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        <div className="flex gap-3">
                          {article.urlToImage && (
                            <img
                              src={article.urlToImage}
                              alt=""
                              className="h-16 w-24 flex-none rounded-lg object-cover"
                              loading="lazy"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="line-clamp-2 text-sm font-medium text-slate-100">
                              {article.title}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-400">
                              <span>{article.source}</span>
                              <span>·</span>
                              <span className="text-slate-500">tap to analyze</span>
                            </div>
                          </div>
                        </div>
                      </SpotlightCard>
                    </motion.div>
                  ))}
              {!headlinesLoading && filteredHeadlines.length === 0 && (
                <div className="rounded-2xl glass p-6 text-center text-sm text-slate-400">
                  No headlines match “{searchQuery}”.
                </div>
              )}
            </div>
          </motion.section>
        </div>

        <footer className="mt-16 text-center text-xs text-slate-500">
          Demo mode · sentiment heuristic + curated headlines · no live API calls
        </footer>
      </div>
    </AuroraBackground>
  );
}
