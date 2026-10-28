
import { useEffect, useState } from "react";
import {
  Quote,
  RefreshCw,
  History,
  Heart,
  Copy,
  Sparkles,
  Clock3,
  BookOpen,
} from "lucide-react";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export default function App() {
  const [currentQuote, setCurrentQuote] = useState(null);
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Load history from the backend
  async function loadHistory(showNotice = false) {
    try {
      setHistoryLoading(true);

      const response = await fetch(`${API_URL}/history`);

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Unable to load quote history.");
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid history response from backend.");
      }

      setHistory(data);
      setError("");

      if (showNotice) {
        setNotice("History refreshed successfully.");
      }

      return true;
    } catch (err) {
      console.error("History error:", err);
      setError(err.message || "Unable to refresh history.");
      return false;
    } finally {
      setHistoryLoading(false);
    }
  }

  // Load favorites from the backend
  async function loadFavorites(showNotice = false) {
    try {
      const response = await fetch(`${API_URL}/favorites`);

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Unable to load favorites.");
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid favorites response from backend.");
      }

      setFavorites(data);

      if (showNotice) {
        setNotice("Favorites refreshed successfully.");
      }

      return true;
    } catch (err) {
      console.error("Favorites error:", err);
      setError(err.message || "Unable to load favorites.");
      return false;
    }
  }

  // Fetch a public quote and save it to history
  async function generateQuote() {
    try {
      setLoading(true);
      setError("");
      setNotice("");

      const response = await fetch(`${API_URL}/quotes/random`);

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Unable to fetch a quote.");
      }

      const result = await response.json();
      const nextQuote = result.quote;

      if (!nextQuote?.text || !nextQuote?.author) {
        throw new Error("The quote API returned invalid data.");
      }

      // Show the new quote
      setCurrentQuote(nextQuote);

      // Save it to the history table
      const saveResponse = await fetch(`${API_URL}/history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quote_text: nextQuote.text,
          quote_author: nextQuote.author,
          topic: nextQuote.topic || "Inspiration",
        }),
      });

      if (!saveResponse.ok) {
        const saveResult = await saveResponse.json().catch(() => ({}));
        throw new Error(
          saveResult.error || "Quote displayed, but history saving failed."
        );
      }

      // Refresh history without displaying a second notice
      await loadHistory(false);
    } catch (err) {
      console.error("Generate quote error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // Copy the current quote
  async function copyQuote() {
    if (!currentQuote) return;

    try {
      await navigator.clipboard.writeText(
        `"${currentQuote.text}" — ${currentQuote.author}`
      );

      setError("");
      setNotice("Quote copied to clipboard!");
    } catch (err) {
      console.error("Copy error:", err);
      setError("Copy failed. Please try again or copy the quote manually.");
    }
  }

  // Check whether a quote is a favorite
  function isFavorite(quote) {
    if (!quote) return false;

    return favorites.some(
      (item) =>
        item.quote_text === quote.text &&
        item.quote_author === quote.author
    );
  }

  // Add or remove a favorite in Supabase
  async function toggleFavorite() {
    if (!currentQuote || favoriteLoading) return;

    const existingFavorite = favorites.find(
      (item) =>
        item.quote_text === currentQuote.text &&
        item.quote_author === currentQuote.author
    );

    try {
      setFavoriteLoading(true);
      setError("");
      setNotice("");

      if (existingFavorite) {
        const response = await fetch(
          `${API_URL}/favorites/${existingFavorite.id}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.error || "Could not remove favorite.");
        }

        setFavorites((previous) =>
          previous.filter((item) => item.id !== existingFavorite.id)
        );

        setNotice("Removed from favorites.");
      } else {
        const response = await fetch(`${API_URL}/favorites`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quote_text: currentQuote.text,
            quote_author: currentQuote.author,
            topic: currentQuote.topic || "Inspiration",
          }),
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.error || "Could not save favorite.");
        }

        await loadFavorites(false);
        setNotice("Added to your favorites!");
      }
    } catch (err) {
      console.error("Favorite error:", err);
      setError(err.message || "Unable to update favorites.");
    } finally {
      setFavoriteLoading(false);
    }
  }

  // Remove a favorite from the favorites list
  async function removeFavorite(id) {
    try {
      setError("");
      setNotice("");

      const response = await fetch(`${API_URL}/favorites/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Could not remove favorite.");
      }

      setFavorites((previous) =>
        previous.filter((item) => item.id !== id)
      );

      setNotice("Removed from favorites.");
    } catch (err) {
      console.error("Remove favorite error:", err);
      setError(err.message || "Unable to remove favorite.");
    }
  }

  // Load app data when the page opens
  useEffect(() => {
    async function initializeApp() {
      await Promise.all([
        generateQuote(),
        loadHistory(false),
        loadFavorites(false),
      ]);
    }

    initializeApp();
  }, []);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-icon">
            <Quote size={20} />
          </span>
          <span>Quotely</span>
        </a>

        <span className="topbar-label">
          YOUR DAILY DOSE OF INSPIRATION
        </span>
      </header>

      <section className="hero">
        <div className="eyebrow">
          <Sparkles size={15} /> A LITTLE INSPIRATION
        </div>

        <h1>
          Words that move <span>you.</span>
        </h1>

        <p>Discover a thought worth carrying with you today.</p>
      </section>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div className="success-message" role="status">
          {notice}
        </div>
      )}

      <section className="content-grid">
        <div className="main-column">
          <article className="quote-card">
            <div className="card-topline">
              <span className="topic-pill">
                <BookOpen size={14} />
                {currentQuote?.topic || "Daily inspiration"}
              </span>

              <span className="today-label">
                QUOTE OF THE MOMENT
              </span>
            </div>

            <div className="quote-mark">“</div>

            {loading && !currentQuote ? (
              <p className="quote-text">
                Finding words to inspire you...
              </p>
            ) : currentQuote ? (
              <>
                <blockquote className="quote-text">
                  {currentQuote.text}
                </blockquote>

                <p className="quote-author">
                  — {currentQuote.author}
                </p>
              </>
            ) : (
              <p className="quote-text">
                No quote available. Please try again.
              </p>
            )}

            <div className="card-actions">
              <button
                type="button"
                className="primary-button"
                onClick={generateQuote}
                disabled={loading}
              >
                <RefreshCw size={17} />
                {loading ? "Finding quote..." : "Inspire me"}
              </button>

              <button
                type="button"
                className="icon-button"
                onClick={copyQuote}
                disabled={!currentQuote}
                aria-label="Copy quote"
                title="Copy quote"
              >
                <Copy size={18} />
              </button>

              <button
                type="button"
                className={`icon-button ${
                  isFavorite(currentQuote) ? "is-favorite" : ""
                }`}
                onClick={toggleFavorite}
                disabled={!currentQuote || favoriteLoading}
                aria-label={
                  isFavorite(currentQuote)
                    ? "Remove favorite"
                    : "Save favorite"
                }
                title={
                  isFavorite(currentQuote)
                    ? "Remove favorite"
                    : "Save favorite"
                }
              >
                <Heart
                  size={18}
                  fill={
                    isFavorite(currentQuote)
                      ? "currentColor"
                      : "none"
                  }
                />
              </button>
            </div>
          </article>

          <div className="tip-card">
            <Sparkles size={18} />
            <p>
              <strong>A reminder for you</strong>
              <br />
              Great things often begin with a single thought.
            </p>
          </div>

          <section className="history-card favorites-card">
            <div className="history-heading">
              <div className="history-icon">
                <Heart size={20} />
              </div>

              <div>
                <h2>Your favorites</h2>
                <p>Quotes worth keeping</p>
              </div>

              <span className="history-count">
                {favorites.length}
              </span>
            </div>

            <div className="history-list">
              {favorites.length === 0 ? (
                <div className="empty-history">
                  <Heart size={27} />
                  <p>No favorites yet</p>
                  <span>
                    Tap the heart on a quote to save it here.
                  </span>
                </div>
              ) : (
                favorites.map((item) => (
                  <article className="history-item" key={item.id}>
                    <span className="history-topic">
                      {item.topic}
                    </span>

                    <p>“{item.quote_text}”</p>

                    <span className="history-author">
                      — {item.quote_author}
                    </span>

                    <time>
                      {new Date(item.created_at).toLocaleString()}
                    </time>

                    <button
                      type="button"
                      className="refresh-history"
                      onClick={() => removeFavorite(item.id)}
                    >
                      <Heart size={14} fill="currentColor" />
                      Remove favorite
                    </button>
                  </article>
                ))
              )}
            </div>

            <button
              type="button"
              className="refresh-history"
              onClick={() => loadFavorites(true)}
            >
              <RefreshCw size={14} /> Refresh favorites
            </button>
          </section>
        </div>

        <aside className="history-card">
          <div className="history-heading">
            <div className="history-icon">
              <History size={20} />
            </div>

            <div>
              <h2>Your history</h2>
              <p>Words you've discovered</p>
            </div>

            <span className="history-count">
              {history.length}
            </span>
          </div>

          <div className="history-list">
            {historyLoading && history.length === 0 ? (
              <div className="empty-history">
                <Clock3 size={27} />
                <p>Loading history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="empty-history">
                <Clock3 size={27} />
                <p>No quotes yet</p>
                <span>
                  Generate a quote and it will appear here.
                </span>
              </div>
            ) : (
              history.map((item) => (
                <article className="history-item" key={item.id}>
                  <span className="history-topic">
                    {item.topic}
                  </span>

                  <p>“{item.quote_text}”</p>

                  <span className="history-author">
                    — {item.quote_author}
                  </span>

                  <time>
                    {new Date(item.generated_at).toLocaleString()}
                  </time>
                </article>
              ))
            )}
          </div>

          <button
            type="button"
            className="refresh-history"
            onClick={() => loadHistory(true)}
            disabled={historyLoading}
          >
            <RefreshCw size={14} />
            {historyLoading ? "Refreshing..." : "Refresh history"}
          </button>
        </aside>
      </section>

      <footer className="footer">
        <span>QUOTELY</span>
        <span>Small words. Big possibilities.</span>
      </footer>
    </main>
  );
}
