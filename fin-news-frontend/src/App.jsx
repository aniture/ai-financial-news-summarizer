import { useEffect, useMemo, useState } from "react";
import { mockApi } from "./lib/mockApi";

function clsx(...parts) {
  return parts.filter(Boolean).join(" ");
}

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

function StatusBar() {
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
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="text-amber">◆</span>
          <span className="text-sm font-semibold tracking-tight text-ink">TAPE READER</span>
          <span className="label hidden sm:inline">news desk</span>
        </div>

        <div className="flex items-center gap-5">
          <span className="flex items-center gap-2">
            <span className="pip inline-block h-1.5 w-1.5 rounded-full bg-up" />
            <span className="label">demo feed</span>
          </span>
          <span className="text-[12px] tabular-nums text-mute">{clock} UTC</span>
        </div>
      </div>
    </header>
  );
}

/* ---------- Readouts ---------- */

const SENTIMENT = {
  positive: { label: "POSITIVE", cls: "text-up", mark: "▲", bar: "bg-up" },
  negative: { label: "NEGATIVE", cls: "text-down", mark: "▼", bar: "bg-down" },
  neutral: { label: "NEUTRAL", cls: "text-flat", mark: "■", bar: "bg-flat" },
};

function Row({ k, children }) {
  return (
    <div className="flex gap-4 border-b border-line-soft py-2.5 last:border-b-0">
      <span className="label w-24 shrink-0 pt-0.5">{k}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center border border-line bg-panel-2 px-1.5 py-0.5 text-[11px] text-ink">
      {children}
    </span>
  );
}

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

  useEffect(() => {
    let cancelled = false;
    mockApi.headlines().then((data) => {
      if (cancelled) return;
      setHeadlines(data.articles ?? []);
      setHeadlinesLoading(false);
    });
    mockApi.tape().then((data) => {
      if (!cancelled) setQuotes(data.quotes ?? []);
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
    return headlines.filter((a) =>
      `${a.title} ${a.description ?? ""}`.toLowerCase().includes(q)
    );
  }, [headlines, searchQuery]);

  const sentiment = analysis ? SENTIMENT[analysis.sentiment] ?? SENTIMENT.neutral : null;
  const hasResult = Boolean(summary || analysis);

  return (
    <div className="min-h-screen">
      <Tape quotes={quotes} />
      <StatusBar />

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
            <div className="panel">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <span className="label">article</span>
                <span className="label">
                  {inputText.length === 0 ? "empty" : `${inputText.length} chars`}
                </span>
              </div>

              <textarea
                rows={9}
                placeholder="Paste a story here, or pick one from the wire."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="prose-read w-full resize-y bg-transparent p-4 outline-none placeholder:font-mono placeholder:text-[13px] placeholder:text-mute/70"
              />

              <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
                <button
                  onClick={() => {
                    setInputText("");
                    setSummary("");
                    setAnalysis(null);
                  }}
                  disabled={!inputText}
                  className="label transition-colors hover:text-ink disabled:opacity-30"
                >
                  Clear
                </button>

                <button
                  onClick={handleAnalyze}
                  disabled={loading || !inputText.trim()}
                  className="bg-amber px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#14100a] transition-[filter] hover:brightness-110 disabled:border disabled:border-line disabled:bg-transparent disabled:text-mute"
                >
                  {loading ? "Analyzing…" : "Analyze"}
                </button>
              </div>

              {loading && (
                <div className="h-px w-full overflow-hidden bg-line">
                  <div className="scan h-px w-1/4 bg-amber" />
                </div>
              )}
            </div>

            {/* ---- Readout ---- */}
            {!hasResult && !loading && (
              <div className="panel">
                <div className="border-b border-line px-4 py-2.5">
                  <span className="label">readout</span>
                </div>
                <div className="px-4 py-2">
                  <Row k="summary">
                    <span className="text-[12px] text-mute">
                      A three-sentence recap of the story.
                    </span>
                  </Row>
                  <Row k="tickers">
                    <span className="text-[12px] text-mute">
                      Symbols named in the text.
                    </span>
                  </Row>
                  <Row k="sectors">
                    <span className="text-[12px] text-mute">
                      Sectors the story touches.
                    </span>
                  </Row>
                </div>
              </div>
            )}

            {hasResult && (
              <div className="panel">
                <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                  <span className="label">readout</span>
                  {sentiment && (
                    <span className={clsx("text-[12px] font-medium", sentiment.cls)}>
                      {sentiment.mark} {sentiment.label}
                    </span>
                  )}
                </div>

                <div className="px-4 py-2">
                  {summary && (
                    <Row k="summary">
                      <p className="prose-read">{summary}</p>
                    </Row>
                  )}

                  {analysis && (
                    <>
                      <Row k="tickers">
                        {analysis.tags.tickers.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.tags.tickers.map((t) => (
                              <Chip key={t}>{t}</Chip>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[12px] text-mute">none detected</span>
                        )}
                      </Row>

                      <Row k="sectors">
                        {analysis.tags.sectors.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.tags.sectors.map((s) => (
                              <Chip key={s}>{s}</Chip>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[12px] text-mute">none detected</span>
                        )}
                      </Row>
                    </>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* ---- Wire feed ---- */}
          <section className="min-w-0">
            <div className="panel flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <span className="label">the wire</span>
                <span className="label">{filteredHeadlines.length} stories</span>
              </div>

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
                      onClick={() => {
                        setInputText(
                          `${article.title}. ${article.description ?? ""}`.trim()
                        );
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="group block w-full border-b border-line-soft px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-panel-2"
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
                    <button
                      onClick={() => setSearchQuery("")}
                      className="label mt-3 text-amber hover:brightness-110"
                    >
                      Clear filter
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
          <p className="label">
            demo build · sentiment is a keyword heuristic · quotes and headlines are fixed
            sample data
          </p>
        </div>
      </footer>
    </div>
  );
}
