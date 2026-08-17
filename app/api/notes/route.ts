import { NextRequest, NextResponse } from "next/server";
import { Storage } from "megajs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 1. Mitschriften abrufen & mit MEGA synchronisieren (Auto-Hide)
export async function GET() {
  try {
    const { data: notes, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!notes || notes.length === 0) return NextResponse.json([]);

    // Verbindung zu MEGA aufbauen
    const storage = await new Storage({
      email: process.env.MEGA_EMAIL!,
      password: process.env.MEGA_PASSWORD!,
    }).ready;

    const megaFiles = Object.values(storage.files);
    const validNotes = [];
    const missingNoteIds = [];

    // Prüfen, ob die Datei noch in MEGA existiert
    for (const note of notes) {
      const existsInMega = megaFiles.some((f) => {
        try {
          return f.link() === note.mega_url;
        } catch {
          return false;
        }
      });

      if (existsInMega) {
        validNotes.push(note);
      } else {
        missingNoteIds.push(note.id);
      }
    }

    // Wenn Dateien in MEGA fehlen, aus Supabase bereinigen
    if (missingNoteIds.length > 0) {
      await supabase.from("notes").delete().in("id", missingNoteIds);
    }

    return NextResponse.json(validNotes);
  } catch (err: any) {
    console.error("Fehler beim Synchronisieren:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. Mitschrift manuell löschen (mit PIN)
export async function DELETE(request: NextRequest) {
  try {
    const { id, deletePin } = await request.json();

    if (!id || !deletePin) {
      return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 });
    }

    // Mitschrift suchen
    const { data: note, error } = await supabase
      .from("notes")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !note) {
      return NextResponse.json({ error: "Mitschrift nicht gefunden" }, { status: 404 });
    }

    // PIN prüfen (Ersteller-PIN ODER Jahrgangs-Passwort als Admin-Bypass)
    const isValidPin = note.delete_pin === deletePin || deletePin === process.env.YEAR_ACCESS_CODE;
    if (!isValidPin) {
      return NextResponse.json({ error: "Falscher Lösch-PIN!" }, { status: 401 });
    }

    // Aus MEGA löschen
    const storage = await new Storage({
      email: process.env.MEGA_EMAIL!,
      password: process.env.MEGA_PASSWORD!,
    }).ready;

    const file = Object.values(storage.files).find((f) => {
      try {
        return f.link() === note.mega_url;
      } catch {
        return false;
      }
    });

    if (file) {
      await file.delete(true);
    }

    // Aus Supabase löschen
    await supabase.from("notes").delete().eq("id", id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}