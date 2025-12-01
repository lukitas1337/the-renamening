# THE RENAMENING - Dokumentation

## Übersicht

THE RENAMENING ist eine browserbasierte Webanwendung zum automatischen Umbenennen von Videos basierend auf Metadaten-Vergleich. Die App läuft vollständig im Browser - keine Uploads, keine Server, alle Daten bleiben lokal auf Ihrem Gerät.

---

## Für Endbenutzer

### Was macht die App?

Die App vergleicht zwei Ordner mit Videos und benennt die Videos im Ausgabe-Ordner automatisch um, basierend auf den passenden Videos im Eingabe-Ordner.

**Anwendungsfall:**
- Sie haben Original-Videos mit aussagekräftigen Namen im **Eingabe-Ordner**
- Sie haben bearbeitete/exportierte Videos mit generischen Namen (z.B. "SF-101.MP4") im **Ausgabe-Ordner**
- Die App findet automatisch zusammengehörige Videos und benennt die Ausgabe-Videos nach den Eingabe-Videos um

### Voraussetzungen

- **Browser:** Google Chrome (Version 86+) oder Microsoft Edge (Version 86+)
- **Betriebssystem:** Desktop (Windows, macOS, Linux)
- **Nicht unterstützt:** Mobile Geräte, Safari, Firefox

> ⚠️ Die App funktioniert nicht auf mobilen Geräten, da die benötigte File System Access API nur auf Desktop-Browsern verfügbar ist.

### Schritt-für-Schritt Anleitung

#### 1. Ordner auswählen

1. **Eingabe-Ordner:** Klicken Sie auf "Browse" bei "Input Folder" und wählen Sie den Ordner mit Ihren Original-Videos
2. **Ausgabe-Ordner:** Klicken Sie auf "Browse" bei "Output Folder" und wählen Sie den Ordner mit den Videos, die umbenannt werden sollen
3. **Backup-Speicherort (Optional):** Wählen Sie einen Ordner, in dem Backups gespeichert werden sollen (Standard: Ausgabe-Ordner)

#### 2. Analyse starten

Klicken Sie auf **"Analyze"**. Die App wird:
- Alle Videos in beiden Ordnern scannen
- Metadaten (Auflösung, Dauer) von jedem Video extrahieren
- Videos automatisch zuordnen

#### 3. Ergebnisse prüfen

Nach der Analyse sehen Sie eine Tabelle mit folgenden Status-Typen:

| Status | Bedeutung | Aktion möglich? |
|--------|-----------|-----------------|
| **Match** (Grün) | Eindeutige Zuordnung gefunden | ✅ Ja |
| **Ambiguous** (Gelb) | Mehrere Eingabe-Videos passen zu einem Ausgabe-Video | ❌ Nein - Konflikt lösen |
| **Collision** (Orange) | Mehrere Ausgabe-Videos würden denselben Namen bekommen | ❌ Nein - Duplikate entfernen |
| **No Match** (Rot) | Kein passendes Eingabe-Video gefunden | ⚠️ Wird übersprungen |

#### 4. Videos umbenennen

1. Prüfen Sie die Vorschau in der "New Name" Spalte
2. Klicken Sie auf **"Rename Videos"**
3. Bestätigen Sie die Aktion
4. Ein Backup wird automatisch erstellt
5. Nur Videos mit Status "Match" werden umbenannt

> ⚠️ **Wichtig:** Videos mit Status "Ambiguous" oder "Collision" blockieren die Umbenennung. Diese Konflikte müssen vorher manuell gelöst werden.

### Unterstützte Videoformate

Die App unterstützt folgende Videoformate:
- **Standard:** MP4, MOV, AVI, MKV, FLV, WMV, M4V
- **MPEG:** MPEG, MPG, MPE, M2V, M4P
- **HEVC/H.265:** HEVC, H265, 265
- **Web:** WEBM, OGV
- **Mobil:** 3GP, 3G2
- **Transport Streams:** VOB, TS, M2TS, MTS
- **Sonstige:** DIVX, XVID, ASF, RM, RMVB

---

## Technische Dokumentation

### Technologie-Stack

- **Framework:** Next.js 14.2.18 (App Router)
- **Sprache:** TypeScript
- **Styling:** Tailwind CSS
- **UI-Komponenten:** shadcn/ui
- **Browser API:** File System Access API
- **Deployment:** Vercel

### Architektur

#### Dateistruktur

