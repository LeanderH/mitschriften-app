'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [notes, setNotes] = useState<any[]>([]);
  const [filterSubject, setFilterSubject] = useState('Alle');
  const [loading, setLoading] = useState(false);

  // Formular-Zustand
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Mathe');
  const [author, setAuthor] = useState('');
  const [date, setDate] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const { data } = await supabase.from('notes').select('*').order('date', { ascending: false });
    if (data) setNotes(data);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return alert('Bitte eine Datei auswählen!');

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('subject', subject);
    formData.append('author', author);
    formData.append('date', date);
    formData.append('accessCode', accessCode);

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const result = await res.json();
    setLoading(false);

    if (res.ok) {
      alert('Mitschrift erfolgreich hochgeladen!');
      setTitle('');
      setFile(null);
      fetchNotes(); // Liste aktualisieren
    } else {
      alert('Fehler: ' + result.error);
    }
  }

  const filteredNotes = filterSubject === 'Alle' 
    ? notes 
    : notes.filter(n => n.subject === filterSubject);

  return (
    <main className="max-w-4xl mx-auto p-6 font-sans">
      <h1 className="text-3xl font-bold mb-6 text-slate-800">📚 Jahrgangs-Mitschriften</h1>

      {/* Formular zum Hochladen */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-slate-700">Neue Mitschrift hochladen</h2>
        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            type="text" 
            placeholder="Titel (z.B. Vektorrechnung Zusammenfassung)" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            required 
            className="p-2 border rounded md:col-span-2"
          />
          <select value={subject} onChange={e => setSubject(e.target.value)} className="p-2 border rounded">
            <option value="Mathe">Mathe</option>
            <option value="Deutsch">Deutsch</option>
            <option value="Englisch">Englisch</option>
            <option value="Physik">Physik</option>
            <option value="Geschichte">Geschichte</option>
            <option value="Biologie">Biologie</option>
          </select>
          <input 
            type="text" 
            placeholder="Dein Name" 
            value={author} 
            onChange={e => setAuthor(e.target.value)} 
            required 
            className="p-2 border rounded"
          />
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            required 
            className="p-2 border rounded"
          />
          <input 
            type="password" 
            placeholder="Jahrgangs-Passwort" 
            value={accessCode} 
            onChange={e => setAccessCode(e.target.value)} 
            required 
            className="p-2 border rounded"
          />
          <input 
            type="file" 
            onChange={e => setFile(e.target.files?.[0] || null)} 
            required 
            className="p-2 border rounded md:col-span-2"
          />
          <button 
            type="submit" 
            disabled={loading} 
            className="md:col-span-2 bg-sky-600 text-white font-medium py-2 px-4 rounded hover:bg-sky-700 transition disabled:opacity-50"
          >
            {loading ? 'Wird zu MEGA hochgeladen...' : 'Mitschrift veröffentlichen'}
          </button>
        </form>
      </div>

      {/* Filter & Liste der Mitschriften */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-700">Verfügbare Mitschriften</h2>
        <div>
          <label className="mr-2 text-sm text-slate-600">Filter nach Fach:</label>
          <select 
            value={filterSubject} 
            onChange={e => setFilterSubject(e.target.value)} 
            className="p-1 border rounded text-sm"
          >
            <option value="Alle">Alle Fächer</option>
            <option value="Mathe">Mathe</option>
            <option value="Deutsch">Deutsch</option>
            <option value="Englisch">Englisch</option>
            <option value="Physik">Physik</option>
            <option value="Geschichte">Geschichte</option>
            <option value="Biologie">Biologie</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredNotes.length === 0 ? (
          <p className="text-slate-500 italic">Noch keine Mitschriften für dieses Fach vorhanden.</p>
        ) : (
          filteredNotes.map(note => (
            <div key={note.id} className="bg-white p-4 rounded-lg border-l-4 border-sky-600 shadow-sm border border-slate-200 flex justify-between items-center">
              <div>
                <span className="inline-block bg-sky-100 text-sky-800 text-xs px-2 py-0.5 rounded font-semibold mr-2">
                  {note.subject}
                </span>
                <strong className="text-slate-800">{note.title}</strong>
                <div className="text-xs text-slate-500 mt-1">
                  Datum: {note.date} | Hochgeladen von: {note.author_name}
                </div>
              </div>
              <a 
                href={note.mega_url} 
                target="_blank" 
                rel="noreferrer" 
                className="bg-slate-800 hover:bg-slate-900 text-white text-sm px-3 py-1.5 rounded transition"
              >
                📄 Öffnen (MEGA)
              </a>
            </div>
          ))
        )}
      </div>
    </main>
  );
}