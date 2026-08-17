"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase Client Initialisierung
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Mitschriften laden
  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fehler beim Laden:", error);
    } else if (data) {
      setNotes(data);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Upload verarbeiten
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !password) {
      setStatusMessage({ type: "error", text: "Bitte fülle alle Felder aus und wähle eine Datei." });
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

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload fehlgeschlagen");
      }

      setStatusMessage({ type: "success", text: "Mitschrift erfolgreich im Archiv gespeichert!" });
      setTitle("");
      setFile(null);
      setPassword("");
      fetchNotes();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Ein Fehler ist aufgetreten." });
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = selectedFilter === "Alle" 
    ? notes 
    : notes.filter((n) => n.subject === selectedFilter);

  return (
    <main className="relative min-h-screen bg-[#09090b] text-zinc-100 pb-20 selection:bg-zinc-800 selection:text-zinc-100">
      {/* Edler diffuser Hintergrund-Glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-zinc-800/20 via-zinc-900/10 to-transparent blur-3xl rounded-full" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        
        {/* Header */}
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

        {/* Haupt-Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Upload Formular (Links) */}
          <div className="lg:col-span-5">
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/50 sticky top-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800/60">
                <div className="p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/50 text-zinc-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-100">Neue Mitschrift</h2>
                  <p className="text-xs text-zinc-400">Dokument hochladen & teilen</p>
                </div>
              </div>

              <form onSubmit={handleUpload} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Titel / Thema</label>
                  <input
                    type="text"
                    placeholder="z.B. Integralrechnung Zusammenfassung"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Fach</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all cursor-pointer"
                  >
                    {SUBJECTS.filter((s) => s !== "Alle").map((s) => (
                      <option key={s} value={s} className="bg-zinc-900 text-zinc-100">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Datei (PDF oder Bild)</label>
                  <div className="relative border border-dashed border-zinc-800 hover:border-zinc-600 rounded-xl p-4 transition-colors bg-zinc-950/40 text-center cursor-pointer">
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-xs text-zinc-400 truncate max-w-[200px]">
                        {file ? file.name : "Klicken oder Datei hierher ziehen"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Jahrgangs-Passwort</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                  />
                </div>

                {statusMessage && (
                  <div
                    className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                      statusMessage.type === "success"
                        ? "bg-emerald-950/40 border border-emerald-800/50 text-emerald-300"
                        : "bg-rose-950/40 border border-rose-800/50 text-rose-300"
                    }`}
                  >
                    <span>{statusMessage.type === "success" ? "✓" : "✕"}</span>
                    {statusMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-semibold py-3.5 rounded-xl text-sm transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_25px_rgba(255,255,255,0.15)] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                      Wird hochgeladen...
                    </>
                  ) : (
                    "Mitschrift veröffentlichen"
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Mitschriften Liste (Rechts) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Filter Leiste */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {SUBJECTS.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedFilter(sub)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer border ${
                    selectedFilter === sub
                      ? "bg-zinc-100 text-zinc-950 border-white shadow-sm"
                      : "bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>

            {/* Mitschriften Grid */}
            {filteredNotes.length === 0 ? (
              <div className="text-center py-16 border border-zinc-800/50 rounded-2xl bg-zinc-900/20 backdrop-blur-sm">
                <svg className="w-10 h-10 mx-auto text-zinc-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-zinc-400 text-sm">Keine Mitschriften in dieser Kategorie vorhanden.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="group bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-5 transition-all duration-300 backdrop-blur-md flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                          {note.subject}
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          {new Date(note.created_at).toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <h3 className="text-base font-medium text-zinc-200 group-hover:text-white transition-colors truncate">
                        {note.title}
                      </h3>
                    </div>

                    <a
                      href={note.mega_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 px-4 py-2 rounded-xl text-xs font-medium bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700/60 transition-all flex items-center gap-1.5 group/btn"
                    >
                      <span>Öffnen</span>
                      <svg className="w-3.5 h-3.5 text-zinc-400 group-hover/btn:text-white group-hover/btn:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
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