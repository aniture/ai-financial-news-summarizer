import { useEffect, useMemo, useState } from "react";
import { api } from "./lib/api";
import { clsx } from "./lib/clsx";
import { Button } from "./components/Button";
import { Panel, PanelHeader, Row } from "./components/Panel";

/* ---------- Signature: the tape ---------- */

function Tape({ quotes }) {
  if (!quotes.length) return null;
  // Rendered twice so the -50% keyframe loops seamlessly.
  const run = [...quotes, ...quotes];

  return (
    <div className="tape border-b border-line bg-panel overflow-hidden">
      <div className="tape-track py-2">
        {run.map((q, i) => {
          const dir = q.change > 0 ? "up" : q.change < 0 ? "down" : "flat";
          return (
            <span
              key={`${q.symbol}-${i}`}
              className="inline-flex items-baseline gap-2 px-5 text-[12px] tabular-nums"
              // The duplicated half is decorative; keep it out of the a11y tree.
              aria-hidden={i >= quotes.length ? "true" : undefined}
            >
              <span className="font-medium text-ink">{q.symbol}</span>
              <span className="text-mute">{q.last.toFixed(2)}</span>
              <span
                className={clsx(
                  dir === "up" && "text-up",
                  dir === "down" && "text-down",
                  dir === "flat" && "text-flat"
                )}
              >
                {q.change > 0 ? "▲" : q.change < 0 ? "▼" : "■"}{" "}
                {Math.abs(q.change).toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Chrome ---------- */

function StatusBar({ live }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const clock = now.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="text-amber">◆</span>
          <span className="text-sm font-semibold tracking-tight text-ink">TAPE READER</span>
          <span className="label hidden sm:inline">news desk</span>
        </div>

        <div className="flex items-center gap-5">
          <span className="flex items-center gap-2">
            <span
              className={clsx("pip inline-block h-1.5 w-1.5 rounded-full", live ? "bg-up" : "bg-amber")}
            />
            <span className="label">{live ? "live feed" : "demo feed"}</span>
          </span>
          <span className="text-[12px] tabular-nums text-mute">{clock} UTC</span>
        </div>
      </div>
    </header>
  );
}

/* ---------- Readouts ---------- */

const SENTIMENT = {
  positive: { label: "POSITIVE", cls: "text-up", mark: "▲" },
  negative: { label: "NEGATIVE", cls: "text-down", mark: "▼" },
  neutral: { label: "NEUTRAL", cls: "text-flat", mark: "■" },
};

function Chip({ children }) {
  return (
    <span className="inline-flex items-center border border-line bg-panel-2 px-1.5 py-0.5 text-[11px] text-ink">
      {children}
    </span>
  );
}

/* Platform-correct shortcut hint. */
const MOD = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)
  ? "⌘"
  : "Ctrl";

/* ---------- App ---------- */

export default function App() {
  const [inputText, setInputText] = useState("");
  const [summary, setSummary] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [headlines, setHeadlines] = useState([]);
  const [headlinesLoading, setHeadlinesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [quotes, setQuotes] = useState([]);
  const [copied, setCopied] = useState(false);
  const [live, setLive] = useState(false);
  const [error, setError] = useState("");
  const [loadingArticle, setLoadingArticle] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.headlines().then((data) => {
      if (cancelled) return;
      setHeadlines(data.articles ?? []);
      setLive(data.live);
      setHeadlinesLoading(false);
    });
    api.tape().then((data) => {
      if (!cancelled) setQuotes(data.quotes ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAnalyze() {
    if (!inputText.trim() || loading) return;
    setLoading(true);
    setSummary("");
    setAnalysis(null);
    setError("");
    try {
      const [sumData, tagData] = await Promise.all([
        api.summarize(inputText),
        api.tag(inputText),
      ]);
      setSummary(sumData.summary);
      setAnalysis(tagData);
    } catch {
      setError("The analysis service didn't respond. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setInputText("");
    setSummary("");
    setAnalysis(null);
    setError("");
  }

  // Load a headline into the composer. Live stories carry a URL, so try for the
  // full body first (the feed's description is only a teaser) and fall back to
  // the teaser if the publisher won't serve it.
  async function loadArticle(article) {
    const teaser = `${article.title}. ${article.description ?? ""}`.trim();
    setInputText(teaser);
    setSummary("");
    setAnalysis(null);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!article.url) return;

    setLoadingArticle(true);
    const body = await api.extract(article.url);
    setLoadingArticle(false);
    // Only replace the teaser if the user hasn't started editing it meanwhile.
    if (body) setInputText((cur) => (cur === teaser ? `${article.title}\n\n${body}` : cur));
  }

  async function copySummary() {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  const filteredHeadlines = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return headlines;
    return headlines.filter((a) =>
      `${a.title} ${a.description ?? ""}`.toLowerCase().includes(q)
    );
  }, [headlines, searchQuery]);

  const sentiment = analysis ? SENTIMENT[analysis.sentiment] ?? SENTIMENT.neutral : null;
  const hasResult = Boolean(summary || analysis);

  return (
    <div className="min-h-screen">
      <Tape quotes={quotes} />
      <StatusBar live={live} />

      <main className="mx-auto max-w-[1400px] px-4 pb-20 pt-10 sm:px-6">
        {/* Hero — kept short. The work happens below it. */}
        <div className="max-w-2xl">
          <div className="label">summary · sentiment · exposure</div>
          <h1 className="mt-4 text-3xl font-semibold leading-[1.15] tracking-tight text-ink sm:text-[2.5rem]">
            Summarize the wire.
          </h1>
          <p className="prose-read mt-4 text-mute">
            Paste any market story and get the recap, the direction it reads, and the
            tickers and sectors it touches.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
          {/* ---- Analyser ---- */}
          <section className="min-w-0 space-y-6">
            <Panel active={Boolean(inputText)}>
              <PanelHeader
                label="article"
                right={
                  <span className="label">
                    {loadingArticle
                      ? "fetching article…"
                      : inputText.length === 0
                        ? "empty"
                        : `${inputText.length} chars`}
                  </span>
                }
              />

              <textarea
                rows={9}
                placeholder="Paste a story here, or pick one from the wire."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  // ⌘/Ctrl+Enter submits, the way a terminal composer would.
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleAnalyze();
                }}
                className="prose-read w-full resize-y bg-transparent p-4 outline-none placeholder:font-mono placeholder:text-[13px] placeholder:text-mute/70"
              />

              <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
                <Button variant="ghost" size="sm" onClick={handleClear} disabled={!inputText}>
                  Clear
                </Button>

                <div className="flex items-center gap-3">
                  <span className="label hidden sm:inline">{MOD} ↵</span>
                  <Button onClick={handleAnalyze} disabled={loading || !inputText.trim()}>
                    {loading ? "Analyzing…" : "Analyze"}
                  </Button>
                </div>
              </div>

              {loading && (
                <div className="h-px w-full overflow-hidden bg-line">
                  <div className="scan h-px w-1/4 bg-amber" />
                </div>
              )}
            </Panel>

            {/* ---- Readout ---- */}
            {error && (
              <p role="alert" className="border border-down px-4 py-2.5 text-[12px] text-down">
                {error}
              </p>
            )}

            <Panel active={hasResult}>
              <PanelHeader
                label="readout"
                right={
                  sentiment ? (
                    <span className={clsx("text-[12px] font-medium", sentiment.cls)}>
                      {sentiment.mark} {sentiment.label}
                    </span>
                  ) : (
                    <span className="label">awaiting input</span>
                  )
                }
              />

              <div className="px-4 py-2">
                <Row k="summary">
                  {summary ? (
                    <div className="space-y-2">
                      <p className="prose-read">{summary}</p>
                      <Button variant="ghost" size="sm" className="px-0" onClick={copySummary}>
                        {copied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  ) : (
                    <span className="text-[12px] text-mute">
                      A three-sentence recap of the story.
                    </span>
                  )}
                </Row>

                <Row k="tickers">
                  {analysis ? (
                    analysis.tags.tickers.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.tags.tickers.map((t) => (
                          <Chip key={t}>{t}</Chip>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[12px] text-mute">none detected</span>
                    )
                  ) : (
                    <span className="text-[12px] text-mute">Symbols named in the text.</span>
                  )}
                </Row>

                <Row k="sectors">
                  {analysis ? (
                    analysis.tags.sectors.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.tags.sectors.map((s) => (
                          <Chip key={s}>{s}</Chip>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[12px] text-mute">none detected</span>
                    )
                  ) : (
                    <span className="text-[12px] text-mute">Sectors the story touches.</span>
                  )}
                </Row>
              </div>
            </Panel>
          </section>

          {/* ---- Wire feed ---- */}
          <section className="min-w-0">
            <Panel className="flex h-full flex-col">
              <PanelHeader
                label="the wire"
                right={<span className="label">{filteredHeadlines.length} stories</span>}
              />

              <div className="border-b border-line px-4 py-2.5">
                <input
                  type="text"
                  placeholder="Filter headlines"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-[12px] text-ink outline-none placeholder:text-mute"
                />
              </div>

              <div className="scroll-fade max-h-[34rem] overflow-y-auto">
                {headlinesLoading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="border-b border-line-soft px-4 py-3">
                      <div className="h-2 w-3/4 bg-line" />
                      <div className="mt-2 h-2 w-1/3 bg-line-soft" />
                    </div>
                  ))}

                {!headlinesLoading &&
                  filteredHeadlines.map((article, i) => (
                    <button
                      key={`${article.title}-${i}`}
                      onClick={() => loadArticle(article)}
                      className="group block w-full border-b border-line-soft px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-panel-2 focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-amber"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-[0.14em] text-amber">
                          {article.source}
                        </span>
                        <span className="h-px flex-1 bg-line" />
                        <span className="label opacity-0 transition-opacity group-hover:opacity-100">
                          load
                        </span>
                      </div>
                      <div className="prose-read mt-1.5 text-[15px] leading-snug">
                        {article.title}
                      </div>
                    </button>
                  ))}

                {!headlinesLoading && filteredHeadlines.length === 0 && (
                  <div className="px-4 py-10 text-center">
                    <p className="text-[12px] text-mute">
                      Nothing on the wire matches “{searchQuery}”.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 text-amber"
                      onClick={() => setSearchQuery("")}
                    >
                      Clear filter
                    </Button>
                  </div>
                )}
              </div>
            </Panel>
          </section>
        </div>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
          <p className="label">
            {live
              ? "live headlines and quotes · sentiment is VADER, a lexicon score · not investment advice"
              : "demo build · sentiment is a keyword heuristic · quotes and headlines are fixed sample data"}
          </p>
        </div>
      </footer>
    </div>
  );
}
