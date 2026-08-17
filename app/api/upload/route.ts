import { NextRequest, NextResponse } from 'next/server';
import { Storage } from 'megajs';
import { createClient } from '@supabase/supabase-js';

// Supabase Server-Client initialisieren
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const subject = formData.get('subject') as string;
    const date = formData.get('date') as string;
    const author = formData.get('author') as string;
    const accessCode = formData.get('accessCode') as string;

    // 1. Jahrgangs-Zugangscode prüfen
    if (accessCode !== process.env.YEAR_ACCESS_CODE) {
      return NextResponse.json({ error: 'Falscher Jahrgangs-Zugangscode!' }, { status: 401 });
    }

    if (!file || !title || !subject) {
      return NextResponse.json({ error: 'Bitte alle Pflichtfelder ausfüllen.' }, { status: 400 });
    }

    // 2. Datei in einen Node.js Buffer umwandeln
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Verbindung zu MEGA aufbauen
    const storage = await new Storage({
      email: process.env.MEGA_EMAIL!,
      password: process.env.MEGA_PASSWORD!,
    }).ready;

    // 4. Datei zu MEGA hochladen
    const uploadedFile = await storage.upload({
      name: `${subject}_${date}_${file.name}`,
      size: buffer.length,
    }, buffer).complete;

    // 5. Öffentlichen Freigabelink generieren
    const megaUrl = await uploadedFile.link();

    // 6. Metadaten in Supabase Datenbank speichern
    const { error } = await supabase.from('notes').insert([
      {
        title,
        subject,
        date: date || new Date().toISOString().split('T')[0],
        author_name: author || 'Anonym',
        mega_url: megaUrl,
      },
    ]);

    if (error) throw error;

    return NextResponse.json({ success: true, megaUrl });
  } catch (err: any) {
    console.error('Upload-Fehler:', err);
    return NextResponse.json({ error: err.message || 'Serverfehler beim Upload' }, { status: 500 });
  }
}