```
videoNameFix-web/
├── app/
│   ├── page.tsx              # Hauptseite mit UI-Logik
│   ├── layout.tsx            # Root Layout
│   └── globals.css           # Globale Styles
├── components/
│   ├── BrowserCheck.tsx      # Browser-Kompatibilitätsprüfung
│   ├── FolderSelector.tsx    # Ordnerauswahl-Komponente
│   └── MatchesTable.tsx      # Ergebnistabelle
├── lib/
│   ├── fileSystem.ts         # File System Access API Wrapper
│   ├── videoMetadata.ts      # Metadaten-Extraktion
│   └── matching.ts           # Matching-Algorithmus
└── components/ui/            # shadcn/ui Basis-Komponenten
```

#### Kernmodule

##### 1. File System Access (`lib/fileSystem.ts`)

**Funktionen:**
- `checkFileSystemSupport()`: Prüft Browser-Unterstützung
- `selectDirectory()`: Öffnet Ordnerauswahl-Dialog
- `getVideoFiles()`: Scannt Ordner nach Videodateien
- `renameFile()`: Benennt Datei um (Copy → Delete)
- `createBackupDirectory()`: Erstellt Backup-Ordner mit Timestamp

**Besonderheiten:**
- Verwendet `showDirectoryPicker()` API
- Nur-Lesen-Modus für Eingabe-Ordner
- Lesen/Schreiben-Modus für Ausgabe- und Backup-Ordner

##### 2. Metadaten-Extraktion (`lib/videoMetadata.ts`)

**Funktionalität:**
```typescript
interface VideoMetadata {
  fileHandle: FileSystemFileHandle;
  fileName: string;
  width: number;        // Videobreite in Pixeln
  height: number;       // Videohöhe in Pixeln
  durationMs: number;   // Dauer in Millisekunden
  error?: string;       // Fehler bei Extraktion
}
```

**Extraktionsprozess:**
1. Datei als Blob laden (`fileHandle.getFile()`)
2. Blob-URL erstellen (`URL.createObjectURL()`)
3. HTML5 `<video>` Element erstellen
4. Metadaten über `loadedmetadata` Event auslesen
5. URL freigeben und Speicher bereinigen

**Wichtig:** Die Dauer wird vom Browser als `video.duration` zurückgegeben und kann die Dauer des längsten Streams (oft Audio) sein, nicht nur des Video-Streams.

##### 3. Matching-Algorithmus (`lib/matching.ts`)

**Fingerprint-Generierung:**
```typescript
function getFingerprint(metadata: VideoMetadata): string {
  // Dauer auf nächstes 150ms-Intervall runden für Toleranz
  const durationBucket = Math.round(metadata.durationMs / 150) * 150;
  return `${metadata.width}x${metadata.height}_${durationBucket}`;
}
```

**Matching-Kriterien:**
1. **Auflösung:** Exakte Übereinstimmung (Breite × Höhe)
2. **Dauer:** Toleranz von ±75ms (gerundet auf 150ms-Buckets)

**Beispiel:**
- Input: 1080x1920, 67200ms → Fingerprint: `1080x1920_67200`
- Output: 1080x1920, 67264ms → Fingerprint: `1080x1920_67200` (gerundet)
- **Ergebnis:** Match ✅

**Warum 150ms Toleranz?**
- Audio-Streams können länger sein als Video-Streams (Padding)
- Encoding kann minimale Unterschiede erzeugen (±64ms beobachtet)
- 150ms ist eng genug, um False Positives zu vermeiden
- Beispiel: 7s vs 8s Video = 1000ms Unterschied → Kein Match ✅

### Getestete Szenarien

#### Match-Typen

| Szenario | Test | Erwartetes Verhalten |
|----------|------|---------------------|
| **1:1 Match** | 1 Input, 1 Output, identische Metadaten | Status: Match, Umbenennung möglich |
| **Ambiguous** | 2+ Inputs mit identischen Metadaten, 1 Output | Status: Ambiguous, blockiert Umbenennung |
| **Collision** | 2+ Outputs würden denselben Namen bekommen | Status: Collision, blockiert Umbenennung |
| **No Match** | Output ohne passendes Input | Status: No Match, wird übersprungen |
| **Encoding-Unterschied** | Gleicher Inhalt, 64ms Audio-Unterschied | Match dank 150ms Toleranz ✅ |
| **Verschiedene Videos** | 7s vs 8s Video | Kein Match (1000ms > 150ms) ✅ |

#### Edge Cases

| Fall | Verhalten |
|------|-----------|
| Leerer Eingabe-Ordner | Alert: "No video files found in input folder" |
| Leerer Ausgabe-Ordner | Alert: "No video files found in output folder" |
| Verschiedene Auflösungen | No Match (exakte Auflösung erforderlich) |
| Browser nicht unterstützt | Rote Warnung mit unterstützten Browsern |
| Fehler beim Metadaten-Lesen | Video wird übersprungen, error-Flag gesetzt |
| Ambiguous/Collision vorhanden | Umbenennung blockiert, Alert mit Erklärung |

