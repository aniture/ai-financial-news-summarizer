import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState(null);
  const [loading, setLoading] = useState(false);
  const [headlines, setHeadlines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(
          `https://newsapi.org/v2/top-headlines?category=business&language=en&pageSize=10&apiKey=34c2b989947a4cc1a4ce4eec1863f2cd`
        );
        const data = await res.json();
        setHeadlines(data.articles || []);
      } catch (err) {
        console.error('Error fetching news:', err);
      }
    };

    fetchNews();
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    setSummary('');
    setTags(null);

    try {
      const sumRes = await fetch('http://127.0.0.1:8001/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inputText })
      });
      const sumData = await sumRes.json();
      setSummary(sumData.summary);

      const tagRes = await fetch('http://127.0.0.1:8001/tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inputText })
      });
      const tagData = await tagRes.json();
      setTags(tagData);
    } catch (err) {
      console.error('Backend error:', err);
      alert('Error connecting to backend.');
    }

    setLoading(false);
  };

  return (
    <div className="App">
      <h1 className="title">AI Financial News Analyzer</h1>

      <div className="analyze-box">
        <textarea
          rows="8"
          placeholder="Paste your financial news article here or select from the list below..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <br />
        <button className="analyze-btn" onClick={handleAnalyze} disabled={loading || !inputText}>
          {loading ? 'Analyzing...' : 'Analyze'}
          {loading && <span className="spinner" />}
        </button>
        {summary && (
        <div className="result">
          <h3>📌 Summary:</h3>
          <p>{summary}</p>
        </div>
      )}

      {tags && (
        <div className="result">
          <h3>📊 Sentiment:</h3>
          <p>{tags.sentiment}</p>
          <h3>🏷️ Tags:</h3>
          <p><strong>Tickers:</strong> {tags.tags.tickers.join(', ') || 'None'}</p>
          <p><strong>Sectors:</strong> {tags.tags.sectors.join(', ') || 'None'}</p>
        </div>
      )}
      </div>

      <h2 className="subtitle">🖋️ Latest Financial Headlines</h2>

      <div style={{ display: 'flex', marginBottom: '1rem', gap: '10px' }}>
        <input
          type="text"
          placeholder="Search news by keyword..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: '0.5rem' }}
        />
        <button
          onClick={() => setSearchQuery('')}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
        >
          Clear
        </button>
      </div>

      <ul className="news-list">
        {headlines
          .filter(article =>
            (article.title + article.description)
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
          )
          .slice(0, 10)
          .map((article, index) => (
            <li
            key={index}
            className="news-item"
            onClick={() => {
                const content = article.title + (article.description ? `. ${article.description}` : '');
                setInputText(content);
            }}
            >
            {article.urlToImage && (
                <img
                src={article.urlToImage}
                alt="Thumbnail"
                className="news-thumbnail"
                />
            )}
            <div className="news-text">
                <strong>{article.title}</strong><br />
                <small>{article.source.name}</small>
            </div>
            </li>

          ))}
      </ul>

      
    </div>
  );
}
