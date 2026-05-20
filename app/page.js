"use client";
import { useState, useEffect } from "react";

const ACCENT = "#2b8279";

export default function Home() {
  const [view, setView] = useState("home");
  const [book, setBook] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [library, setLibrary] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [savedNotes, setSavedNotes] = useState([]);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [currentBook, setCurrentBook] = useState("");

  useEffect(() => {
    const lib = JSON.parse(localStorage.getItem("booklib") || "[]");
    setLibrary(lib);
  }, []);

  function saveToLibrary(bookData, bookName, chat, notes) {
    const lib = JSON.parse(localStorage.getItem("booklib") || "[]");
    const existing = lib.findIndex(b => b.title === bookData.title);
    const entry = { ...bookData, bookName, chat: chat || [], notes: notes || [], savedAt: Date.now() };
    if (existing >= 0) lib[existing] = entry;
    else lib.unshift(entry);
    localStorage.setItem("booklib", JSON.stringify(lib));
    setLibrary(lib);
  }

  async function searchBook() {
    if (!book.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    setChatMessages([]);
    setSavedNotes([]);
    setCurrentBook(book);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "insights", book }),
      });
      const json = await res.json();
      if (json.error) { setError("Book not found. Try the full title."); return; }
      setData(json);
      setView("book");
      saveToLibrary(json, book, [], []);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function sendChat(msg) {
    const message = msg || chatInput.trim();
    if (!message) return;
    setChatInput("");
    const newHistory = [...chatMessages, { role: "user", content: message }];
    setChatMessages(newHistory);
    setChatLoading(true);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "chat", book: currentBook, history: newHistory }),
      });
      const json = await res.json();
      const updated = [...newHistory, { role: "assistant", content: json.reply }];
      setChatMessages(updated);
      saveToLibrary(data, currentBook, updated, savedNotes);
    } catch {
      setChatMessages([...newHistory, { role: "assistant", content: "Something went wrong." }]);
    } finally {
      setChatLoading(false);
    }
  }

  async function generateInsights() {
    if (chatMessages.length === 0) return;
    setGeneratingInsights(true);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "insights_from_chat", book: currentBook, history: chatMessages }),
      });
      const json = await res.json();
      const newNotes = [...savedNotes, ...(json.notes || [])];
      setSavedNotes(newNotes);
      saveToLibrary(data, currentBook, chatMessages, newNotes);
    } catch {
      alert("Something went wrong generating insights.");
    } finally {
      setGeneratingInsights(false);
    }
  }

  function openFromLibrary(entry) {
    setData(entry);
    setCurrentBook(entry.bookName);
    setChatMessages(entry.chat || []);
    setSavedNotes(entry.notes || []);
    setView("book");
  }

  function deleteFromLibrary(title) {
    const lib = library.filter(b => b.title !== title);
    localStorage.setItem("booklib", JSON.stringify(lib));
    setLibrary(lib);
  }

  const bg = darkMode ? "#21211e" : "#f5f5f0";
  const bg2 = darkMode ? "#2a2a26" : "#e8e8e3";
  const bg3 = darkMode ? "#333330" : "#ddddd8";
  const text = darkMode ? "#f0f0f0" : "#1a1a1a";
  const muted = darkMode ? "#aaa" : "#666";
  const border = darkMode ? "#3a3a36" : "#ccc";

  return (
    <main style={{ minHeight: "100vh", background: bg, color: text, fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", transition: "all 0.3s" }}>
      <style>{`
        @keyframes wave {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeSlideIn 0.4s ease forwards; }
        .dot1 { animation: wave 1s infinite 0s; display: inline-block; }
        .dot2 { animation: wave 1s infinite 0.15s; display: inline-block; }
        .dot3 { animation: wave 1s infinite 0.3s; display: inline-block; }
      `}</style>

      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem", borderBottom: "1px solid " + border, position: "sticky", top: 0, background: bg, zIndex: 100 }}>
        <span onClick={() => setView("home")} style={{ fontSize: 18, fontWeight: 600, cursor: "pointer" }}>📚 BookApp</span>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={() => setView("library")} style={{ background: view === "library" ? ACCENT : bg2, color: view === "library" ? "#fff" : muted, border: "none", padding: "6px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
            Library {library.length > 0 && "(" + library.length + ")"}
          </button>
          <button onClick={() => setDarkMode(!darkMode)} style={{ background: bg2, border: "none", padding: "6px 10px", borderRadius: 8, fontSize: 14, cursor: "pointer", color: text }}>
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "1.5rem 1rem" }}>

        {view === "home" && (
          <div>
            <div style={{ textAlign: "center", padding: "2rem 0 2.5rem" }}>
              <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>What will you learn today?</h1>
              <p style={{ color: muted, fontSize: 15 }}>Get the key ideas, mindset, and personal insights from any book.</p>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input value={book} onChange={e => setBook(e.target.value)} onKeyDown={e => e.key === "Enter" && searchBook()} placeholder="E.g. Atomic Habits, 48 Laws of Power..." style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid " + border, background: bg2, color: text, fontSize: 15, outline: "none" }} />
              <button onClick={searchBook} disabled={loading} style={{ padding: "12px 20px", borderRadius: 12, border: "none", background: ACCENT, color: "#fff", fontSize: 15, cursor: "pointer", fontWeight: 500, minWidth: 90 }}>
                {loading ? <span><span className="dot1">.</span><span className="dot2">.</span><span className="dot3">.</span></span> : "Search"}
              </button>
            </div>
            {error && <p style={{ color: "#f87171", fontSize: 14 }}>{error}</p>}
            {library.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: muted, marginBottom: 12 }}>Recently read</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {library.slice(0, 3).map((b, i) => (
                    <div key={i} onClick={() => openFromLibrary(b)} style={{ background: bg2, border: "1px solid " + border, borderRadius: 12, padding: "12px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{b.title}</p>
                        <p style={{ fontSize: 12, color: muted }}>{b.chat?.length > 0 ? b.chat.length + " messages" : "No chat yet"}{b.notes?.length > 0 ? " · " + b.notes.length + " insights" : ""}</p>
                      </div>
                      <span style={{ color: muted, fontSize: 18 }}>›</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {view === "library" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 20 }}>Your Library</h2>
            {library.length === 0 ? (
              <p style={{ color: muted, fontSize: 14 }}>No books yet. Search for a book to get started.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {library.map((b, i) => (
                  <div key={i} style={{ background: bg2, border: "1px solid " + border, borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div onClick={() => openFromLibrary(b)} style={{ cursor: "pointer", flex: 1 }}>
                        <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{b.title}</p>
                        <p style={{ fontSize: 12, color: muted }}>{(b.overview || "").slice(0, 80)}...</p>
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          {b.chat?.length > 0 && <span style={{ fontSize: 11, background: bg3, padding: "2px 8px", borderRadius: 6, color: muted }}>{b.chat.length} messages</span>}
                          {b.notes?.length > 0 && <span style={{ fontSize: 11, background: ACCENT + "33", padding: "2px 8px", borderRadius: 6, color: ACCENT }}>{b.notes.length} insights</span>}
                        </div>
                      </div>
                      <button onClick={() => deleteFromLibrary(b.title)} style={{ background: "none", border: "none", color: muted, cursor: "pointer", fontSize: 18, padding: "0 4px" }}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === "book" && data && (
          <div className="fade-in">
            <button onClick={() => setView("home")} style={{ background: "none", border: "none", color: muted, cursor: "pointer", fontSize: 13, marginBottom: 16, padding: 0 }}>← Back</button>

            <div style={{ background: bg2, borderRadius: 14, padding: "1.25rem", marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 6 }}>{data.title}</h2>
              <p style={{ color: muted, fontSize: 14, lineHeight: 1.6 }}>{data.overview}</p>
            </div>

            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: muted, marginBottom: 8 }}>Core mindset</p>
            <div style={{ background: bg2, borderLeft: "3px solid " + ACCENT, borderRadius: "0 12px 12px 0", padding: "0.875rem 1rem", marginBottom: 16 }}>
              <p style={{ color: text, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{data.mindset}</p>
            </div>

            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: muted, marginBottom: 8 }}>Key ideas</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {(data.ideas || []).map((idea, i) => (
                <div key={i} className="fade-in" style={{ background: bg2, border: "1px solid " + border, borderRadius: 12, padding: "0.875rem 1rem", animationDelay: i * 0.08 + "s" }}>
                  <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{idea.title}</p>
                  <p style={{ color: muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>{idea.body}</p>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: muted, marginBottom: 8 }}>What you can actually do</p>
            <div style={{ background: bg2, border: "1px solid " + border, borderRadius: 12, padding: "0.875rem 1rem", marginBottom: 24 }}>
              {(data.actions || []).map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: i < data.actions.length - 1 ? 8 : 0 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT, marginTop: 6, flexShrink: 0 }} />
                  <p style={{ color: muted, fontSize: 13, lineHeight: 1.5, margin: 0 }}>{a}</p>
                </div>
              ))}
            </div>

            {savedNotes.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: ACCENT, marginBottom: 8 }}>Your personal insights</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {savedNotes.map((note, i) => (
                    <div key={i} style={{ background: ACCENT + "15", border: "1px solid " + ACCENT + "44", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: text, lineHeight: 1.6 }}>
                      💡 {note}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ borderTop: "1px solid " + border, paddingTop: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: muted, marginBottom: 10 }}>Dig deeper</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {(data.followup_chips || []).map((q, i) => (
                  <button key={i} onClick={() => sendChat(q)} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 8, border: "1px solid " + border, background: bg2, color: muted, cursor: "pointer" }}>{q}</button>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12, maxHeight: 320, overflowY: "auto" }}>
                {chatMessages.map((m, i) => (
                  <div key={i} style={{ padding: "10px 12px", borderRadius: 10, fontSize: 13, lineHeight: 1.6, maxWidth: "90%", alignSelf: m.role === "user" ? "flex-end" : "flex-start", background: m.role === "user" ? ACCENT : bg2, border: m.role === "assistant" ? "1px solid " + border : "none", color: m.role === "user" ? "#fff" : text }}>
                    {m.content}
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ padding: "10px 12px", borderRadius: 10, fontSize: 13, background: bg2, border: "1px solid " + border, color: muted, alignSelf: "flex-start" }}>
                    <span className="dot1">.</span><span className="dot2">.</span><span className="dot3">.</span>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} placeholder="Ask anything about this book..." style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid " + border, background: bg2, color: text, fontSize: 13, outline: "none" }} />
                <button onClick={() => sendChat()} style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 13, cursor: "pointer" }}>Ask</button>
              </div>
              {chatMessages.length >= 2 && (
                <button onClick={generateInsights} disabled={generatingInsights} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid " + ACCENT, background: "transparent", color: ACCENT, fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
                  {generatingInsights ? "Generating your insights..." : "✨ Generate my insights"}
                </button>
              )}
            </div>
          </div>
        )}

      </div>
      <div style={{ textAlign: "center", padding: "2rem 0 1rem", color: "#555", fontSize: 12 }}>
        BookApp by <span style={{ color: "#2b8279", fontWeight: 500 }}>Solviq</span>
      </div>
    </main>
  );
}
