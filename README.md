# Video Name Fix - Web App

A modern web application that automatically matches and renames exported videos to their original filenames based on video metadata (resolution and duration). All processing happens **100% in your browser** - no files are uploaded to any server.

🚀 **[Live Version](https://the-renamening.vercel.app/)**

## Features

- ✅ **100% Client-Side** - All video processing happens in your browser
- ✅ **No Upload Required** - Videos never leave your computer
- ✅ **Direct File Access** - Uses File System Access API to read and rename files in place
- ✅ **Fast Metadata Extraction** - Only reads video headers, not entire files
- ✅ **Automatic Backup** - Creates backup before any renaming
- ✅ **Duplicate Detection** - Warns when multiple videos have identical metadata
- ✅ **Modern UI** - Built with Next.js and Tailwind CSS
- ✅ **Zero Storage** - No data stored anywhere

## Browser Requirements

This app requires the **File System Access API**, which is currently supported in:
- ✅ Google Chrome (version 86+)
- ✅ Microsoft Edge (version 86+)
- ❌ Firefox (not yet supported)
- ❌ Safari (not yet supported)

## How It Works

1. **Select Folders** - Choose input (original videos) and output (exported videos) folders
2. **Analyze** - App extracts metadata (resolution, duration) from video headers
3. **Preview Matches** - Review the matches in a table
4. **Rename** - App creates backup and renames files directly on your disk

### Example

**Before:**
```
Input/vacation_day1.mp4
Output/export_abc123.mp4  (same video with captions)
```

**After:**
```
Output/vacation_day1_done.mp4
```

## Local Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   cd /Users/lukasfollert/claude-projects/videoNameFix-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   ```
   http://localhost:3000
   ```

### Project Structure

```
videoNameFix-web/
├── app/
│   ├── page.tsx              # Main application page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles with Tailwind
├── components/
│   ├── BrowserCheck.tsx      # Browser compatibility check
│   ├── FolderSelector.tsx    # Folder selection UI
│   └── MatchesTable.tsx      # Matches preview table
├── lib/
│   ├── fileSystem.ts         # File System Access API wrapper
│   ├── videoMetadata.ts      # Video metadata extraction
│   └── matching.ts           # Video matching algorithm
├── public/                   # Static assets
├── package.json
├── next.config.js           # Next.js configuration (static export)
├── tailwind.config.ts       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```

## Deployment to Vercel

### Method 1: Deploy via GitHub (Recommended)

1. **Push to GitHub**
   ```bash
   cd /Users/lukasfollert/claude-projects/videoNameFix-web
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/video-name-fix-web.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel auto-detects Next.js settings
   - Click "Deploy"
   - Done! Your app is live at `https://your-project.vercel.app`

3. **Auto-Deploy**
   - Every push to `main` branch automatically redeploys

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd /Users/lukasfollert/claude-projects/videoNameFix-web
   vercel
   ```

3. **Follow prompts**
   - Login to Vercel
   - Accept defaults
   - Done!

### Custom Domain (Optional)

1. Go to your project settings on Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed

## Alternative Hosting

### Netlify

1. **Build the app**
   ```bash
   npm run build
   ```

2. **Deploy**
   - Drag the `out` folder to [netlify.com/drop](https://app.netlify.com/drop)
   - Or connect your GitHub repository

### GitHub Pages

1. **Update `next.config.js`** - Add base path if deploying to subdirectory

2. **Build and deploy**
   ```bash
   npm run build
   # Deploy the 'out' folder to GitHub Pages
   ```

## Usage Guide

### For End Users

1. **Open the app** in Chrome or Edge
2. **Click "Browse"** next to Input Folder → Select folder with original videos
3. **Click "Browse"** next to Output Folder → Select folder with exported videos
4. **(Optional)** Select custom backup location
5. **Click "Analyze & Preview Matches"**
6. **Review the matches** in the table
   - Green = Good match
   - Yellow = Duplicate metadata warning
7. **Click "Rename Videos"** if matches look correct
8. **Done!** Videos are renamed, backup is created

### Security & Privacy

- ✅ **All processing happens in your browser** - Videos are NOT uploaded
- ✅ **Only metadata is read** - App reads ~100KB per video (header only)
- ✅ **No data stored** - Nothing saved to any server
- ✅ **Open source** - You can verify the code yourself
- ✅ **No analytics** - No tracking, no cookies

## Troubleshooting

### "Browser Not Supported" Warning

**Solution:** Use Google Chrome or Microsoft Edge (version 86+)

### "Permission Denied" Error

**Solution:** Click "Browse" again and grant folder access permission

### Videos Don't Match

**Possible causes:**
- Caption app changed video resolution or re-encoded videos
- Input and output folders contain different videos

**Solution:** Verify your caption app doesn't modify video properties

### Slow Performance

**Solution:**
- Metadata extraction should be fast (~1-2 seconds per video)
- If slow, close other browser tabs
- Large video files (>4GB) may take longer

## Technical Details

### File System Access API

The app uses the modern [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) to:
- Read video file metadata without loading entire files
- Rename files directly on disk (no download/upload)
- Create backup copies

### Video Metadata Extraction

Uses browser's built-in video decoder to extract:
- Resolution (width x height)
- Duration (in milliseconds)

**Why this is fast:**
- Browser only loads video header (~100KB)
- No need to download entire video file
- Native browser API (no external libraries needed)

### Matching Algorithm

1. Creates "fingerprint" for each video: `{width}x{height}_{durationMs}`
2. Example: `1920x1080_45320` (1080p, 45.32 seconds)
3. Matches output videos to input videos with identical fingerprints
4. Detects duplicates when multiple videos have same fingerprint

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Adding Features

The codebase is organized for easy extension:

1. **New UI components** → `components/`
2. **Business logic** → `lib/`
3. **Styling** → Tailwind classes in components
4. **Configuration** → `next.config.js`, `tailwind.config.ts`

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use for personal or commercial projects

## Support

If you encounter issues:
1. Check browser compatibility (Chrome/Edge only)
2. Grant folder access permissions when prompted
3. Verify videos have valid metadata
4. Check browser console for errors

## Roadmap

Future enhancements:
- [ ] Manual match override for duplicates
- [ ] Batch processing for multiple folder pairs
- [ ] Export match report as PDF
- [ ] Remember last used folders (localStorage)
- [ ] Support for audio files
- [ ] Firefox/Safari support when File System Access API becomes available

---

**Built with:**
- [Next.js 14](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