### Umbenennung-Logik

**Namenskonvention:**
```typescript
function generateNewName(inputVideo, outputVideo): string {
  const outputExt = outputVideo.fileName.substring(outputVideo.fileName.lastIndexOf('.'));
  const inputBaseName = inputVideo.fileName.substring(0, inputVideo.fileName.lastIndexOf('.'));
  return `${inputBaseName}_done${outputExt}`;
}
```

**Beispiel:**
- Input: `Captions_24B10E.MP4`
- Output: `SF-101.MP4`
- Neuer Name: `Captions_24B10E_done.MP4`

**Umbenennung-Prozess:**
1. Backup aller Ausgabe-Videos erstellen
2. Original-Datei in Speicher laden
3. Neue Datei mit neuem Namen erstellen
4. Daten kopieren
5. Original-Datei löschen

> **Warum kein natives Rename?** Die File System Access API unterstützt kein direktes Umbenennen - daher Copy → Delete.

### Sicherheitsmaßnahmen

1. **Automatisches Backup:** Vor jeder Umbenennung wird ein Backup-Ordner erstellt
2. **Backup-Benennung:** `backup_[OrdnerName]_[YYYY-MM-DD]`
3. **Keine destruktiven Operationen ohne Bestätigung:** User muss Umbenennung explizit bestätigen
4. **Validierung:** Kollisionen und mehrdeutige Zuordnungen blockieren die Umbenennung
5. **Client-seitig:** Alle Daten bleiben lokal, kein Upload zu Servern

### Performance-Optimierungen

- **Batch-Verarbeitung:** Metadaten werden sequenziell extrahiert mit Progress-Feedback
- **Speicher-Management:** Blob-URLs werden sofort nach Gebrauch freigegeben
- **Lazy Loading:** Videos werden nur für Metadaten-Extraktion geladen, nicht für Anzeige
- **Fingerprint-Caching:** Map-basierte Fingerprint-Suche (O(1) Lookup)

### Browser-Kompatibilität

Die App nutzt die **File System Access API**, die nur auf Desktop-Browsern verfügbar ist:

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 86+ | ✅ Voll unterstützt |
| Edge | 86+ | ✅ Voll unterstützt |
| Safari | Alle | ❌ Nicht unterstützt |
| Firefox | Alle | ❌ Nicht unterstützt |
| Mobile (alle) | Alle | ❌ Nicht unterstützt |

**Warum keine mobile Unterstützung?**
Die File System Access API ist aus Sicherheitsgründen auf mobilen Geräten nicht verfügbar.

---

## Entwicklung

### Lokale Installation

```bash
# Repository klonen
git clone https://github.com/lukitas1337/the-renamening.git
cd the-renamening

# Dependencies installieren
npm install

# Development Server starten
npm run dev
```

Die App ist dann unter `http://localhost:3000` erreichbar.

### Build

```bash
# Production Build
npm run build

# Build starten
npm start
```

### Deployment

Die App ist für Vercel optimiert und deployed automatisch bei Push zu `main`:
- **URL:** https://the-renamening.vercel.app
- **Framework:** Next.js (automatisch erkannt)
- **Build Command:** `npm run build`

---

## Fehlerbehebung

### "Browser Not Supported" Warnung

**Problem:** Browser unterstützt File System Access API nicht.

**Lösung:**
- Chrome oder Edge (Version 86+) verwenden
- Auf Desktop-Gerät wechseln

### Videos werden nicht gefunden

**Problem:** Ordner enthält keine Videos oder unsupported Format.

**Lösung:**
- Prüfen, ob Videos im Ordner sind (nicht in Unterordnern!)
- Unterstützte Formate überprüfen
- Dateiendung prüfen (Groß-/Kleinschreibung egal)

### "No Match" für alle Videos

**Problem:** Input- und Output-Videos haben unterschiedliche Metadaten.

**Lösung:**
- Auflösungen überprüfen (müssen exakt übereinstimmen)
- Dauer prüfen (darf nicht >150ms abweichen)
- Sicherstellen, dass Videos vom gleichen Quellmaterial sind

### "Ambiguous" Status

**Problem:** Mehrere Input-Videos haben identische Metadaten.

**Lösung:**
- Duplikate im Input-Ordner entfernen
- Nur unterscheidbare Videos im Input-Ordner behalten

### "Collision" Status

**Problem:** Mehrere Output-Videos würden denselben Namen bekommen.

**Lösung:**
- Duplikate im Output-Ordner entfernen
- Nur eindeutige Videos im Output-Ordner behalten

---

## Credits

Entwickelt mit ❤️ von Luki

**Technologien:**
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Vercel

---

**Version:** 1.0
**Letzte Aktualisierung:** November 2025
