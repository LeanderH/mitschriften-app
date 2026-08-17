import { NextRequest, NextResponse } from "next/server";
import { Storage } from "megajs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const subject = formData.get("subject") as string;
    const password = formData.get("password") as string;
    const deletePin = formData.get("deletePin") as string;

    // 1. Jahrgangs-Passwort überprüfen
    const expectedCode = process.env.YEAR_ACCESS_CODE || "";

    if (!password || password.trim() !== expectedCode.trim()) {
      return NextResponse.json(
        { error: "Falscher Jahrgangs-Zugangscode!" },
        { status: 401 }
      );
    }

    if (!file || !title || !subject) {
      return NextResponse.json(
        { error: "Bitte fülle alle Pflichtfelder aus." },
        { status: 400 }
      );
    }

    // 2. Datei in Buffer umwandeln
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Verbindung zu MEGA herstellen
    const storage = await new Storage({
      email: process.env.MEGA_EMAIL!,
      password: process.env.MEGA_PASSWORD!,
    }).ready;

    // 4. Upload ausführen
    const uploadedFile: any = await storage.upload(
      {
        name: file.name,
        size: file.size,
      },
      buffer
    ).complete;

    // 5. Link sicher abrufen
    const megaUrl: string = await new Promise((resolve, reject) => {
      if (typeof uploadedFile.link === "function") {
        uploadedFile.link((err: any, url: string) => {
          if (err || !url) {
            Promise.resolve(uploadedFile.link()).then(resolve).catch(reject);
          } else {
            resolve(url);
          }
        });
      } else {
        reject(new Error("MEGA-Link konnte nicht generiert werden."));
      }
    });

    // Heutiges Datum erzeugen (YYYY-MM-DD)
    const currentDate = new Date().toISOString().split("T")[0];

    // 6. In Supabase speichern (inklusive 'date')
    const { error: dbError } = await supabase.from("notes").insert([
      {
        title,
        subject,
        date: currentDate,
        mega_url: megaUrl,
        delete_pin: deletePin || null,
      },
    ]);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, megaUrl });
  } catch (err: any) {
    console.error("Upload-Fehler:", err);
    return NextResponse.json(
      { error: err.message || "Upload fehlerhaft" },
      { status: 500 }
    );
  }
}