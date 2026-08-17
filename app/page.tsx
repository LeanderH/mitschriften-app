"use client";

import React, { useState, useEffect } from "react";

const SUBJECTS = [
  "Alle",
  "Mathematik",
  "Deutsch",
  "Englisch",
  "Physik",
  "Chemie",
  "Biologie",
  "Geschichte",
  "Geographie",
  "Informatik",
  "Sonstiges",
];

interface Note {
  id: string;
  title: string;
  subject: string;
  mega_url: string;
  created_at: string;
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("Alle");
  
  // Formular-States
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Mathematik");
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [deletePin, setDeletePin] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Mitschriften laden (über synchronisierenden API-Endpunkt)
  const fetchNotes = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/notes");
      const data = await res.json();
      if (Array.isArray(data)) setNotes(data);
    } catch (err) {
      console.error("Fehler beim Laden:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Upload verarbeiten
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !password || !deletePin) {
      setStatusMessage({ type: "error", text: "Bitte fülle alle Pflichtfelder inkl. Lösch-PIN aus." });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("subject", subject);
      formData.append("password", password);
      formData.append("deletePin", deletePin);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload fehlgeschlagen");

      setStatusMessage({ type: "success", text: "Mitschrift erfolgreich gespeichert!" });
      setTitle("");
      setFile(null);
      setPassword("");
      setDeletePin("");
      fetchNotes();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Mitschrift löschen
  const handleDelete = async (id: string) => {
    const pin = prompt("Gib deinen Lösch-PIN (oder das Jahrgangs-Passwort) ein, um die Datei zu entfernen:");
    if (!pin) return;

    try {
      const res = await fetch("/api/notes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, deletePin: pin }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Löschen fehlgeschlagen");

      alert("Mitschrift wurde entfernt.");
      fetchNotes();
    } catch (err: any) {
      alert("Fehler: " + err.message);
    }
  };

  const filteredNotes = selectedFilter === "Alle" 
    ? notes 
    : notes.filter((n) => n.subject === selectedFilter);

  return (
    <main className="relative min-h-screen bg-[#09090b] text-zinc-100 pb-20 selection:bg-zinc-800 selection:text-zinc-100">
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-zinc-800/20 via-zinc-900/10 to-transparent blur-3xl rounded-full" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <header className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-medium text-zinc-400 mb-4 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Jahrgangs-Archiv Online
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-500">
            Mitschriften & Materialien
          </h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-xl">
            Sicheres Teilen und Archivieren von Unterrichtsmaterialien für unseren Jahrgang.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Upload Formular */}
          <div className="lg:col-span-5">
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/50 sticky top-8">
              <h2 className="text-lg font-semibold text-zinc-100 mb-4">Neue Mitschrift</h2>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Titel / Thema</label>
                  <input
                    type="text"
                    placeholder="z.B. Integralrechnung Zusammenfassung"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Fach</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
                  >
                    {SUBJECTS.filter((s) => s !== "Alle").map((s) => (
                      <option key={s} value={s} className="bg-zinc-900">{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Datei (PDF/Bild)</label>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-zinc-800 file:text-zinc-200 border border-zinc-800 rounded-xl p-1 bg-zinc-950/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Jahrgangs-Passwort</label>
                    <input
                      type="password"
                      placeholder="Passwort"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Eigener Lösch-PIN</label>
                    <input
                      type="password"
                      placeholder="z.B. 1234"
                      value={deletePin}
                      onChange={(e) => setDeletePin(e.target.value)}
                      className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100"
                    />
                  </div>
                </div>

                {statusMessage && (
                  <p className={`text-xs ${statusMessage.type === "success" ? "text-emerald-400" : "text-rose-400"}`}>
                    {statusMessage.text}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-semibold py-3 rounded-xl text-sm transition-all"
                >
                  {loading ? "Wird hochgeladen..." : "Veröffentlichen"}
                </button>
              </form>
            </div>
          </div>

          {/* Mitschriften Liste */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {SUBJECTS.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedFilter(sub)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border ${
                    selectedFilter === sub
                      ? "bg-zinc-100 text-zinc-950 border-white"
                      : "bg-zinc-900/60 text-zinc-400 border-zinc-800"
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>

            {fetching ? (
              <p className="text-zinc-500 text-sm italic">Synchronisiere mit MEGA Cloud...</p>
            ) : filteredNotes.length === 0 ? (
              <p className="text-zinc-500 text-sm italic">Keine Mitschriften gefunden.</p>
            ) : (
              <div className="space-y-3">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                        {note.subject}
                      </span>
                      <h3 className="text-base font-medium text-zinc-200 truncate">{note.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={note.mega_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition-all"
                      >
                        Öffnen
                      </a>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/50 transition-all"
                        title="Mitschrift löschen"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}