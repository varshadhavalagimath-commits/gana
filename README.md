# Gana 🎵 — Worldwide Music & Artist Social Platform

Gana is a unified, fullstack **Next.js 16 + React 19 + Prisma v6 + MongoDB Atlas** web application. Everything (UI, API Route Handlers, Database, Audio Player, Singer Studio, and Chat) runs seamlessly from a single codebase with a single command.

---

## 📁 Project Architecture

```
gana/
├── .env                              # MongoDB Atlas connection string
├── package.json                      # Next.js 16, React 19, Tailwind v4, Prisma v6, Lucide React
├── tsconfig.json                     # TypeScript configuration
├── next.config.ts                    # Next.js configuration
├── prisma/
│   ├── schema.prisma                 # MongoDB Atlas schema (User, Song, Friendship, ChatMessage, Comment)
│   └── seed.ts                       # Database seeder script
├── public/
│   └── uploads/                      # Uploaded audio tracks (MP3 / WAV)
└── src/
    ├── app/
    │   ├── globals.css               # Modern glassmorphism UI & styles
    │   ├── layout.tsx                # Multi-language LanguageProvider wrapper
    │   ├── page.tsx                  # Main app with Feed, Singer Studio, Chat & Admin tabs
    │   └── api/                      # Built-in Next.js App Router API endpoints
    │       ├── auth/route.ts         # Sign in, Sign up with User/Singer roles & Admin init
    │       ├── admin/route.ts        # Database diagnostics, stats & catalog sync
    │       ├── songs/route.ts        # Audio upload, search, mood/genre filters
    │       ├── songs/[id]/like/      # Track like counter
    │       ├── songs/comments/       # Comment thread & profanity filter
    │       ├── songs/suggestions/    # Fast search autocomplete
    │       ├── songs/youtube-search/ # YouTube audio integration
    │       ├── friends/route.ts      # Social connections & unread badges
    │       ├── friends/search/       # A-Z friend finder
    │       ├── chat/route.ts         # Direct messaging with song sharing
    │       ├── user/privacy/         # Profile privacy controls
    │       ├── user/suggest/         # Procedural username generator
    │       └── users/count/          # Community member counter
    ├── types/
    │   └── index.ts                  # TypeScript definitions (Song, User, Friend, etc.)
    ├── lib/
    │   ├── prisma.ts                 # PrismaClient singleton
    │   ├── artists.ts                # Worldwide catalog data & languages
    │   ├── moods.ts                  # Mood presets and translations
    │   └── LanguageContext.tsx       # 5-language internationalization (EN, ES, FR, DE, HI)
    └── components/
        ├── Avatar.tsx                # Procedural avatar generator
        ├── AuthModal.tsx             # Login / Sign up modal with roles
        ├── SongCreator.tsx           # AI Synth, MP3 upload, YouTube link & import
        ├── BottomPlayer.tsx          # Full-featured audio player with visualizer & scrubber
        ├── CommunityFeed.tsx         # Language pills, top singers, hit albums, comments
        ├── ChatDrawer.tsx            # WhatsApp-style chat with track sharing
        └── AdminPortal.tsx           # Owner database dashboard & catalog sync
```

---

## 💻 How to Run in VS Code

### Step 1: Open the Project in VS Code
1. Launch **Visual Studio Code**.
2. Go to **File** → **Open Folder...** (or press `Ctrl + K, Ctrl + O`).
3. Select the `gana` folder: `C:\Users\varsh\OneDrive\Desktop\gana`.

### Step 2: Open the Integrated Terminal
- Press ``Ctrl + ` `` (Backtick) or go to **Terminal** → **New Terminal**.

### Step 3: Install Dependencies (First time only)
```powershell
npm install
```

### Step 4: Generate the Prisma Client
```powershell
npx prisma generate
```

### Step 5: Start the Development Server
```powershell
npm run dev
```

### Step 6: Open the App
- Open your browser and go to: **[http://localhost:3000](http://localhost:3000)**

---

## 🛠️ Helpful Commands

| Action | Command |
|---|---|
| **Start Development Server** | `npm run dev` |
| **Build for Production** | `npm run build` |
| **Start Production Server** | `npm run start` |
| **Generate Prisma Client** | `npx prisma generate` |
| **Push Schema to MongoDB** | `npx prisma db push` |
| **Open Prisma Studio** | `npx prisma studio` |
| **Seed Database** | `npx ts-node prisma/seed.ts` |

---

## ✨ Features
- **All-in-One Fullstack Architecture**: Frontend UI and API Route Handlers run from a single Next.js server on port 3000. No CORS or proxy errors.
- **MongoDB Atlas Database**: Persistent cloud database connection with Prisma ORM.
- **Singer Studio**: Upload MP3/WAV tracks, stream YouTube music, or use the procedural AI synth.
- **Interactive Social Features**: Direct messaging, song sharing in chat, friend requests, and comment threads.
- **Custom Mood Tags**: Tag songs with mood emojis, create custom mood playlists, and remove/manage moods easily.
